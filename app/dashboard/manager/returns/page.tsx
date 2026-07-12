// app/dashboard/manager/returns/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { ReturnsClient } from "@/components/manager/returns-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/manager/returns">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Return Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review and process asset return requests from employees.</p>
        </div>
        <ReturnsClient />
      </div>
    </AppShell>
  );
}
