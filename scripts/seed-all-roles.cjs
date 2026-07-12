// scripts/seed-all-roles.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const dept = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {},
    create: { name: "Engineering", code: "ENG", status: "ACTIVE" },
  });
  const users = [
    { email: "admin@assetflow.dev", firstName: "Sys", lastName: "Admin", role: "ADMIN", employeeId: "ADM-001" },
    { email: "manager@assetflow.dev", firstName: "Asset", lastName: "Manager", role: "ASSET_MANAGER", employeeId: "MGR-001", departmentId: dept.id },
  ];
  for (const u of users) {
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, status: "ACTIVE", emailVerified: true, departmentId: u.departmentId ?? null },
      create: {
        email: u.email, passwordHash, firstName: u.firstName, lastName: u.lastName,
        role: u.role, status: "ACTIVE", emailVerified: true,
        departmentId: u.departmentId ?? null, employeeId: u.employeeId,
      },
    });
    console.log("Ready:", created.email, "/ Password123! (role", created.role + ")");
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
