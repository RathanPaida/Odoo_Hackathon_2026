// app/dashboard/manager/page.tsx
// Asset Manager dashboard: stats, quick actions, pending items.
import Link from "next/link";
import { AppShell } from "@/components/user/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import { getDashboardSummary } from "@/lib/services/manager/dashboard.service";
import { listTransfers } from "@/lib/services/manager/transfers.service";
import { listMaintenance } from "@/lib/services/manager/maintenance.service";
import { MANAGER_NAV } from "@/lib/constants/manager";
import { formatDateTime } from "@/lib/utils/manager";

const QUICK_ACTIONS = [
  { href: "/dashboard/manager/assets", label: "Assets", icon: "\ud83d\udce6" },
  { href: "/dashboard/manager/categories", label: "Categories", icon: "\ud83d\udcc2" },
  { href: "/dashboard/manager/transfers", label: "Transfers", icon: "\ud83d\udd04" },
  { href: "/dashboard/manager/returns", label: "Returns", icon: "\u21a9\ufe0f" },
  { href: "/dashboard/manager/maintenance", label: "Maintenance", icon: "\ud83d\udee0\ufe0f" },
  { href: "/dashboard/manager/bookings", label: "Bookings", icon: "\ud83d\udcc5" },
];

export default async function ManagerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const pu = toPublicUser(user as any);

  const [stats, pendingTransfers, pendingMaintenance] = await Promise.all([
    getDashboardSummary(),
    listTransfers({ status: "PENDING", page: 1, pageSize: 5 }),
    listMaintenance({ status: "PENDING", page: 1, pageSize: 5 }),
  ]);

  const fullName = `${pu.firstName ?? ""} ${pu.lastName ?? ""}`.trim() || pu.email;

  const statCards = [
    { label: "Total Assets", value: stats.totalAssets, href: "/dashboard/manager/assets", tone: "text-brand-600" },
    { label: "Available", value: stats.availableAssets, href: "/dashboard/manager/assets", tone: "text-emerald-600" },
    { label: "Allocated", value: stats.allocatedAssets, href: "/dashboard/manager/assets", tone: "text-indigo-600" },
    { label: "Pending Transfers", value: stats.pendingTransfers, href: "/dashboard/manager/transfers", tone: "text-amber-600" },
    { label: "Pending Returns", value: stats.pendingReturns, href: "/dashboard/manager/returns", tone: "text-amber-600" },
    { label: "Maintenance Active", value: stats.maintenanceInFlight, href: "/dashboard/manager/maintenance", tone: "text-sky-600" },
    { label: "Active Bookings", value: stats.activeBookings, href: "/dashboard/manager/bookings", tone: "text-indigo-600" },
    { label: "Categories", value: stats.categories, href: "/dashboard/manager/categories", tone: "text-slate-600" },
  ];

  return (
    <AppShell active="/dashboard/manager">
      <div className="space-y-6">
        <div className="card">
          <h1 className="text-2xl font-semibold text-slate-800">
            Asset Manager Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {fullName}. Manage assets, review requests, and keep your inventory in order.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {statCards.map((c) => (
            <Link key={c.label} href={c.href} className="card transition hover:border-brand-300 hover:shadow-md">
              <p className={`text-3xl font-bold ${c.tone}`}>{c.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {QUICK_ACTIONS.map((q) => (
                <Link key={q.href} href={q.href} className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 p-4 text-center transition hover:border-brand-200 hover:bg-brand-50/40">
                  <span className="text-2xl">{q.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Pending Transfers</h2>
              <Link href="/dashboard/manager/transfers" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            {pendingTransfers.data.length === 0 ? (
              <p className="text-sm text-slate-400">No pending transfers.</p>
            ) : (
              <ul className="space-y-2">
                {pendingTransfers.data.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{t.assetName}</span>
                      <span className="ml-2 text-xs text-slate-400">{t.fromUserName} &rarr; {t.toUserName}</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateTime(t.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Pending Maintenance</h2>
              <Link href="/dashboard/manager/maintenance" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            {pendingMaintenance.data.length === 0 ? (
              <p className="text-sm text-slate-400">No pending maintenance requests.</p>
            ) : (
              <ul className="space-y-2">
                {pendingMaintenance.data.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-700">{m.assetName}</span>
                      <span className="ml-2 text-xs text-slate-400">{m.priority}</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateTime(m.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Asset Overview</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Available</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-emerald-500" style={{ width: `${stats.totalAssets > 0 ? (stats.availableAssets / stats.totalAssets) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{stats.availableAssets}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Allocated</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-indigo-500" style={{ width: `${stats.totalAssets > 0 ? (stats.allocatedAssets / stats.totalAssets) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{stats.allocatedAssets}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">In Maintenance</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-amber-500" style={{ width: `${stats.totalAssets > 0 ? (stats.maintenanceInFlight / stats.totalAssets) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{stats.maintenanceInFlight}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
