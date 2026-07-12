// lib/services/manager/categories.service.ts
// Business logic for Asset Manager category CRUD.
import * as repo from "@/lib/repositories/manager/categories.repository";
import * as feed from "@/lib/repositories/manager/feed.repository";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/validations/manager";
import type { CategoryDto, Paginated } from "@/types/manager";
import { paginate } from "@/lib/utils/manager";

export class CategoryError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "HAS_ASSETS" | "DUPLICATE" = "NOT_FOUND"
  ) {
    super(message);
  }
}

export async function listCategories(opts: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<Paginated<CategoryDto>> {
  const { skip, take, page, pageSize } = paginate(opts.page, opts.pageSize);
  return repo.listCategories({ q: opts.q, skip, take });
}

export async function getAllCategories(): Promise<CategoryDto[]> {
  return repo.getAllCategories();
}

export async function getCategory(id: string): Promise<CategoryDto> {
  const cat = await repo.getCategoryById(id);
  if (!cat) throw new CategoryError("Category not found", "NOT_FOUND");
  return cat;
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
  ipAddress?: string | null
): Promise<CategoryDto> {
  const created = await repo.createCategory({
    name: input.name,
    description: input.description,
    customFields: input.customFields,
  });

  await feed.logManagerAction({
    userId,
    action: "CATEGORY_CREATED",
    entityType: "Category",
    entityId: created.id,
    details: { name: created.name },
    ipAddress,
  });

  return created;
}

export async function updateCategory(
  userId: string,
  id: string,
  input: UpdateCategoryInput,
  ipAddress?: string | null
): Promise<CategoryDto> {
  const updated = await repo.updateCategory(id, {
    name: input.name,
    description: input.description,
    customFields: input.customFields,
  });
  if (!updated) throw new CategoryError("Category not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: "CATEGORY_UPDATED",
    entityType: "Category",
    entityId: id,
    details: { changes: Object.keys(input).filter((k) => (input as any)[k] !== undefined) },
    ipAddress,
  });

  return updated;
}

export async function deleteCategory(
  userId: string,
  id: string,
  ipAddress?: string | null
): Promise<void> {
  const cat = await repo.getCategoryById(id);
  if (!cat) throw new CategoryError("Category not found", "NOT_FOUND");
  if (cat.assetCount > 0) {
    throw new CategoryError(
      "Cannot delete category with assigned assets",
      "HAS_ASSETS"
    );
  }

  const deleted = await repo.deleteCategory(id);
  if (!deleted) throw new CategoryError("Category not found", "NOT_FOUND");

  await feed.logManagerAction({
    userId,
    action: "CATEGORY_DELETED",
    entityType: "Category",
    entityId: id,
    details: { name: cat.name },
    ipAddress,
  });
}
