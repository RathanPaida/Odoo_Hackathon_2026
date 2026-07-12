import { Metadata } from "next";
import { AppShell } from "@/components/user/app-shell";
import { MaintenanceList } from "@/components/admin/maintenance/maintenance-list";

export const metadata: Metadata = {
  title: "Maintenance Requests - Admin",
};

export default function MaintenancePage() {
  return (
    <AppShell active="/dashboard/admin/maintenance">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-slate-500">Review and assign asset maintenance requests.</p>
        </div>
        
        <div className="card">
          <MaintenanceList />
        </div>
      </div>
    </AppShell>
  );
}
