const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: 'admin@oodoprep.com' } });
  
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  const valid = await bcrypt.compare("Admin@123456", user.passwordHash);
  console.log("Password is valid?", valid);
  
  await prisma.$disconnect();
}

test().catch(console.error);
