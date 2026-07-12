import { prisma as db } from "@/lib/db";

export async function getReturns(params?: { status?: string }) {
  const where = params?.status ? { status: params.status } : {};
  return await db.returnRequest.findMany({
    where,
    include: {
      asset: { select: { name: true, assetTag: true } },
      requestedBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewReturn(
  id: string,
  status: "APPROVED" | "REJECTED",
  reviewerId: string
) {
  const ret = await db.returnRequest.findUnique({ where: { id } });
  if (!ret) throw new Error("Return request not found.");
  if (ret.status !== "PENDING") {
    throw new Error("Return request is no longer pending.");
  }

  const updated = await db.$transaction(async (tx) => {
    // 1. Update return status
    const req = await tx.returnRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (status === "APPROVED") {
      // 2. Un-allocate the asset
      await tx.asset.update({
        where: { id: ret.assetId },
        data: { holderId: null },
      });

      // 3. Mark previous allocation inactive
      await tx.assetAllocation.updateMany({
        where: { assetId: ret.assetId, userId: ret.requestedById, isActive: true },
        data: { isActive: false, actualReturnDate: new Date() },
      });

      // 4. Asset History
      await tx.assetHistory.create({
        data: {
          assetId: ret.assetId,
          action: "RETURNED",
          performedById: reviewerId,
          fromUserId: ret.requestedById,
        },
      });
    }

    return req;
  });

  return updated;
}
