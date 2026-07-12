// components/employee/transfers-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState, TableSkeleton } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { ConfirmDialog } from "@/components/employee/ui/confirm";
import { RemoteSelect } from "@/components/employee/ui/remote-select";
import { TransferBadge } from "@/components/employee/ui/badges";
import { cn, formatDateTime } from "@/lib/utils/employee";
import type { Paginated, TransferRequestDto } from "@/types/employee";

export function TransfersClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<TransferRequestDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Paginated<TransferRequestDto> }>(
        `/api/employee/transfers?page=${page}&pageSize=10`
      );
      setData(res.data.data);
    } catch (e: any) {
      toast(e.message ?? "Failed to load transfers", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function submit() {
    if (!assetId || !target || reason.trim().length < 3) {
      toast("Please complete all fields.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/employee/transfers", {
        method: "POST",
        body: JSON.stringify({ assetId, targetEmployeeId: target, reason }),
      });
      toast("Transfer request submitted.", "success");
      setOpen(false);
      setAssetId("");
      setTarget("");
      setReason("");
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
      await apiFetch(`/api/employee/transfers/${cancelId}`, { method: "PATCH" });
      toast("Transfer cancelled.", "success");
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
        <h2 className="text-lg font-semibold text-slate-700">Transfer Requests</h2>
        <button className="btn-primary" onClick={() => setOpen(true)}>New Transfer</button>
      </div>

      {loading && !data ? (
        <TableSkeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No transfer requests"
          description="Request to transfer an allocated asset to another employee. Managers approve later."
          action={<button className="btn-primary" onClick={() => setOpen(true)}>New Transfer</button>}
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{t.assetName}</p>
                    <p className="text-xs text-slate-400">{t.assetTag}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.toUserName}</td>
                  <td className="px-4 py-3 text-slate-600">{t.reason}</td>
                  <td className="px-4 py-3"><TransferBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(t.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {t.canCancel && (
                      <button className="text-xs font-medium text-rose-600 hover:underline" onClick={() => setCancelId(t.id)}>
                        Cancel
                      </button>
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
        title="New Transfer Request"
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
            <label className="label">Transfer To (Employee)</label>
            <RemoteSelect
              url="/api/employee/employees?pageSize=100"
              value={target}
              onChange={setTarget}
              placeholder="Select employee"
            />
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input min-h-[90px]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you transferring this asset?" />
          </div>
          <p className="text-xs text-slate-400">Status starts as <span className="font-medium">Pending</span>. You cannot approve transfers.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelId !== null}
        message="Cancel this pending transfer request? This cannot be undone."
        confirmLabel="Cancel Request"
        destructive
        onConfirm={doCancel}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
