/**
 * Helper to get package code for a maintenance based on client's plan code and cycle
 */

export interface PackageMapping {
  planCode: string
  maintenanceCycle: number
  package: {
    code: string
    name: string
  }
}

let cachedMappings: PackageMapping[] | null = null

export async function getPackageMappings(): Promise<PackageMapping[]> {
  if (cachedMappings) return cachedMappings

  const response = await fetch('/api/package-mappings')
  if (!response.ok) {
    console.error('Failed to load package mappings')
    return []
  }

  const data = await response.json()
  cachedMappings = data
  return data
}

export function getPackageForMaintenance(
  planCode: string | null | undefined,
  cycleNumber: number | null | undefined,
  mappings: PackageMapping[]
): string {
  if (!planCode || !cycleNumber) return '-'

  const cycleMonths = cycleNumber * 6
  const mapping = mappings.find(
    m => m.planCode === planCode && m.maintenanceCycle === cycleMonths
  )

  return mapping?.package.code || '-'
}
