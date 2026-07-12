// app/dashboard/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";
import { formatDate, initials } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // middleware redirects; safety fallback
  const pu = toPublicUser(user as any);

  return (
    <AppShell active="/dashboard">
      <div className="space-y-6">
        <div className="card flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
            {initials(pu.firstName, pu.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              Welcome, {pu.firstName ?? pu.email}!
            </h1>
            <p className="text-sm text-slate-500">{pu.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Account status" value={pu.status} />
          <Stat label="Email verified" value={pu.emailVerified ? "Yes" : "No"} />
          <Stat label="Role" value={pu.role} />
          <Stat label="Last login" value={formatDate(pu.lastLoginAt)} />
          <Stat label="Member since" value={formatDate(pu.createdAt)} />
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize text-slate-800">
        {value}
      </p>
    </div>
  );
}
