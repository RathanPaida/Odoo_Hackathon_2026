// app/dashboard/employee/page.tsx
// Employee dashboard: stats, quick actions, recent notifications & activity.
import Link from "next/link";
import { AppShell } from "@/components/user/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import { getDashboardSummary } from "@/lib/services/employee/dashboard.service";
import { listNotifications } from "@/lib/services/employee/notifications.service";
import { listActivity } from "@/lib/services/employee/activity.service";
import { listMyAssets } from "@/lib/services/employee/assets.service";
import { Timeline } from "@/components/employee/ui/timeline";
import { NotificationTypeBadge } from "@/components/employee/ui/badges";
import { fromNow } from "@/lib/utils/employee";
import { EMPLOYEE_NAV } from "@/lib/constants/employee";

const QUICK_ACTIONS = [
  { href: "/dashboard/employee/assets", label: "My Assets", icon: "📦" },
  { href: "/dashboard/employee/transfers", label: "Transfer", icon: "🔁" },
  { href: "/dashboard/employee/returns", label: "Return", icon: "↩️" },
  { href: "/dashboard/employee/maintenance", label: "Maintenance", icon: "🛠️" },
  { href: "/dashboard/employee/bookings", label: "Book", icon: "📅" },
  { href: "/dashboard/employee/notifications", label: "Notifications", icon: "🔔" },
];

export default async function EmployeeDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const pu = toPublicUser(user as any);

  const [stats, notifs, activity, assets] = await Promise.all([
    getDashboardSummary(user.id),
    listNotifications(user.id, { unreadOnly: false, page: 1, pageSize: 5 }),
    listActivity(user.id, { page: 1, pageSize: 6 }),
    listMyAssets(user.id, {
      q: undefined,
      status: undefined,
      condition: undefined,
      sort: "allocatedAt",
      order: "desc",
      page: 1,
      pageSize: 5,
    }),
  ]);

  const fullName = `${pu.firstName ?? ""} ${pu.lastName ?? ""}`.trim() || pu.email;

  const statCards = [
    { label: "Active Assets", value: stats.activeAssets, href: "/dashboard/employee/assets", tone: "text-brand-600" },
    { label: "Upcoming Returns", value: stats.upcomingReturns, href: "/dashboard/employee/assets", tone: "text-amber-600" },
    { label: "Active Bookings", value: stats.activeBookings, href: "/dashboard/employee/bookings", tone: "text-indigo-600" },
    { label: "Pending Maintenance", value: stats.pendingMaintenance, href: "/dashboard/employee/maintenance", tone: "text-sky-600" },
    { label: "Unread Notifications", value: stats.unreadNotifications, href: "/dashboard/employee/notifications", tone: "text-emerald-600" },
  ];

  return (
    <AppShell active="/dashboard/employee">
      <div className="space-y-6">
        <div className="card">
          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome, {fullName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your assets and requests.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Notifications</h2>
              <Link href="/dashboard/employee/notifications" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            {notifs.data.length === 0 ? (
              <p className="text-sm text-slate-400">No notifications yet.</p>
            ) : (
              <ul className="space-y-2">
                {notifs.data.map((n) => (
                  <li key={n.id} className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" style={{ visibility: n.read ? "hidden" : "visible" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <NotificationTypeBadge type={n.type} />
                      </div>
                      <p className="text-xs text-slate-500">{n.message}</p>
                      <p className="text-[11px] text-slate-400">{fromNow(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">My Assets</h2>
            {assets.data.length === 0 ? (
              <p className="text-sm text-slate-400">No assets allocated yet.</p>
            ) : (
              <ul className="space-y-2">
                {assets.data.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{a.asset.name}</span>
                    <span className="text-xs text-slate-400">{a.asset.assetTag}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Activity</h2>
              <Link href="/dashboard/employee/activity" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            <Timeline
              items={activity.data.map((a) => ({
                id: a.id,
                title: a.action.replace(/_/g, " "),
                subtitle: a.entityType,
                timestamp: a.createdAt,
                tone: "brand",
              }))}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
