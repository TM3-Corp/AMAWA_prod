import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'carga_masiva_bluex.xlsx')

console.log('Reading:', filePath)

const workbook = XLSX.readFile(filePath)

console.log('\n=== WORKBOOK STRUCTURE ===')
console.log('Sheet Names:', workbook.SheetNames)
console.log('')

// Analyze each sheet
workbook.SheetNames.forEach((sheetName, index) => {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`SHEET ${index + 1}: "${sheetName}"`)
  console.log('='.repeat(80))

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  if (data.length > 0) {
    // Show headers
    console.log('\n📋 HEADERS (Row 1):')
    const headers = data[0] as any[]
    headers.forEach((header, idx) => {
      console.log(`  Column ${String.fromCharCode(65 + idx)}: ${header}`)
    })

    // Show first 5 data rows
    console.log('\n📊 SAMPLE DATA (First 5 rows):')
    for (let i = 0; i < Math.min(6, data.length); i++) {
      const row = data[i] as any[]
      console.log(`\nRow ${i + 1}:`)
      row.forEach((cell, idx) => {
        if (cell !== '') {
          const header = headers[idx] || `Column ${idx}`
          console.log(`  ${header}: ${cell}`)
        }
      })
    }

    // Show total rows
    console.log(`\n📈 Total rows: ${data.length}`)
  } else {
    console.log('Sheet is empty')
  }
})

console.log('\n' + '='.repeat(80))
console.log('ANALYSIS COMPLETE')
console.log('='.repeat(80))
