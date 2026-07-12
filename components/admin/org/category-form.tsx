"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { categorySchema } from "@/validations/admin/org";
import { apiFetch } from "@/hooks/use-api";
import clsx from "clsx";

type FormValues = z.infer<typeof categorySchema>;

export function CategoryForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const url = initialData ? `/api/admin/categories/${initialData.id}` : `/api/admin/categories`;
      const method = initialData ? "PATCH" : "POST";
      
      const response = await apiFetch<any>(url, {
        method,
        body: JSON.stringify(data),
      });



      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input
          {...register("name")}
          className={clsx("mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500", errors.name && "border-red-500")}
          placeholder="e.g., Electronics"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          {...register("description")}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700">Custom Fields (JSON)</label>
        <textarea
          {...register("customFields")}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm font-mono text-sm"
          placeholder={'{"warranty": "12 months"}'}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50">
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
