import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJavieraLora() {
  console.log('='.repeat(100));
  console.log('CHECKING JAVIERA LORA STATUS IN DATABASE');
  console.log('='.repeat(100));
  console.log();

  // Search by email
  console.log('Searching by email: javieralora.s@gmail.com...');
  const byEmail = await prisma.client.findMany({
    where: {
      email: {
        contains: 'javieralora.s@gmail.com',
        mode: 'insensitive',
      },
    },
    include: {
      maintenances: {
        orderBy: { cycleNumber: 'asc' },
      },
    },
  });

  console.log(`Found ${byEmail.length} clients by email\n`);

  // Search by phone
  console.log('Searching by phone: 56 9 341 55459...');
  const byPhone = await prisma.client.findMany({
    where: {
      phone: {
        contains: '34155459',
      },
    },
    include: {
      maintenances: {
        orderBy: { cycleNumber: 'asc' },
      },
    },
  });

  console.log(`Found ${byPhone.length} clients by phone\n`);

  // Search by RUT
  console.log('Searching by RUT: 17.672.439-0...');
  const byRut = await prisma.client.findMany({
    where: {
      rut: {
        contains: '17672439',
      },
    },
    include: {
      maintenances: {
        orderBy: { cycleNumber: 'asc' },
      },
    },
  });

  console.log(`Found ${byRut.length} clients by RUT\n`);

  // Combine all results
  const allClients = [...byEmail, ...byPhone, ...byRut];
  const uniqueClients = Array.from(new Map(allClients.map(c => [c.id, c])).values());

  console.log('='.repeat(100));
  console.log('RESULTS');
  console.log('='.repeat(100));
  console.log(`Total unique clients found: ${uniqueClients.length}\n`);

  uniqueClients.forEach((client, index) => {
    console.log(`${index + 1}. Client: ${client.name}`);
    console.log(`   ID: ${client.id}`);
    console.log(`   RUT: ${client.rut || 'N/A'}`);
    console.log(`   Email: ${client.email || 'N/A'}`);
    console.log(`   Phone: ${client.phone || 'N/A'}`);
    console.log(`   STATUS: ${client.status}`);
    console.log(`   Maintenances: ${client.maintenances.length}`);
    console.log();

    if (client.maintenances.length > 0) {
      console.log('   Maintenance Details:');
      client.maintenances.forEach(m => {
        console.log(`     - Cycle ${m.cycleNumber}: ${m.status} (Scheduled: ${m.scheduledDate.toISOString().split('T')[0]})`);
      });
      console.log();
    }
  });

  // Also check if there are any ACTIVE clients with similar names
  console.log('='.repeat(100));
  console.log('CHECKING FOR ANY ACTIVE CLIENTS WITH SIMILAR NAME');
  console.log('='.repeat(100));
  console.log();

  const similarNames = await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: 'Javiera', mode: 'insensitive' } },
        { name: { contains: 'Lora', mode: 'insensitive' } },
      ],
      status: 'ACTIVE',
    },
    include: {
      maintenances: true,
    },
  });

  console.log(`Found ${similarNames.length} active clients with similar names\n`);

  similarNames.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name}`);
    console.log(`   ID: ${client.id}`);
    console.log(`   RUT: ${client.rut || 'N/A'}`);
    console.log(`   Email: ${client.email || 'N/A'}`);
    console.log(`   Phone: ${client.phone || 'N/A'}`);
    console.log(`   Status: ${client.status}`);
    console.log();
  });

  console.log('='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log();

  if (uniqueClients.length === 0) {
    console.log('❌ Javiera Lora NOT found in database');
  } else if (uniqueClients.every(c => c.status === 'INACTIVE')) {
    console.log('✅ Javiera Lora is correctly marked as INACTIVE in database');
    console.log('   Issue: Frontend might be caching old data or query needs updating');
  } else if (uniqueClients.some(c => c.status === 'ACTIVE')) {
    console.log('⚠️  Found ACTIVE clients matching Javiera Lora:');
    uniqueClients.filter(c => c.status === 'ACTIVE').forEach(c => {
      console.log(`   - ${c.name} (ID: ${c.id})`);
    });
  }

  await prisma.$disconnect();
}

checkJavieraLora().catch(error => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
