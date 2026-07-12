// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

// Merge Tailwind classes safely.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a Date to a readable string.
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

// Initials for avatar fallback.
export function initials(first?: string | null, last?: string | null) {
  const a = (first?.[0] ?? "").toUpperCase();
  const b = (last?.[0] ?? "").toUpperCase();
  return (a + b) || "?";
}

// Generate a random numeric OTP of given length.
export function generateOtp(length = 6) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Generate a cryptographically random token (url-safe).
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

// SHA-256 hash (used to store refresh token hashes).
export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
