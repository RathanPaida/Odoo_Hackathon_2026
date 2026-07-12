// app/dashboard/manager/assets/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { AssetsClient } from "@/components/manager/assets-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/manager/assets">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Asset Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all organizational assets, assign holders, and track status.</p>
        </div>
        <AssetsClient />
      </div>
    </AppShell>
  );
}
