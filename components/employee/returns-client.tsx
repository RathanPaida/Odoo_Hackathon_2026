// components/employee/returns-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState, TableSkeleton } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { ConfirmDialog } from "@/components/employee/ui/confirm";
import { RemoteSelect } from "@/components/employee/ui/remote-select";
import { ReturnBadge } from "@/components/employee/ui/badges";
import { formatDateTime } from "@/lib/utils/employee";
import type { Paginated, ReturnRequestDto } from "@/types/employee";

export function ReturnsClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<ReturnRequestDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [cancelId, setCancelId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Paginated<ReturnRequestDto> }>(
        `/api/employee/returns?page=${page}&pageSize=10`
      );
      setData(res.data?.data?.data || []);
    } catch (e: any) {
      toast(e.message ?? "Failed to load returns", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function addImage() {
    const v = imageUrl.trim();
    if (!v || images.includes(v) || images.length >= 5) return;
    if (!/^https?:\/\//.test(v)) {
      toast("Enter a valid image URL (http/https).", "error");
      return;
    }
    setImages((p) => [...p, v]);
    setImageUrl("");
  }

  async function submit() {
    if (!assetId) {
      toast("Please select an asset.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/employee/returns", {
        method: "POST",
        body: JSON.stringify({ assetId, conditionNotes: notes || null, imageUrls: images }),
      });
      toast("Return request submitted.", "success");
      setOpen(false);
      setAssetId("");
      setNotes("");
      setImages([]);
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed to submit", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!cancelId) return;
    try {
      await apiFetch(`/api/employee/returns/${cancelId}`, { method: "PATCH" });
      toast("Return cancelled.", "success");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setCancelId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Return Requests</h2>
        <button className="btn-primary" onClick={() => setOpen(true)}>New Return</button>
      </div>

      {loading && !data ? (
        <TableSkeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No return requests"
          description="Return an allocated asset to your organization. Managers approve later."
          action={<button className="btn-primary" onClick={() => setOpen(true)}>New Return</button>}
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Condition Notes</th>
                <th className="px-4 py-3">Photos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.assetName}</p>
                    <p className="text-xs text-slate-400">{r.assetTag}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.conditionNotes ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.imageUrls.length} attached</td>
                  <td className="px-4 py-3"><ReturnBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.canCancel && (
                      <button className="text-xs font-medium text-rose-600 hover:underline" onClick={() => setCancelId(r.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Return Request"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Close</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit"}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Asset</label>
            <RemoteSelect
              url="/api/employee/assets?pageSize=100"
              valueKey="asset.id"
              labelKey="asset.name"
              sublabelKey="asset.assetTag"
              value={assetId}
              onChange={setAssetId}
              placeholder="Select allocated asset"
            />
          </div>
          <div>
            <label className="label">Condition Notes</label>
            <textarea className="input min-h-[90px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the asset condition on return" />
          </div>
          <div>
            <label className="label">Photos (image URLs, max 5)</label>
            <div className="flex gap-2">
              <input className="input" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <button className="btn-secondary" type="button" onClick={addImage}>Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((img) => (
                <span key={img} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  📎 {img.slice(0, 24)}…
                  <button className="text-rose-500" onClick={() => setImages(images.filter((x) => x !== img))}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelId !== null}
        message="Cancel this pending return request?"
        confirmLabel="Cancel Request"
        destructive
        onConfirm={doCancel}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
