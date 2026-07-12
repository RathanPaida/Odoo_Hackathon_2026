// components/employee/bookings-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { EmptyState, TableSkeleton } from "@/components/employee/ui/states";
import { Modal } from "@/components/employee/ui/modal";
import { ConfirmDialog } from "@/components/employee/ui/confirm";
import { RemoteSelect } from "@/components/employee/ui/remote-select";
import { BookingCalendar } from "@/components/employee/ui/calendar";
import { BookingBadge } from "@/components/employee/ui/badges";
import { cn, formatRange } from "@/lib/utils/employee";
import type { ResourceBookingDto } from "@/types/employee";

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BookingsClient() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<ResourceBookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [start, setStart] = useState(toLocalInput(new Date()));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 3600_000)));
  const [purpose, setPurpose] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reschedId, setReschedId] = useState<string | null>(null);
  const [rStart, setRStart] = useState("");
  const [rEnd, setREnd] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: ResourceBookingDto[] }>(
        `/api/employee/bookings?pageSize=100`
      );
      setBookings(res.data.data);
    } catch (e: any) {
      toast(e.message ?? "Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (!assetId) {
      toast("Please select a resource.", "error");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/api/employee/bookings", {
        method: "POST",
        body: JSON.stringify({
          assetId,
          startTime: new Date(start).toISOString(),
          endTime: new Date(end).toISOString(),
          purpose: purpose || null,
        }),
      });
      toast("Resource booked.", "success");
      setOpen(false);
      setAssetId("");
      setPurpose("");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed to book", "error");
    } finally {
      setBusy(false);
    }
  }

  async function doCancel() {
    if (!cancelId) return;
    try {
      await apiFetch(`/api/employee/bookings/${cancelId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel" }),
      });
      toast("Booking cancelled.", "success");
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed", "error");
    } finally {
      setCancelId(null);
    }
  }

  async function doReschedule() {
    if (!reschedId) return;
    try {
      await apiFetch(`/api/employee/bookings/${reschedId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "reschedule",
          startTime: new Date(rStart).toISOString(),
          endTime: new Date(rEnd).toISOString(),
          purpose,
        }),
      });
      toast("Booking rescheduled.", "success");
      setReschedId(null);
      load();
    } catch (e: any) {
      toast(e.message ?? "Failed to reschedule", "error");
    }
  }

  const upcoming = bookings.filter((b) => b.status === "UPCOMING" || b.status === "CURRENT");
  const history = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-700">Resource Bookings</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button className={cn("rounded-md px-3 py-1.5 text-sm", view === "calendar" ? "bg-brand-600 text-white" : "text-slate-600")} onClick={() => setView("calendar")}>Calendar</button>
            <button className={cn("rounded-md px-3 py-1.5 text-sm", view === "list" ? "bg-brand-600 text-white" : "text-slate-600")} onClick={() => setView("list")}>List</button>
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)}>Book Resource</button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" description="Book a shared resource to get started." icon="calendar" action={<button className="btn-primary" onClick={() => setOpen(true)}>Book Resource</button>} />
      ) : view === "calendar" ? (
        <BookingCalendar bookings={bookings} />
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-500">Upcoming & Current</h3>
            <div className="space-y-2">
              {upcoming.length === 0 && <p className="text-sm text-slate-400">Nothing scheduled.</p>}
              {upcoming.map((b) => (
                <div key={b.id} className="card flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">{b.assetName}</p>
                    <p className="text-xs text-slate-500">{formatRange(b.startTime, b.endTime)}</p>
                    {b.purpose && <p className="text-xs text-slate-400">{b.purpose}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <BookingBadge status={b.status} />
                    <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => { setReschedId(b.id); setRStart(toLocalInput(new Date(b.startTime))); setREnd(toLocalInput(new Date(b.endTime))); setPurpose(b.purpose ?? ""); }}>Reschedule</button>
                    <button className="text-xs font-medium text-rose-600 hover:underline" onClick={() => setCancelId(b.id)}>Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-500">History</h3>
            <div className="space-y-2">
              {history.length === 0 && <p className="text-sm text-slate-400">No past bookings.</p>}
              {history.map((b) => (
                <div key={b.id} className="card flex items-center justify-between gap-3 opacity-80">
                  <div>
                    <p className="font-medium text-slate-800">{b.assetName}</p>
                    <p className="text-xs text-slate-500">{formatRange(b.startTime, b.endTime)}</p>
                  </div>
                  <BookingBadge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Book a Resource"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>Close</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Booking…" : "Book"}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Resource</label>
            <RemoteSelect
              url="/api/employee/resources?pageSize=100"
              value={assetId}
              onChange={setAssetId}
              placeholder="Select a bookable resource"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start</label>
              <input type="datetime-local" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label">End</label>
              <input type="datetime-local" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Purpose</label>
            <input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Meeting, training, etc." />
          </div>
          <p className="text-xs text-slate-400">Overlapping bookings for the same resource are prevented.</p>
        </div>
      </Modal>

      <ConfirmDialog open={cancelId !== null} message="Cancel this booking?" confirmLabel="Cancel Booking" destructive onConfirm={doCancel} onClose={() => setCancelId(null)} />

      <Modal open={reschedId !== null} onClose={() => setReschedId(null)} title="Reschedule Booking"
        footer={<><button className="btn-secondary" onClick={() => setReschedId(null)}>Close</button><button className="btn-primary" onClick={doReschedule}>Save</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Start</label><input type="datetime-local" className="input" value={rStart} onChange={(e) => setRStart(e.target.value)} /></div>
          <div><label className="label">End</label><input type="datetime-local" className="input" value={rEnd} onChange={(e) => setREnd(e.target.value)} /></div>
        </div>
        <div className="mt-3"><label className="label">Purpose</label><input className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
      </Modal>
    </div>
  );
}
