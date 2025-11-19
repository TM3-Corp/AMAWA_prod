import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface MaintenanceCompletion {
  clientName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  excelRow: number;
  batchName: string;
  cycle: number; // 6, 12, 18, or 24
  scheduledMonth: string;
  scheduledDate: Date | null;
  actualChangeDate: Date | null;
  comments: string | null;
}

interface UpdateCandidate {
  clientName: string;
  phone: string | null;
  email: string | null;
  excelRow: number;
  cycle: number;
  batchName: string;
  scheduledDate: string | null;
  actualChangeDate: string | null;
  dbMaintenanceId: string | null;
  dbClientId: string | null;
  dbCurrentStatus: string | null;
  canUpdate: boolean;
  reason: string;
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

function extractCycleFromBatchName(batchName: string): number | null {
  // Extract the first cycle mention, e.g., "Mayo 2025 (6M)" -> 6
  const match = batchName.match(/\((\d+)M?\)/i);
  if (match) {
    return parseInt(match[1]);
  }
  return null;
}

async function parseMaintenanceControl() {
  console.log('='.repeat(120));
  console.log('PARSING MAINTENANCE CONTROL SHEET');
  console.log('='.repeat(120));
  console.log();

  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Control de mantenciones');
  if (!sheet) throw new Error('Control de mantenciones sheet not found');

  const completions: MaintenanceCompletion[] = [];
  let currentBatch = '';
  let currentCycle = 0;

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    // Column 1 is empty header, check column 2 for batch headers
    const col1Value = row.getCell(1).value?.toString() || '';
    const nombreValue = row.getCell(2).value?.toString() || '';

    // Check if this is a batch header (in column 1, not column 2)
    const hasMonth = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(nombreValue);
    const hasYear = /202[4-6]/i.test(nombreValue);
    const hasCycle = /\d+\s*m/i.test(nombreValue);

    if (hasMonth && hasYear && hasCycle) {
      currentBatch = nombreValue;
      currentCycle = extractCycleFromBatchName(nombreValue) || 0;
      console.log(`Found batch at row ${i}: ${nombreValue} (Cycle: ${currentCycle}M)`);
      continue;
    }

    // Skip if we haven't found a batch yet or if nombre is empty
    if (!currentBatch || !nombreValue || nombreValue === 'Nombre') continue;

    // This is a client row
    const lastName = row.getCell(3).value?.toString() || '';
    const phone = row.getCell(4).value?.toString() || null;
    const email = null; // Email doesn't seem to be in this sheet

    // Get maintenance data based on cycle
    let scheduledDate: Date | null = null;
    let actualChangeDate: Date | null = null;
    let comments: string | null = null;

    if (currentCycle === 6) {
      scheduledDate = parseDateCell(row.getCell(14)); // cambio 6 meses
      actualChangeDate = parseDateCell(row.getCell(15)); // fecha real de cambio
      comments = row.getCell(16).value?.toString() || null; // Comentario
    } else if (currentCycle === 12) {
      scheduledDate = parseDateCell(row.getCell(17)); // cambio 12 meses
      actualChangeDate = parseDateCell(row.getCell(18)); // fecha real de cambio
      comments = row.getCell(19).value?.toString() || null; // Comentario
    } else if (currentCycle === 18) {
      scheduledDate = parseDateCell(row.getCell(20)); // cambio 18 meses
      actualChangeDate = parseDateCell(row.getCell(21)); // fecha real de cambio
      comments = null; // No comment column for 18M
    } else if (currentCycle === 24) {
      scheduledDate = parseDateCell(row.getCell(22)); // cambio 24 meses
      actualChangeDate = parseDateCell(row.getCell(23)); // fecha real de cambio
      comments = null; // No comment column for 24M
    }

    completions.push({
      clientName: nombreValue,
      lastName,
      phone,
      email,
      excelRow: i,
      batchName: currentBatch,
      cycle: currentCycle,
      scheduledMonth: currentBatch.split('(')[0].trim(),
      scheduledDate,
      actualChangeDate,
      comments,
    });
  }

  console.log(`\nParsed ${completions.length} maintenance records\n`);

  // Summary
  const byCycle: Record<number, MaintenanceCompletion[]> = {};
  completions.forEach(c => {
    if (!byCycle[c.cycle]) byCycle[c.cycle] = [];
    byCycle[c.cycle].push(c);
  });

  console.log('='.repeat(120));
  console.log('SUMMARY BY CYCLE');
  console.log('='.repeat(120));
  Object.entries(byCycle).forEach(([cycle, records]) => {
    const withActualDate = records.filter(r => r.actualChangeDate !== null).length;
    console.log(`\n${cycle} months:`);
    console.log(`  Total records: ${records.length}`);
    console.log(`  With actual change date: ${withActualDate} (${((withActualDate / records.length) * 100).toFixed(1)}%)`);
  });

  return completions;
}

async function matchWithDatabase(completions: MaintenanceCompletion[]) {
  console.log('\n' + '='.repeat(120));
  console.log('MATCHING WITH DATABASE');
  console.log('='.repeat(120));
  console.log();

  const updateCandidates: UpdateCandidate[] = [];

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
  let withActualDate = 0;
  let canUpdate = 0;

  for (const completion of completions) {
    if (!completion.phone) continue;

    // Find matching DB client by phone (normalize to last 8 digits)
    const normalizedPhone = completion.phone.replace(/\D/g, '').slice(-8);
    const dbClient = dbClients.find(c =>
      c.phone?.replace(/\D/g, '').includes(normalizedPhone)
    );

    if (!dbClient) {
      updateCandidates.push({
        clientName: `${completion.clientName} ${completion.lastName}`,
        phone: completion.phone,
        email: completion.email,
        excelRow: completion.excelRow,
        cycle: completion.cycle,
        batchName: completion.batchName,
        scheduledDate: normalizeDate(completion.scheduledDate),
        actualChangeDate: normalizeDate(completion.actualChangeDate),
        dbMaintenanceId: null,
        dbClientId: null,
        dbCurrentStatus: null,
        canUpdate: false,
        reason: 'Client not found in database',
      });
      continue;
    }

    matchedCount++;

    // Find the maintenance for this cycle
    const cycleNumber = completion.cycle / 6; // Convert 6M->1, 12M->2, 18M->3, 24M->4
    const maintenance = dbClient.maintenances.find(m => m.cycleNumber === cycleNumber);

    if (!maintenance) {
      updateCandidates.push({
        clientName: `${completion.clientName} ${completion.lastName}`,
        phone: completion.phone,
        email: completion.email,
        excelRow: completion.excelRow,
        cycle: completion.cycle,
        batchName: completion.batchName,
        scheduledDate: normalizeDate(completion.scheduledDate),
        actualChangeDate: normalizeDate(completion.actualChangeDate),
        dbMaintenanceId: null,
        dbClientId: dbClient.id,
        dbCurrentStatus: null,
        canUpdate: false,
        reason: `No ${cycleNumber}-cycle maintenance found in database`,
      });
      continue;
    }

    const hasActualDate = completion.actualChangeDate !== null;
    if (hasActualDate) withActualDate++;

    const shouldUpdate =
      hasActualDate &&
      maintenance.status !== 'COMPLETED' &&
      maintenance.status !== 'CANCELLED';

    if (shouldUpdate) canUpdate++;

    updateCandidates.push({
      clientName: `${completion.clientName} ${completion.lastName}`,
      phone: completion.phone,
      email: completion.email,
      excelRow: completion.excelRow,
      cycle: completion.cycle,
      batchName: completion.batchName,
      scheduledDate: normalizeDate(completion.scheduledDate),
      actualChangeDate: normalizeDate(completion.actualChangeDate),
      dbMaintenanceId: maintenance.id,
      dbClientId: dbClient.id,
      dbCurrentStatus: maintenance.status,
      canUpdate: shouldUpdate,
      reason: shouldUpdate
        ? 'Ready to update to COMPLETED'
        : !hasActualDate
        ? 'No actual change date in Excel'
        : maintenance.status === 'COMPLETED'
        ? 'Already completed in DB'
        : maintenance.status === 'CANCELLED'
        ? 'Maintenance cancelled in DB'
        : 'Unknown reason',
    });
  }

  console.log(`Matched ${matchedCount} clients from Excel with database`);
  console.log(`Found ${withActualDate} maintenances with actual change date`);
  console.log(`Can update ${canUpdate} maintenances to COMPLETED status\n`);

  return updateCandidates;
}

async function generateReport(updateCandidates: UpdateCandidate[]) {
  console.log('='.repeat(120));
  console.log('UPDATE REPORT');
  console.log('='.repeat(120));
  console.log();

  const canUpdate = updateCandidates.filter(c => c.canUpdate);
  const alreadyCompleted = updateCandidates.filter(c => c.dbCurrentStatus === 'COMPLETED');
  const notFound = updateCandidates.filter(c => !c.dbMaintenanceId);
  const noActualDate = updateCandidates.filter(c => !c.actualChangeDate && c.dbMaintenanceId);

  console.log(`✅ CAN UPDATE TO COMPLETED: ${canUpdate.length} maintenances`);
  console.log(`✓ Already completed in DB: ${alreadyCompleted.length} maintenances`);
  console.log(`⚠ Not found in DB: ${notFound.length} maintenances`);
  console.log(`ℹ️ Missing actual date: ${noActualDate.length} maintenances`);
  console.log();

  if (canUpdate.length > 0) {
    console.log('='.repeat(120));
    console.log(`MAINTENANCES READY TO UPDATE (showing first 30 of ${canUpdate.length})`);
    console.log('='.repeat(120));

    canUpdate.slice(0, 30).forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.clientName}`);
      console.log(`   Phone: ${candidate.phone}`);
      console.log(`   Batch: ${candidate.batchName}`);
      console.log(`   Cycle: ${candidate.cycle} months`);
      console.log(`   Scheduled: ${candidate.scheduledDate}`);
      console.log(`   Actual Change: ${candidate.actualChangeDate}`);
      console.log(`   DB Status: ${candidate.dbCurrentStatus} → COMPLETED`);
      console.log(`   Maintenance ID: ${candidate.dbMaintenanceId}`);
    });

    if (canUpdate.length > 30) {
      console.log(`\n... and ${canUpdate.length - 30} more`);
    }
  }

  // Export to CSV
  const csvPath = path.join(__dirname, '../docs/maintenance-completions-review.csv');
  const csvLines = [
    'Can Update,Client Name,Phone,Email,Excel Row,Cycle (months),Batch,Scheduled Date,Actual Change Date,DB Maintenance ID,DB Client ID,DB Current Status,Reason'
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
      escape(candidate.phone),
      escape(candidate.email),
      escape(candidate.excelRow),
      escape(candidate.cycle),
      escape(candidate.batchName),
      escape(candidate.scheduledDate),
      escape(candidate.actualChangeDate),
      escape(candidate.dbMaintenanceId),
      escape(candidate.dbClientId),
      escape(candidate.dbCurrentStatus),
      escape(candidate.reason),
    ].join(','));
  });

  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log('\n' + '='.repeat(120));
  console.log(`✅ Full report exported to: ${csvPath}`);
  console.log('='.repeat(120));

  return { canUpdate, alreadyCompleted, notFound, noActualDate };
}

async function main() {
  try {
    const completions = await parseMaintenanceControl();
    const updateCandidates = await matchWithDatabase(completions);
    const summary = await generateReport(updateCandidates);

    console.log('\n' + '='.repeat(120));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(120));
    console.log(`Total maintenance records in Excel: ${completions.length}`);
    console.log(`✅ Ready to update: ${summary.canUpdate.length}`);
    console.log(`✓ Already completed: ${summary.alreadyCompleted.length}`);
    console.log(`⚠ Not found in DB: ${summary.notFound.length}`);
    console.log(`ℹ️ Missing actual date: ${summary.noActualDate.length}`);
    console.log('='.repeat(120));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
