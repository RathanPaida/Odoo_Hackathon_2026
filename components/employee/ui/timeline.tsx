// components/employee/ui/timeline.tsx
// Vertical timeline used by activity + asset history views.
import { cn } from "@/lib/utils/employee";
import { formatDateTime } from "@/lib/utils/employee";

export interface TimelineEntry {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  timestamp?: string | null;
  icon?: string;
  tone?: "brand" | "emerald" | "amber" | "rose" | "slate";
}

const TONES: Record<string, string> = {
  brand: "bg-brand-100 text-brand-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};

export function Timeline({ items }: { items: TimelineEntry[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">No activity recorded yet.</p>;
  }
  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-6">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span
            className={cn(
              "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full text-xs",
              TONES[it.tone ?? "slate"]
            )}
          >
            {it.icon ?? "•"}
          </span>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{it.title}</p>
              {it.timestamp && (
                <span className="text-xs text-slate-400">{formatDateTime(it.timestamp)}</span>
              )}
            </div>
            {it.subtitle && <p className="text-xs text-slate-500">{it.subtitle}</p>}
            {it.description && (
              <p className="mt-1 text-sm text-slate-600">{it.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
