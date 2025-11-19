import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface MaintenanceBatch {
  batchName: string;
  cycle: number; // 6, 12, 18, or 24
  scheduledMonth: string;
  excelRow: number;
  clients: ClientMaintenanceStatus[];
}

interface ClientMaintenanceStatus {
  rowNumber: number;
  name: string;
  lastName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  scheduledDate: Date | null;
  actualChangeDate: Date | null;
  status: string | null;
  observations: string | null;
}

interface MaintenanceUpdateCandidate {
  clientName: string;
  rut: string | null;
  email: string | null;
  excelRow: number;
  cycle: number;
  scheduledMonth: string;
  scheduledDate: string | null;
  actualChangeDate: string | null;
  excelStatus: string;
  dbMaintenanceId: string | null;
  dbCurrentStatus: string | null;
  canUpdate: boolean;
  recommendedAction: string;
}

function normalizeDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function parseDateCell(cell: any): Date | null {
  const value = cell.value;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  }
  if (typeof value === 'string' && value.includes('/')) {
    // Try parsing DD/MM/YYYY format
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  return null;
}

function extractCycleFromBatchName(batchName: string): number | null {
  // Look for patterns like "(6M)", "(12M)", "(18M)", "(24M)" at the start
  const match = batchName.match(/\((\d+)M?\)/i);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

async function analyzeMaintenanceStatus() {
  console.log('='.repeat(100));
  console.log('MAINTENANCE STATUS ANALYSIS FROM EXCEL');
  console.log('='.repeat(100));
  console.log();

  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  console.log('Step 1: Parsing maintenance batches from Excel...\n');

  const batches: MaintenanceBatch[] = [];
  let currentBatch: MaintenanceBatch | null = null;

  // First, let's identify which columns contain the data we need
  const headerRow = sheet.getRow(1);
  const columnMap: Record<string, number> = {};

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cell.value?.toString().toLowerCase() || '';
    if (header.includes('nombre') && !header.includes('completo')) columnMap['nombre'] = colNumber;
    if (header.includes('apellido')) columnMap['apellido'] = colNumber;
    if (header.includes('rut')) columnMap['rut'] = colNumber;
    if (header.includes('correo')) columnMap['correo'] = colNumber;
    if (header.includes('celular')) columnMap['celular'] = colNumber;
    if (header.includes('fecha') && header.includes('instalacion')) columnMap['fechaInstalacion'] = colNumber;
    if (header.includes('observaciones')) columnMap['observaciones'] = colNumber;
  });

  console.log('Column mapping:');
  console.log(JSON.stringify(columnMap, null, 2));
  console.log();

  // Now parse the rows
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const nombreCell = row.getCell(columnMap['nombre'] || 2).value?.toString() || '';

    // Check if this is a batch header (contains month name and cycle indicator)
    const monthPattern = /(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+\d{4}\s*\((\d+)M?\)/i;
    const isBatchHeader = monthPattern.test(nombreCell);

    if (isBatchHeader) {
      // Save previous batch
      if (currentBatch && currentBatch.clients.length > 0) {
        batches.push(currentBatch);
      }

      const cycle = extractCycleFromBatchName(nombreCell);
      currentBatch = {
        batchName: nombreCell,
        cycle: cycle || 6,
        scheduledMonth: nombreCell.split('(')[0].trim(),
        excelRow: i,
        clients: [],
      };
      console.log(`Found batch: ${nombreCell} (Row ${i}, Cycle: ${cycle}M)`);
    } else if (currentBatch && nombreCell && nombreCell !== '' && !nombreCell.includes('Regularizado')) {
      // This is a client row
      const lastName = row.getCell(columnMap['apellido'] || 3).value?.toString() || '';
      const rut = row.getCell(columnMap['rut'] || 4).value?.toString() || null;
      const email = row.getCell(columnMap['correo'] || 5).value?.toString() || null;
      const phone = row.getCell(columnMap['celular'] || 6).value?.toString() || null;

      // Find maintenance date columns based on cycle
      // The Excel has maintenance dates in columns 45-49 approximately
      let scheduledDate: Date | null = null;
      let actualChangeDate: Date | null = null;
      let status: string | null = null;

      // Try to find the scheduled date for this cycle
      // Column 45: 6M, Column 47: 12M, Column 48: 18M, Column 49: 24M
      const dateColumnMap: Record<number, number> = {
        6: 45,
        12: 47,
        18: 48,
        24: 49,
      };

      const dateCol = dateColumnMap[currentBatch.cycle];
      if (dateCol) {
        scheduledDate = parseDateCell(row.getCell(dateCol));
      }

      // Look for "fecha real de cambio" and "status" columns
      // These might be in different locations, let's search for them
      for (let col = 1; col <= sheet.columnCount; col++) {
        const header = sheet.getRow(1).getCell(col).value?.toString().toLowerCase() || '';
        if (header.includes('fecha real') || header.includes('cambio')) {
          actualChangeDate = parseDateCell(row.getCell(col));
        }
        if (header.includes('status') || header.includes('estado')) {
          status = row.getCell(col).value?.toString() || null;
        }
      }

      const observations = row.getCell(columnMap['observaciones'] || 51).value?.toString() || null;

      currentBatch.clients.push({
        rowNumber: i,
        name: nombreCell,
        lastName,
        rut,
        email,
        phone,
        scheduledDate,
        actualChangeDate,
        status,
        observations,
      });
    }
  }

  // Add the last batch
  if (currentBatch && currentBatch.clients.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`\nFound ${batches.length} maintenance batches\n`);

  // Summary by batch
  console.log('='.repeat(100));
  console.log('BATCH SUMMARY');
  console.log('='.repeat(100));
  batches.forEach((batch, index) => {
    console.log(`\n${index + 1}. ${batch.batchName}`);
    console.log(`   Cycle: ${batch.cycle} months`);
    console.log(`   Total clients: ${batch.clients.length}`);

    const withActualDate = batch.clients.filter(c => c.actualChangeDate !== null).length;
    const withStatus = batch.clients.filter(c => c.status !== null).length;

    console.log(`   Clients with actual change date: ${withActualDate}`);
    console.log(`   Clients with status: ${withStatus}`);

    // Status breakdown
    const statusCount: Record<string, number> = {};
    batch.clients.forEach(c => {
      if (c.status) {
        statusCount[c.status] = (statusCount[c.status] || 0) + 1;
      }
    });

    if (Object.keys(statusCount).length > 0) {
      console.log('   Status breakdown:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count}`);
      });
    }
  });

  return batches;
}

async function matchWithDatabase(batches: MaintenanceBatch[]) {
  console.log('\n' + '='.repeat(100));
  console.log('MATCHING WITH DATABASE');
  console.log('='.repeat(100));
  console.log();

  const updateCandidates: MaintenanceUpdateCandidate[] = [];

  // Load all clients with maintenances
  const dbClients = await prisma.client.findMany({
    include: {
      maintenances: {
        orderBy: { cycleNumber: 'asc' },
      },
    },
  });

  console.log(`Loaded ${dbClients.length} clients from database\n`);

  let matchedCount = 0;
  let completedInExcel = 0;
  let canUpdateToCompleted = 0;

  for (const batch of batches) {
    for (const client of batch.clients) {
      if (!client.rut && !client.email) continue;

      // Find matching DB client
      let dbClient = null;
      if (client.rut) {
        const normalizedRut = client.rut.replace(/[.\-]/g, '').toLowerCase();
        dbClient = dbClients.find(c =>
          c.rut?.replace(/[.\-]/g, '').toLowerCase().includes(normalizedRut.replace(/[^0-9kK]/g, ''))
        );
      }

      if (!dbClient && client.email) {
        dbClient = dbClients.find(c => c.email?.toLowerCase() === client.email?.toLowerCase());
      }

      if (!dbClient) continue;

      matchedCount++;

      // Find the maintenance for this cycle
      const cycleNumber = batch.cycle / 6; // Convert 6M->1, 12M->2, etc.
      const maintenance = dbClient.maintenances.find(m => m.cycleNumber === cycleNumber);

      if (!maintenance) continue;

      const isCompletedInExcel =
        client.status?.toLowerCase().includes('cambiado') ||
        client.status?.toLowerCase().includes('ok') ||
        (client.actualChangeDate !== null);

      if (isCompletedInExcel) {
        completedInExcel++;
      }

      const canUpdate =
        isCompletedInExcel &&
        maintenance.status !== 'COMPLETED' &&
        client.actualChangeDate !== null;

      if (canUpdate) {
        canUpdateToCompleted++;
      }

      updateCandidates.push({
        clientName: `${client.name} ${client.lastName}`,
        rut: client.rut,
        email: client.email,
        excelRow: client.rowNumber,
        cycle: batch.cycle,
        scheduledMonth: batch.scheduledMonth,
        scheduledDate: normalizeDate(client.scheduledDate),
        actualChangeDate: normalizeDate(client.actualChangeDate),
        excelStatus: client.status || 'N/A',
        dbMaintenanceId: maintenance.id,
        dbCurrentStatus: maintenance.status,
        canUpdate,
        recommendedAction: canUpdate
          ? `UPDATE to COMPLETED with actualDate: ${normalizeDate(client.actualChangeDate)}`
          : isCompletedInExcel && !client.actualChangeDate
          ? 'Missing actual change date in Excel'
          : maintenance.status === 'COMPLETED'
          ? 'Already completed in DB'
          : 'Not completed in Excel',
      });
    }
  }

  console.log(`Matched ${matchedCount} clients from Excel with database`);
  console.log(`Found ${completedInExcel} maintenances marked as completed in Excel`);
  console.log(`Can update ${canUpdateToCompleted} maintenances to COMPLETED status\n`);

  return updateCandidates;
}

async function generateReport(updateCandidates: MaintenanceUpdateCandidate[]) {
  console.log('='.repeat(100));
  console.log('UPDATE CANDIDATES REPORT');
  console.log('='.repeat(100));
  console.log();

  const canUpdate = updateCandidates.filter(c => c.canUpdate);
  const alreadyCompleted = updateCandidates.filter(c => c.dbCurrentStatus === 'COMPLETED');
  const missingDate = updateCandidates.filter(c =>
    c.excelStatus.toLowerCase().includes('cambiado') && !c.actualChangeDate
  );

  console.log(`✅ CAN UPDATE TO COMPLETED: ${canUpdate.length} maintenances`);
  console.log(`✓ Already completed in DB: ${alreadyCompleted.length} maintenances`);
  console.log(`⚠ Completed in Excel but missing actual date: ${missingDate.length} maintenances`);
  console.log();

  if (canUpdate.length > 0) {
    console.log('='.repeat(100));
    console.log('MAINTENANCES READY TO UPDATE (First 50)');
    console.log('='.repeat(100));

    canUpdate.slice(0, 50).forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.clientName}`);
      console.log(`   RUT: ${candidate.rut || 'N/A'} | Email: ${candidate.email || 'N/A'}`);
      console.log(`   Cycle: ${candidate.cycle} months | Month: ${candidate.scheduledMonth}`);
      console.log(`   Scheduled: ${candidate.scheduledDate}`);
      console.log(`   Actual Change: ${candidate.actualChangeDate}`);
      console.log(`   Excel Status: ${candidate.excelStatus}`);
      console.log(`   DB Status: ${candidate.dbCurrentStatus} → COMPLETED`);
      console.log(`   DB Maintenance ID: ${candidate.dbMaintenanceId}`);
    });

    if (canUpdate.length > 50) {
      console.log(`\n... and ${canUpdate.length - 50} more maintenances`);
    }
  }

  // Export to CSV
  const csvPath = path.join(__dirname, '../docs/maintenance-update-candidates.csv');
  const csvLines = [
    'Can Update,Client Name,RUT,Email,Excel Row,Cycle (months),Scheduled Month,Scheduled Date,Actual Change Date,Excel Status,DB Status,DB Maintenance ID,Recommended Action'
  ];

  updateCandidates.forEach(candidate => {
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    csvLines.push([
      escape(candidate.canUpdate ? 'YES' : 'NO'),
      escape(candidate.clientName),
      escape(candidate.rut),
      escape(candidate.email),
      escape(candidate.excelRow),
      escape(candidate.cycle),
      escape(candidate.scheduledMonth),
      escape(candidate.scheduledDate),
      escape(candidate.actualChangeDate),
      escape(candidate.excelStatus),
      escape(candidate.dbCurrentStatus),
      escape(candidate.dbMaintenanceId),
      escape(candidate.recommendedAction),
    ].join(','));
  });

  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log('\n' + '='.repeat(100));
  console.log(`✅ Full report exported to: ${csvPath}`);
  console.log('='.repeat(100));

  // Generate update script
  if (canUpdate.length > 0) {
    const scriptPath = path.join(__dirname, '../scripts/update-completed-maintenances.ts');
    const scriptContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This script updates ${canUpdate.length} maintenances to COMPLETED status
// based on data from Excel

async function updateCompletedMaintenances() {
  console.log('Updating ${canUpdate.length} maintenances to COMPLETED status...\\n');

  const updates = [
${canUpdate.map(c => `    { id: '${c.dbMaintenanceId}', actualDate: new Date('${c.actualChangeDate}') }`).join(',\n')}
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    try {
      await prisma.maintenance.update({
        where: { id: update.id },
        data: {
          status: 'COMPLETED',
          actualDate: update.actualDate,
          completedDate: new Date(),
        },
      });
      successCount++;
    } catch (error) {
      console.error(\`Error updating maintenance \${update.id}:\`, error);
      errorCount++;
    }
  }

  console.log(\`✅ Successfully updated: \${successCount}\`);
  console.log(\`❌ Errors: \${errorCount}\`);

  await prisma.$disconnect();
}

updateCompletedMaintenances();
`;

    fs.writeFileSync(scriptPath, scriptContent, 'utf-8');
    console.log(`\n✅ Update script generated: ${scriptPath}`);
    console.log('   Run with: npx dotenv -e .env.local -- npx tsx scripts/update-completed-maintenances.ts');
    console.log('='.repeat(100));
  }

  return { canUpdate, alreadyCompleted, missingDate };
}

async function main() {
  try {
    const batches = await analyzeMaintenanceStatus();
    const updateCandidates = await matchWithDatabase(batches);
    await generateReport(updateCandidates);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
