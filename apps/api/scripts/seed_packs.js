const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const packs = [
    {
      code: 'FREE',
      name: 'Free Trial',
      ordersCount: 100,
      bonusCredits: 0,
      priceUsd: 0,
      priceInr: 0,
      sortOrder: 1,
      featuresJson: {
        qrMenu: true,
        aiMenuImport: true,
        counterDashboard: true,
        liveOrderStatus: true,
      },
    },
    {
      code: 'STARTER',
      name: 'Starter Pack',
      ordersCount: 500,
      bonusCredits: 0,
      priceUsd: 5.0,
      priceInr: 149.0,
      sortOrder: 2,
      featuresJson: {
        qrMenu: true,
        aiMenuImport: true,
        counterDashboard: true,
        liveOrderStatus: true,
      },
    },
    {
      code: 'GROWTH',
      name: 'Growth Pack',
      ordersCount: 1500,
      bonusCredits: 0,
      priceUsd: 12.0,
      priceInr: 399.0,
      sortOrder: 3,
      featuresJson: {
        qrMenu: true,
        aiMenuImport: true,
        counterDashboard: true,
        liveOrderStatus: true,
        dailyReports: true,
      },
    },
    {
      code: 'PRO',
      name: 'Pro Pack (Popular)',
      ordersCount: 3000,
      bonusCredits: 300,
      priceUsd: 20.0,
      priceInr: 699.0,
      sortOrder: 4,
      featuresJson: {
        qrMenu: true,
        aiMenuImport: true,
        counterDashboard: true,
        liveOrderStatus: true,
        dailyReports: true,
        multiLanguage: true,
        kitchenScreen: true,
        tvDisplay: true,
      },
    },
    {
      code: 'BUSINESS',
      name: 'Business Pack',
      ordersCount: 10000,
      bonusCredits: 1500,
      priceUsd: 50.0,
      priceInr: 1999.0,
      sortOrder: 5,
      featuresJson: {
        qrMenu: true,
        aiMenuImport: true,
        counterDashboard: true,
        liveOrderStatus: true,
        dailyReports: true,
        multiLanguage: true,
        kitchenScreen: true,
        tvDisplay: true,
        multiCounter: true,
        staffRoles: true,
      },
    },
    {
      code: 'CHAIN',
      name: 'Chain Enterprise',
      ordersCount: 25000,
      bonusCredits: 5000,
      priceUsd: 100.0,
      priceInr: 4999.0,
      sortOrder: 6,
      featuresJson: {
        qrMenu: true,
        aiMenuImport: true,
        counterDashboard: true,
        liveOrderStatus: true,
        dailyReports: true,
        multiLanguage: true,
        kitchenScreen: true,
        tvDisplay: true,
        multiCounter: true,
        staffRoles: true,
        multiOutlets: true,
        prioritySupport: true,
      },
    },
  ];

  console.log('Seeding packs...');
  for (const pack of packs) {
    await prisma.pack.upsert({
      where: { code: pack.code },
      update: pack,
      create: pack,
    });
  }
  console.log('Packs seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
