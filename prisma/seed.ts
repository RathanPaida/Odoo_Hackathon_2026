// prisma/seed.ts
// Seeds an admin user. Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@oodoprep.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const firstName = process.env.SEED_ADMIN_NAME ?? "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName: "User",
      role: "ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log("Admin user created:");
  console.log(`   email:    ${email}`);
  console.log(`   password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
