// app/dashboard/manager/categories/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { CategoriesClient } from "@/components/manager/categories-client";

export default function Page() {
  return (
    <AppShell active="/dashboard/manager/categories">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Asset Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Organize assets into categories for better tracking and reporting.</p>
        </div>
        <CategoriesClient />
      </div>
    </AppShell>
  );
}
