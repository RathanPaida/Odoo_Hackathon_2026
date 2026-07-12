"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function OrgTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: "Departments", href: "/dashboard/admin/org/departments" },
    { name: "Categories", href: "/dashboard/admin/org/categories" },
    { name: "Employees", href: "/dashboard/admin/org/employees" },
  ];

  return (
    <div className="tabs mb-6 border-b border-slate-200 flex gap-4">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
