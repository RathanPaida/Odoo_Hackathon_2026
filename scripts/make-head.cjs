// scripts/make-head.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const dept = await prisma.department.findUnique({ where: { code: "ENG" } });
  if (!dept) throw new Error("Run seed-demo.cjs first (no ENG department).");
  const head = await prisma.user.upsert({
    where: { email: "head@assetflow.dev" },
    update: { passwordHash, role: "DEPARTMENT_HEAD", departmentId: dept.id, status: "ACTIVE", emailVerified: true },
    create: {
      email: "head@assetflow.dev",
      passwordHash,
      firstName: "Dept",
      lastName: "Head",
      role: "DEPARTMENT_HEAD",
      status: "ACTIVE",
      emailVerified: true,
      departmentId: dept.id,
      employeeId: "HEAD-001",
    },
  });
  await prisma.department.update({ where: { id: dept.id }, data: { headId: head.id } });
  console.log("Head user ready:", head.email, "/ Password123! (role", head.role + ")");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
