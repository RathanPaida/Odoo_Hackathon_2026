// components/employee/assets-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/employee/ui/pagination";
import { EmptyState, TableSkeleton } from "@/components/employee/ui/states";
import { Drawer } from "@/components/employee/ui/modal";
import { AssetStatusBadge, ConditionBadge } from "@/components/employee/ui/badges";
import { QrCode, downloadQr } from "@/components/employee/qr-code";
import { Timeline } from "@/components/employee/ui/timeline";
import { cn, formatDate, fromNow } from "@/lib/utils/employee";
import { ASSET_STATUS_LABEL } from "@/lib/constants/employee";
import type {
  AssetAllocationDto,
  AssetDetailsDto,
  Paginated,
} from "@/types/employee";

export function AssetsClient() {
  const { toast } = useToast();
  const [data, setData] = useState<Paginated<AssetAllocationDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("allocatedAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<AssetDetailsDto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

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
        pageSize: "9",
      });
      const res = await apiFetch<{ data: Paginated<AssetAllocationDto> }>(
        `/api/employee/assets?${params}`
      );
      setData(res.data?.data as any || null);
    } catch (e: any) {
      toast(e.message ?? "Failed to load assets", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, condition, sort, order, page]);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    try {
      const res = await apiFetch<{ data: AssetDetailsDto }>(
        `/api/employee/assets/${id}`
      );
      setDetail(res.data.data);
    } catch {
      toast("Failed to load asset details", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search assets, tags, serial…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select className="input max-w-[160px]" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {Object.entries(ASSET_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="input max-w-[160px]" value={condition} onChange={(e) => { setPage(1); setCondition(e.target.value); }}>
          <option value="">All conditions</option>
          {["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input max-w-[150px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="allocatedAt">Sort: Allocated</option>
          <option value="name">Sort: Name</option>
          <option value="expectedReturnDate">Sort: Return</option>
          <option value="condition">Sort: Condition</option>
        </select>
        <button className="btn-secondary" onClick={() => setOrder(order === "asc" ? "desc" : "asc")}>
          {order === "asc" ? "Asc ↑" : "Desc ↓"}
        </button>
      </div>

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No assets allocated"
          description="Assets allocated to you by your organization will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((a) => (
            <button
              key={a.id}
              onClick={() => openDetail(a.id)}
              className="card flex flex-col gap-3 text-left transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">{a.asset.name}</p>
                  <p className="text-xs text-slate-400">{a.asset.assetTag}</p>
                </div>
                <AssetStatusBadge status={a.asset.status} />
              </div>
              {a.asset.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.asset.photoUrl} alt={a.asset.name} className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg bg-slate-100 text-2xl">📦</div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <ConditionBadge condition={a.asset.condition} />
                <span>Return: {a.expectedReturnDate ? formatDate(a.expectedReturnDate) : "Open"}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {data && (
        <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
      )}

      <Drawer open={detailId !== null} onClose={() => setDetailId(null)} title="Asset Details">
        {!detail ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              {detail.asset.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={detail.asset.photoUrl} alt={detail.asset.name} className="h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-3xl">📦</div>
              )}
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-800">{detail.asset.name}</p>
                <p className="text-xs text-slate-400">Tag: {detail.asset.assetTag}</p>
                <p className="text-xs text-slate-400">Serial: {detail.asset.serialNumber ?? "—"}</p>
                <div className="flex gap-2 pt-1">
                  <AssetStatusBadge status={detail.asset.status} />
                  <ConditionBadge condition={detail.asset.condition} />
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Category" value={detail.asset.categoryName} />
              <Field label="Location" value={detail.asset.location ?? "—"} />
              <Field label="Assigned" value={formatDate(detail.allocatedAt)} />
              <Field label="Expected Return" value={detail.expectedReturnDate ? formatDate(detail.expectedReturnDate) : "Open"} />
            </dl>

            <div className="flex items-center gap-4 rounded-lg border border-slate-100 p-3">
              <QrCode value={detail.asset.assetTag} size={120} />
              <div>
                <p className="text-sm font-medium text-slate-700">Asset QR</p>
                <p className="text-xs text-slate-400">Scan to identify this asset.</p>
                <button className="btn-secondary mt-2" onClick={() => downloadQr(detail.asset.assetTag, `${detail.asset.assetTag}.svg`)}>
                  Download QR
                </button>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-600">Maintenance History</h4>
              <Timeline
                items={detail.maintenanceHistory.map((m) => ({
                  id: m.id,
                  title: m.issueDescription,
                  subtitle: `${m.priority} · ${m.status}`,
                  timestamp: m.createdAt,
                  tone: m.status === "RESOLVED" ? "emerald" : m.status === "REJECTED" ? "rose" : "amber",
                }))}
              />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-600">Asset Timeline</h4>
              <Timeline
                items={detail.history.map((h) => ({
                  id: h.id,
                  title: h.action,
                  subtitle: h.fromUserName && h.toUserName ? `${h.fromUserName} → ${h.toUserName}` : undefined,
                  description: h.notes ?? undefined,
                  timestamp: h.createdAt,
                  tone: "brand",
                }))}
              />
            </div>
          </div>
        )}
      </Drawer>
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
