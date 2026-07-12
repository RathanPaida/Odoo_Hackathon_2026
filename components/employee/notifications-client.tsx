// components/employee/notifications-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { NotificationTypeBadge } from "@/components/employee/ui/badges";
import { cn, formatDateTime, fromNow } from "@/lib/utils/employee";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/constants/employee";
import type { NotificationDto, NotificationType, Paginated } from "@/types/employee";

const TYPES = Object.keys(NOTIFICATION_TYPE_LABEL) as NotificationType[];

export function NotificationsClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<NotificationDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        unreadOnly: String(unreadOnly),
        page: String(page),
        pageSize: "15",
      });
      const res = await apiFetch<{ data: Paginated<NotificationDto> }>(
        `/api/employee/notifications?${params}`
      );
      setData(res.data?.data || null);
    } catch (e: any) {
      toast(e.message ?? "Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, unreadOnly, page]);

  async function markRead(id: string) {
    try {
      await apiFetch(`/api/employee/notifications/${id}`, { method: "PATCH" });
      load();
    } catch {
      /* ignore */
    }
  }

  async function markAll() {
    try {
      await apiFetch(`/api/employee/notifications`, { method: "POST" });
      toast("All marked as read.", "success");
      load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-700">Notifications</h2>
        <button className="btn-secondary" onClick={markAll}>Mark all read</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className="input max-w-[180px]" value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{NOTIFICATION_TYPE_LABEL[t]}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setPage(1); setUnreadOnly(e.target.checked); }} />
          Unread only
        </label>
      </div>

      {loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon="bell" title="No notifications" description="You're all caught up." />
      ) : (
        <ul className="space-y-2">
          {data.data.map((n) => (
            <li
              key={n.id}
              className={cn("card flex items-start gap-3", !n.read && "border-brand-200 bg-brand-50/40")}
            >
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" style={{ visibility: n.read ? "hidden" : "visible" }} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{n.title}</p>
                  <NotificationTypeBadge type={n.type} />
                </div>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400" title={formatDateTime(n.createdAt)}>{fromNow(n.createdAt)}</p>
              </div>
              {!n.read && (
                <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => markRead(n.id)}>Mark read</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
