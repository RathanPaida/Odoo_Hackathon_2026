// app/dashboard/head/assets/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { AssetsTable } from "@/components/head/assets-table";

export default function HeadAssetsPage() {
  return (
    <AppShell active="/dashboard/head/assets">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Department Assets</h1>
        <AssetsTable />
      </div>
    </AppShell>
  );
}
