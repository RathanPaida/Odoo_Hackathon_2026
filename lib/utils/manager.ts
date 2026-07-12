// lib/utils/manager.ts
// Small, dependency-free helpers for the Asset Manager Module.
import { cn as baseCn } from "@/lib/utils";
import type { BookingStatus } from "@/types/manager";
import { jsonResponse } from "@/lib/request";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const cn = baseCn;

export async function parseBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      data: null,
      error: jsonResponse({ ok: false, message: "Invalid JSON body." }, 400),
    };
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

export function paginate(page: number, pageSize: number) {
  const p = Math.max(1, page);
  const size = Math.max(1, pageSize);
  return { skip: (p - 1) * size, take: size, page: p, pageSize: size };
}

export function totalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "\u2014";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "\u2014";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function fromNow(value: string | Date) {
  const diff = Date.now() - new Date(value).getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60)
    return `${mins}m ${diff < 0 ? "from now" : "ago"}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)
    return `${hrs}h ${diff < 0 ? "from now" : "ago"}`;
  const days = Math.round(hrs / 24);
  if (days < 30)
    return `${days}d ${diff < 0 ? "from now" : "ago"}`;
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

export function deriveBookingStatus(
  stored: string,
  startTime: string | Date,
  endTime: string | Date
): BookingStatus {
  if (stored === "CANCELLED") return "CANCELLED";
  if (stored === "COMPLETED") return "COMPLETED";
  const now = Date.now();
  if (
    now >= new Date(startTime).getTime() &&
    now <= new Date(endTime).getTime()
  ) {
    return "CURRENT";
  }
  return "UPCOMING";
}
