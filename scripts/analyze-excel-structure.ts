import * as XLSX from 'xlsx'
import * as path from 'path'

const excelPath = path.join('/home/paul/projects/AMAWA', 'Clientes AMAWA Hogar.xlsx')

try {
  const workbook = XLSX.readFile(excelPath)

  console.log('📊 Available sheets:')
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`  ${idx + 1}. ${name}`)
  })

  // Read "Envio de filtros" sheet
  const sheetName = 'Envio de filtros'
  if (workbook.SheetNames.includes(sheetName)) {
    console.log(`\n📋 Analyzing sheet: "${sheetName}"`)
    const worksheet = workbook.Sheets[sheetName]

    // Get raw data as arrays
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    console.log('\n📝 First 10 rows:')
    data.slice(0, 10).forEach((row: any, idx: number) => {
      console.log(`Row ${idx}:`, row)
    })

    console.log(`\n✅ Total rows: ${data.length}`)
  } else {
    console.log(`\n❌ Sheet "${sheetName}" not found`)
  }

} catch (error) {
  console.error('Error reading Excel:', error)
}
