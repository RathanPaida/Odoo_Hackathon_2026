// lib/auth/password.ts
// Password hashing + strength validation helpers.
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Minimum password policy (mirrored in Zod schemas).
export const PASSWORD_MIN_LENGTH = 8;

export function isStrongPassword(pw: string): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (pw.length < PASSWORD_MIN_LENGTH)
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  if (!/[A-Z]/.test(pw)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(pw)) errors.push("One number");
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push("One special character");
  return { ok: errors.length === 0, errors };
}
