// components/manager/maintenance-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { MaintenanceBadge, PriorityBadge } from "@/components/employee/ui/badges";
import { cn, formatDateTime } from "@/lib/utils/manager";
import { MAINTENANCE_LABEL, PRIORITY_LABEL } from "@/lib/constants/manager";
import type { ManagerMaintenanceDto, Paginated } from "@/types/manager";

export function MaintenanceClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<ManagerMaintenanceDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [reviewItem, setReviewItem] = useState<ManagerMaintenanceDto | null>(null);
  const [form, setForm] = useState({
    status: "APPROVED" as "APPROVED" | "REJECTED" | "IN_PROGRESS" | "RESOLVED",
    technicianId: "",
    technicianNotes: "",
  });
  const [busy, setBusy] = useState(false);
  const [employees, setEmployees] = useState<{ id: string; firstName: string | null; lastName: string | null }[]>([]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      const res = await apiFetch<{ data: Paginated<ManagerMaintenanceDto> }>(
        `/api/manager/maintenance?${params}`
      );
      setData(res.data?.data?.data || []);
    } catch (e: any) {
      toast(e.message ?? "Failed to load maintenance requests", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      const res = await apiFetch<{ data: { data: { id: string; firstName: string | null; lastName: string | null }[] } }>(
        "/api/manager/employees?pageSize=100"
      );
      setEmployees(res.data.data.data ?? []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function submitReview() {
    if (!reviewItem) return;
    setBusy(true);
    try {
      await apiFetch(`/api/manager/maintenance/${reviewItem.id}`, {
        method: "POST",
        body: JSON.stringify({
          status: form.status,
          technicianId: form.technicianId || null,
          technicianNotes: form.technicianNotes || null,
        }),
      });
      toast(`Maintenance ${form.status.toLowerCase()}.`, "success");
      setReviewItem(null);
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-700">Maintenance Requests</h2>
        <div className="flex-1" />
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">All statuses</option>
          {["PENDING", "APPROVED", "REJECTED", "IN_PROGRESS", "RESOLVED"].map((s) => (
            <option key={s} value={s}>{MAINTENANCE_LABEL[s as keyof typeof MAINTENANCE_LABEL]}</option>
          ))}
        </select>
        <select className="input max-w-[160px]" value={priorityFilter} onChange={(e) => { setPage(1); setPriorityFilter(e.target.value); }}>
          <option value="">All priorities</option>
          {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
            <option key={p} value={p}>{PRIORITY_LABEL[p as keyof typeof PRIORITY_LABEL]}</option>
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
        <EmptyState title="No maintenance requests" description="Maintenance requests from employees will appear here." />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{m.assetName}</p>
                    <p className="text-xs text-slate-400">{m.assetTag}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.requestedByName}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">{m.issueDescription}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={m.priority} /></td>
                  <td className="px-4 py-3"><MaintenanceBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(m.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {m.canReview && (
                      <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => {
                        setForm({ status: "APPROVED", technicianId: m.technicianId ?? "", technicianNotes: "" });
                        setReviewItem(m);
                      }}>
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
        title="Review Maintenance"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReviewItem(null)}>Cancel</button>
            <button className="btn-primary" onClick={submitReview} disabled={busy}>
              {busy ? "Submitting..." : "Submit"}
            </button>
          </>
        }
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p><span className="font-medium">Asset:</span> {reviewItem.assetName} ({reviewItem.assetTag})</p>
              <p><span className="font-medium">Issue:</span> {reviewItem.issueDescription}</p>
              <p><span className="font-medium">Requested by:</span> {reviewItem.requestedByName}</p>
            </div>

            <div>
              <label className="label">Action</label>
              <div className="grid grid-cols-2 gap-2">
                {(["APPROVED", "IN_PROGRESS", "RESOLVED", "REJECTED"] as const).map((s) => (
                  <button
                    key={s}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      form.status === s
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                    onClick={() => setForm({ ...form, status: s })}
                  >
                    {MAINTENANCE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Assign Technician</label>
              <select className="input" value={form.technicianId} onChange={(e) => setForm({ ...form, technicianId: e.target.value })}>
                <option value="">Unassigned</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Technician Notes</label>
              <textarea className="input min-h-[80px]" value={form.technicianNotes} onChange={(e) => setForm({ ...form, technicianNotes: e.target.value })} placeholder="Notes for the employee..." />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
