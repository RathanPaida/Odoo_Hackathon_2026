import { Metadata } from "next";
import { AppShell } from "@/components/user/app-shell";
import { AuditList } from "@/components/admin/audits/audit-list";

export const metadata: Metadata = {
  title: "Audit Cycles - Admin",
};

export default function AuditsPage() {
  return (
    <AppShell active="/dashboard/admin/audits">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Cycles</h1>
          <p className="text-slate-500">Manage and track inventory audit cycles.</p>
        </div>
        
        <div className="card">
          <AuditList />
        </div>
      </div>
    </AppShell>
  );
}
