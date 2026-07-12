import { Metadata } from "next";
import { KPICards } from "@/components/admin/dashboard/kpi-cards";
import Link from "next/link";
import { AppShell } from "@/components/user/app-shell";

export const metadata: Metadata = {
  title: "Admin Dashboard - AssetFlow",
};

export default function AdminDashboardPage() {
  return (
    <AppShell active="/dashboard/admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500">Overview of system metrics and quick actions.</p>
        </div>
        
        <KPICards />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/admin/org/departments" className="p-3 border rounded hover:bg-slate-50 text-center font-medium text-brand-700 transition">
                Manage Organization
              </Link>
              <Link href="/dashboard/admin/activity" className="p-3 border rounded hover:bg-slate-50 text-center font-medium text-brand-700 transition">
                View Activity Logs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
