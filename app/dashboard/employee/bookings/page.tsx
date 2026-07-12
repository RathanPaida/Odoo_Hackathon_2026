// app/dashboard/employee/bookings/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { BookingsClient } from "@/components/employee/bookings-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/employee/bookings">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Resource Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">Book shared resources and manage your reservations.</p>
        </div>
        <BookingsClient />
      </div>
    </AppShell>
  );
}
