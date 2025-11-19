import * as XLSX from 'xlsx'
import * as path from 'path'

async function analyzeIncidenciasStructure() {
  console.log('📚 Analyzing Incidencias sheet structure...\n')

  const filePath = path.join(process.cwd(), 'data', 'Clientes_AMAWA_Hogar.xlsx')
  const workbook = XLSX.readFile(filePath)

  const worksheet = workbook.Sheets['Incidencias']
  if (!worksheet) {
    throw new Error('Sheet "Incidencias" not found')
  }

  // Get all data as raw array of arrays
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

  console.log(`Total rows: ${data.length}\n`)

  // Show first 50 rows to understand structure
  console.log('First 50 rows:')
  console.log('='.repeat(100))

  for (let i = 0; i < Math.min(50, data.length); i++) {
    const row = data[i]
    const firstCell = row[0] || ''
    const secondCell = row[1] || ''
    const thirdCell = row[2] || ''

    // Check if this looks like a month header
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                       'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

    if (monthNames.includes(String(firstCell).toUpperCase())) {
      console.log(`\n>>> ROW ${i}: MONTH HEADER = "${firstCell}"`)
    } else if (String(firstCell).toLowerCase().includes('nombre') ||
               String(firstCell).toLowerCase().includes('apellido')) {
      console.log(`\nROW ${i}: COLUMN HEADERS`)
      console.log(`  Total columns: ${row.length}`)
      console.log(`  ALL Columns: ${row.map((c, idx) => `[${idx}] ${c}`).join(' | ')}`)
    } else if (firstCell && firstCell !== '') {
      console.log(`\nROW ${i}: DATA (showing all ${row.length} columns)`)
      console.log(`  [0] Nombre: ${firstCell}`)
      console.log(`  [1] Apellido: ${secondCell}`)
      console.log(`  [2] Dirección: ${thirdCell}`)
      for (let j = 9; j < row.length; j++) {
        if (row[j]) {
          console.log(`  [${j}]: ${row[j]}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(100))
  console.log('\nLet me check the first data row to see all columns:')

  // Find first data row after a month header
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const firstCell = String(row[0] || '').trim()
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                       'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

    if (monthNames.includes(firstCell.toUpperCase())) {
      // Found month, next non-header row should be data
      for (let j = i + 1; j < Math.min(i + 5, data.length); j++) {
        const dataRow = data[j]
        const first = String(dataRow[0] || '').trim()
        if (first && !first.toLowerCase().includes('nombre') && !first.toLowerCase().includes('apellido')) {
          console.log(`\nFirst data row (row ${j}) has ${dataRow.length} columns:`)
          for (let k = 0; k < dataRow.length; k++) {
            if (dataRow[k]) {
              console.log(`  [${k}] = ${dataRow[k]}`)
            }
          }
          return
        }
      }
    }
  }
}

analyzeIncidenciasStructure()
  .then(() => {
    console.log('\n✅ Analysis complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
