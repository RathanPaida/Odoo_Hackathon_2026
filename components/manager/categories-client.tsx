// components/manager/categories-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { ConfirmDialog } from "@/components/employee/ui/confirm";
import { cn, formatDateTime } from "@/lib/utils/manager";
import type { CategoryDto, Paginated } from "@/types/manager";

export function CategoriesClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<CategoryDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCat, setEditCat] = useState<CategoryDto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (q) params.set("q", q);
      const res = await apiFetch<{ data: Paginated<CategoryDto> }>(
        `/api/manager/categories?${params}`
      );
      setData(res.data.data);
    } catch (e: any) {
      toast(e.message ?? "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q]);

  async function submitCreate() {
    if (!form.name.trim()) {
      toast("Name is required.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/manager/categories", {
        method: "POST",
        body: JSON.stringify({ name: form.name, description: form.description || null }),
      });
      toast("Category created.", "success");
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    if (!editCat) return;
    setBusy(true);
    try {
      await apiFetch(`/api/manager/categories/${editCat.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: form.name, description: form.description || null }),
      });
      toast("Category updated.", "success");
      setEditCat(null);
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!deleteId) return;
    try {
      await apiFetch(`/api/manager/categories/${deleteId}`, { method: "DELETE" });
      toast("Category deleted.", "success");
      load();
    } catch (e: any) {
      toast(e.message ?? "Cannot delete category with assets", "error");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search categories..."
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <div className="flex-1" />
        <button className="btn-primary" onClick={() => { setForm({ name: "", description: "" }); setCreateOpen(true); }}>
          + New Category
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Create categories to organize your assets."
          action={<button className="btn-primary" onClick={() => setCreateOpen(true)}>+ New Category</button>}
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Assets</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.description ?? "\u2014"}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{c.assetCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(c.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => { setForm({ name: c.name, description: c.description ?? "" }); setEditCat(c); }}>
                      Edit
                    </button>
                    <button className="ml-2 text-xs font-medium text-rose-600 hover:underline" onClick={() => setDeleteId(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Category"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submitCreate} disabled={busy}>{busy ? "Creating..." : "Create"}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
        </div>
      </Modal>

      <Modal
        open={editCat !== null}
        onClose={() => setEditCat(null)}
        title="Edit Category"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditCat(null)}>Cancel</button>
            <button className="btn-primary" onClick={submitEdit} disabled={busy}>{busy ? "Saving..." : "Save"}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this category? Only possible if no assets are assigned."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
