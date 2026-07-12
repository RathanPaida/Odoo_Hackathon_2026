// components/auth/login-form.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [showResend, setShowResend] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast("Welcome back!", "success");
      const redirect = params.get("redirect") || "/dashboard";
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      // If the account exists but isn't verified, surface the resend option.
      if (err?.message?.toLowerCase().includes("verify")) {
        setShowResend(true);
      }
      toast(err.message ?? "Login failed", "error");
    }
  };

  if (showResend) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
          Your email isn&apos;t verified yet. Resend the verification email below,
          then use the link or code to activate your account.
        </div>
        <ResendVerificationForm />
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => setShowResend(false)}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" className="input" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="password">Password</label>
          <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
            Forgot?
          </Link>
        </div>
        <input id="password" type="password" autoComplete="current-password" className="input" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4" {...register("remember")} />
        Remember me
      </label>
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Sign in
      </button>
      <button
        type="button"
        className="w-full text-center text-xs text-slate-500 hover:underline"
        onClick={() => setShowResend(true)}
      >
        Didn&apos;t verify your email? Resend
      </button>
    </form>
  );
}
