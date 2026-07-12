// components/user/app-shell.tsx
// Shared chrome for authenticated pages (header + nav + content).
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import type { PublicUser } from "@/types";
import { LogoutButton } from "@/components/user/logout-button";
import { NotificationBell } from "@/components/user/notification-bell";
import { initials } from "@/lib/utils";
import { getRoleNav } from "@/lib/auth/navigation";
import { ROLE_LABELS, dashboardForRole } from "@/lib/auth/roles";

export async function AppShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const pu = user ? toPublicUser(user as any) : null;
  const role = (pu?.role ?? "EMPLOYEE") as PublicUser["role"];
  const NAV = pu ? getRoleNav(role) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <Link
            href={dashboardForRole(role)}
            className="text-xl font-extrabold tracking-tight text-brand-600 mr-8"
          >
            AssetFlow
          </Link>
          <div className="flex-1 overflow-x-auto whitespace-nowrap no-scrollbar pb-1 sm:pb-0">
            <nav className="flex items-center gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active === n.href
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="ml-6 flex items-center gap-4 shrink-0 pl-4 border-l border-slate-200">
            <Link href="/profile" className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-none">
                  {pu ? `${pu.firstName ?? ""} ${pu.lastName ?? ""}`.trim() || pu.email : ""}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 mt-1">
                  {ROLE_LABELS[role]}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shadow-sm border border-brand-200">
                {pu ? initials(pu.firstName, pu.lastName) : "?"}
              </div>
            </Link>
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
