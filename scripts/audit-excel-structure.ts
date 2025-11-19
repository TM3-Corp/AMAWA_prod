import ExcelJS from 'exceljs';
import * as path from 'path';

async function analyzeExcel() {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');

  console.log(`Reading file: ${filePath}\n`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // List all sheets
  console.log('='.repeat(80));
  console.log('ALL SHEETS IN WORKBOOK');
  console.log('='.repeat(80));
  workbook.worksheets.forEach((sheet, index) => {
    console.log(`${index + 1}. ${sheet.name} (${sheet.rowCount} rows, ${sheet.columnCount} cols)`);
  });
  console.log();

  // Analyze "Clientes" sheet
  const clientesSheet = workbook.getWorksheet('Clientes');
  if (clientesSheet) {
    console.log('='.repeat(80));
    console.log('CLIENTES SHEET - COLUMN HEADERS');
    console.log('='.repeat(80));
    const headerRow = clientesSheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = cell.value?.toString() || '';
      headers.push(header);
      console.log(`Column ${colNumber}: ${header}`);
    });
    console.log(`\nTotal columns: ${headers.length}`);
    console.log(`Total data rows: ${clientesSheet.rowCount - 1}`);

    // Show first 3 data rows as sample
    console.log('\n' + '='.repeat(80));
    console.log('SAMPLE DATA (First 3 rows)');
    console.log('='.repeat(80));
    for (let i = 2; i <= Math.min(4, clientesSheet.rowCount); i++) {
      console.log(`\nRow ${i}:`);
      const row = clientesSheet.getRow(i);
      headers.forEach((header, idx) => {
        const cell = row.getCell(idx + 1);
        let value = cell.value;
        // Handle dates
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0];
        } else if (typeof value === 'object' && value !== null && 'result' in value) {
          value = value.result;
        }
        console.log(`  ${header}: ${value}`);
      });
    }
  }

  // Analyze "Envio de filtros" sheet
  const envioSheet = workbook.getWorksheet('Envio de filtros');
  if (envioSheet) {
    console.log('\n' + '='.repeat(80));
    console.log('ENVIO DE FILTROS SHEET - STRUCTURE');
    console.log('='.repeat(80));
    console.log(`Total rows: ${envioSheet.rowCount}`);
    console.log(`Total columns: ${envioSheet.columnCount}`);

    // Show first 35 rows to understand the structure
    console.log('\nFirst 35 rows:');
    for (let i = 1; i <= Math.min(35, envioSheet.rowCount); i++) {
      const row = envioSheet.getRow(i);
      const values: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 11) { // Show first 11 columns (A-K as shown in screenshot)
          values.push(cell.value?.toString().substring(0, 30) || '');
        }
      });
      console.log(`Row ${i}: ${values.join(' | ')}`);
    }
  }
}

analyzeExcel().catch(console.error);
