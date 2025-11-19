import ExcelJS from 'exceljs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface ReviewItem {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  clientName: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  excelRow: number;
  issue: string;
  excelValue: any;
  dbValue: any;
  recommendation: string;
}

function normalizeDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

function normalizeRut(rut: string | null): string | null {
  if (!rut) return null;
  return rut.replace(/[.\-]/g, '').toLowerCase();
}

function normalizeEquipment(equipment: string | null): string | null {
  if (!equipment) return null;
  const normalized = equipment.trim().toLowerCase();
  const mappings: Record<string, string> = {
    'whp-3200': 'whp-3200',
    'whp-4200': 'whp-4200',
    'whp-4230': 'whp-4230',
    'llave': 'llave',
  };
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) return value;
  }
  return normalized;
}

function normalizeFilterType(filterType: string | null): string | null {
  if (!filterType) return null;
  const normalized = filterType.trim().toLowerCase();
  if (normalized.includes('osmosis') || normalized.includes('reverse')) return 'ro';
  if (normalized.includes('ultra')) return 'uf';
  return normalized;
}

function normalizeDeliveryType(deliveryType: string | null): string | null {
  if (!deliveryType) return null;
  const normalized = deliveryType.trim().toLowerCase();
  if (normalized.includes('presencial')) return 'presencial';
  if (normalized.includes('domicilio') || normalized.includes('delivery')) return 'domicilio';
  return normalized;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function dateDiffInDays(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

async function generateReviewList() {
  console.log('Generating review list for problematic clients...\n');

  const reviewItems: ReviewItem[] = [];

  // Read Excel data
  const filePath = path.join(__dirname, '../../AMAWA/Clientes AMAWA Hogar.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('Clientes');
  if (!sheet) throw new Error('Clientes sheet not found');

  const dbClients = await prisma.client.findMany({
    include: {
      equipment: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      maintenances: {
        orderBy: { scheduledDate: 'asc' },
      },
      contracts: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Process each row
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);

    const rut = row.getCell(4).value?.toString() || null;
    const email = row.getCell(5).value?.toString() || null;
    const phone = row.getCell(6).value?.toString() || null;
    const name = row.getCell(56).value?.toString() || 'Unknown';

    if (!rut && !email && !phone) continue;

    // Parse installation date
    let installationDate: Date | null = null;
    const installDateCell = row.getCell(11).value;
    if (installDateCell instanceof Date) {
      installationDate = installDateCell;
    } else if (typeof installDateCell === 'number') {
      installationDate = new Date((installDateCell - 25569) * 86400 * 1000);
    }

    const equipment = row.getCell(20).value?.toString() || null;
    const filterType = row.getCell(21).value?.toString() || null;
    const deliveryType = row.getCell(22).value?.toString() || null;
    const planCode = row.getCell(23).value?.toString() || null;

    // Find matching DB client
    let dbClient = null;
    let matchMethod = '';

    if (rut) {
      const normalizedRut = normalizeRut(rut);
      dbClient = dbClients.find(c =>
        c.rut?.replace(/[.\-]/g, '').toLowerCase().includes(normalizedRut?.replace(/[^0-9kK]/g, '') || '')
      );
      if (dbClient) matchMethod = 'RUT';
    }

    if (!dbClient && email) {
      dbClient = dbClients.find(c => c.email?.toLowerCase() === email.toLowerCase());
      if (dbClient) matchMethod = 'Email';
    }

    if (!dbClient && phone) {
      const normalizedPhone = normalizePhone(phone);
      dbClient = dbClients.find(c =>
        c.phone?.replace(/\D/g, '').includes(normalizedPhone?.slice(-8) || '')
      );
      if (dbClient) matchMethod = 'Phone';
    }

    if (!dbClient) {
      reviewItems.push({
        priority: 'LOW',
        category: 'Client Not Found',
        clientName: name,
        rut,
        email,
        phone,
        excelRow: i,
        issue: 'Client exists in Excel but not in database',
        excelValue: 'Present',
        dbValue: 'Not found',
        recommendation: 'Verify if this client should be imported or is intentionally excluded (inactive/cancelled)',
      });
      continue;
    }

    const dbEquipment = dbClient.equipment[0] || null;

    // Check installation date
    const excelDate = normalizeDate(installationDate);
    const dbDate = normalizeDate(dbEquipment?.installationDate);

    if (excelDate && dbDate && excelDate !== dbDate) {
      reviewItems.push({
        priority: 'HIGH',
        category: 'Installation Date Mismatch',
        clientName: name,
        rut,
        email,
        phone,
        excelRow: i,
        issue: `Installation date differs (matched by ${matchMethod})`,
        excelValue: excelDate,
        dbValue: dbDate,
        recommendation: 'Verify which date is correct. If DB is wrong, update equipment.installationDate',
      });
    }

    // Check equipment type
    if (dbEquipment) {
      const normalizedExcelEquip = normalizeEquipment(equipment);
      const normalizedDbEquip = normalizeEquipment(dbEquipment.equipmentType);

      if (normalizedExcelEquip && normalizedDbEquip &&
          normalizedExcelEquip !== normalizedDbEquip &&
          !normalizedDbEquip.includes(normalizedExcelEquip) &&
          !normalizedExcelEquip.includes(normalizedDbEquip)) {
        reviewItems.push({
          priority: 'MEDIUM',
          category: 'Equipment Type Mismatch',
          clientName: name,
          rut,
          email,
          phone,
          excelRow: i,
          issue: 'Equipment model differs',
          excelValue: equipment,
          dbValue: dbEquipment.equipmentType,
          recommendation: 'Check if client has multiple equipment or if one source is outdated',
        });
      }

      // Check filter type
      const normalizedExcelFilter = normalizeFilterType(filterType);
      const normalizedDbFilter = normalizeFilterType(dbEquipment.filterType);

      if (normalizedExcelFilter && normalizedDbFilter && normalizedExcelFilter !== normalizedDbFilter) {
        reviewItems.push({
          priority: 'HIGH',
          category: 'Filter Type Mismatch',
          clientName: name,
          rut,
          email,
          phone,
          excelRow: i,
          issue: 'Filter type differs (affects maintenance packages)',
          excelValue: filterType,
          dbValue: dbEquipment.filterType,
          recommendation: 'CRITICAL: Verify correct filter type as this affects maintenance schedule',
        });
      }

      // Check delivery type
      const normalizedExcelDelivery = normalizeDeliveryType(deliveryType);
      const normalizedDbDelivery = normalizeDeliveryType(dbEquipment.deliveryType);

      if (normalizedExcelDelivery && normalizedDbDelivery && normalizedExcelDelivery !== normalizedDbDelivery) {
        reviewItems.push({
          priority: 'LOW',
          category: 'Delivery Type Mismatch',
          clientName: name,
          rut,
          email,
          phone,
          excelRow: i,
          issue: 'Delivery preference differs',
          excelValue: deliveryType,
          dbValue: dbEquipment.deliveryType,
          recommendation: 'Update if client preference has changed',
        });
      }
    }

    // Check maintenance schedule outliers
    if (dbEquipment?.installationDate && installationDate) {
      const maintenances = dbClient.maintenances;

      [6, 12, 18, 24].forEach((cycle, index) => {
        const expectedDate = addMonths(dbEquipment.installationDate!, cycle);
        const dbMaintenance = maintenances.find(m => m.cycleNumber === index + 1);

        if (dbMaintenance) {
          const diff = Math.abs(dateDiffInDays(expectedDate, dbMaintenance.scheduledDate));
          if (diff > 30) { // Flag if more than 30 days off
            reviewItems.push({
              priority: diff > 100 ? 'HIGH' : 'MEDIUM',
              category: 'Maintenance Date Outlier',
              clientName: name,
              rut,
              email,
              phone,
              excelRow: i,
              issue: `${cycle}-month maintenance is ${diff} days off expected date`,
              excelValue: normalizeDate(expectedDate),
              dbValue: normalizeDate(dbMaintenance.scheduledDate),
              recommendation: diff > 100
                ? 'INVESTIGATE: Large deviation suggests possible data error'
                : 'Review if this date was intentionally adjusted',
            });
          }
        }
      });
    }
  }

  // Sort by priority and category
  reviewItems.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.category.localeCompare(b.category);
  });

  // Generate console output
  console.log('='.repeat(100));
  console.log('CLIENT REVIEW LIST');
  console.log('='.repeat(100));
  console.log(`Total items requiring review: ${reviewItems.length}\n`);

  const byPriority = {
    HIGH: reviewItems.filter(r => r.priority === 'HIGH'),
    MEDIUM: reviewItems.filter(r => r.priority === 'MEDIUM'),
    LOW: reviewItems.filter(r => r.priority === 'LOW'),
  };

  console.log(`🔴 HIGH Priority: ${byPriority.HIGH.length} items`);
  console.log(`🟡 MEDIUM Priority: ${byPriority.MEDIUM.length} items`);
  console.log(`🟢 LOW Priority: ${byPriority.LOW.length} items\n`);

  const byCategory: Record<string, ReviewItem[]> = {};
  reviewItems.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  console.log('By Category:');
  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`  ${category}: ${items.length} items`);
  });

  console.log('\n' + '='.repeat(100));
  console.log('HIGH PRIORITY ITEMS (requiring immediate review)');
  console.log('='.repeat(100));

  byPriority.HIGH.forEach((item, index) => {
    console.log(`\n${index + 1}. [${item.category}] ${item.clientName}`);
    console.log(`   Excel Row: ${item.excelRow}`);
    console.log(`   RUT: ${item.rut || 'N/A'} | Email: ${item.email || 'N/A'} | Phone: ${item.phone || 'N/A'}`);
    console.log(`   Issue: ${item.issue}`);
    console.log(`   Excel: ${item.excelValue}`);
    console.log(`   Database: ${item.dbValue}`);
    console.log(`   ➜ ${item.recommendation}`);
  });

  // Generate CSV file
  const csvPath = path.join(__dirname, '../docs/client-review-list.csv');
  const csvLines = [
    'Priority,Category,Client Name,RUT,Email,Phone,Excel Row,Issue,Excel Value,DB Value,Recommendation'
  ];

  reviewItems.forEach(item => {
    const escape = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    csvLines.push([
      escape(item.priority),
      escape(item.category),
      escape(item.clientName),
      escape(item.rut),
      escape(item.email),
      escape(item.phone),
      escape(item.excelRow),
      escape(item.issue),
      escape(item.excelValue),
      escape(item.dbValue),
      escape(item.recommendation),
    ].join(','));
  });

  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log('\n' + '='.repeat(100));
  console.log(`✅ Full review list exported to: ${csvPath}`);
  console.log('='.repeat(100));

  return reviewItems;
}

async function main() {
  try {
    await generateReviewList();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
