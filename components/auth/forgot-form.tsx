// components/auth/forgot-form.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

export function ForgotForm() {
  const { toast } = useToast();
  const [devLink, setDevLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      const res = await apiFetch<{
        message: string;
        devResetLink?: string;
      }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast(res.data?.message ?? "Reset link sent.", "success");
      if (res.data?.devResetLink) setDevLink(res.data.devResetLink);
    } catch (err: any) {
      toast(err.message ?? "Request failed", "error");
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          If an account exists, a reset link has been sent. Check your inbox.
        </div>
        {devLink && (
          <a href={devLink} className="btn-primary w-full">
            Open reset link (dev mode)
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Send reset link
      </button>
    </form>
  );
}