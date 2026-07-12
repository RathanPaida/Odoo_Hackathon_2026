// app/dashboard/head/booking/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { BookingCalendar } from "@/components/head/booking-calendar";

export default function HeadBookingPage() {
  return (
    <AppShell active="/dashboard/head/booking">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Resource Booking</h1>
        <BookingCalendar />
      </div>
    </AppShell>
  );
}
