// app/dashboard/manager/transfers/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { TransfersClient } from "@/components/manager/transfers-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/manager/transfers">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Transfer Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Review and approve asset transfer requests from employees.</p>
        </div>
        <TransfersClient />
      </div>
    </AppShell>
  );
}
