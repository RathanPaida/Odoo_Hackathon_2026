// app/dashboard/employee/notifications/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { NotificationsClient } from "@/components/employee/notifications-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/employee/notifications">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Stay updated on your assets and requests.</p>
        </div>
        <NotificationsClient />
      </div>
    </AppShell>
  );
}
