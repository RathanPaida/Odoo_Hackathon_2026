// lib/repositories/manager/categories.repository.ts
// Prisma access for asset category CRUD.
import { prisma } from "@/lib/db";
import type { CategoryDto, Paginated } from "@/types/manager";

function mapCategory(row: any): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    customFields: row.customFields,
    assetCount: row._count?.assets ?? 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCategories(opts: {
  q?: string;
  skip: number;
  take: number;
}): Promise<Paginated<CategoryDto>> {
  const where: any = {};
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q } },
      { description: { contains: opts.q } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.assetCategory.findMany({
      where,
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.assetCategory.count({ where }),
  ]);
  return {
    data: rows.map(mapCategory),
    total,
    page: Math.floor(opts.skip / opts.take) + 1,
    pageSize: opts.take,
    totalPages: Math.max(1, Math.ceil(total / opts.take)),
  };
}

export async function getAllCategories(): Promise<CategoryDto[]> {
  const rows = await prisma.assetCategory.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapCategory);
}

export async function getCategoryById(
  id: string
): Promise<CategoryDto | null> {
  const row = await prisma.assetCategory.findUnique({
    where: { id },
    include: { _count: { select: { assets: true } } },
  });
  return row ? mapCategory(row) : null;
}

export async function createCategory(data: {
  name: string;
  description?: string | null;
  customFields?: string | null;
}): Promise<CategoryDto> {
  const row = await prisma.assetCategory.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      customFields: data.customFields ?? null,
    },
    include: { _count: { select: { assets: true } } },
  });
  return mapCategory(row);
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    customFields: string | null;
  }>
): Promise<CategoryDto | null> {
  const existing = await prisma.assetCategory.findUnique({ where: { id } });
  if (!existing) return null;
  const row = await prisma.assetCategory.update({
    where: { id },
    data,
    include: { _count: { select: { assets: true } } },
  });
  return mapCategory(row);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const existing = await prisma.assetCategory.findUnique({ where: { id } });
  if (!existing) return false;
  const assetCount = await prisma.asset.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (assetCount > 0) return false;
  await prisma.assetCategory.delete({ where: { id } });
  return true;
}
