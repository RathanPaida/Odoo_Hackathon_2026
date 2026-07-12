// lib/utils/employee.ts
// Small, dependency-free helpers for the Employee Module.
import { cn as baseCn } from "@/lib/utils";
import type { BookingStatus } from "@/types/employee";
import { jsonResponse } from "@/lib/request";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const cn = baseCn;

// Parse + validate a JSON request body with a Zod schema.
// Returns the parsed data, or a Response you can return directly on failure.
export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { data: null, error: jsonResponse({ ok: false, message: "Invalid JSON body." }, 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      data: null,
      error: jsonResponse(
        {
          ok: false,
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        422
      ),
    };
  }
  return { data: parsed.data, error: null };
}

// Build a paginated query object from page/pageSize numbers.
export function pageMeta(page: number, pageSize: number) {
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

// Build a Prisma-style pagination skip/take from page/pageSize.
export function paginate(page: number, pageSize: number) {
  const p = Math.max(1, page);
  const size = Math.max(1, pageSize);
  return { skip: (p - 1) * size, take: size, page: p, pageSize: size };
}

export function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

// Format a date range explicitly.
export function formatRange(start: string | Date, end: string | Date) {
  const s = new Date(start);
  const e = new Date(end);
  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  return `${s.toLocaleString("en-US", dateOpts)} ${s.toLocaleTimeString(
    "en-US",
    timeOpts
  )} – ${e.toLocaleTimeString("en-US", timeOpts)}`;
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export function fromNow(value: string | Date) {
  const diff = Date.now() - new Date(value).getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ${diff < 0 ? "from now" : "ago"}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ${diff < 0 ? "from now" : "ago"}`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ${diff < 0 ? "from now" : "ago"}`;
  return formatDate(value);
}

export function fullName(
  first: string | null | undefined,
  last: string | null | undefined,
  fallback = "Unknown"
) {
  const n = `${first ?? ""} ${last ?? ""}`.trim();
  return n || fallback;
}

// Derive a booking's logical status, treating CURRENT as a time-derived state.
export function deriveBookingStatus(
  stored: string,
  startTime: string | Date,
  endTime: string | Date
): BookingStatus {
  if (stored === "CANCELLED") return "CANCELLED";
  if (stored === "COMPLETED") return "COMPLETED";
  const now = Date.now();
  if (now >= new Date(startTime).getTime() && now <= new Date(endTime).getTime()) {
    return "CURRENT";
  }
  return "UPCOMING";
}

// True when two time ranges [aStart,aEnd] and [bStart,bEnd] overlap.
export function rangesOverlap(
  aStart: string | Date,
  aEnd: string | Date,
  bStart: string | Date,
  bEnd: string | Date
) {
  const as = new Date(aStart).getTime();
  const ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime();
  const be = new Date(bEnd).getTime();
  return as < be && bs < ae;
}
