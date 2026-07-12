import { Metadata } from "next";
import { OrgTabs } from "@/components/admin/org/org-tabs";
import { DepartmentList } from "@/components/admin/org/department-list";
import { AppShell } from "@/components/user/app-shell";

export const metadata: Metadata = {
  title: "Departments - Org Setup",
};

export default function DepartmentsPage() {
  return (
    <AppShell active="/dashboard/admin/org/departments">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Setup</h1>
          <p className="text-slate-500">Manage your company's departments, categories, and employees.</p>
        </div>
        
        <OrgTabs />
        
        <div className="card p-6">
          <DepartmentList />
        </div>
      </div>
    </AppShell>
  );
}
