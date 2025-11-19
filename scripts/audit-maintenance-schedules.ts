import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClientMaintenanceData {
  rut: string | null;
  email: string | null;
  name: string;
  installationDate: Date | null;
  excelMaint6: Date | null;
  excelMaint12: Date | null;
  excelMaint18: Date | null;
  excelMaint24: Date | null;
  rowNumber: number;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function normalizeDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function dateDiffInDays(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

async function readExcelMaintenanceDates(): Promise<ClientMaintenanceData[]> {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  const clients: ClientMaintenanceData[] = [];

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    const rut = row.getCell(4).value?.toString() || null;
    const email = row.getCell(5).value?.toString() || null;
    const name = row.getCell(56).value?.toString() || '';

    // Skip if no identifier
    if (!rut && !email) continue;

    // Parse installation date (column 11)
    let installationDate: Date | null = null;
    const installDateCell = row.getCell(11).value;
    if (installDateCell instanceof Date) {
      installationDate = installDateCell;
    } else if (typeof installDateCell === 'number') {
      installationDate = new Date((installDateCell - 25569) * 86400 * 1000);
    }

    // Parse maintenance dates (columns 45-49)
    const parseDateCell = (cell: any): Date | null => {
      const value = cell.value;
      if (value instanceof Date) return value;
      if (typeof value === 'number') {
        return new Date((value - 25569) * 86400 * 1000);
      }
      return null;
    };

    const excelMaint6 = parseDateCell(row.getCell(45));
    const excelMaint12 = parseDateCell(row.getCell(47));
    const excelMaint18 = parseDateCell(row.getCell(48));
    const excelMaint24 = parseDateCell(row.getCell(49));

    clients.push({
      rut,
      email,
      name,
      installationDate,
      excelMaint6,
      excelMaint12,
      excelMaint18,
      excelMaint24,
      rowNumber: i,
    });
  }

  return clients;
}

async function validateMaintenanceSchedules() {
  console.log('='.repeat(80));
  console.log('MAINTENANCE SCHEDULE VALIDATION');
  console.log('='.repeat(80));
  console.log();

  console.log('Step 1: Loading Excel maintenance dates...');
  const excelData = await readExcelMaintenanceDates();
  console.log(`Loaded ${excelData.length} clients from Excel\n`);

  console.log('Step 2: Loading database maintenance records...');
  const dbClients = await prisma.client.findMany({
    include: {
      equipment: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      maintenances: {
        orderBy: { scheduledDate: 'asc' },
      },
      contracts: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  console.log(`Loaded ${dbClients.length} clients from database\n`);

  console.log('Step 3: Validating maintenance schedules...');

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  const failures: any[] = [];

  for (const excelClient of excelData) {
    if (!excelClient.installationDate) continue;

    // Find matching DB client
    let dbClient = null;
    if (excelClient.rut) {
      const normalizedRut = excelClient.rut.replace(/[.\-]/g, '').toLowerCase();
      dbClient = dbClients.find(c =>
        c.rut?.replace(/[.\-]/g, '').toLowerCase().includes(normalizedRut.replace(/[^0-9kK]/g, ''))
      );
    }

    if (!dbClient && excelClient.email) {
      dbClient = dbClients.find(c =>
        c.email?.toLowerCase() === excelClient.email?.toLowerCase()
      );
    }

    if (!dbClient || dbClient.equipment.length === 0) continue;

    const equipment = dbClient.equipment[0];
    const contract = dbClient.contracts[0];

    if (!equipment.installationDate) continue;

    // Calculate expected maintenance dates
    const expectedDates = {
      6: addMonths(equipment.installationDate, 6),
      12: addMonths(equipment.installationDate, 12),
      18: addMonths(equipment.installationDate, 18),
      24: addMonths(equipment.installationDate, 24),
    };

    // Get actual maintenances from DB
    const maintenances = dbClient.maintenances;

    // Check each cycle
    [6, 12, 18, 24].forEach((cycle, index) => {
      totalChecks++;

      const expectedDate = expectedDates[cycle as keyof typeof expectedDates];
      const excelDate = index === 0 ? excelClient.excelMaint6 :
                        index === 1 ? excelClient.excelMaint12 :
                        index === 2 ? excelClient.excelMaint18 :
                        excelClient.excelMaint24;

      const dbMaintenance = maintenances.find(m => m.cycleNumber === index + 1);

      // Validate Excel date matches expected
      if (excelDate) {
        const excelDiff = Math.abs(dateDiffInDays(expectedDate, excelDate));
        if (excelDiff <= 7) { // Allow 7 days tolerance
          passedChecks++;
        } else {
          failedChecks++;
          failures.push({
            client: `${excelClient.name} (${excelClient.rut || excelClient.email})`,
            cycle,
            type: 'Excel vs Expected',
            expected: normalizeDate(expectedDate),
            actual: normalizeDate(excelDate),
            diff: excelDiff,
          });
        }
      }

      // Validate DB maintenance matches expected
      if (dbMaintenance) {
        const dbDiff = Math.abs(dateDiffInDays(expectedDate, dbMaintenance.scheduledDate));
        if (dbDiff <= 7) { // Allow 7 days tolerance
          passedChecks++;
        } else {
          failedChecks++;
          failures.push({
            client: `${excelClient.name} (${excelClient.rut || excelClient.email})`,
            cycle,
            type: 'DB vs Expected',
            expected: normalizeDate(expectedDate),
            actual: normalizeDate(dbMaintenance.scheduledDate),
            diff: dbDiff,
          });
        }

        // Validate DB matches Excel
        if (excelDate) {
          const excelDbDiff = Math.abs(dateDiffInDays(excelDate, dbMaintenance.scheduledDate));
          if (excelDbDiff <= 7) {
            passedChecks++;
          } else {
            failedChecks++;
            failures.push({
              client: `${excelClient.name} (${excelClient.rut || excelClient.email})`,
              cycle,
              type: 'DB vs Excel',
              expected: normalizeDate(excelDate),
              actual: normalizeDate(dbMaintenance.scheduledDate),
              diff: excelDbDiff,
            });
          }
        }
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`✓ Passed: ${passedChecks} (${((passedChecks / totalChecks) * 100).toFixed(1)}%)`);
  console.log(`✗ Failed: ${failedChecks} (${((failedChecks / totalChecks) * 100).toFixed(1)}%)`);
  console.log();

  if (failures.length > 0) {
    console.log('='.repeat(80));
    console.log(`DETAILED FAILURES (showing first 20 of ${failures.length})`);
    console.log('='.repeat(80));
    failures.slice(0, 20).forEach(failure => {
      console.log(`\n${failure.client} - ${failure.cycle} months (${failure.type}):`);
      console.log(`  Expected: ${failure.expected}`);
      console.log(`  Actual: ${failure.actual}`);
      console.log(`  Difference: ${failure.diff} days`);
    });

    if (failures.length > 20) {
      console.log(`\n... and ${failures.length - 20} more failures`);
    }
  }
}

async function main() {
  try {
    await validateMaintenanceSchedules();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
