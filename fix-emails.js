const { PrismaClient } = require('@prisma/client');

async function fixEmails() {
  const prisma = new PrismaClient();
  
  // Update admin
  try {
    await prisma.user.update({
      where: { email: 'admin@oodoprep.com' },
      data: { email: 'admin@odooprep.com' }
    });
    console.log("Admin email updated to admin@odooprep.com");
  } catch(e) { console.log(e.message) }

  // Update head
  try {
    await prisma.user.update({
      where: { email: 'head@oodoprep.com' },
      data: { email: 'head@odooprep.com' }
    });
    console.log("Head email updated to head@odooprep.com");
  } catch(e) { console.log(e.message) }

  await prisma.$disconnect();
}

fixEmails().catch(console.error);
