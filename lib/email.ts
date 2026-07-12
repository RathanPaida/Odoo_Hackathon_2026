// lib/email.ts
// Email sending via Resend (API) or SMTP (nodemailer). Provider selected by
// EMAIL_PROVIDER env var. Falls back to console logging in dev if not set.
import nodemailer from "nodemailer";
import {
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} from "@/lib/email/templates";

const from = process.env.EMAIL_FROM ?? "OodoPrep <noreply@example.com>";

// Hosts that should NOT be treated as real SMTP configuration.
const PLACEHOLDER_HOSTS = ["smtp.example.com", ""];
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

// True only when a real, usable email provider is configured.
export function isRealEmailConfigured(): boolean {
  const provider = process.env.EMAIL_PROVIDER ?? "smtp";
  if (provider === "resend") return Boolean(process.env.RESEND_API_KEY);
  if (provider === "smtp") {
    const host = process.env.SMTP_HOST ?? "";
    if (PLACEHOLDER_HOSTS.includes(host)) return false;
    // Local dev SMTP (e.g. our mailbox sink) is valid without auth.
    if (LOCAL_HOSTS.includes(host)) return true;
    return Boolean(process.env.SMTP_USER);
  }
  return false;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const provider = process.env.EMAIL_PROVIDER ?? "smtp";

  // Dev / no real config: log to console so flows still work locally.
  if (!isRealEmailConfigured()) {
    console.log(
      `\n[email:${provider}] -> ${opts.to}\nSubject: ${opts.subject}\n${opts.text ?? ""}\n`
    );
    return { ok: true, dev: true };
  }

  if (provider === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
    return { ok: true };
  }

  // SMTP
  await getTransporter().sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return { ok: true };
}

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  link: string;
  code?: string;
}) {
  const html = verificationEmailTemplate(opts);
  await sendEmail({
    to: opts.to,
    subject: "Verify your email - OodoPrep",
    html,
    text: opts.code
      ? `Your verification code is ${opts.code}`
      : `Verify your email: ${opts.link}`,
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  link: string;
}) {
  const html = resetPasswordEmailTemplate(opts);
  await sendEmail({
    to: opts.to,
    subject: "Reset your password - OodoPrep",
    html,
    text: `Reset your password: ${opts.link}`,
  });
}
