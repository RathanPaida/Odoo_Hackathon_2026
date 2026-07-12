// components/auth/resend-verification-form.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendVerificationSchema, type ResendVerificationInput } from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

export function ResendVerificationForm() {
  const { toast } = useToast();
  const [dev, setDev] = useState<{ verifyLink?: string; code?: string } | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResendVerificationInput) => {
    try {
      const res = await apiFetch<{ dev?: { verifyLink?: string; code?: string } }>(
        "/api/auth/resend-verification",
        { method: "POST", body: JSON.stringify(values) }
      );
      toast("Verification email sent. Check your inbox.", "success");
      setDone(true);
      if (res.data?.dev) setDev(res.data.dev);
    } catch (err: any) {
      toast(err.message ?? "Failed to resend.", "error");
    }
  };

  if (done && dev?.verifyLink) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          {dev.code ? (
            <>Your new verification code is <span className="font-mono font-semibold">{dev.code}</span>.</>
          ) : (
            "A new verification email has been sent."
          )}
        </div>
        <a href={dev.verifyLink} className="btn-primary w-full">
          Verify email
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="resend-email">Email</label>
        <input id="resend-email" type="email" className="input" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Resend verification email
      </button>
    </form>
  );
}
