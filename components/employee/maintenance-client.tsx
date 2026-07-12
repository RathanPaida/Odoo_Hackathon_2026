// components/employee/maintenance-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState, TableSkeleton } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { RemoteSelect } from "@/components/employee/ui/remote-select";
import { MaintenanceBadge, PriorityBadge } from "@/components/employee/ui/badges";
import { Timeline } from "@/components/employee/ui/timeline";
import { formatDateTime } from "@/lib/utils/employee";
import { MAINTENANCE_PRIORITY } from "@/lib/constants/employee";
import type { MaintenanceRequestDto, Paginated } from "@/types/employee";

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ["PENDING", "APPROVED/REJECTED"],
  APPROVED: ["PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED"],
  REJECTED: ["PENDING", "REJECTED"],
  IN_PROGRESS: ["PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["PENDING", "APPROVED", "IN_PROGRESS", "RESOLVED"],
};

export function MaintenanceClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<MaintenanceRequestDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [detail, setDetail] = useState<MaintenanceRequestDto | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Paginated<MaintenanceRequestDto> }>(
        `/api/employee/maintenance?page=${page}&pageSize=10`
      );
      setData(res.data?.data as any || null);
    } catch (e: any) {
      toast(e.message ?? "Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function submit() {
    if (!assetId || issue.trim().length < 5) {
      toast("Please select an asset and describe the issue.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/employee/maintenance", {
        method: "POST",
        body: JSON.stringify({
          assetId,
          priority,
          issueDescription: issue,
          description: description || null,
          photoUrl: photoUrl || null,
        }),
      });
      toast("Maintenance request submitted.", "success");
      setOpen(false);
      setAssetId("");
      setIssue("");
      setDescription("");
      setPhotoUrl("");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed to submit", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Maintenance Requests</h2>
        <button className="btn-primary" onClick={() => setOpen(true)}>Raise Request</button>
      </div>

      {loading && !data ? (
        <TableSkeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No maintenance requests"
          description="Report an issue with an allocated asset. A technician reviews and resolves it."
          action={<button className="btn-primary" onClick={() => setOpen(true)}>Raise Request</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((m) => (
            <button
              key={m.id}
              onClick={() => setDetail(m)}
              className="card flex flex-col gap-2 text-left transition hover:border-brand-300"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{m.assetName}</p>
                <MaintenanceBadge status={m.status} />
              </div>
              <p className="text-sm text-slate-600">{m.issueDescription}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <PriorityBadge priority={m.priority} />
                <span>{formatDateTime(m.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Raise Maintenance Request"
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
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {MAINTENANCE_PRIORITY.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Issue *</label>
            <input className="input" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="e.g. Screen flickering" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Photo URL (optional)</label>
            <input className="input" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
      </Modal>

      <Modal open={detail !== null} onClose={() => setDetail(null)} title="Maintenance Detail" size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MaintenanceBadge status={detail.status} />
              <PriorityBadge priority={detail.priority} />
            </div>
            <p className="text-sm text-slate-700">{detail.issueDescription}</p>
            {detail.technicianNotes && (
              <p className="text-sm text-slate-500"><span className="font-medium">Technician notes:</span> {detail.technicianNotes}</p>
            )}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-600">Status Timeline</h4>
              <Timeline
                items={STATUS_FLOW[detail.status].map((s, i) => ({
                  id: `${detail.id}-${i}`,
                  title: s,
                  tone:
                    s === detail.status
                      ? detail.status === "REJECTED"
                        ? "rose"
                        : detail.status === "RESOLVED"
                        ? "emerald"
                        : "brand"
                      : "slate",
                  icon: s === detail.status ? "●" : "○",
                }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
