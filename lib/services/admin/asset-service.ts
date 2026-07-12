import { prisma as db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function getAssets(params?: {
  departmentId?: string;
  categoryId?: string;
  status?: string;
  q?: string;
}) {
  const where: Prisma.AssetWhereInput = { deletedAt: null };

  if (params?.departmentId) where.departmentId = params.departmentId;
  if (params?.categoryId) where.categoryId = params.categoryId;
  if (params?.status) where.status = params.status;
  if (params?.q) {
    where.OR = [
      { name: { contains: params.q } },
      { assetTag: { contains: params.q } },
      { serialNumber: { contains: params.q } },
    ];
  }

  const assets = await db.asset.findMany({
    where,
    include: {
      category: true,
      department: true,
      holder: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return assets;
}

export async function createAsset(data: {
  name: string;
  assetTag: string;
  categoryId: string;
  serialNumber?: string;
  condition?: string;
  location?: string;
  isBookable?: boolean;
  status?: string;
  departmentId?: string;
  holderId?: string;
}, adminId?: string) {
  // Enforce unique asset tag manually to return clean error
  const existing = await db.asset.findUnique({
    where: { assetTag: data.assetTag },
  });
  if (existing) {
    throw new Error("Asset tag must be unique.");
  }

  const asset = await db.$transaction(async (tx) => {
    const created = await tx.asset.create({
      data: {
        name: data.name,
        assetTag: data.assetTag,
        categoryId: data.categoryId,
        serialNumber: data.serialNumber,
        condition: data.condition || "NEW",
        location: data.location,
        isBookable: data.isBookable || false,
        status: data.holderId ? "ALLOCATED" : (data.status || "AVAILABLE"),
        departmentId: data.departmentId,
        holderId: data.holderId || null,
      },
    });

    if (data.holderId && adminId) {
      await tx.assetAllocation.create({
        data: {
          assetId: created.id,
          userId: data.holderId,
          allocatedById: adminId,
          isActive: true,
        }
      });
    }

    return created;
  });

  return asset;
}

export async function allocateAsset(assetId: string, holderId: string | null, adminId: string) {
  const asset = await db.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Asset not found");
  
  const result = await db.$transaction(async (tx) => {
    // Deactivate old allocations
    await tx.assetAllocation.updateMany({
      where: { assetId, isActive: true },
      data: { isActive: false, actualReturnDate: new Date() },
    });
    
    // Update asset holder
    const updated = await tx.asset.update({
      where: { id: assetId },
      data: { 
        holderId,
        status: holderId ? "ALLOCATED" : "AVAILABLE"
      },
    });
    
    // Create new allocation
    if (holderId) {
      await tx.assetAllocation.create({
        data: {
          assetId,
          userId: holderId,
          allocatedById: adminId,
          isActive: true,
        }
      });

      // Create notification for the employee
      await tx.notification.create({
        data: {
          userId: holderId,
          type: "ASSET_ASSIGNED",
          title: "Asset Assigned",
          message: `You have been assigned "${asset.name}" (${asset.assetTag}).`,
          link: "/dashboard/employee/assets",
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: "ASSET_ALLOCATED",
          entityType: "Asset",
          entityId: assetId,
          details: JSON.stringify({ assetName: asset.name, holderId }),
        },
      });
    }
    
    return updated;
  });

  return result;
}
