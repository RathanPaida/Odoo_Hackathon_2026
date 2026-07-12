"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { employeeRoleSchema } from "@/validations/admin/org";
import { apiFetch } from "@/hooks/use-api";

type FormValues = z.infer<typeof employeeRoleSchema>;

export function EmployeePromoteDialog({
  employee,
  onSuccess,
  onCancel,
}: {
  employee: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(employeeRoleSchema),
    defaultValues: { role: employee.role },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const response = await apiFetch<any>(`/api/admin/employees/${employee.id}/role`, {
        method: "PATCH",
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
      
      <p className="text-sm text-slate-600 mb-4">
        Change role for <strong>{employee.firstName} {employee.lastName}</strong> ({employee.email}).
      </p>

      <div>
        <label className="block text-sm font-medium text-slate-700">Role</label>
        <select
          {...register("role")}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="DEPARTMENT_HEAD">Department Head</option>
          <option value="ASSET_MANAGER">Asset Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50">
          {isSubmitting ? "Saving..." : "Save Role"}
        </button>
      </div>
    </form>
  );
}
