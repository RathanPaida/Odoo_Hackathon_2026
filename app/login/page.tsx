// app/login/page.tsx
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to OodoPrep"
      subtitle="Welcome back. Enter your details below."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-600 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="py-4 text-center text-sm text-slate-400">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
