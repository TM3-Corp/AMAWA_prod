import ExcelJS from 'exceljs';
import * as path from 'path';

async function showAllNombreValues() {
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  console.log('Showing all unique patterns in Nombre column...\n');
  console.log('='.repeat(120));

  const uniquePatterns = new Set<string>();

  for (let i = 1; i <= Math.min(2000, sheet.rowCount); i++) {
    const row = sheet.getRow(i);
    const nombreValue = row.getCell(2).value?.toString() || '';

    // Skip empty rows
    if (!nombreValue.trim()) continue;

    // Look for anything that's not a typical name
    const looksLikeHeader =
      nombreValue.length > 30 ||
      nombreValue.includes('-') ||
      nombreValue.includes('2024') ||
      nombreValue.includes('2025') ||
      nombreValue.includes('2026') ||
      nombreValue.toLowerCase().includes('noviembre') ||
      nombreValue.toLowerCase().includes('diciembre') ||
      nombreValue.toLowerCase().includes('septiembre') ||
      nombreValue.toLowerCase().includes('6m') ||
      nombreValue.toLowerCase().includes('12m') ||
      nombreValue.toLowerCase().includes('18m');

    if (looksLikeHeader && !uniquePatterns.has(nombreValue)) {
      uniquePatterns.add(nombreValue);
      console.log(`Row ${i}: "${nombreValue}"`);
    }
  }

  console.log('\n='.repeat(120));
  console.log(`Found ${uniquePatterns.size} unique header-like values\n`);

  // Also check if there are other sheets that might have maintenance tracking
  console.log('Available sheets in workbook:');
  workbook.worksheets.forEach((ws, idx) => {
    console.log(`  ${idx + 1}. ${ws.name} (${ws.rowCount} rows)`);
  });
}

showAllNombreValues().catch(console.error);
