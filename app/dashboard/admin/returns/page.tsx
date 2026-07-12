import { Metadata } from "next";
import { AppShell } from "@/components/user/app-shell";
import { ReturnList } from "@/components/admin/returns/return-list";

export const metadata: Metadata = {
  title: "Return Requests - Admin",
};

export default function ReturnsPage() {
  return (
    <AppShell active="/dashboard/admin/returns">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Return Requests</h1>
          <p className="text-slate-500">Review and approve employee asset return requests.</p>
        </div>
        
        <div className="card">
          <ReturnList />
        </div>
      </div>
    </AppShell>
  );
}
