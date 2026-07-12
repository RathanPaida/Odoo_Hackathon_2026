// components/user/role-dashboard.tsx
// Shared ERP landing page content for each role. Demonstrates RBAC wiring:
// shows the role's granted permissions (from lib/auth/permissions) and the
// runtime role/permission guards available to downstream ERP pages.
import { AppShell } from "@/components/user/app-shell";
import { getRolePermissions } from "@/lib/auth/permissions";
import { ROLE_LABELS, dashboardForRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import type { UserRole } from "@/types";

const ROLE_BLURB: Record<UserRole, string> = {
  ADMIN:
    "Full control over departments, employees, roles, categories, audits and reports.",
  ASSET_MANAGER:
    "Register and allocate assets; approve transfers, maintenance and returns.",
  DEPARTMENT_HEAD:
    "Oversee department assets, approve department transfers, book shared resources.",
  EMPLOYEE:
    "View your assets, book resources, and raise maintenance / transfer / return requests.",
};

export function RoleDashboard({ role }: { role: UserRole }) {
  const perms = getRolePermissions(role);
  return (
    <AppShell active={dashboardForRole(role)}>
      <div className="space-y-6">
        <div className="card">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {ROLE_LABELS[role]}
          </span>
          <h1 className="mt-3 text-2xl font-semibold">AssetFlow — {ROLE_LABELS[role]} Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">{ROLE_BLURB[role]}</p>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Granted Permissions
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {perms.map((p) => (
              <span
                key={p}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {p.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Guard used by every role dashboard page: ensures the viewer actually holds
// the role (middleware already enforces this, this is a server-side safety net).
export async function assertRolePage(role: UserRole) {
  const user = await getCurrentUser();
  if (!user) return null;
  const pu = toPublicUser(user as any);
  return pu.role === role || pu.role === "ADMIN" ? pu : null;
}
