const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = '123456';
  const hash = await bcrypt.hash(password, 10);

  // Update super admins
  await prisma.user.updateMany({
    where: { email: 'admin@ordzo.com' },
    data: { passwordHash: hash },
  });

  // Update demo owner
  await prisma.user.updateMany({
    where: { email: 'owner@ordzo.com' },
    data: { passwordHash: hash },
  });

  // Update demo staff
  await prisma.user.updateMany({
    where: { email: 'staff@ordzo.com' },
    data: { passwordHash: hash },
  });

  console.log('Successfully set credentials to 123456:');
  console.log('Super Admin: admin@ordzo.com -> ' + password);
  console.log('Restaurant Owner: owner@ordzo.com -> ' + password);
  console.log('Branch Staff: staff@ordzo.com -> ' + password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
