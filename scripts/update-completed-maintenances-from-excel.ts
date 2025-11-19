import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * This script updates maintenances to COMPLETED status based on actual change dates
 * from the "Control de mantenciones" Excel sheet.
 *
 * Generated from maintenance status analysis on 2025-10-29
 */

async function updateCompletedMaintenances() {
  console.log('='.repeat(100));
  console.log('UPDATING COMPLETED MAINTENANCES FROM EXCEL DATA');
  console.log('='.repeat(100));
  console.log();

  // Read the CSV report to get the list of maintenances to update
  const csvPath = path.join(__dirname, '../docs/maintenance-completions-review.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  const updates: Array<{ id: string; actualDate: Date; clientName: string; cycle: number }> = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Parse CSV (handle quoted values)
    const match = line.match(/"([^"]*)"/g);
    if (!match || match.length < 13) continue;

    const canUpdate = match[0].replace(/"/g, '');
    const clientName = match[1].replace(/"/g, '');
    const actualChangeDateStr = match[8].replace(/"/g, '');
    const dbMaintenanceId = match[9].replace(/"/g, '');
    const cycle = parseInt(match[5].replace(/"/g, ''));

    if (canUpdate === 'YES' && dbMaintenanceId && actualChangeDateStr) {
      try {
        const actualDate = new Date(actualChangeDateStr);
        if (!isNaN(actualDate.getTime())) {
          updates.push({
            id: dbMaintenanceId,
            actualDate,
            clientName,
            cycle,
          });
        }
      } catch (error) {
        console.error(`Error parsing date for ${clientName}: ${actualChangeDateStr}`);
      }
    }
  }

  console.log(`Found ${updates.length} maintenances to update\n`);

  if (updates.length === 0) {
    console.log('No maintenances to update. Exiting.');
    return;
  }

  console.log('Sample of maintenances to be updated:');
  console.log('-'.repeat(100));
  updates.slice(0, 10).forEach((update, index) => {
    console.log(`${index + 1}. ${update.clientName} - ${update.cycle}M - ${update.actualDate.toISOString().split('T')[0]}`);
  });
  if (updates.length > 10) {
    console.log(`... and ${updates.length - 10} more`);
  }
  console.log();

  console.log('⚠️  IMPORTANT: This will update maintenance records in your database.');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Starting updates...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      await prisma.maintenance.update({
        where: { id: update.id },
        data: {
          status: 'COMPLETED',
          actualDate: update.actualDate,
          completedDate: new Date(),
        },
      });
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Progress: ${successCount}/${updates.length} updated`);
      }
    } catch (error) {
      errorCount++;
      const errorMsg = `Error updating ${update.clientName} (${update.id}): ${error}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('UPDATE COMPLETE');
  console.log('='.repeat(100));
  console.log(`✅ Successfully updated: ${successCount} maintenances`);
  console.log(`❌ Errors: ${errorCount} maintenances`);

  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n' + '='.repeat(100));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(100));

  // Verify the updates
  const completedCount = await prisma.maintenance.count({
    where: { status: 'COMPLETED' },
  });

  const pendingCount = await prisma.maintenance.count({
    where: { status: 'PENDING' },
  });

  console.log(`Maintenances with status COMPLETED: ${completedCount}`);
  console.log(`Maintenances with status PENDING: ${pendingCount}`);
  console.log('='.repeat(100));

  await prisma.$disconnect();
}

updateCompletedMaintenances().catch(error => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
