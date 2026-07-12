// components/employee/asset-details-client.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/employee/ui/states";
import { AssetStatusBadge, ConditionBadge } from "@/components/employee/ui/badges";
import { QrCode, downloadQr } from "@/components/employee/qr-code";
import { Timeline } from "@/components/employee/ui/timeline";
import { formatDate } from "@/lib/utils/employee";
import type { AssetDetailsDto } from "@/types/employee";
import Link from "next/link";

export function AssetDetailsClient({ allocationId }: { allocationId: string }) {
  const { toast } = useToast();
  const [asset, setAsset] = useState<AssetDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ data: AssetDetailsDto }>(
          `/api/employee/assets/${allocationId}`
        );
        setAsset(res.data.data);
      } catch {
        toast("Failed to load asset", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [allocationId]);

  if (loading) {
    return <div className="card h-64 animate-pulse bg-slate-100" />;
  }
  if (!asset) {
    return <EmptyState title="Asset not found" description="This asset may no longer be allocated to you." action={<Link className="btn-primary" href="/dashboard/employee/assets">Back to My Assets</Link>} />;
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/employee/assets" className="text-sm font-medium text-brand-600 hover:underline">← My Assets</Link>
      <div className="card">
        <div className="flex flex-wrap items-start gap-4">
          {asset.asset.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.asset.photoUrl} alt={asset.asset.name} className="h-28 w-28 rounded-lg object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-slate-100 text-3xl">📦</div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-800">{asset.asset.name}</h1>
              <AssetStatusBadge status={asset.asset.status} />
              <ConditionBadge condition={asset.asset.condition} />
            </div>
            <p className="mt-1 text-sm text-slate-400">Tag: {asset.asset.assetTag}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Field label="Category" value={asset.asset.categoryName} />
              <Field label="Serial" value={asset.asset.serialNumber ?? "—"} />
              <Field label="Location" value={asset.asset.location ?? "—"} />
              <Field label="Assigned" value={formatDate(asset.allocatedAt)} />
              <Field label="Expected Return" value={asset.expectedReturnDate ? formatDate(asset.expectedReturnDate) : "Open"} />
              <Field label="Condition" value={asset.asset.condition} />
            </dl>
          </div>
          <div className="flex flex-col items-center gap-2">
            <QrCode value={asset.asset.assetTag} size={120} />
            <button className="btn-secondary" onClick={() => downloadQr(asset.asset.assetTag, `${asset.asset.assetTag}.svg`)}>Download QR</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Maintenance History</h2>
          <Timeline items={asset.maintenanceHistory.map((m) => ({
            id: m.id,
            title: m.issueDescription,
            subtitle: `${m.priority} · ${m.status}`,
            timestamp: m.createdAt,
            tone: m.status === "RESOLVED" ? "emerald" : m.status === "REJECTED" ? "rose" : "amber",
          }))} />
        </div>
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Asset Timeline</h2>
          <Timeline items={asset.history.map((h) => ({
            id: h.id,
            title: h.action,
            subtitle: h.fromUserName && h.toUserName ? `${h.fromUserName} → ${h.toUserName}` : undefined,
            description: h.notes ?? undefined,
            timestamp: h.createdAt,
            tone: "brand",
          }))} />
        </div>
      </div>
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
