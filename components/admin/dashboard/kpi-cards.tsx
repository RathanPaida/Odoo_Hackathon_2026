"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/hooks/use-api";

export function KPICards() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKPIs() {
      try {
        const res = await apiFetch<any>("/api/admin/dashboard/kpis");
        if (res.ok && res.data?.data) setKpis(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadKPIs();
  }, []);

  if (loading) return <div>Loading metrics...</div>;
  if (!kpis) return null;

  const stats = [
    { label: "Total Assets", value: kpis.totalAssets, href: "/dashboard/admin/assets", color: "text-slate-900" },
    { label: "Assets Available", value: kpis.assetsAvailable, href: "/dashboard/admin/assets", color: "text-emerald-600" },
    { label: "Assets Allocated", value: kpis.assetsAllocated, href: "/dashboard/admin/assets", color: "text-blue-600" },
    { label: "Pending Maintenance", value: kpis.maintenancePending, href: "/dashboard/admin/maintenance", color: "text-rose-600" },
    { label: "Pending Transfers", value: kpis.pendingTransfers, href: "/dashboard/admin/transfers", color: "text-amber-600" },
    { label: "Employees", value: kpis.totalEmployees, href: "/dashboard/admin/org/departments", color: "text-slate-900" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <Link key={i} href={stat.href} className="card p-6 flex flex-col justify-center items-center text-center transition hover:border-brand-300 hover:shadow-md">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
          <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
        </Link>
      ))}
    </div>
  );
}
