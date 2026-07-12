// prisma/seed.ts
// Seeds an admin user. Run with: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@oodoprep.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const firstName = process.env.SEED_ADMIN_NAME ?? "Admin";

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
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
  } else {
    console.log(`Admin user already exists: ${email}`);
  }

  // Seed AssetCategories
  const categories = ["Electronics", "Furniture", "Vehicles", "Office Supplies"];
  for (const name of categories) {
    const existingCat = await prisma.assetCategory.findFirst({ where: { name } });
    if (!existingCat) {
      await prisma.assetCategory.create({
        data: { name, description: `Standard ${name} category` }
      });
      console.log(`Category created: ${name}`);
    }
  }

  // Seed Departments (Testing Hierarchy)
  const existingHq = await prisma.department.findUnique({ where: { code: "HQ-01" } });
  let parentId = null;
  if (!existingHq) {
    const hq = await prisma.department.create({
      data: { name: "Headquarters", code: "HQ-01", description: "Main HQ" }
    });
    parentId = hq.id;
    console.log("Department created: Headquarters");
  } else {
    parentId = existingHq.id;
  }

  const existingIT = await prisma.department.findUnique({ where: { code: "IT-01" } });
  if (!existingIT && parentId) {
    await prisma.department.create({
      data: { name: "IT Operations", code: "IT-01", parentId, description: "Sub-department of HQ" }
    });
    console.log("Department created: IT Operations");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
