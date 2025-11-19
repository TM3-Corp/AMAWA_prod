import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MaintenanceCycleMapping {
  planCode: string;
  equipment: string;
  filterType: string;
  cycle6Months: string[];
  cycle12Months: string[];
  cycle18Months: string[];
  cycle24Months: string[];
  packages: string[];
}

async function analyzeEnvioFiltros() {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Envio de filtros');
  if (!sheet) throw new Error('Envio de filtros sheet not found');

  console.log('='.repeat(80));
  console.log('MAINTENANCE PACKAGE LOGIC ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  const mappings: MaintenanceCycleMapping[] = [];
  let currentMapping: Partial<MaintenanceCycleMapping> | null = null;

  // Parse the sheet structure
  for (let i = 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const colA = row.getCell(1).value?.toString() || '';
    const colB = row.getCell(2).value?.toString() || '';
    const colC = row.getCell(3).value?.toString() || '';

    // Check if this is a new plan code row (has a plan code in column A)
    if (colA && colA.includes('RODE') || colA.includes('UFDE')) {
      if (currentMapping && currentMapping.planCode) {
        mappings.push(currentMapping as MaintenanceCycleMapping);
      }

      currentMapping = {
        planCode: colA,
        equipment: colB || '',
        filterType: colC || '',
        cycle6Months: [],
        cycle12Months: [],
        cycle18Months: [],
        cycle24Months: [],
        packages: [],
      };

      // Parse filters for each cycle
      const col6m = row.getCell(4).value?.toString() || '';
      const col12m = row.getCell(5).value?.toString() || '';
      const col18m = row.getCell(6).value?.toString() || '';
      const col24m = row.getCell(7).value?.toString() || '';

      if (col6m) currentMapping.cycle6Months.push(col6m);
      if (col12m) currentMapping.cycle12Months.push(col12m);
      if (col18m) currentMapping.cycle18Months.push(col18m);
      if (col24m) currentMapping.cycle24Months.push(col24m);

      // Extract package names from columns I, J, K
      for (let col = 9; col <= 11; col++) {
        const pkg = row.getCell(col).value?.toString() || '';
        if (pkg && pkg.includes('Paquete')) {
          currentMapping.packages.push(pkg);
        }
      }
    } else if (currentMapping && colA === '' && colB === '') {
      // Additional filters for the current plan code
      const col6m = row.getCell(4).value?.toString() || '';
      const col12m = row.getCell(5).value?.toString() || '';
      const col18m = row.getCell(6).value?.toString() || '';
      const col24m = row.getCell(7).value?.toString() || '';

      if (col6m) currentMapping.cycle6Months!.push(col6m);
      if (col12m) currentMapping.cycle12Months!.push(col12m);
      if (col18m) currentMapping.cycle18Months!.push(col18m);
      if (col24m) currentMapping.cycle24Months!.push(col24m);
    }
  }

  // Add the last mapping
  if (currentMapping && currentMapping.planCode) {
    mappings.push(currentMapping as MaintenanceCycleMapping);
  }

  console.log('EXTRACTED MAINTENANCE MAPPINGS FROM EXCEL:');
  console.log('='.repeat(80));
  mappings.forEach((mapping, index) => {
    console.log(`\n${index + 1}. Plan Code: ${mapping.planCode}`);
    console.log(`   Equipment: ${mapping.equipment}`);
    console.log(`   Filter Type: ${mapping.filterType}`);
    console.log(`   Packages: ${mapping.packages.join(', ')}`);
    console.log(`   6 Months: ${mapping.cycle6Months.join(', ')}`);
    console.log(`   12 Months: ${mapping.cycle12Months.join(', ')}`);
    console.log(`   18 Months: ${mapping.cycle18Months.join(', ')}`);
    console.log(`   24 Months: ${mapping.cycle24Months.join(', ')}`);
  });

  return mappings;
}

async function validateAgainstDatabase(excelMappings: MaintenanceCycleMapping[]) {
  console.log('\n' + '='.repeat(80));
  console.log('DATABASE VALIDATION');
  console.log('='.repeat(80));

  // Get all filter packages from database
  const dbPackages = await prisma.filterPackage.findMany({
    include: {
      items: {
        include: {
          filter: true,
        },
      },
      mappings: true,
    },
  });

  console.log(`\nFound ${dbPackages.length} filter packages in database\n`);

  dbPackages.forEach(pkg => {
    console.log(`Package ${pkg.code} (${pkg.name}):`);
    console.log(`  Filters: ${pkg.items.map(item => `${item.filter.sku} (x${item.quantity})`).join(', ')}`);
    console.log(`  Mappings: ${pkg.mappings.map(m => `${m.planCode} @ ${m.maintenanceCycle} months`).join(', ')}`);
    console.log();
  });

  // Get all equipment filter mappings
  const dbMappings = await prisma.equipmentFilterMapping.findMany({
    include: {
      package: {
        include: {
          items: {
            include: {
              filter: true,
            },
          },
        },
      },
    },
    orderBy: [
      { planCode: 'asc' },
      { maintenanceCycle: 'asc' },
    ],
  });

  console.log('='.repeat(80));
  console.log('EQUIPMENT FILTER MAPPINGS IN DATABASE');
  console.log('='.repeat(80));

  // Group by plan code
  const groupedByPlan: Record<string, typeof dbMappings> = {};
  dbMappings.forEach(mapping => {
    if (!groupedByPlan[mapping.planCode]) {
      groupedByPlan[mapping.planCode] = [];
    }
    groupedByPlan[mapping.planCode].push(mapping);
  });

  Object.entries(groupedByPlan).forEach(([planCode, mappings]) => {
    console.log(`\n${planCode}:`);
    mappings.forEach(mapping => {
      console.log(`  ${mapping.maintenanceCycle} months → Package ${mapping.package.code} (${mapping.package.name})`);
      console.log(`    Filters: ${mapping.package.items.map(item => `${item.filter.sku} (x${item.quantity})`).join(', ')}`);
    });
  });

  // Compare Excel with Database
  console.log('\n' + '='.repeat(80));
  console.log('COMPARISON: EXCEL vs DATABASE');
  console.log('='.repeat(80));

  const excelPlanCodes = excelMappings.map(m => m.planCode);
  const dbPlanCodes = Object.keys(groupedByPlan);

  console.log(`\nExcel Plan Codes (${excelPlanCodes.length}): ${excelPlanCodes.join(', ')}`);
  console.log(`Database Plan Codes (${dbPlanCodes.length}): ${dbPlanCodes.join(', ')}`);

  const missingInDb = excelPlanCodes.filter(code => !dbPlanCodes.includes(code));
  const missingInExcel = dbPlanCodes.filter(code => !excelPlanCodes.includes(code));

  if (missingInDb.length > 0) {
    console.log(`\n⚠ Plan codes in Excel but NOT in database: ${missingInDb.join(', ')}`);
  }

  if (missingInExcel.length > 0) {
    console.log(`\n⚠ Plan codes in database but NOT in Excel: ${missingInExcel.join(', ')}`);
  }

  if (missingInDb.length === 0 && missingInExcel.length === 0) {
    console.log('\n✓ All plan codes match between Excel and database!');
  }

  return { dbPackages, dbMappings, groupedByPlan };
}

async function main() {
  try {
    const excelMappings = await analyzeEnvioFiltros();
    await validateAgainstDatabase(excelMappings);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
