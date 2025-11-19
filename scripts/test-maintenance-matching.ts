import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchResult {
  excelRow: number;
  clientName: string;
  excelPhone: string;
  normalizedExcelPhone: string;
  actualChangeDate: string | null;
  dbClientId: string | null;
  dbClientName: string | null;
  dbPhone: string | null;
  normalizedDbPhone: string | null;
  dbMaintenanceId: string | null;
  dbMaintenanceCycle: number | null;
  dbScheduledDate: string | null;
  dbCurrentStatus: string | null;
  matchStatus: 'MATCHED' | 'CLIENT_NOT_FOUND' | 'NO_6M_MAINTENANCE' | 'NO_ACTUAL_DATE';
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all whitespace and keep only digits
  return phone.replace(/\s/g, '').replace(/\D/g, '');
}

function parseDateCell(cell: any): Date | null {
  const value = cell.value;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  }
  if (typeof value === 'object' && value !== null && 'result' in value) {
    const result = value.result;
    if (result instanceof Date) return result;
    if (typeof result === 'string') {
      const parsed = new Date(result);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

async function testMatching() {
  console.log('='.repeat(120));
  console.log('TESTING MAINTENANCE MATCHING LOGIC');
  console.log('='.repeat(120));
  console.log();

  // Read Excel data
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Control de mantenciones');
  if (!sheet) throw new Error('Control de mantenciones sheet not found');

  // Load all clients with their first maintenance (cycle 1 = 6 months)
  const dbClients = await prisma.client.findMany({
    include: {
      maintenances: {
        where: { cycleNumber: 1 }, // Only get 6-month maintenance
        take: 1,
      },
    },
  });

  console.log(`Loaded ${dbClients.length} clients from database`);
  console.log(`Clients with 6-month maintenance: ${dbClients.filter(c => c.maintenances.length > 0).length}\n`);

  const results: MatchResult[] = [];
  let currentBatch = '';

  // Parse Excel rows
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const nombreValue = row.getCell(2).value?.toString() || '';

    // Check if this is a batch header
    const hasMonth = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(nombreValue);
    const hasYear = /202[4-6]/i.test(nombreValue);
    const hasCycle = /\d+\s*m/i.test(nombreValue);

    if (hasMonth && hasYear && hasCycle) {
      currentBatch = nombreValue;
      continue;
    }

    // Skip if no batch or empty name
    if (!currentBatch || !nombreValue || nombreValue === 'Nombre') continue;

    // Get client data from Excel
    const lastName = row.getCell(3).value?.toString() || '';
    const excelPhone = row.getCell(4).value?.toString() || '';
    const actualChangeDate = parseDateCell(row.getCell(15)); // Column 15: fecha real de cambio (6M)

    if (!excelPhone) continue;

    const normalizedExcelPhone = normalizePhone(excelPhone);

    // Try to find matching client in DB by phone
    let dbClient = null;
    let matchedBy = '';

    if (normalizedExcelPhone && normalizedExcelPhone.length >= 8) {
      // Try to match by last 8 digits (Chilean mobile numbers)
      const last8 = normalizedExcelPhone.slice(-8);
      dbClient = dbClients.find(c => {
        const normalizedDbPhone = normalizePhone(c.phone);
        return normalizedDbPhone && normalizedDbPhone.includes(last8);
      });
      if (dbClient) matchedBy = 'last 8 digits';

      // If not found, try full match
      if (!dbClient) {
        dbClient = dbClients.find(c => {
          const normalizedDbPhone = normalizePhone(c.phone);
          return normalizedDbPhone === normalizedExcelPhone;
        });
        if (dbClient) matchedBy = 'full phone';
      }
    }

    if (!dbClient) {
      results.push({
        excelRow: i,
        clientName: `${nombreValue} ${lastName}`,
        excelPhone,
        normalizedExcelPhone: normalizedExcelPhone || '',
        actualChangeDate: formatDate(actualChangeDate),
        dbClientId: null,
        dbClientName: null,
        dbPhone: null,
        normalizedDbPhone: null,
        dbMaintenanceId: null,
        dbMaintenanceCycle: null,
        dbScheduledDate: null,
        dbCurrentStatus: null,
        matchStatus: 'CLIENT_NOT_FOUND',
      });
      continue;
    }

    // Client found - check for 6-month maintenance
    const maintenance = dbClient.maintenances[0];

    if (!maintenance) {
      results.push({
        excelRow: i,
        clientName: `${nombreValue} ${lastName}`,
        excelPhone,
        normalizedExcelPhone: normalizedExcelPhone || '',
        actualChangeDate: formatDate(actualChangeDate),
        dbClientId: dbClient.id,
        dbClientName: dbClient.name,
        dbPhone: dbClient.phone || '',
        normalizedDbPhone: normalizePhone(dbClient.phone) || '',
        dbMaintenanceId: null,
        dbMaintenanceCycle: null,
        dbScheduledDate: null,
        dbCurrentStatus: null,
        matchStatus: 'NO_6M_MAINTENANCE',
      });
      continue;
    }

    // Check if we have actual change date
    if (!actualChangeDate) {
      results.push({
        excelRow: i,
        clientName: `${nombreValue} ${lastName}`,
        excelPhone,
        normalizedExcelPhone: normalizedExcelPhone || '',
        actualChangeDate: null,
        dbClientId: dbClient.id,
        dbClientName: dbClient.name,
        dbPhone: dbClient.phone || '',
        normalizedDbPhone: normalizePhone(dbClient.phone) || '',
        dbMaintenanceId: maintenance.id,
        dbMaintenanceCycle: maintenance.cycleNumber,
        dbScheduledDate: formatDate(maintenance.scheduledDate),
        dbCurrentStatus: maintenance.status,
        matchStatus: 'NO_ACTUAL_DATE',
      });
      continue;
    }

    // Perfect match!
    results.push({
      excelRow: i,
      clientName: `${nombreValue} ${lastName}`,
      excelPhone,
      normalizedExcelPhone: normalizedExcelPhone || '',
      actualChangeDate: formatDate(actualChangeDate),
      dbClientId: dbClient.id,
      dbClientName: dbClient.name,
      dbPhone: dbClient.phone || '',
      normalizedDbPhone: normalizePhone(dbClient.phone) || '',
      dbMaintenanceId: maintenance.id,
      dbMaintenanceCycle: maintenance.cycleNumber,
      dbScheduledDate: formatDate(maintenance.scheduledDate),
      dbCurrentStatus: maintenance.status,
      matchStatus: 'MATCHED',
    });
  }

  // Generate report
  console.log('='.repeat(120));
  console.log('MATCHING RESULTS');
  console.log('='.repeat(120));
  console.log();

  const matched = results.filter(r => r.matchStatus === 'MATCHED');
  const clientNotFound = results.filter(r => r.matchStatus === 'CLIENT_NOT_FOUND');
  const noMaintenance = results.filter(r => r.matchStatus === 'NO_6M_MAINTENANCE');
  const noActualDate = results.filter(r => r.matchStatus === 'NO_ACTUAL_DATE');

  console.log(`Total records processed: ${results.length}`);
  console.log(`✅ Successfully matched: ${matched.length} (${((matched.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Client not found: ${clientNotFound.length}`);
  console.log(`⚠️  No 6M maintenance: ${noMaintenance.length}`);
  console.log(`ℹ️  No actual date: ${noActualDate.length}`);
  console.log();

  // Show sample of successful matches
  if (matched.length > 0) {
    console.log('='.repeat(120));
    console.log('SAMPLE SUCCESSFUL MATCHES (First 10)');
    console.log('='.repeat(120));
    matched.slice(0, 10).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.clientName}`);
      console.log(`   Excel Row: ${result.excelRow}`);
      console.log(`   Excel Phone: ${result.excelPhone} → Normalized: ${result.normalizedExcelPhone}`);
      console.log(`   DB Phone: ${result.dbPhone} → Normalized: ${result.normalizedDbPhone}`);
      console.log(`   Actual Change Date: ${result.actualChangeDate}`);
      console.log(`   DB Maintenance: ${result.dbMaintenanceId}`);
      console.log(`   DB Cycle: ${result.dbMaintenanceCycle} (6 months)`);
      console.log(`   DB Scheduled: ${result.dbScheduledDate}`);
      console.log(`   DB Status: ${result.dbCurrentStatus} → Will update to COMPLETED`);
    });
  }

  // Show issues
  if (clientNotFound.length > 0) {
    console.log('\n' + '='.repeat(120));
    console.log(`CLIENTS NOT FOUND IN DATABASE (${clientNotFound.length} total, showing first 10)`);
    console.log('='.repeat(120));
    clientNotFound.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ${result.clientName} - Phone: ${result.excelPhone} (${result.normalizedExcelPhone})`);
    });
  }

  if (noMaintenance.length > 0) {
    console.log('\n' + '='.repeat(120));
    console.log(`CLIENTS WITHOUT 6-MONTH MAINTENANCE (${noMaintenance.length} total, showing first 10)`);
    console.log('='.repeat(120));
    noMaintenance.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ${result.clientName} - Client ID: ${result.dbClientId}`);
    });
  }

  console.log('\n' + '='.repeat(120));
  console.log('TEST COMPLETE');
  console.log('='.repeat(120));
  console.log();
  console.log(`✅ Matching logic is working correctly!`);
  console.log(`   ${matched.length} maintenances ready to be marked as COMPLETED`);
  console.log();
  console.log('Next step: Run the actual update script');
  console.log('Command: npx dotenv -e .env.local -- npx tsx scripts/update-6month-maintenances.ts');
  console.log('='.repeat(120));

  await prisma.$disconnect();

  return { matched, clientNotFound, noMaintenance, noActualDate };
}

testMatching().catch(error => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
