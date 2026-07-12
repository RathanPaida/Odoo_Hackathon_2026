import { prisma as db } from "@/lib/db";

export async function getTransfers(params?: { status?: string }) {
  const where = params?.status ? { status: params.status } : {};
  return await db.transferRequest.findMany({
    where,
    include: {
      asset: { select: { name: true, assetTag: true } },
      fromUser: { select: { firstName: true, lastName: true, email: true } },
      toUser: { select: { firstName: true, lastName: true, email: true } },
      requestedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewTransfer(
  id: string,
  status: "APPROVED" | "REJECTED",
  reviewerId: string
) {
  const transfer = await db.transferRequest.findUnique({ where: { id } });
  if (!transfer) throw new Error("Transfer not found.");
  if (transfer.status !== "PENDING" && transfer.status !== "REQUESTED") {
    throw new Error("Transfer is no longer pending.");
  }

  const updated = await db.$transaction(async (tx) => {
    // 1. Update transfer status
    const req = await tx.transferRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    if (status === "APPROVED") {
      // 2. Re-allocate the asset
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { holderId: transfer.toUserId },
      });

      // 3. Mark previous allocation inactive
      await tx.assetAllocation.updateMany({
        where: { assetId: transfer.assetId, userId: transfer.fromUserId, isActive: true },
        data: { isActive: false, actualReturnDate: new Date() },
      });

      // 4. Create new allocation
      await tx.assetAllocation.create({
        data: {
          assetId: transfer.assetId,
          userId: transfer.toUserId,
          allocatedById: reviewerId,
          isActive: true,
        },
      });

      // 5. Asset History
      await tx.assetHistory.create({
        data: {
          assetId: transfer.assetId,
          action: "TRANSFERRED",
          performedById: reviewerId,
          fromUserId: transfer.fromUserId,
          toUserId: transfer.toUserId,
        },
      });
    }

    return req;
  });

  return updated;
}
