// app/dashboard/manager/maintenance/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { MaintenanceClient } from "@/components/manager/maintenance-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/manager/maintenance">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Maintenance Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review, assign technicians, and resolve maintenance requests.</p>
        </div>
        <MaintenanceClient />
      </div>
    </AppShell>
  );
}
