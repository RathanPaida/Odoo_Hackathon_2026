// components/manager/returns-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { ReturnBadge } from "@/components/employee/ui/badges";
import { cn, formatDateTime } from "@/lib/utils/manager";
import { RETURN_LABEL } from "@/lib/constants/manager";
import type { ManagerReturnDto, Paginated } from "@/types/manager";

export function ReturnsClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<ManagerReturnDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewItem, setReviewItem] = useState<ManagerReturnDto | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch<{ data: Paginated<ManagerReturnDto> }>(
        `/api/manager/returns?${params}`
      );
      setData(res.data?.data || null);
    } catch (e: any) {
      toast(e.message ?? "Failed to load returns", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function submitReview() {
    if (!reviewItem) return;
    setBusy(true);
    try {
      await apiFetch(`/api/manager/returns/${reviewItem.id}`, {
        method: "POST",
        body: JSON.stringify({ status: reviewStatus, notes: reviewNotes || null }),
      });
      toast(`Return ${reviewStatus.toLowerCase()}.`, "success");
      setReviewItem(null);
      setReviewNotes("");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-700">Return Requests</h2>
        <div className="flex-1" />
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">All statuses</option>
          {["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{RETURN_LABEL[s as keyof typeof RETURN_LABEL]}</option>
          ))}
        </select>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-14 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No return requests" description="Return requests from employees will appear here." />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Condition Notes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
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
                  <td className="px-4 py-3 text-slate-600">{r.requestedByName}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">{r.conditionNotes ?? "\u2014"}</td>
                  <td className="px-4 py-3"><ReturnBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.canReview && (
                      <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setReviewItem(r)}>
                        Review
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
        open={reviewItem !== null}
        onClose={() => setReviewItem(null)}
        title="Review Return"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReviewItem(null)}>Cancel</button>
            <button
              className={reviewStatus === "APPROVED" ? "btn-primary" : "btn-danger"}
              onClick={submitReview}
              disabled={busy}
            >
              {busy ? "Submitting..." : reviewStatus === "APPROVED" ? "Approve" : "Reject"}
            </button>
          </>
        }
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p><span className="font-medium">Asset:</span> {reviewItem.assetName} ({reviewItem.assetTag})</p>
              <p><span className="font-medium">Requested by:</span> {reviewItem.requestedByName}</p>
              <p><span className="font-medium">Condition notes:</span> {reviewItem.conditionNotes ?? "N/A"}</p>
            </div>
            <div className="flex gap-3">
              <button
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${reviewStatus === "APPROVED" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                onClick={() => setReviewStatus("APPROVED")}
              >
                Approve
              </button>
              <button
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${reviewStatus === "REJECTED" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                onClick={() => setReviewStatus("REJECTED")}
              >
                Reject
              </button>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input min-h-[80px]" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add notes..." />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
