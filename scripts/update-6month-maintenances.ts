import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateRecord {
  maintenanceId: string;
  clientName: string;
  scheduledDate: string;
  actualDate: Date;
  currentStatus: string;
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
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

async function updateMaintenances() {
  console.log('='.repeat(120));
  console.log('UPDATING 6-MONTH MAINTENANCES FROM EXCEL');
  console.log('='.repeat(120));
  console.log();
  console.log('⚠️  This script will update maintenance records in your database.');
  console.log('   - Status will be changed to COMPLETED');
  console.log('   - actualDate will be set from "fecha real de cambio"');
  console.log('   - completedDate will be set to current timestamp');
  console.log();
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting update process...\n');

  // Read Excel data
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Control de mantenciones');
  if (!sheet) throw new Error('Control de mantenciones sheet not found');

  // Load all clients with their first maintenance
  console.log('Loading clients from database...');
  const dbClients = await prisma.client.findMany({
    include: {
      maintenances: {
        where: { cycleNumber: 1 }, // Only 6-month maintenance
        take: 1,
      },
    },
  });

  console.log(`Loaded ${dbClients.length} clients`);
  console.log(`Clients with 6-month maintenance: ${dbClients.filter(c => c.maintenances.length > 0).length}\n`);

  const updates: UpdateRecord[] = [];
  let currentBatch = '';

  // Parse Excel rows and collect updates
  console.log('Parsing Excel data...');
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

    if (!currentBatch || !nombreValue || nombreValue === 'Nombre') continue;

    const lastName = row.getCell(3).value?.toString() || '';
    const excelPhone = row.getCell(4).value?.toString() || '';
    const actualChangeDate = parseDateCell(row.getCell(15)); // fecha real de cambio (6M)

    if (!excelPhone || !actualChangeDate) continue;

    const normalizedExcelPhone = normalizePhone(excelPhone);
    if (!normalizedExcelPhone || normalizedExcelPhone.length < 8) continue;

    // Find matching client
    const last8 = normalizedExcelPhone.slice(-8);
    const dbClient = dbClients.find(c => {
      const normalizedDbPhone = normalizePhone(c.phone);
      return normalizedDbPhone && normalizedDbPhone.includes(last8);
    });

    if (!dbClient || dbClient.maintenances.length === 0) continue;

    const maintenance = dbClient.maintenances[0];

    // Only update if not already completed
    if (maintenance.status === 'COMPLETED') continue;

    updates.push({
      maintenanceId: maintenance.id,
      clientName: `${nombreValue} ${lastName}`,
      scheduledDate: formatDate(maintenance.scheduledDate) || '',
      actualDate: actualChangeDate,
      currentStatus: maintenance.status,
    });
  }

  console.log(`Found ${updates.length} maintenances to update\n`);

  if (updates.length === 0) {
    console.log('No maintenances to update. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Show sample of what will be updated
  console.log('='.repeat(120));
  console.log('SAMPLE OF UPDATES (First 10)');
  console.log('='.repeat(120));
  updates.slice(0, 10).forEach((update, index) => {
    console.log(`${index + 1}. ${update.clientName}`);
    console.log(`   Scheduled: ${update.scheduledDate}`);
    console.log(`   Actual: ${formatDate(update.actualDate)}`);
    console.log(`   Status: ${update.currentStatus} → COMPLETED`);
    console.log(`   Maintenance ID: ${update.maintenanceId}`);
    console.log();
  });

  if (updates.length > 10) {
    console.log(`... and ${updates.length - 10} more\n`);
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
      await prisma.maintenance.update({
        where: { id: update.maintenanceId },
        data: {
          status: 'COMPLETED',
          actualDate: update.actualDate,
          completedDate: new Date(),
        },
      });
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount}/${updates.length} completed`);
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
  console.log(`✅ Successfully updated: ${successCount} maintenances`);
  console.log(`❌ Errors: ${errorCount} maintenances`);

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  // Verification
  console.log('\n' + '='.repeat(120));
  console.log('VERIFICATION');
  console.log('='.repeat(120));

  const completedCount = await prisma.maintenance.count({
    where: {
      cycleNumber: 1,
      status: 'COMPLETED',
    },
  });

  const pendingCount = await prisma.maintenance.count({
    where: {
      cycleNumber: 1,
      status: 'PENDING',
    },
  });

  console.log(`6-month maintenances with status COMPLETED: ${completedCount}`);
  console.log(`6-month maintenances with status PENDING: ${pendingCount}`);

  // Show a sample of updated records
  console.log('\n' + '='.repeat(120));
  console.log('SAMPLE UPDATED RECORDS (Verification)');
  console.log('='.repeat(120));

  const sampleUpdated = await prisma.maintenance.findMany({
    where: {
      id: { in: updates.slice(0, 5).map(u => u.maintenanceId) },
    },
    include: {
      client: {
        select: { name: true },
      },
    },
  });

  sampleUpdated.forEach((maintenance, index) => {
    console.log(`\n${index + 1}. ${maintenance.client.name}`);
    console.log(`   Maintenance ID: ${maintenance.id}`);
    console.log(`   Scheduled Date: ${formatDate(maintenance.scheduledDate)}`);
    console.log(`   Actual Date: ${formatDate(maintenance.actualDate)}`);
    console.log(`   Completed Date: ${formatDate(maintenance.completedDate)}`);
    console.log(`   Status: ${maintenance.status}`);
    console.log(`   URL: http://localhost:3000/maintenances/${maintenance.id}`);
  });

  console.log('\n' + '='.repeat(120));
  console.log('✅ ALL DONE!');
  console.log('='.repeat(120));
  console.log();
  console.log('You can now view the updated maintenances in your application.');
  console.log('The "Fecha Real" (actualDate) is now saved and will be visible on the maintenance page.');
  console.log('='.repeat(120));

  await prisma.$disconnect();
}

updateMaintenances().catch(error => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
