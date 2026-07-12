import { Metadata } from "next";
import { OrgTabs } from "@/components/admin/org/org-tabs";
import { EmployeeDirectory } from "@/components/admin/org/employee-directory";
import { AppShell } from "@/components/user/app-shell";

export const metadata: Metadata = {
  title: "Employees - Org Setup",
};

export default function EmployeesPage() {
  return (
    <AppShell active="/dashboard/admin/org/departments">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Setup</h1>
          <p className="text-slate-500">Manage your company's departments, categories, and employees.</p>
        </div>
        
        <OrgTabs />
        
        <div className="card p-6">
          <EmployeeDirectory />
        </div>
      </div>
    </AppShell>
  );
}
