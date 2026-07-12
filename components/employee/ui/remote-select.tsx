// components/employee/ui/remote-select.tsx
"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/hooks/use-api";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/employee";

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

export function RemoteSelect({
  url,
  value,
  onChange,
  placeholder = "Select…",
  loadOnMount = true,
  valueKey = "id",
  labelKey,
  sublabelKey,
}: {
  url: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loadOnMount?: boolean;
  valueKey?: string;
  labelKey?: string;
  sublabelKey?: string;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { data: any[] } }>(url);
      const rows = (res.data?.data?.data ?? res.data?.data) ?? [];
      setOptions(
        rows.map((r: any) => ({
          value: r[valueKey],
          label: labelKey ? String(r[labelKey]) : ((r.name ?? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()) || r.email),
          sublabel: sublabelKey ? String(r[sublabelKey]) : r.assetTag ? `${r.assetTag} · ${r.categoryName ?? ""}` : r.email,
        }))
      );
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loadOnMount) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <select
        className={cn("input", loading && "opacity-70")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? "Loading…" : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.sublabel ? ` — ${o.sublabel}` : ""}
          </option>
        ))}
      </select>
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <Spinner />
        </span>
      )}
    </div>
  );
}
