import { Metadata } from "next";
import { AppShell } from "@/components/user/app-shell";
import { AssetList } from "@/components/admin/assets/asset-list";

export const metadata: Metadata = {
  title: "Asset Management - Admin",
};

export default function AssetsPage() {
  return (
    <AppShell active="/dashboard/admin/assets">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-slate-500">Register new assets and generate QR codes.</p>
        </div>
        
        <div className="card">
          <AssetList />
        </div>
      </div>
    </AppShell>
  );
}
