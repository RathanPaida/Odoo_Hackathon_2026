// lib/services/auth-service.ts
// Core authentication business logic. Reusable, framework-agnostic.
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { sendVerificationEmail, sendPasswordResetEmail, isRealEmailConfigured } from "@/lib/email";
import { generateToken, generateOtp } from "@/lib/utils";
import type { LoginInput, RegisterInput } from "@/validations/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AuthError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      status: "ACTIVE",
      emailVerified: false,
    },
  });

  const verification = await issueVerification(user.id, user.email, input.firstName);
  // In dev (no real email provider) surface the link so the UI can show it.
  const dev =
    !isRealEmailConfigured() && verification
      ? { verifyLink: verification.link, code: verification.code }
      : undefined;
  return { user, dev };
}

// Create a verification token (link + OTP) and email it.
export async function issueVerification(
  userId: string,
  email: string,
  name: string
): Promise<{ link: string; code: string } | null> {
  const token = generateToken(32);
  const code = generateOtp(6);
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
  await prisma.emailVerification.create({
    data: { userId, token, code, expiresAt },
  });
  const link = `${APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  // Email failures should not break the flow (e.g. misconfigured SMTP in dev).
  try {
    await sendVerificationEmail({ to: email, name, link, code });
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }
  return { link, code };
}

export async function loginUser(
  input: LoginInput,
  ctx: { userAgent?: string | null; ip?: string | null }
) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  
  if (!user || user.deletedAt) {
    console.log("LOGIN DEBUG: User not found or deleted", input.email, user);
    throw new AuthError("Invalid email or password.", 401);
  }
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    console.log("LOGIN DEBUG: Password mismatch for", input.email);
    throw new AuthError("Invalid email or password.", 401);
  }
  if (user.status !== "ACTIVE") {
    console.log("LOGIN DEBUG: Account inactive", input.email);
    throw new AuthError("Your account is inactive. Contact support.", 403);
  }
  if (!user.emailVerified) {
    console.log("LOGIN DEBUG: Email not verified", input.email);
    throw new AuthError("Please verify your email before logging in.", 403);
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    userAgent: ctx.userAgent,
    ip: ctx.ip,
    remember: input.remember,
  });
  return user;
}

export async function verifyEmail(input: {
  token?: string;
  code?: string;
  email?: string;
}) {
  let record = null as null | {
    id: string;
    userId: string;
    usedAt: Date | null;
    expiresAt: Date;
  };

  if (input.token) {
    record = await prisma.emailVerification.findUnique({
      where: { token: input.token },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });
  } else if (input.code && input.email) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (user) {
      record = await prisma.emailVerification.findFirst({
        where: { userId: user.id, code: input.code },
        orderBy: { createdAt: "desc" },
        select: { id: true, userId: true, usedAt: true, expiresAt: true },
      });
    }
  }

  if (!record) throw new AuthError("Invalid verification token.", 400);
  if (record.usedAt) throw new AuthError("Token already used.", 400);
  if (record.expiresAt < new Date())
    throw new AuthError("Verification token expired.", 400);

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, status: "ACTIVE" },
    }),
  ]);
  return true;
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AuthError("No account found.", 404);
  if (user.emailVerified)
    throw new AuthError("Email already verified.", 400);
  const verification = await issueVerification(
    user.id,
    user.email,
    user.firstName ?? "there"
  );
  const dev =
    !isRealEmailConfigured() && verification
      ? { verifyLink: verification.link, code: verification.code }
      : undefined;
  return { ok: true, dev };
}

export async function forgotPassword(
  email: string
): Promise<{ sent: boolean; devResetLink?: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Avoid enumeration: only send if account exists.
  if (!user) return { sent: false };
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });
  const link = `${APP_URL}/reset-password?token=${token}`;
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.firstName ?? "there",
      link,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }
  return {
    sent: true,
    devResetLink: isRealEmailConfigured() ? undefined : link,
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordReset.findUnique({ where: { token } });
  if (!record) throw new AuthError("Invalid reset token.", 400);
  if (record.usedAt) throw new AuthError("Token already used.", 400);
  if (record.expiresAt < new Date())
    throw new AuthError("Reset token expired.", 400);

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    // Log out all devices after a password reset for safety.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId },
      data: { revokedAt: new Date() },
    }),
  ]);
  return true;
}

export { AuthError };
