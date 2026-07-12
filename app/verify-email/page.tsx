// app/verify-email/page.tsx
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailShell } from "@/components/auth/verify-email-shell";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your inbox."
    >
      <VerifyEmailShell token={token} email={email} />
    </AuthShell>
  );
}
