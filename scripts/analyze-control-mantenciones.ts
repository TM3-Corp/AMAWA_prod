import ExcelJS from 'exceljs';
import * as path from 'path';

async function analyzeControlMantenciones() {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Control de mantenciones');
  if (!sheet) throw new Error('Control de mantenciones sheet not found');

  console.log('='.repeat(120));
  console.log('ANALYZING "CONTROL DE MANTENCIONES" SHEET');
  console.log('='.repeat(120));
  console.log();

  // Show column headers
  console.log('COLUMN HEADERS:');
  console.log('-'.repeat(120));
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const header = cell.value?.toString() || '';
    headers.push(header);
    if (colNumber <= 30) { // Show first 30 columns
      console.log(`Column ${colNumber}: ${header}`);
    }
  });
  console.log();

  // Look for batch headers in Nombre column
  console.log('MAINTENANCE BATCH HEADERS (looking for month/year patterns):');
  console.log('-'.repeat(120));

  const batchHeaders: any[] = [];

  for (let i = 1; i <= Math.min(1000, sheet.rowCount); i++) {
    const row = sheet.getRow(i);
    const nombreValue = row.getCell(1).value?.toString() || ''; // Column A (1) is usually first

    // Look for rows with month names and years
    const hasMonth = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(nombreValue);
    const hasYear = /202[4-6]/i.test(nombreValue);
    const hasCycle = /\d+\s*m/i.test(nombreValue) || nombreValue.includes('(6M)') || nombreValue.includes('(12M)');

    if (hasMonth && hasYear) {
      batchHeaders.push({ row: i, value: nombreValue });
      console.log(`Row ${i}: "${nombreValue}"`);
    }
  }

  console.log(`\nFound ${batchHeaders.length} potential batch headers`);

  // Show sample data after first batch header
  if (batchHeaders.length > 0) {
    const firstBatch = batchHeaders[0];
    console.log(`\n${'='.repeat(120)}`);
    console.log(`SAMPLE DATA AFTER FIRST BATCH HEADER (Row ${firstBatch.row}): "${firstBatch.value}"`);
    console.log('='.repeat(120));

    for (let i = firstBatch.row + 1; i <= Math.min(firstBatch.row + 10, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      console.log(`\nRow ${i}:`);

      // Show first 10 columns
      for (let col = 1; col <= Math.min(15, headers.length); col++) {
        const value = row.getCell(col).value;
        let displayValue = value;

        // Handle dates
        if (value instanceof Date) {
          displayValue = value.toISOString().split('T')[0];
        } else if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value).substring(0, 50);
        }

        console.log(`  ${headers[col - 1]}: ${displayValue}`);
      }

      // Check if this is another batch header
      const nombreValue = row.getCell(1).value?.toString() || '';
      const hasMonth = /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(nombreValue);
      const hasYear = /202[4-6]/i.test(nombreValue);
      if (hasMonth && hasYear) {
        console.log('\n  ^ Next batch header detected');
        break;
      }
    }
  }

  // Show last few batch headers
  if (batchHeaders.length > 5) {
    console.log(`\n${'='.repeat(120)}`);
    console.log('LAST 5 BATCH HEADERS:');
    console.log('='.repeat(120));
    batchHeaders.slice(-5).forEach(header => {
      console.log(`Row ${header.row}: "${header.value}"`);
    });
  }
}

analyzeControlMantenciones().catch(console.error);
