// app/dashboard/employee/activity/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { ActivityClient } from "@/components/employee/activity-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/employee/activity">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Activity Timeline</h1>
          <p className="mt-1 text-sm text-slate-500">Your complete activity across the ERP, newest first.</p>
        </div>
        <ActivityClient />
      </div>
    </AppShell>
  );
}
