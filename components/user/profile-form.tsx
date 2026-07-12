// components/user/profile-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/validations/user";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import type { PublicUser } from "@/types";

export function ProfileForm({ user }: { user: PublicUser }) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  const onSubmit = async (values: UpdateProfileInput) => {
    try {
      await apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      toast("Profile updated.", "success");
    } catch (err: any) {
      toast(err.message ?? "Update failed", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="label">Email (verified: {user.emailVerified ? "yes" : "no"})</label>
        <input className="input bg-slate-50" value={user.email} disabled />
      </div>
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
        <label className="label" htmlFor="avatarUrl">Avatar URL</label>
        <input id="avatarUrl" className="input" placeholder="https://…" {...register("avatarUrl")} />
        {errors.avatarUrl && <p className="mt-1 text-xs text-rose-600">{errors.avatarUrl.message}</p>}
      </div>
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting && <Spinner />} Save changes
      </button>
    </form>
  );
}
