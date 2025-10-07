const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample SACCOs
  const saccos = await Promise.all([
    prisma.sacco.upsert({
      where: { licenseNo: 'SACCO001' },
      update: {},
      create: {
        name: 'Umoja SACCO',
        licenseNo: 'SACCO001',
      },
    }),
    prisma.sacco.upsert({
      where: { licenseNo: 'SACCO002' },
      update: {},
      create: {
        name: 'Harambee SACCO',
        licenseNo: 'SACCO002',
      },
    }),
    prisma.sacco.upsert({
      where: { licenseNo: 'SACCO003' },
      update: {},
      create: {
        name: 'Jenga SACCO',
        licenseNo: 'SACCO003',
      },
    }),
  ]);

  console.log(`✅ Created ${saccos.length} SACCOs`);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@saccochain.com' },
    update: {},
    create: {
      email: 'admin@saccochain.com',
      password: adminPassword,
      name: 'System Administrator',
      nationalId: '00000000',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user');

  // Create sample members
  const memberPassword = await bcrypt.hash('member123', 12);
  const members = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.member@saccochain.com' },
      update: {},
      create: {
        email: 'john.member@saccochain.com',
        password: memberPassword,
        name: 'John Member',
        nationalId: '12345678',
        saccoId: saccos[0].id,
        creditScore: 750,
        walletAddress: '0x1234567890abcdef',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mary.member@saccochain.com' },
      update: {},
      create: {
        email: 'mary.member@saccochain.com',
        password: memberPassword,
        name: 'Mary Member',
        nationalId: '23456789',
        saccoId: saccos[1].id,
        creditScore: 820,
        walletAddress: '0xabcdef1234567890',
      },
    }),
    prisma.user.upsert({
      where: { email: 'peter.member@saccochain.com' },
      update: {},
      create: {
        email: 'peter.member@saccochain.com',
        password: memberPassword,
        name: 'Peter Member',
        nationalId: '34567890',
        saccoId: saccos[0].id,
        creditScore: 680,
      },
    }),
  ]);

  console.log(`✅ Created ${members.length} member users`);

  // Create sample transactions
  const transactions = [];
  const transactionTypes = ['DEPOSIT', 'WITHDRAWAL', 'LOAN', 'REPAYMENT'];
  const statuses = ['COMPLETED', 'PENDING', 'FAILED'];

  for (let i = 0; i < 50; i++) {
    const user = members[Math.floor(Math.random() * members.length)];
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.random() * 10000 + 1000;

    transactions.push(
      prisma.transaction.create({
        data: {
          type,
          amount,
          status,
          description: `Sample ${type.toLowerCase()} transaction`,
          userId: user.id,
        },
      })
    );
  }

  await Promise.all(transactions);
  console.log(`✅ Created ${transactions.length} sample transactions`);

  // Create sample credit scores
  const creditScores = [];
  for (const member of members) {
    for (let i = 0; i < 5; i++) {
      const score = Math.random() * 200 + 600; // 600-800 range
      const riskLevel = score >= 750 ? 'LOW' : score >= 650 ? 'MEDIUM' : 'HIGH';
      
      creditScores.push(
        prisma.creditScore.create({
          data: {
            score,
            riskLevel,
            userId: member.id,
            createdAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000), // Past months
          },
        })
      );
    }
  }

  await Promise.all(creditScores);
  console.log(`✅ Created ${creditScores.length} sample credit scores`);

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Sample Login Credentials:');
  console.log('Admin: admin@saccochain.com / admin123');
  console.log('Member: john.member@saccochain.com / member123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });