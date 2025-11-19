import ExcelJS from 'exceljs';
import * as path from 'path';

async function analyzeClientFunnel() {
  console.log('='.repeat(120));
  console.log('ANALYZING CLIENT FUNNEL STATUS FROM EXCEL');
  console.log('='.repeat(120));
  console.log();

  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  console.log('Column positions:');
  console.log('  Paso 1: Column 15');
  console.log('  Paso 2: Column 16');
  console.log();

  // Collect all unique values for Paso 1 and Paso 2
  const paso1Values = new Set<string>();
  const paso2Values = new Set<string>();

  // Count statuses
  let totalClients = 0;
  let activeClients = 0;
  let inactiveClients = 0;

  const clientsByStatus: {
    active: Array<{ name: string; rut: string | null; phone: string | null; paso1: string; paso2: string; row: number }>;
    inactive: Array<{ name: string; rut: string | null; phone: string | null; paso1: string; paso2: string; row: number }>;
  } = {
    active: [],
    inactive: [],
  };

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

    totalClients++;

    if (paso1) paso1Values.add(paso1);
    if (paso2) paso2Values.add(paso2);

    // Determine if active or inactive
    // Active = Paso 2 is "Cliente captado"
    // Inactive = Paso 2 is anything else
    const isActive = paso2.trim().toLowerCase() === 'cliente captado';

    if (isActive) {
      activeClients++;
      if (clientsByStatus.active.length < 10) { // Keep first 10 for display
        clientsByStatus.active.push({
          name: `${nombre} ${apellido}`,
          rut,
          phone,
          paso1,
          paso2,
          row: i,
        });
      }
    } else {
      inactiveClients++;
      if (clientsByStatus.inactive.length < 20) { // Keep first 20 for display
        clientsByStatus.inactive.push({
          name: `${nombre} ${apellido}`,
          rut,
          phone,
          paso1,
          paso2,
          row: i,
        });
      }
    }
  }

  console.log('='.repeat(120));
  console.log('UNIQUE VALUES IN PASO 1');
  console.log('='.repeat(120));
  Array.from(paso1Values).sort().forEach(value => {
    console.log(`  - "${value}"`);
  });

  console.log('\n' + '='.repeat(120));
  console.log('UNIQUE VALUES IN PASO 2');
  console.log('='.repeat(120));
  Array.from(paso2Values).sort().forEach(value => {
    console.log(`  - "${value}"`);
  });

  console.log('\n' + '='.repeat(120));
  console.log('CLIENT STATUS SUMMARY');
  console.log('='.repeat(120));
  console.log(`Total clients in Excel: ${totalClients}`);
  console.log(`✅ ACTIVE (Paso 2 = "Cliente captado"): ${activeClients} (${((activeClients / totalClients) * 100).toFixed(1)}%)`);
  console.log(`❌ INACTIVE (Paso 2 ≠ "Cliente captado"): ${inactiveClients} (${((inactiveClients / totalClients) * 100).toFixed(1)}%)`);

  console.log('\n' + '='.repeat(120));
  console.log('SAMPLE ACTIVE CLIENTS (First 10)');
  console.log('='.repeat(120));
  clientsByStatus.active.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (Row ${client.row})`);
    console.log(`   RUT: ${client.rut || 'N/A'}`);
    console.log(`   Phone: ${client.phone || 'N/A'}`);
    console.log(`   Paso 1: "${client.paso1}"`);
    console.log(`   Paso 2: "${client.paso2}"`);
    console.log();
  });

  console.log('='.repeat(120));
  console.log('SAMPLE INACTIVE CLIENTS (First 20)');
  console.log('='.repeat(120));
  clientsByStatus.inactive.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (Row ${client.row})`);
    console.log(`   RUT: ${client.rut || 'N/A'}`);
    console.log(`   Phone: ${client.phone || 'N/A'}`);
    console.log(`   Paso 1: "${client.paso1}"`);
    console.log(`   Paso 2: "${client.paso2}"`);
    console.log();
  });

  // Show breakdown by Paso 2 values for inactive clients
  const inactiveCounts: Record<string, number> = {};
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const nombre = row.getCell(2).value?.toString() || '';
    const paso2 = row.getCell(16).value?.toString() || '';

    if (!nombre || nombre === 'Nombre') continue;

    const isActive = paso2.trim().toLowerCase() === 'cliente captado';
    if (!isActive && paso2) {
      inactiveCounts[paso2] = (inactiveCounts[paso2] || 0) + 1;
    }
  }

  console.log('='.repeat(120));
  console.log('INACTIVE CLIENTS BY PASO 2 VALUE');
  console.log('='.repeat(120));
  Object.entries(inactiveCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([paso2, count]) => {
      console.log(`  "${paso2}": ${count} clients`);
    });

  console.log('\n' + '='.repeat(120));
  console.log('NEXT STEPS');
  console.log('='.repeat(120));
  console.log('1. Review the inactive clients list above');
  console.log('2. Confirm the logic is correct (Paso 2 ≠ "Cliente captado" = INACTIVE)');
  console.log('3. Run the update script to mark these clients as inactive in the database');
  console.log('='.repeat(120));
}

analyzeClientFunnel().catch(console.error);
