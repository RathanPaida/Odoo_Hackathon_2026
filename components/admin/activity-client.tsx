"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState } from "@/components/employee/ui/states";
import { Timeline } from "@/components/employee/ui/timeline";
import type { ActivityItemDto, Paginated } from "@/types/employee";

const TONES: Record<string, "brand" | "emerald" | "amber" | "rose" | "slate"> = {
  TRANSFER: "brand",
  RETURN: "amber",
  MAINTENANCE: "emerald",
  BOOKING: "slate",
  ASSET: "brand",
};

export function AdminActivityClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<ActivityItemDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, page: String(page), pageSize: "25" });
      const res = await apiFetch<{ data: Paginated<ActivityItemDto> }>(
        `/api/admin/activity?${params}`
      );
      setData(res.data?.data || null);
    } catch (e: any) {
      toast(e.message ?? "Failed to load activity", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type, page]);

  const items = (data?.data ?? []).map((a) => ({
    id: a.id,
    title: a.action.replace(/_/g, " "),
    subtitle: a.entityType,
    description: a.details
      ? JSON.stringify(a.details).slice(0, 160)
      : undefined,
    timestamp: a.createdAt,
    tone: TONES[a.entityType] ?? "slate",
    icon: "•",
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-700">System Activity</h2>
        <select className="input max-w-[180px]" value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
          <option value="">All activity</option>
          <option value="TRANSFER">Transfers</option>
          <option value="RETURN">Returns</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="BOOKING">Bookings</option>
          <option value="ASSET">Assets</option>
        </select>
      </div>

      {loading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No activity yet" description="System-wide activity across assets, transfers, returns, maintenance and bookings will appear here." />
      ) : (
        <Timeline items={items} />
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
