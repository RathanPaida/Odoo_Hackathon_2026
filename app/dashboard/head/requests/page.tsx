// app/dashboard/head/requests/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { RequestsList } from "@/components/head/requests-list";

export default function HeadRequestsPage() {
  return (
    <AppShell active="/dashboard/head/requests">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Approve Department Requests</h1>
        <RequestsList />
      </div>
    </AppShell>
  );
}
