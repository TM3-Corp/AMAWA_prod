import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateRecord {
  clientId: string;
  clientName: string;
  paso1: string;
  paso2: string;
  currentStatus: string;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\s/g, '').replace(/\D/g, '');
}

function normalizeRut(rut: string | null): string | null {
  if (!rut) return null;
  return rut.replace(/[.\-]/g, '').toLowerCase();
}

async function updateClientStatuses() {
  console.log('='.repeat(120));
  console.log('UPDATING CLIENT STATUSES FROM EXCEL FUNNEL DATA');
  console.log('='.repeat(120));
  console.log();
  console.log('⚠️  This script will update client statuses in your database.');
  console.log('   - Clients with Paso 2 ≠ "Cliente captado" will be marked as INACTIVE');
  console.log('   - This affects the /clients/stats view and /maintenances table');
  console.log();
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting update process...\n');

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

  const updates: UpdateRecord[] = [];

  // Parse Excel rows and collect updates
  console.log('Parsing Excel data...');
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

    // Check if should be inactive
    const shouldBeInactive = paso2.trim().toLowerCase() !== 'cliente captado';
    if (!shouldBeInactive) continue;

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

    // If found and currently active, add to updates
    if (dbClient && dbClient.status !== 'INACTIVE') {
      updates.push({
        clientId: dbClient.id,
        clientName: `${nombre} ${apellido}`,
        paso1,
        paso2,
        currentStatus: dbClient.status,
      });
    }
  }

  console.log(`Found ${updates.length} clients to update to INACTIVE\n`);

  if (updates.length === 0) {
    console.log('No clients to update. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Show sample of what will be updated
  console.log('='.repeat(120));
  console.log('SAMPLE OF UPDATES (First 20)');
  console.log('='.repeat(120));
  updates.slice(0, 20).forEach((update, index) => {
    console.log(`${index + 1}. ${update.clientName}`);
    console.log(`   Paso 1: "${update.paso1}"`);
    console.log(`   Paso 2: "${update.paso2}"`);
    console.log(`   Status: ${update.currentStatus} → INACTIVE`);
    console.log(`   Client ID: ${update.clientId}`);
    console.log();
  });

  if (updates.length > 20) {
    console.log(`... and ${updates.length - 20} more\n`);
  }

  // Perform updates
  console.log('='.repeat(120));
  console.log('PERFORMING UPDATES');
  console.log('='.repeat(120));
  console.log();

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      await prisma.client.update({
        where: { id: update.clientId },
        data: {
          status: 'INACTIVE',
        },
      });
      successCount++;
      if (successCount % 25 === 0) {
        console.log(`Progress: ${successCount}/${updates.length} updated`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = `Failed to update ${update.clientName}: ${error}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log();
  console.log('='.repeat(120));
  console.log('UPDATE COMPLETE');
  console.log('='.repeat(120));
  console.log(`✅ Successfully updated: ${successCount} clients`);
  console.log(`❌ Errors: ${errorCount} clients`);

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  // Verification
  console.log('\n' + '='.repeat(120));
  console.log('VERIFICATION');
  console.log('='.repeat(120));

  const activeCount = await prisma.client.count({
    where: { status: 'ACTIVE' },
  });

  const inactiveCount = await prisma.client.count({
    where: { status: 'INACTIVE' },
  });

  const totalCount = await prisma.client.count();

  console.log(`Total clients in database: ${totalCount}`);
  console.log(`Clients with status ACTIVE: ${activeCount} (${((activeCount / totalCount) * 100).toFixed(1)}%)`);
  console.log(`Clients with status INACTIVE: ${inactiveCount} (${((inactiveCount / totalCount) * 100).toFixed(1)}%)`);

  // Show a sample of updated records
  console.log('\n' + '='.repeat(120));
  console.log('SAMPLE UPDATED RECORDS (Verification)');
  console.log('='.repeat(120));

  const sampleUpdated = await prisma.client.findMany({
    where: {
      id: { in: updates.slice(0, 5).map(u => u.clientId) },
    },
    select: {
      id: true,
      name: true,
      status: true,
      phone: true,
    },
  });

  sampleUpdated.forEach((client, index) => {
    console.log(`\n${index + 1}. ${client.name}`);
    console.log(`   Client ID: ${client.id}`);
    console.log(`   Phone: ${client.phone || 'N/A'}`);
    console.log(`   Status: ${client.status}`);
  });

  console.log('\n' + '='.repeat(120));
  console.log('✅ ALL DONE!');
  console.log('='.repeat(120));
  console.log();
  console.log('Impact on your platform:');
  console.log('  - Client Stats (http://localhost:3000/clients/stats) will show updated active/inactive counts');
  console.log('  - Maintenances table will only show maintenances for ACTIVE clients');
  console.log('  - Total active clients: ' + activeCount);
  console.log('='.repeat(120));

  await prisma.$disconnect();
}

updateClientStatuses().catch(error => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
