// app/dashboard/admin/activity/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { AdminActivityClient } from "@/components/admin/activity-client";

export default function AdminActivityPage() {
  return (
    <AppShell active="/dashboard/admin/activity">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Activity Logs</h1>
          <p className="mt-1 text-sm text-slate-500">System-wide activity across all users and modules.</p>
        </div>
        <AdminActivityClient />
      </div>
    </AppShell>
  );
}
