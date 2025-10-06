import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function seedFilters() {
  console.log('🔧 Seeding Filter Inventory System...\n')

  // ============================================
  // 1. SEED FILTERS (Master SKU List)
  // ============================================
  console.log('📦 Step 1: Creating Filter SKUs...')

  const filters = [
    // Ultrafiltración Filters
    {
      sku: 'S/P COMBI',
      name: 'Sediment/Pre-filter Combo (UF)',
      description: 'Combined sediment and pre-filter for ultrafiltration systems',
      category: 'UF',
      unitCost: null,
    },
    {
      sku: 'U/P COMBI',
      name: 'Ultra-filter/Post-filter Combo (UF)',
      description: 'Combined ultra-filter and post-filter for ultrafiltration systems',
      category: 'UF',
      unitCost: null,
    },

    // Osmosis Inversa Standard Filters
    {
      sku: 'PP-10CF',
      name: 'Polypropylene Sediment Filter 10"',
      description: 'Pre-filter - Removes sediment and particles',
      category: 'RO',
      unitCost: null,
    },
    {
      sku: 'CTO-10CF',
      name: 'Carbon Block Filter 10"',
      description: 'Pre-filter - Removes chlorine, odors, and organic compounds',
      category: 'RO',
      unitCost: null,
    },
    {
      sku: 'RO-10CF',
      name: 'Reverse Osmosis Membrane 10"',
      description: 'Main filter - Removes dissolved solids, heavy metals, and contaminants',
      category: 'RO',
      unitCost: null,
    },
    {
      sku: 'T33-10CF',
      name: 'Post-Carbon Filter 10"',
      description: 'Post-filter - Improves taste and removes residual odors',
      category: 'RO',
      unitCost: null,
    },
    {
      sku: 'POST CARBON RUHENS',
      name: 'Post Carbon Ruhens',
      description: 'Additional post-carbon filter (used in WHP-3200 RO and WHP-4230)',
      category: 'RO',
      unitCost: null,
    },
    {
      sku: 'MAGNESIUM',
      name: 'Magnesium Mineralization Filter',
      description: 'Adds beneficial minerals to purified water (WHP-3200 RO only)',
      category: 'RO',
      unitCost: null,
    },

    // WHP-4230 Specific Filter
    {
      sku: 'MICRO CARBON',
      name: 'Micro Carbon Pre-filter',
      description: 'Pre-filter for WHP-4230 pedestal model (replaces PP-10CF + CTO-10CF)',
      category: 'RO',
      unitCost: null,
    },
  ]

  const createdFilters: Record<string, any> = {}

  for (const filterData of filters) {
    const filter = await prisma.filter.upsert({
      where: { sku: filterData.sku },
      update: filterData,
      create: filterData,
    })
    createdFilters[filterData.sku] = filter
    console.log(`  ✓ Created filter: ${filter.sku} - ${filter.name}`)
  }

  console.log(`\n✅ Created ${filters.length} filter SKUs\n`)

  // ============================================
  // 2. SEED FILTER PACKAGES
  // ============================================
  console.log('📋 Step 2: Creating Filter Packages...')

  const packages = [
    {
      code: '1.1',
      name: 'UF Partial Replacement',
      description: 'WHP-3200 Ultrafiltración at 6 and 18 months',
    },
    {
      code: '1.2',
      name: 'UF Complete Replacement',
      description: 'WHP-3200 Ultrafiltración at 12 and 24 months',
    },
    {
      code: '2.1',
      name: 'RO Standard Partial Replacement',
      description: 'WHP-3200 RO pre-filters at 6, 12, 18 months',
    },
    {
      code: '2.2',
      name: 'RO Standard Complete Replacement',
      description: 'WHP-3200 RO all filters at 24 months',
    },
    {
      code: '5.2',
      name: 'RO 4200/Llave Complete Replacement',
      description: 'WHP-4200 and Llave all filters at 24 months',
    },
    {
      code: '4230-6',
      name: 'WHP-4230 6-month Package',
      description: 'WHP-4230 at 6 and 18 months',
    },
    {
      code: '4230-12',
      name: 'WHP-4230 12-month Package',
      description: 'WHP-4230 at 12 months',
    },
    {
      code: '4230-24',
      name: 'WHP-4230 24-month Package',
      description: 'WHP-4230 complete replacement at 24 months',
    },
  ]

  const createdPackages: Record<string, any> = {}

  for (const packageData of packages) {
    const pkg = await prisma.filterPackage.upsert({
      where: { code: packageData.code },
      update: packageData,
      create: packageData,
    })
    createdPackages[packageData.code] = pkg
    console.log(`  ✓ Created package: ${pkg.code} - ${pkg.name}`)
  }

  console.log(`\n✅ Created ${packages.length} filter packages\n`)

  // ============================================
  // 3. SEED FILTER PACKAGE ITEMS
  // ============================================
  console.log('📦 Step 3: Defining Package Contents...')

  const packageItems = [
    // Package 1.1 (UF Partial)
    { packageCode: '1.1', filterSku: 'S/P COMBI', quantity: 1 },

    // Package 1.2 (UF Complete)
    { packageCode: '1.2', filterSku: 'S/P COMBI', quantity: 1 },
    { packageCode: '1.2', filterSku: 'U/P COMBI', quantity: 1 },

    // Package 2.1 (RO Standard Partial)
    { packageCode: '2.1', filterSku: 'PP-10CF', quantity: 1 },
    { packageCode: '2.1', filterSku: 'CTO-10CF', quantity: 1 },

    // Package 2.2 (RO Standard Complete)
    { packageCode: '2.2', filterSku: 'PP-10CF', quantity: 1 },
    { packageCode: '2.2', filterSku: 'CTO-10CF', quantity: 1 },
    { packageCode: '2.2', filterSku: 'RO-10CF', quantity: 1 },
    { packageCode: '2.2', filterSku: 'T33-10CF', quantity: 1 },
    { packageCode: '2.2', filterSku: 'POST CARBON RUHENS', quantity: 1 },
    { packageCode: '2.2', filterSku: 'MAGNESIUM', quantity: 1 },

    // Package 5.2 (RO 4200/Llave Complete) - No MAGNESIUM or POST CARBON RUHENS
    { packageCode: '5.2', filterSku: 'PP-10CF', quantity: 1 },
    { packageCode: '5.2', filterSku: 'CTO-10CF', quantity: 1 },
    { packageCode: '5.2', filterSku: 'RO-10CF', quantity: 1 },
    { packageCode: '5.2', filterSku: 'T33-10CF', quantity: 1 },

    // Package 4230-6 (WHP-4230 at 6/18 months)
    { packageCode: '4230-6', filterSku: 'MICRO CARBON', quantity: 1 },

    // Package 4230-12 (WHP-4230 at 12 months)
    { packageCode: '4230-12', filterSku: 'MICRO CARBON', quantity: 1 },
    { packageCode: '4230-12', filterSku: 'POST CARBON RUHENS', quantity: 1 },

    // Package 4230-24 (WHP-4230 at 24 months - complete)
    { packageCode: '4230-24', filterSku: 'MICRO CARBON', quantity: 1 },
    { packageCode: '4230-24', filterSku: 'POST CARBON RUHENS', quantity: 1 },
    { packageCode: '4230-24', filterSku: 'RO-10CF', quantity: 1 },
  ]

  let itemCount = 0
  for (const item of packageItems) {
    const pkg = createdPackages[item.packageCode]
    const filter = createdFilters[item.filterSku]

    if (!pkg || !filter) {
      console.error(`  ❌ Error: Package ${item.packageCode} or filter ${item.filterSku} not found`)
      continue
    }

    await prisma.filterPackageItem.upsert({
      where: {
        unique_package_filter: {
          packageId: pkg.id,
          filterId: filter.id,
        }
      },
      update: { quantity: item.quantity },
      create: {
        packageId: pkg.id,
        filterId: filter.id,
        quantity: item.quantity,
      },
    })

    console.log(`  ✓ Added ${item.filterSku} to package ${item.packageCode}`)
    itemCount++
  }

  console.log(`\n✅ Created ${itemCount} package items\n`)

  // ============================================
  // 4. SEED EQUIPMENT FILTER MAPPINGS
  // ============================================
  console.log('🔗 Step 4: Creating Equipment-Filter Mappings...')

  const mappings = [
    // WHP-3200 Ultrafiltración (3200UFDE)
    { planCode: '3200UFDE', maintenanceCycle: 6, packageCode: '1.1' },
    { planCode: '3200UFDE', maintenanceCycle: 12, packageCode: '1.2' },
    { planCode: '3200UFDE', maintenanceCycle: 18, packageCode: '1.1' },
    { planCode: '3200UFDE', maintenanceCycle: 24, packageCode: '1.2' },

    // WHP-3200 Osmosis Inversa (3200RODE)
    { planCode: '3200RODE', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: '3200RODE', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: '3200RODE', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: '3200RODE', maintenanceCycle: 24, packageCode: '2.2' },

    // WHP-3200 Osmosis con Bomba (3200RBDE) - same as 3200RODE
    { planCode: '3200RBDE', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: '3200RBDE', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: '3200RBDE', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: '3200RBDE', maintenanceCycle: 24, packageCode: '2.2' },

    // WHP-4200 Osmosis Inversa (4200RODE)
    { planCode: '4200RODE', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: '4200RODE', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: '4200RODE', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: '4200RODE', maintenanceCycle: 24, packageCode: '5.2' },

    // Llave Osmosis Inversa (LLAVERODE) - same as 4200RODE
    { planCode: 'LLAVERODE', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: 'LLAVERODE', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: 'LLAVERODE', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: 'LLAVERODE', maintenanceCycle: 24, packageCode: '5.2' },

    // WHP-4230 Pedestal (4230RODE) - custom packages
    { planCode: '4230RODE', maintenanceCycle: 6, packageCode: '4230-6' },
    { planCode: '4230RODE', maintenanceCycle: 12, packageCode: '4230-12' },
    { planCode: '4230RODE', maintenanceCycle: 18, packageCode: '4230-6' },
    { planCode: '4230RODE', maintenanceCycle: 24, packageCode: '4230-24' },

    // Add presencial variants
    { planCode: '3200UFPR', maintenanceCycle: 6, packageCode: '1.1' },
    { planCode: '3200UFPR', maintenanceCycle: 12, packageCode: '1.2' },
    { planCode: '3200UFPR', maintenanceCycle: 18, packageCode: '1.1' },
    { planCode: '3200UFPR', maintenanceCycle: 24, packageCode: '1.2' },

    { planCode: '3200ROPR', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: '3200ROPR', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: '3200ROPR', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: '3200ROPR', maintenanceCycle: 24, packageCode: '2.2' },

    { planCode: '3200RBPR', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: '3200RBPR', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: '3200RBPR', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: '3200RBPR', maintenanceCycle: 24, packageCode: '2.2' },

    { planCode: '4200ROPR', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: '4200ROPR', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: '4200ROPR', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: '4200ROPR', maintenanceCycle: 24, packageCode: '5.2' },

    { planCode: '4230ROPR', maintenanceCycle: 6, packageCode: '4230-6' },
    { planCode: '4230ROPR', maintenanceCycle: 12, packageCode: '4230-12' },
    { planCode: '4230ROPR', maintenanceCycle: 18, packageCode: '4230-6' },
    { planCode: '4230ROPR', maintenanceCycle: 24, packageCode: '4230-24' },

    { planCode: 'LLAVEROPR', maintenanceCycle: 6, packageCode: '2.1' },
    { planCode: 'LLAVEROPR', maintenanceCycle: 12, packageCode: '2.1' },
    { planCode: 'LLAVEROPR', maintenanceCycle: 18, packageCode: '2.1' },
    { planCode: 'LLAVEROPR', maintenanceCycle: 24, packageCode: '5.2' },
  ]

  let mappingCount = 0
  for (const mapping of mappings) {
    const pkg = createdPackages[mapping.packageCode]

    if (!pkg) {
      console.error(`  ❌ Error: Package ${mapping.packageCode} not found`)
      continue
    }

    await prisma.equipmentFilterMapping.upsert({
      where: {
        unique_plan_cycle: {
          planCode: mapping.planCode,
          maintenanceCycle: mapping.maintenanceCycle,
        }
      },
      update: { packageId: pkg.id },
      create: {
        planCode: mapping.planCode,
        maintenanceCycle: mapping.maintenanceCycle,
        packageId: pkg.id,
      },
    })

    console.log(`  ✓ Mapped ${mapping.planCode} @ ${mapping.maintenanceCycle}m → Package ${mapping.packageCode}`)
    mappingCount++
  }

  console.log(`\n✅ Created ${mappingCount} equipment-filter mappings\n`)

  // ============================================
  // 5. UPDATE INVENTORY WITH FILTER REFERENCES
  // ============================================
  console.log('📊 Step 5: Updating Inventory with Filter References...')

  // Create inventory entries for all filters
  const inventoryData = [
    { filterSku: 'PP-10CF', quantity: 300, minStock: 250, location: 'Bodega Principal' },
    { filterSku: 'CTO-10CF', quantity: 300, minStock: 250, location: 'Bodega Principal' },
    { filterSku: 'RO-10CF', quantity: 80, minStock: 60, location: 'Bodega Principal' },
    { filterSku: 'T33-10CF', quantity: 80, minStock: 60, location: 'Bodega Principal' },
    { filterSku: 'POST CARBON RUHENS', quantity: 70, minStock: 60, location: 'Bodega Principal' },
    { filterSku: 'MAGNESIUM', quantity: 50, minStock: 40, location: 'Bodega Principal' },
    { filterSku: 'S/P COMBI', quantity: 80, minStock: 60, location: 'Bodega Principal' },
    { filterSku: 'U/P COMBI', quantity: 20, minStock: 15, location: 'Bodega Principal' },
    { filterSku: 'MICRO CARBON', quantity: 25, minStock: 20, location: 'Bodega Principal' },
  ]

  for (const invData of inventoryData) {
    const filter = createdFilters[invData.filterSku]

    if (!filter) {
      console.error(`  ❌ Error: Filter ${invData.filterSku} not found`)
      continue
    }

    await prisma.inventory.upsert({
      where: {
        unique_filter_location: {
          filterId: filter.id,
          location: invData.location || 'Bodega Principal',
        }
      },
      update: {
        quantity: invData.quantity,
        minStock: invData.minStock,
      },
      create: {
        filterId: filter.id,
        quantity: invData.quantity,
        minStock: invData.minStock,
        location: invData.location,
      },
    })

    console.log(`  ✓ Inventory: ${invData.filterSku} - ${invData.quantity} units (min: ${invData.minStock})`)
  }

  console.log(`\n✅ Updated inventory for ${inventoryData.length} filter types\n`)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('🎉 SEEDING COMPLETE!\n')
  console.log('Summary:')
  console.log(`  • ${filters.length} filter SKUs created`)
  console.log(`  • ${packages.length} filter packages created`)
  console.log(`  • ${itemCount} package items defined`)
  console.log(`  • ${mappingCount} equipment-filter mappings created`)
  console.log(`  • ${inventoryData.length} inventory records updated`)
  console.log('\n✨ Filter inventory system is ready to use!\n')
}

async function main() {
  try {
    await seedFilters()
  } catch (error) {
    console.error('❌ Error seeding filters:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
