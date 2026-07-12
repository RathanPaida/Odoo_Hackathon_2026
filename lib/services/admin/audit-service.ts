import { prisma as db } from "@/lib/db";

export async function getAudits() {
  return await db.auditCycle.findMany({
    include: {
      auditors: { include: { user: { select: { firstName: true, lastName: true } } } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAudit(data: {
  name: string;
  startDate: string | Date;
  endDate?: string | Date;
  createdById: string;
}) {
  const audit = await db.auditCycle.create({
    data: {
      name: data.name,
      scope: "GLOBAL",
      scopeValue: "ALL",
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : new Date(new Date(data.startDate).getTime() + 7 * 24 * 60 * 60 * 1000),
      status: "DRAFT",
      createdById: data.createdById,
    },
  });
  return audit;
}
