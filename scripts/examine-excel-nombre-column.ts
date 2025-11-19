import ExcelJS from 'exceljs';
import * as path from 'path';

async function examineNombreColumn() {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  console.log('Examining Nombre column (column 2) for maintenance batch headers...\n');
  console.log('='.repeat(100));

  let batchHeaders = [];

  for (let i = 1; i <= Math.min(1000, sheet.rowCount); i++) {
    const row = sheet.getRow(i);
    const nombreValue = row.getCell(2).value?.toString() || '';

    // Look for rows that might be batch headers
    // They typically contain month names and years with cycle indicators
    const hasMonthYear = /\d{4}/i.test(nombreValue);
    const hasCycleIndicator = /\d+\s*m/i.test(nombreValue) || nombreValue.includes('6M') || nombreValue.includes('12M');

    if (hasMonthYear && hasCycleIndicator) {
      batchHeaders.push({
        row: i,
        value: nombreValue,
      });
      console.log(`Row ${i}: "${nombreValue}"`);
    }
  }

  console.log('\n='.repeat(100));
  console.log(`Found ${batchHeaders.length} potential batch headers\n`);

  // Show some sample client rows after the first batch header
  if (batchHeaders.length > 0) {
    const firstBatch = batchHeaders[0];
    console.log(`\nSample rows after first batch (Row ${firstBatch.row}):`);
    console.log('='.repeat(100));

    for (let i = firstBatch.row + 1; i <= Math.min(firstBatch.row + 10, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      const nombre = row.getCell(2).value?.toString() || '';
      const apellido = row.getCell(3).value?.toString() || '';
      const rut = row.getCell(4).value?.toString() || '';

      console.log(`Row ${i}: Nombre="${nombre}" | Apellido="${apellido}" | RUT="${rut}"`);

      // Check if we hit the next batch header
      const hasMonthYear = /\d{4}/i.test(nombre);
      const hasCycleIndicator = /\d+\s*m/i.test(nombre);
      if (hasMonthYear && hasCycleIndicator) {
        console.log('  ^ Next batch header found');
        break;
      }
    }
  }

  // Also show all column headers
  console.log('\n' + '='.repeat(100));
  console.log('ALL COLUMN HEADERS:');
  console.log('='.repeat(100));
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cell.value?.toString() || '';
    if (colNumber <= 57) {
      console.log(`Column ${colNumber}: ${header}`);
    }
  });
}

examineNombreColumn().catch(console.error);
