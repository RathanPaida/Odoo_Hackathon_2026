// components/manager/assets-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { Modal, Drawer } from "@/components/employee/ui/modal";
import { ConfirmDialog } from "@/components/employee/ui/confirm";
import {
  AssetStatusBadge,
  ConditionBadge,
} from "@/components/employee/ui/badges";
import { cn, formatCurrency, formatDate } from "@/lib/utils/manager";
import {
  ASSET_STATUS_LABEL,
  ASSET_CONDITION_LABEL,
} from "@/lib/constants/manager";
import type {
  ManagerAssetDto,
  ManagerAssetDetailsDto,
  Paginated,
} from "@/types/manager";

export function AssetsClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<ManagerAssetDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<ManagerAssetDetailsDto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    name: "",
    assetTag: "",
    serialNumber: "",
    categoryId: "",
    location: "",
    condition: "NEW",
    isBookable: false,
  });
  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        status,
        condition,
        sort,
        order,
        page: String(page),
        pageSize: "12",
      });
      const res = await apiFetch<{ data: Paginated<ManagerAssetDto> }>(
        `/api/manager/assets?${params}`
      );
      setData(res.data.data);
    } catch (e: any) {
      toast(e.message ?? "Failed to load assets", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await apiFetch<{ data: { data: { id: string; name: string }[] } }>(
        "/api/manager/categories?pageSize=100"
      );
      setCategories(res.data.data.data ?? []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, condition, sort, order, page]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    try {
      const res = await apiFetch<{ data: ManagerAssetDetailsDto }>(
        `/api/manager/assets/${id}`
      );
      setDetail(res.data.data);
    } catch {
      toast("Failed to load asset details", "error");
    }
  }

  async function submitCreate() {
    if (!form.name.trim() || !form.assetTag.trim() || !form.categoryId) {
      toast("Name, asset tag, and category are required.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/manager/assets", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          assetTag: form.assetTag,
          serialNumber: form.serialNumber || null,
          categoryId: form.categoryId,
          location: form.location || null,
          condition: form.condition,
          isBookable: form.isBookable,
        }),
      });
      toast("Asset created.", "success");
      setCreateOpen(false);
      setForm({ name: "", assetTag: "", serialNumber: "", categoryId: "", location: "", condition: "NEW", isBookable: false });
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed to create asset", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!deleteId) return;
    try {
      await apiFetch(`/api/manager/assets/${deleteId}`, { method: "DELETE" });
      toast("Asset deleted.", "success");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search name, tag, serial..."
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select className="input max-w-[160px]" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {Object.entries(ASSET_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input max-w-[160px]" value={condition} onChange={(e) => { setPage(1); setCondition(e.target.value); }}>
          <option value="">All conditions</option>
          {Object.entries(ASSET_CONDITION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input max-w-[150px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt">Sort: Created</option>
          <option value="name">Sort: Name</option>
          <option value="assetTag">Sort: Tag</option>
          <option value="status">Sort: Status</option>
          <option value="condition">Sort: Condition</option>
        </select>
        <button className="btn-secondary" onClick={() => setOrder(order === "asc" ? "desc" : "asc")}>
          {order === "asc" ? "Asc \u2191" : "Desc \u2193"}
        </button>
        <div className="flex-1" />
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          + New Asset
        </button>
      </div>

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No assets found"
          description="Create your first asset to get started."
          action={<button className="btn-primary" onClick={() => setCreateOpen(true)}>+ New Asset</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((a) => (
            <div
              key={a.id}
              className="card flex flex-col gap-3 transition hover:border-brand-300 hover:shadow-md"
            >
              <button onClick={() => openDetail(a.id)} className="text-left">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.assetTag}</p>
                  </div>
                  <AssetStatusBadge status={a.status} />
                </div>
              </button>
              {a.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.photoUrl} alt={a.name} className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-2xl">\ud83d\udce6</div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <ConditionBadge condition={a.condition} />
                <span>{a.categoryName}</span>
              </div>
              {a.holderName && (
                <p className="text-xs text-slate-500">Holder: {a.holderName}</p>
              )}
              <div className="flex justify-end gap-2">
                <button className="text-xs font-medium text-slate-500 hover:underline" onClick={() => openDetail(a.id)}>
                  Details
                </button>
                <button className="text-xs font-medium text-rose-600 hover:underline" onClick={() => setDeleteId(a.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Asset"
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
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Asset name" />
          </div>
          <div>
            <label className="label">Asset Tag *</label>
            <input className="input" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} placeholder="Unique tag" />
          </div>
          <div>
            <label className="label">Serial Number</label>
            <input className="input" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} placeholder="Optional serial" />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Office / floor" />
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {Object.entries(ASSET_CONDITION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} className="rounded" />
            Bookable resource
          </label>
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer open={detailId !== null} onClose={() => setDetailId(null)} title="Asset Details">
        {!detail ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              {detail.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.photoUrl} alt={detail.name} className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-3xl">\ud83d\udce6</div>
              )}
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-800">{detail.name}</p>
                <p className="text-xs text-slate-400">Tag: {detail.assetTag}</p>
                <p className="text-xs text-slate-400">Serial: {detail.serialNumber ?? "\u2014"}</p>
                <div className="flex gap-2 pt-1">
                  <AssetStatusBadge status={detail.status} />
                  <ConditionBadge condition={detail.condition} />
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Category" value={detail.categoryName} />
              <Field label="Department" value={detail.departmentName ?? "\u2014"} />
              <Field label="Location" value={detail.location ?? "\u2014"} />
              <Field label="Holder" value={detail.holderName ?? "Unassigned"} />
              <Field label="Cost" value={formatCurrency(detail.acquisitionCost)} />
              <Field label="Bookable" value={detail.isBookable ? "Yes" : "No"} />
              <Field label="Created" value={formatDate(detail.createdAt)} />
            </dl>

            {detail.allocations.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-600">Active Allocations</h4>
                <ul className="space-y-1 text-sm">
                  {detail.allocations.map((a) => (
                    <li key={a.id} className="flex justify-between text-slate-600">
                      <span>{a.userName}</span>
                      <span className="text-xs text-slate-400">{formatDate(a.allocatedAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.maintenanceHistory.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-600">Maintenance History</h4>
                <ul className="space-y-1 text-sm">
                  {detail.maintenanceHistory.map((m) => (
                    <li key={m.id} className="flex justify-between text-slate-600">
                      <span className="truncate">{m.issueDescription}</span>
                      <span className="ml-2 shrink-0 text-xs text-slate-400">{m.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this asset? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={doDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
