// components/auth/register-form.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DevInfo {
  verifyLink?: string;
  code?: string;
}

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [dev, setDev] = useState<DevInfo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", firstName: "", lastName: "", remember: false },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      const res = await apiFetch<{ dev?: DevInfo }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast("Account created! Verify your email to continue.", "success");
      if (res.data?.dev) setDev(res.data.dev);
      else router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err: any) {
      toast(err.message ?? "Registration failed", "error");
    }
  };

  if (dev) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          Account created.{" "}
          {dev.code ? (
            <>
              Your verification code is <span className="font-mono font-semibold">{dev.code}</span>.
            </>
          ) : (
            "Verify your email to finish."
          )}
        </div>
        {dev.verifyLink && (
          <Link href={dev.verifyLink} className="btn-primary w-full">
            Verify email
          </Link>
        )}
        <Link href="/login" className="block text-center text-sm text-brand-600 hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="firstName">First name</label>
          <input id="firstName" className="input" {...register("firstName")} />
          {errors.firstName && <p className="mt-1 text-xs text-rose-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="lastName">Last name</label>
          <input id="lastName" className="input" {...register("lastName")} />
          {errors.lastName && <p className="mt-1 text-xs text-rose-600">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" className="input" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="new-password" className="input" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
        <p className="mt-1 text-xs text-slate-400">
          Min 8 chars, with uppercase, lowercase, number & symbol.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="h-4 w-4" {...register("remember")} />
        Remember me
      </label>
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Create account
      </button>
    </form>
  );
}
