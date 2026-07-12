import { prisma as db } from "@/lib/db";

export async function getCategories() {
  return db.assetCategory.findMany({
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: string) {
  return db.assetCategory.findUnique({
    where: { id },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string | null;
  customFields?: string | null;
}) {
  return db.assetCategory.create({
    data,
  });
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    customFields: string | null;
  }>
) {
  return db.assetCategory.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string) {
  return db.assetCategory.delete({
    where: { id },
  });
}
