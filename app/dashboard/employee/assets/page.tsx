// app/dashboard/employee/assets/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { AssetsClient } from "@/components/employee/assets-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/employee/assets">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">My Assets</h1>
          <p className="mt-1 text-sm text-slate-500">Assets allocated to you by your organization.</p>
        </div>
        <AssetsClient />
      </div>
    </AppShell>
  );
}
