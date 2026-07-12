// app/dashboard/head/page.tsx
import { AppShell } from "@/components/user/app-shell";

export default function HeadDashboardPage() {
  return (
    <AppShell active="/dashboard/head">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Department Overview</h1>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <h3 className="text-sm font-medium text-slate-500">Total Department Assets</h3>
            <p className="mt-2 text-3xl font-bold">--</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-slate-500">Pending Requests</h3>
            <p className="mt-2 text-3xl font-bold">--</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-slate-500">Active Bookings</h3>
            <p className="mt-2 text-3xl font-bold">--</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
