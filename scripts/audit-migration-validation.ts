import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExcelClient {
  rut: string | null;
  email: string | null;
  phone: string | null;
  name: string;
  installationDate: Date | null;
  equipment: string | null;
  filterType: string | null;
  deliveryType: string | null;
  planCode: string | null;
  rowNumber: number;
}

interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'WARNING';
  field: string;
  excelValue: any;
  dbValue: any;
  message: string;
}

interface ClientValidation {
  identifier: string;
  rowNumber: number;
  results: ValidationResult[];
  overallStatus: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_FOUND';
}

function normalizeDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  // Return date in YYYY-MM-DD format for comparison
  return d.toISOString().split('T')[0];
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
}

function normalizeRut(rut: string | null): string | null {
  if (!rut) return null;
  // Remove dots and hyphens, convert to lowercase
  return rut.replace(/[.\-]/g, '').toLowerCase();
}

function normalizeEquipment(equipment: string | null): string | null {
  if (!equipment) return null;
  // Normalize equipment names
  const normalized = equipment.trim().toLowerCase();
  // Map common variations
  const mappings: Record<string, string> = {
    'whp-3200': 'whp-3200',
    'whp-4200': 'whp-4200',
    'whp-4230': 'whp-4230',
    'llave': 'llave',
  };
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) return value;
  }
  return normalized;
}

function normalizeFilterType(filterType: string | null): string | null {
  if (!filterType) return null;
  const normalized = filterType.trim().toLowerCase();
  if (normalized.includes('osmosis') || normalized.includes('reverse')) return 'ro';
  if (normalized.includes('ultra')) return 'uf';
  return normalized;
}

function normalizeDeliveryType(deliveryType: string | null): string | null {
  if (!deliveryType) return null;
  const normalized = deliveryType.trim().toLowerCase();
  if (normalized.includes('presencial')) return 'presencial';
  if (normalized.includes('domicilio') || normalized.includes('delivery')) return 'domicilio';
  return normalized;
}

async function readExcelClients(): Promise<ExcelClient[]> {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  const clients: ExcelClient[] = [];

  // Start from row 2 (skip header)
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    const rut = row.getCell(4).value?.toString() || null;
    const email = row.getCell(5).value?.toString() || null;
    const phone = row.getCell(6).value?.toString() || null;
    const name = row.getCell(56).value?.toString() || '';

    let installationDate: Date | null = null;
    const installDateCell = row.getCell(11).value;
    if (installDateCell instanceof Date) {
      installationDate = installDateCell;
    } else if (typeof installDateCell === 'number') {
      // Excel date serial number
      installationDate = new Date((installDateCell - 25569) * 86400 * 1000);
    }

    const equipment = row.getCell(20).value?.toString() || null;
    const filterType = row.getCell(21).value?.toString() || null;
    const deliveryType = row.getCell(22).value?.toString() || null;
    const planCode = row.getCell(23).value?.toString() || null;

    // Skip rows without any identifier
    if (!rut && !email && !phone) continue;

    clients.push({
      rut,
      email,
      phone,
      name,
      installationDate,
      equipment,
      filterType,
      deliveryType,
      planCode,
      rowNumber: i,
    });
  }

  return clients;
}

async function validateClient(excelClient: ExcelClient): Promise<ClientValidation> {
  const results: ValidationResult[] = [];

  // Find client in database by RUT, email, or phone
  let dbClient = null;
  let matchMethod = '';

  if (excelClient.rut) {
    const normalizedRut = normalizeRut(excelClient.rut);
    dbClient = await prisma.client.findFirst({
      where: {
        rut: {
          contains: normalizedRut?.replace(/[^0-9kK]/g, ''),
          mode: 'insensitive',
        },
      },
      include: {
        equipment: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (dbClient) matchMethod = 'RUT';
  }

  if (!dbClient && excelClient.email) {
    dbClient = await prisma.client.findFirst({
      where: { email: { equals: excelClient.email, mode: 'insensitive' } },
      include: {
        equipment: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (dbClient) matchMethod = 'Email';
  }

  if (!dbClient && excelClient.phone) {
    const normalizedPhone = normalizePhone(excelClient.phone);
    dbClient = await prisma.client.findFirst({
      where: {
        phone: {
          contains: normalizedPhone?.slice(-8), // Match last 8 digits
        },
      },
      include: {
        equipment: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (dbClient) matchMethod = 'Phone';
  }

  const identifier = excelClient.rut || excelClient.email || excelClient.phone || 'Unknown';

  if (!dbClient) {
    return {
      identifier,
      rowNumber: excelClient.rowNumber,
      results: [{
        status: 'WARNING',
        field: 'Client',
        excelValue: excelClient.name,
        dbValue: null,
        message: 'Client not found in database',
      }],
      overallStatus: 'NOT_FOUND',
    };
  }

  // Get equipment data
  const dbEquipment = dbClient.equipment[0] || null;

  // Validate installation date
  const excelDate = normalizeDate(excelClient.installationDate);
  const dbDate = normalizeDate(dbEquipment?.installationDate);

  if (excelDate && dbDate) {
    if (excelDate === dbDate) {
      results.push({
        status: 'PASS',
        field: 'Fecha instalacion',
        excelValue: excelDate,
        dbValue: dbDate,
        message: 'Installation date matches',
      });
    } else {
      results.push({
        status: 'FAIL',
        field: 'Fecha instalacion',
        excelValue: excelDate,
        dbValue: dbDate,
        message: `Installation date mismatch (matched by ${matchMethod})`,
      });
    }
  } else if (!dbEquipment) {
    results.push({
      status: 'WARNING',
      field: 'Fecha instalacion',
      excelValue: excelDate,
      dbValue: null,
      message: 'No equipment record found in database',
    });
  } else {
    results.push({
      status: 'WARNING',
      field: 'Fecha instalacion',
      excelValue: excelDate,
      dbValue: dbDate,
      message: 'Missing installation date in Excel or DB',
    });
  }

  // Validate equipment type
  if (dbEquipment) {
    const normalizedExcelEquip = normalizeEquipment(excelClient.equipment);
    const normalizedDbEquip = normalizeEquipment(dbEquipment.equipmentType);

    if (normalizedExcelEquip && normalizedDbEquip) {
      if (normalizedExcelEquip === normalizedDbEquip ||
          normalizedDbEquip.includes(normalizedExcelEquip) ||
          normalizedExcelEquip.includes(normalizedDbEquip)) {
        results.push({
          status: 'PASS',
          field: 'Equipo',
          excelValue: excelClient.equipment,
          dbValue: dbEquipment.equipmentType,
          message: 'Equipment type matches',
        });
      } else {
        results.push({
          status: 'FAIL',
          field: 'Equipo',
          excelValue: excelClient.equipment,
          dbValue: dbEquipment.equipmentType,
          message: 'Equipment type mismatch',
        });
      }
    } else {
      results.push({
        status: 'WARNING',
        field: 'Equipo',
        excelValue: excelClient.equipment,
        dbValue: dbEquipment.equipmentType,
        message: 'Missing equipment type in Excel or DB',
      });
    }

    // Validate filter type
    const normalizedExcelFilter = normalizeFilterType(excelClient.filterType);
    const normalizedDbFilter = normalizeFilterType(dbEquipment.filterType);

    if (normalizedExcelFilter && normalizedDbFilter) {
      if (normalizedExcelFilter === normalizedDbFilter) {
        results.push({
          status: 'PASS',
          field: 'Tipo de filtrado',
          excelValue: excelClient.filterType,
          dbValue: dbEquipment.filterType,
          message: 'Filter type matches',
        });
      } else {
        results.push({
          status: 'FAIL',
          field: 'Tipo de filtrado',
          excelValue: excelClient.filterType,
          dbValue: dbEquipment.filterType,
          message: 'Filter type mismatch',
        });
      }
    } else {
      results.push({
        status: 'WARNING',
        field: 'Tipo de filtrado',
        excelValue: excelClient.filterType,
        dbValue: dbEquipment.filterType,
        message: 'Missing filter type in Excel or DB',
      });
    }

    // Validate delivery type
    const normalizedExcelDelivery = normalizeDeliveryType(excelClient.deliveryType);
    const normalizedDbDelivery = normalizeDeliveryType(dbEquipment.deliveryType);

    if (normalizedExcelDelivery && normalizedDbDelivery) {
      if (normalizedExcelDelivery === normalizedDbDelivery) {
        results.push({
          status: 'PASS',
          field: 'Delivery/presencial',
          excelValue: excelClient.deliveryType,
          dbValue: dbEquipment.deliveryType,
          message: 'Delivery type matches',
        });
      } else {
        results.push({
          status: 'FAIL',
          field: 'Delivery/presencial',
          excelValue: excelClient.deliveryType,
          dbValue: dbEquipment.deliveryType,
          message: 'Delivery type mismatch',
        });
      }
    } else {
      results.push({
        status: 'WARNING',
        field: 'Delivery/presencial',
        excelValue: excelClient.deliveryType,
        dbValue: dbEquipment.deliveryType,
        message: 'Missing delivery type in Excel or DB',
      });
    }
  }

  // Determine overall status
  const hasFail = results.some(r => r.status === 'FAIL');
  const hasWarning = results.some(r => r.status === 'WARNING');
  const overallStatus = hasFail ? 'FAIL' : hasWarning ? 'WARNING' : 'PASS';

  return {
    identifier,
    rowNumber: excelClient.rowNumber,
    results,
    overallStatus,
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('MIGRATION VALIDATION AUDIT');
  console.log('='.repeat(80));
  console.log();

  console.log('Step 1: Reading Excel data...');
  const excelClients = await readExcelClients();
  console.log(`Found ${excelClients.length} clients in Excel\n`);

  console.log('Step 2: Validating against database...');
  const validations: ClientValidation[] = [];

  let progress = 0;
  for (const excelClient of excelClients) {
    const validation = await validateClient(excelClient);
    validations.push(validation);

    progress++;
    if (progress % 100 === 0) {
      console.log(`Progress: ${progress}/${excelClients.length} clients validated`);
    }
  }

  console.log(`\nValidation complete!\n`);

  // Generate summary
  const summary = {
    total: validations.length,
    pass: validations.filter(v => v.overallStatus === 'PASS').length,
    fail: validations.filter(v => v.overallStatus === 'FAIL').length,
    warning: validations.filter(v => v.overallStatus === 'WARNING').length,
    notFound: validations.filter(v => v.overallStatus === 'NOT_FOUND').length,
  };

  console.log('='.repeat(80));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total clients validated: ${summary.total}`);
  console.log(`✓ PASS: ${summary.pass} (${((summary.pass / summary.total) * 100).toFixed(1)}%)`);
  console.log(`✗ FAIL: ${summary.fail} (${((summary.fail / summary.total) * 100).toFixed(1)}%)`);
  console.log(`⚠ WARNING: ${summary.warning} (${((summary.warning / summary.total) * 100).toFixed(1)}%)`);
  console.log(`? NOT_FOUND: ${summary.notFound} (${((summary.notFound / summary.total) * 100).toFixed(1)}%)`);
  console.log();

  // Show field-specific summary
  const fieldSummary: Record<string, { pass: number; fail: number; warning: number }> = {};
  validations.forEach(v => {
    v.results.forEach(r => {
      if (!fieldSummary[r.field]) {
        fieldSummary[r.field] = { pass: 0, fail: 0, warning: 0 };
      }
      if (r.status === 'PASS') fieldSummary[r.field].pass++;
      if (r.status === 'FAIL') fieldSummary[r.field].fail++;
      if (r.status === 'WARNING') fieldSummary[r.field].warning++;
    });
  });

  console.log('='.repeat(80));
  console.log('FIELD-SPECIFIC RESULTS');
  console.log('='.repeat(80));
  Object.entries(fieldSummary).forEach(([field, stats]) => {
    const total = stats.pass + stats.fail + stats.warning;
    console.log(`\n${field}:`);
    console.log(`  ✓ PASS: ${stats.pass}/${total} (${((stats.pass / total) * 100).toFixed(1)}%)`);
    console.log(`  ✗ FAIL: ${stats.fail}/${total} (${((stats.fail / total) * 100).toFixed(1)}%)`);
    console.log(`  ⚠ WARNING: ${stats.warning}/${total} (${((stats.warning / total) * 100).toFixed(1)}%)`);
  });
  console.log();

  // Show failures in detail
  const failures = validations.filter(v => v.overallStatus === 'FAIL');
  if (failures.length > 0) {
    console.log('='.repeat(80));
    console.log(`DETAILED FAILURES (${failures.length} clients)`);
    console.log('='.repeat(80));
    failures.slice(0, 20).forEach(v => {
      console.log(`\nRow ${v.rowNumber} - ${v.identifier}:`);
      v.results.forEach(r => {
        if (r.status === 'FAIL') {
          console.log(`  ✗ ${r.field}: ${r.message}`);
          console.log(`    Excel: ${r.excelValue}`);
          console.log(`    DB: ${r.dbValue}`);
        }
      });
    });
    if (failures.length > 20) {
      console.log(`\n... and ${failures.length - 20} more failures`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
