// app/dashboard/manager/bookings/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { BookingsClient } from "@/components/manager/bookings-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/manager/bookings">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Resource Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage all resource bookings across the organization.</p>
        </div>
        <BookingsClient />
      </div>
    </AppShell>
  );
}
