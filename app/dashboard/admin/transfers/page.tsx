import { Metadata } from "next";
import { AppShell } from "@/components/user/app-shell";
import { TransferList } from "@/components/admin/transfers/transfer-list";

export const metadata: Metadata = {
  title: "Transfer Requests - Admin",
};

export default function TransfersPage() {
  return (
    <AppShell active="/dashboard/admin/transfers">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Requests</h1>
          <p className="text-slate-500">Review and approve employee asset transfer requests.</p>
        </div>
        
        <div className="card">
          <TransferList />
        </div>
      </div>
    </AppShell>
  );
}
