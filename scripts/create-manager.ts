import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "manager@oodoprep.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Already exists:", email);
    return;
  }
  const hash = await bcrypt.hash("Manager@123", 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      firstName: "Asset",
      lastName: "Manager",
      role: "ASSET_MANAGER",
      emailVerified: true,
      status: "ACTIVE",
    },
  });
  console.log("Created:", user.email, "/", user.role);
}

main().finally(() => prisma.$disconnect());
