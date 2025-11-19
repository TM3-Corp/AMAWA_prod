import * as XLSX from 'xlsx'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'carga_masiva_bluex.xlsx')
const workbook = XLSX.readFile(filePath)
const sheet = workbook.Sheets['Instrucciones Carga Masiva']
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

console.log('=== BLUEX BULK UPLOAD FIELD INSTRUCTIONS ===\n')

// Skip header row
for (let i = 1; i < data.length; i++) {
  const row = data[i] as any[]
  if (row[0] || row[1] || row[2]) {
    console.log(`${row[1]}`)
    console.log(`  Type: ${row[0]}`)
    console.log(`  Description: ${row[2]}`)
    console.log('')
  }
}
