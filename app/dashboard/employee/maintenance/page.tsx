// app/dashboard/employee/maintenance/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { MaintenanceClient } from "@/components/employee/maintenance-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/employee/maintenance">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Maintenance Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Report and track issues with your allocated assets.</p>
        </div>
        <MaintenanceClient />
      </div>
    </AppShell>
  );
}
