// app/dashboard/employee/returns/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { ReturnsClient } from "@/components/employee/returns-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/employee/returns">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Return Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Return an allocated asset to your organization.</p>
        </div>
        <ReturnsClient />
      </div>
    </AppShell>
  );
}
