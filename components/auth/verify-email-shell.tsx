// components/auth/verify-email-shell.tsx
import { VerifyEmail } from "@/components/auth/verify-email";

export function VerifyEmailShell({
  email,
}: {
  token?: string;
  email?: string;
}) {
  return <VerifyEmail email={email} />;
}
