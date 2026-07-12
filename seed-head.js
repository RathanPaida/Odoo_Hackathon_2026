const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function seedHead() {
  const prisma = new PrismaClient();
  const email = "head@oodoprep.com";
  const password = "Head@123456";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: "Department",
        lastName: "Head",
        role: "DEPARTMENT_HEAD",
        emailVerified: true,
        status: "ACTIVE",
      },
    });
    console.log("Department Head user created successfully!");
  } else {
    console.log("User already exists!");
  }
  await prisma.$disconnect();
}

seedHead().catch(console.error);
