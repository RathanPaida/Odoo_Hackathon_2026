// components/auth/verify-email.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, type VerifyEmailInput } from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

type Status = "idle" | "verifying" | "success" | "error";

export function VerifyEmail({
  email: initialEmail = "",
}: {
  token?: string;
  email?: string;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: "", email: initialEmail },
  });

  const onSubmit = async (v: VerifyEmailInput) => {
    setServerError(null);
    setStatus("verifying");
    try {
      await apiFetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(v),
      });
      setStatus("success");
      toast("Email verified!", "success");
    } catch (err: any) {
      setStatus("error");
      setServerError(err.message ?? "Verification failed");
      toast(err.message ?? "Verification failed", "error");
    }
  };

  const onResend = async () => {
    const email = getValues("email");
    if (!email) {
      toast("Enter your email first.", "error");
      return;
    }
    setResending(true);
    setResendMsg(null);
    try {
      await apiFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendMsg("We've sent a new 6-digit code to your inbox.");
      setShowOtp(true);
      toast("Verification code resent.", "success");
    } catch (err: any) {
      toast(err.message ?? "Failed to resend.", "error");
    } finally {
      setResending(false);
    }
  };

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-slate-600">
        <Spinner className="h-6 w-6" />
        Verifying your email…
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          Your email has been verified. You can now sign in.
        </div>
        <Link href="/login" className="btn-primary w-full">Continue to login</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="you@example.com"
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={showOtp}
          onChange={(e) => setShowOtp(e.target.checked)}
        />
        I have a 6-digit code to enter
      </label>

      {showOtp && (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          <div>
            <label className="label" htmlFor="code">6-digit code</label>
            <input
              id="code"
              className="input tracking-[0.5em] text-center text-lg"
              maxLength={6}
              inputMode="numeric"
              placeholder="••••••"
              {...register("code", {
                onChange: (e) => setValue("code", e.target.value.replace(/\D/g, "")),
              })}
            />
            {errors.code && <p className="mt-1 text-xs text-rose-600">{errors.code.message}</p>}
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting && <Spinner />} Verify email
          </button>
        </div>
      )}

      {serverError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={onResend}
          disabled={resending}
        >
          {resending && <Spinner />} Resend verification email
        </button>
        {resendMsg && (
          <p className="text-center text-sm text-emerald-600">{resendMsg}</p>
        )}
      </div>
    </div>
  );
}
