// components/employee/ui/calendar.tsx
"use client";
import { useState } from "react";
import type { ResourceBookingDto } from "@/types/employee";
import { cn, formatRange } from "@/lib/utils/employee";
import { BOOKING_BADGE } from "@/lib/constants/employee";
import { BookingBadge } from "@/components/employee/ui/badges";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function BookingCalendar({
  bookings,
  onSelect,
}: {
  bookings: ResourceBookingDto[];
  onSelect?: (booking: ResourceBookingDto) => void;
}) {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const bookingsByDay = (day: Date) =>
    bookings.filter((b) => {
      const s = new Date(b.startTime);
      return sameDay(s, day);
    });

  const selectedBookings = selected
    ? bookings.filter((b) => sameDay(new Date(b.startTime), selected))
    : [];

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_280px]">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-secondary px-3 py-1.5" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            ‹
          </button>
          <h3 className="text-sm font-semibold text-slate-700">{monthLabel}</h3>
          <button className="btn-secondary px-3 py-1.5" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayBookings = bookingsByDay(day);
            const isSelected = selected && sameDay(day, selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(day)}
                className={cn(
                  "flex h-16 flex-col rounded-lg border p-1 text-left text-xs transition",
                  isSelected
                    ? "border-brand-400 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50",
                  sameDay(day, new Date()) && "ring-1 ring-brand-200"
                )}
              >
                <span className="font-semibold text-slate-700">{day.getDate()}</span>
                {dayBookings.slice(0, 2).map((b) => (
                  <span
                    key={b.id}
                    className={cn("mt-0.5 truncate rounded px-1 text-[10px] text-white", BOOKING_BADGE[b.status].split(" ")[0])}
                  >
                    {b.assetName}
                  </span>
                ))}
                {dayBookings.length > 2 && (
                  <span className="text-[10px] text-slate-400">+{dayBookings.length - 2} more</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          {selected ? selected.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Selected day"}
        </h3>
        {selectedBookings.length === 0 ? (
          <p className="text-sm text-slate-400">No bookings this day.</p>
        ) : (
          <ul className="space-y-2">
            {selectedBookings.map((b) => (
              <li
                key={b.id}
                onClick={() => onSelect?.(b)}
                className="cursor-pointer rounded-lg border border-slate-100 bg-white p-3 hover:border-brand-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{b.assetName}</span>
                  <BookingBadge status={b.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatRange(b.startTime, b.endTime)}</p>
                {b.purpose && <p className="text-xs text-slate-400">{b.purpose}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
