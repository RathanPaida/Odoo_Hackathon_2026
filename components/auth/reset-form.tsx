// components/auth/reset-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ResetForm({ token }: { token: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast("Password reset. Please log in.", "success");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      toast(err.message ?? "Reset failed", "error");
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
        Password updated. Redirecting to login…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register("token")} />
      <div>
        <label className="label" htmlFor="password">New password</label>
        <input id="password" type="password" autoComplete="new-password" className="input" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" type="password" autoComplete="new-password" className="input" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Reset password
      </button>
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-brand-600 hover:underline">Back to login</Link>
      </p>
    </form>
  );
}
