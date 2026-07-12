// app/reset-password/page.tsx
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new, strong password."
    >
      {token ? (
        <ResetForm token={token} />
      ) : (
        <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
          Missing or invalid reset token. Request a new link from the
          forgot-password page.
        </div>
      )}
    </AuthShell>
  );
}
