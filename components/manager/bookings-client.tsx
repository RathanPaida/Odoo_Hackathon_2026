// components/manager/bookings-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { ConfirmDialog } from "@/components/employee/ui/confirm";
import { BookingBadge } from "@/components/employee/ui/badges";
import { cn, formatDateTime } from "@/lib/utils/manager";
import { BOOKING_LABEL } from "@/lib/constants/manager";
import type { ManagerBookingDto, Paginated } from "@/types/manager";

export function BookingsClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<ManagerBookingDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (q) params.set("q", q);
      const res = await apiFetch<{ data: Paginated<ManagerBookingDto> }>(
        `/api/manager/bookings?${params}`
      );
      setData(res.data?.data || null);
    } catch (e: any) {
      toast(e.message ?? "Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, q]);

  async function doCancel() {
    if (!cancelId) return;
    setBusy(true);
    try {
      await apiFetch(`/api/manager/bookings/${cancelId}`, { method: "DELETE" });
      toast("Booking cancelled.", "success");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setBusy(false);
      setCancelId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-700">All Bookings</h2>
        <div className="flex-1" />
        <input
          className="input max-w-xs"
          placeholder="Search resource or employee..."
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">All statuses</option>
          {["UPCOMING", "CURRENT", "COMPLETED", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{BOOKING_LABEL[s as keyof typeof BOOKING_LABEL]}</option>
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
        <EmptyState title="No bookings" description="Resource bookings from employees will appear here." />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Booked By</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{b.assetName}</p>
                    <p className="text-xs text-slate-400">{b.assetTag}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.userName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(b.startTime)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(b.endTime)}</td>
                  <td className="px-4 py-3"><BookingBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {(b.status === "UPCOMING" || b.status === "CURRENT") && (
                      <button className="text-xs font-medium text-rose-600 hover:underline" onClick={() => setCancelId(b.id)}>
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

      <ConfirmDialog
        open={cancelId !== null}
        message="Cancel this booking? The employee will be notified."
        confirmLabel="Cancel Booking"
        destructive
        onConfirm={doCancel}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
