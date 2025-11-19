import * as XLSX from 'xlsx'
import * as path from 'path'

const filePath = path.join(process.cwd(), 'data', 'Clientes_AMAWA_Hogar.xlsx')
const workbook = XLSX.readFile(filePath)

// Read Incidencias sheet
const incidenciasSheet = workbook.Sheets['Incidencias']
if (!incidenciasSheet) {
  console.error('Sheet "Incidencias" not found')
  process.exit(1)
}

const incidenciasData = XLSX.utils.sheet_to_json(incidenciasSheet, { defval: null })

console.log('=== INCIDENCIAS SHEET ANALYSIS ===\n')
console.log(`Total records: ${incidenciasData.length}`)

// Get column names
if (incidenciasData.length > 0) {
  console.log('\n=== COLUMNS ===')
  const columns = Object.keys(incidenciasData[0] as any)
  columns.forEach((col, idx) => {
    console.log(`${idx + 1}. ${col}`)
  })

  console.log('\n=== SAMPLE DATA (First 5 records) ===')
  incidenciasData.slice(0, 5).forEach((record: any, idx) => {
    console.log(`\n--- Record ${idx + 1} ---`)
    Object.entries(record).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        console.log(`  ${key}: ${value}`)
      }
    })
  })

  // Analyze categories
  console.log('\n=== CATEGORIZATION ===')
  const categories = new Map<string, number>()
  const reasons = new Map<string, number>()

  incidenciasData.forEach((record: any) => {
    const cat = record['Categoría']
    const reason = record['Razón de VT']

    if (cat) {
      categories.set(cat, (categories.get(cat) || 0) + 1)
    }

    if (reason) {
      reasons.set(reason, (reasons.get(reason) || 0) + 1)
    }
  })

  console.log('\nTop Categories:')
  Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`)
    })

  console.log('\nTop Reasons:')
  Array.from(reasons.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count}`)
    })
}
