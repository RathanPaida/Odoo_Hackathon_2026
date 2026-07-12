"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

type Booking = {
  id: string;
  assetId: string;
  assetName: string;
  startTime: string;
  endTime: string;
  status: string;
};

// Mock data
const mockBookings: Booking[] = [
  { id: "1", assetId: "a1", assetName: "Conference Room A", startTime: "2026-07-13T09:00:00Z", endTime: "2026-07-13T10:00:00Z", status: "UPCOMING" },
  { id: "2", assetId: "a2", assetName: "Projector X", startTime: "2026-07-13T11:00:00Z", endTime: "2026-07-13T14:00:00Z", status: "ONGOING" },
];

export function BookingCalendar() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const handleBook = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const assetId = formData.get("assetId") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    // Basic frontend overlap validation
    const hasOverlap = bookings.some(b => 
      b.assetId === assetId &&
      ((startTime >= b.startTime && startTime < b.endTime) ||
       (endTime > b.startTime && endTime <= b.endTime) ||
       (startTime <= b.startTime && endTime >= b.endTime))
    );

    if (hasOverlap) {
      toast("This time slot overlaps with an existing booking.", "error");
      return;
    }

    const newBooking = {
      id: Math.random().toString(),
      assetId,
      assetName: assetId === "a1" ? "Conference Room A" : "Projector X",
      startTime,
      endTime,
      status: "UPCOMING"
    };

    setBookings([...bookings, newBooking]);
    toast("Resource booked successfully.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6 flex-col md:flex-row">
        {/* Booking Form */}
        <div className="card w-full md:w-1/3">
          <h3 className="text-lg font-semibold mb-4">Book Resource</h3>
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Resource</label>
              <select name="assetId" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm">
                <option value="a1">Conference Room A</option>
                <option value="a2">Projector X</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Time</label>
              <input type="datetime-local" name="startTime" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">End Time</label>
              <input type="datetime-local" name="endTime" required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm" />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
              Book Slot
            </button>
          </form>
        </div>

        {/* Calendar View */}
        <div className="card w-full md:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Schedule</h3>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="rounded-md border-slate-300 text-sm focus:ring-brand-500 focus:border-brand-500" 
            />
          </div>
          <div className="space-y-3">
            {bookings
              .filter(b => b.startTime.startsWith(date))
              .map(b => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{b.assetName}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${b.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : ''}
                    ${b.status === 'ONGOING' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {b.status.toLowerCase()}
                  </span>
                </div>
              ))}
            {bookings.filter(b => b.startTime.startsWith(date)).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No bookings for this date.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
