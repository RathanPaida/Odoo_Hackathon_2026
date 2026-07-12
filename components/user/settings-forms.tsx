// components/user/settings-forms.tsx
"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changeEmailSchema,
  deleteAccountSchema,
  type ChangeEmailInput,
  type DeleteAccountInput,
} from "@/validations/user";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/validations/auth";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export function SettingsForms() {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <ChangeEmailCard />
      <DeleteAccountCard />
    </div>
  );
}

function ChangePasswordCard() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (v: ChangePasswordInput) => {
    try {
      await apiFetch("/api/user/change-password", {
        method: "POST",
        body: JSON.stringify(v),
      });
      toast("Password changed.", "success");
      reset();
    } catch (err: any) {
      toast(err.message ?? "Failed", "error");
    }
  };

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <PasswordField label="Current password" id="currentPassword" register={register} error={errors.currentPassword?.message} />
        <PasswordField label="New password" id="newPassword" register={register} error={errors.newPassword?.message} />
        <PasswordField label="Confirm new password" id="confirmPassword" register={register} error={errors.confirmPassword?.message} />
        <button className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Update password
        </button>
      </form>
    </section>
  );
}

function ChangeEmailCard() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (v: ChangeEmailInput) => {
    try {
      await apiFetch("/api/user/change-email", {
        method: "POST",
        body: JSON.stringify(v),
      });
      toast("Email updated. Please verify your new address.", "success");
    } catch (err: any) {
      toast(err.message ?? "Failed", "error");
    }
  };

  return (
    <section className="card">
      <h2 className="text-lg font-semibold">Change email</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">New email</label>
          <input id="email" type="email" className="input" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
        </div>
        <PasswordField label="Confirm with password" id="password" register={register} error={errors.password?.message} />
        <button className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Update email
        </button>
      </form>
    </section>
  );
}

function DeleteAccountCard() {
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = async (v: DeleteAccountInput) => {
    try {
      await apiFetch("/api/user/delete", {
        method: "DELETE",
        body: JSON.stringify(v),
      });
      toast("Account deleted.", "success");
      router.push("/register");
    } catch (err: any) {
      toast(err.message ?? "Failed", "error");
    }
  };

  return (
    <section className="card border-rose-200">
      <h2 className="text-lg font-semibold text-rose-700">Delete account</h2>
      <p className="mt-1 text-sm text-slate-500">
        Permanently remove your account and all associated data. This cannot be undone.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="del-password">Password</label>
          <input id="del-password" type="password" className="input" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="confirm-text">Type <span className="font-mono">DELETE</span> to confirm</label>
          <input id="confirm-text" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn-danger" disabled={isSubmitting || confirm !== "DELETE"}>
          {isSubmitting && <Spinner />} Delete my account
        </button>
      </form>
    </section>
  );
}

// Small reusable password field to reduce repetition.
function PasswordField({
  label,
  id,
  register,
  error,
}: {
  label: string;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} type="password" className="input" {...register(id)} />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
