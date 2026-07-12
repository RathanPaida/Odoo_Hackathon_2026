// app/forgot-password/page.tsx
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we'll send a reset link."
      footer={
        <Link href="/login" className="text-brand-600 hover:underline">
          Back to login
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
