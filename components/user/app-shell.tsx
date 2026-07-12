// components/user/app-shell.tsx
// Shared chrome for authenticated pages (header + nav + content).
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import type { PublicUser } from "@/types";
import { LogoutButton } from "@/components/user/logout-button";
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href={dashboardForRole(role)}
            className="text-lg font-bold text-brand-600"
          >
            AssetFlow
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active === n.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <div className="ml-3 flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-medium text-slate-700">
                  {pu ? `${pu.firstName ?? ""} ${pu.lastName ?? ""}`.trim() || pu.email : ""}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {ROLE_LABELS[role]}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {pu ? initials(pu.firstName, pu.lastName) : "?"}
              </div>
              <LogoutButton />
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
