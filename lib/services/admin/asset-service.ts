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
}) {
  // Enforce unique asset tag manually to return clean error
  const existing = await db.asset.findUnique({
    where: { assetTag: data.assetTag },
  });
  if (existing) {
    throw new Error("Asset tag must be unique.");
  }

  const asset = await db.asset.create({
    data: {
      name: data.name,
      assetTag: data.assetTag,
      categoryId: data.categoryId,
      serialNumber: data.serialNumber,
      condition: data.condition || "NEW",
      location: data.location,
      isBookable: data.isBookable || false,
      status: data.status || "AVAILABLE",
      departmentId: data.departmentId,
    },
  });

  return asset;
}
