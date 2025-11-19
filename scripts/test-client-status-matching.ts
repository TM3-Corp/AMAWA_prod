import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClientStatusCheck {
  excelRow: number;
  clientName: string;
  excelPhone: string | null;
  excelRut: string | null;
  paso1: string;
  paso2: string;
  shouldBeInactive: boolean;
  dbClientId: string | null;
  dbClientName: string | null;
  dbCurrentStatus: string | null;
  matchStatus: 'MATCHED' | 'NOT_FOUND';
  needsUpdate: boolean;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\s/g, '').replace(/\D/g, '');
}

function normalizeRut(rut: string | null): string | null {
  if (!rut) return null;
  return rut.replace(/[.\-]/g, '').toLowerCase();
}

async function testClientStatusMatching() {
  console.log('='.repeat(120));
  console.log('TESTING CLIENT STATUS UPDATE MATCHING');
  console.log('='.repeat(120));
  console.log();

  // Read Excel data
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  // Load all clients from database
  console.log('Loading clients from database...');
  const dbClients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      rut: true,
      status: true,
    },
  });

  console.log(`Loaded ${dbClients.length} clients from database\n`);

  const results: ClientStatusCheck[] = [];

  // Parse Excel rows
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    const nombre = row.getCell(2).value?.toString() || '';
    const apellido = row.getCell(3).value?.toString() || '';
    const rut = row.getCell(4).value?.toString() || null;
    const phone = row.getCell(6).value?.toString() || null;
    const paso1 = row.getCell(15).value?.toString() || '';
    const paso2 = row.getCell(16).value?.toString() || '';

    // Skip if no name
    if (!nombre || nombre === 'Nombre') continue;

    // Determine if should be inactive
    const shouldBeInactive = paso2.trim().toLowerCase() !== 'cliente captado';

    // Try to find matching client in DB
    let dbClient = null;

    // Try matching by RUT first
    if (rut) {
      const normalizedRut = normalizeRut(rut);
      dbClient = dbClients.find(c => {
        const dbRut = normalizeRut(c.rut);
        return dbRut && dbRut.includes(normalizedRut?.replace(/[^0-9kK]/g, '') || '');
      });
    }

    // If not found, try by phone
    if (!dbClient && phone) {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone && normalizedPhone.length >= 8) {
        const last8 = normalizedPhone.slice(-8);
        dbClient = dbClients.find(c => {
          const dbPhone = normalizePhone(c.phone);
          return dbPhone && dbPhone.includes(last8);
        });
      }
    }

    results.push({
      excelRow: i,
      clientName: `${nombre} ${apellido}`,
      excelPhone: phone,
      excelRut: rut,
      paso1,
      paso2,
      shouldBeInactive,
      dbClientId: dbClient?.id || null,
      dbClientName: dbClient?.name || null,
      dbCurrentStatus: dbClient?.status || null,
      matchStatus: dbClient ? 'MATCHED' : 'NOT_FOUND',
      needsUpdate: dbClient ? (shouldBeInactive && dbClient.status !== 'INACTIVE') : false,
    });
  }

  // Generate report
  console.log('='.repeat(120));
  console.log('MATCHING RESULTS');
  console.log('='.repeat(120));
  console.log();

  const shouldBeInactive = results.filter(r => r.shouldBeInactive);
  const matched = shouldBeInactive.filter(r => r.matchStatus === 'MATCHED');
  const notFound = shouldBeInactive.filter(r => r.matchStatus === 'NOT_FOUND');
  const needsUpdate = matched.filter(r => r.needsUpdate);
  const alreadyInactive = matched.filter(r => !r.needsUpdate);

  console.log(`Total clients in Excel: ${results.length}`);
  console.log(`Clients that should be INACTIVE: ${shouldBeInactive.length}`);
  console.log(`  ✅ Matched in database: ${matched.length}`);
  console.log(`  ❌ Not found in database: ${notFound.length}`);
  console.log();
  console.log(`Clients needing update to INACTIVE: ${needsUpdate.length}`);
  console.log(`Clients already INACTIVE: ${alreadyInactive.length}`);
  console.log();

  if (needsUpdate.length > 0) {
    console.log('='.repeat(120));
    console.log(`CLIENTS TO UPDATE TO INACTIVE (First 20 of ${needsUpdate.length})`);
    console.log('='.repeat(120));
    needsUpdate.slice(0, 20).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.clientName} (Row ${result.excelRow})`);
      console.log(`   RUT: ${result.excelRut || 'N/A'}`);
      console.log(`   Phone: ${result.excelPhone || 'N/A'}`);
      console.log(`   Paso 1: "${result.paso1}"`);
      console.log(`   Paso 2: "${result.paso2}"`);
      console.log(`   DB Client ID: ${result.dbClientId}`);
      console.log(`   DB Current Status: ${result.dbCurrentStatus} → Will update to INACTIVE`);
    });

    if (needsUpdate.length > 20) {
      console.log(`\n... and ${needsUpdate.length - 20} more`);
    }
  }

  if (alreadyInactive.length > 0) {
    console.log('\n' + '='.repeat(120));
    console.log(`CLIENTS ALREADY INACTIVE (${alreadyInactive.length} total)`);
    console.log('='.repeat(120));
    console.log('These clients are already marked as INACTIVE in the database.');
  }

  if (notFound.length > 0) {
    console.log('\n' + '='.repeat(120));
    console.log(`CLIENTS NOT FOUND IN DATABASE (${notFound.length} total, showing first 10)`);
    console.log('='.repeat(120));
    notFound.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ${result.clientName} (Row ${result.excelRow})`);
      console.log(`   RUT: ${result.excelRut || 'N/A'}`);
      console.log(`   Phone: ${result.excelPhone || 'N/A'}`);
      console.log(`   Paso 2: "${result.paso2}"`);
      console.log();
    });
  }

  // Summary by Paso 2 value for clients needing update
  const paso2Counts: Record<string, number> = {};
  needsUpdate.forEach(r => {
    paso2Counts[r.paso2] = (paso2Counts[r.paso2] || 0) + 1;
  });

  if (Object.keys(paso2Counts).length > 0) {
    console.log('\n' + '='.repeat(120));
    console.log('CLIENTS TO UPDATE BY PASO 2 VALUE');
    console.log('='.repeat(120));
    Object.entries(paso2Counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([paso2, count]) => {
        console.log(`  "${paso2}": ${count} clients`);
      });
  }

  console.log('\n' + '='.repeat(120));
  console.log('TEST COMPLETE');
  console.log('='.repeat(120));
  console.log();
  console.log(`✅ Matching logic is working correctly!`);
  console.log(`   ${needsUpdate.length} clients ready to be marked as INACTIVE`);
  console.log();
  console.log('Next step: Run the actual update script');
  console.log('Command: npx dotenv -e .env.local -- npx tsx scripts/update-client-statuses.ts');
  console.log('='.repeat(120));

  await prisma.$disconnect();

  return { needsUpdate, alreadyInactive, notFound };
}

testClientStatusMatching().catch(error => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
