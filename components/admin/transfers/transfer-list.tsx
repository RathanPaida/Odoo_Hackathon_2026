"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";

export function TransferList() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/admin/transfers");
      if (res.ok && res.data?.data) setTransfers(res.data.data);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string, status: "APPROVED" | "REJECTED") {
    try {
      const res = await apiFetch(`/api/admin/transfers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast(`Transfer ${status.toLowerCase()}`, "success");
        loadTransfers();
      }
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  if (loading) return <div className="text-slate-500">Loading transfers...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-left text-sm">
        <thead>
          <tr className="border-b text-slate-500 uppercase text-xs font-semibold bg-slate-50">
            <th className="p-3">Date</th>
            <th className="p-3">Asset</th>
            <th className="p-3">From</th>
            <th className="p-3">To</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-3 whitespace-nowrap">
                {format(new Date(t.createdAt), "MMM d, yyyy")}
              </td>
              <td className="p-3 font-medium">
                {t.asset?.name} <span className="text-slate-400 text-xs block">{t.asset?.assetTag}</span>
              </td>
              <td className="p-3">
                {t.fromUser?.firstName} {t.fromUser?.lastName}
              </td>
              <td className="p-3">
                {t.toUser?.firstName} {t.toUser?.lastName}
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  t.status === "PENDING" || t.status === "REQUESTED" ? "bg-amber-100 text-amber-700" :
                  t.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                  "bg-rose-100 text-rose-700"
                }`}>
                  {t.status}
                </span>
              </td>
              <td className="p-3 text-right space-x-2">
                {(t.status === "PENDING" || t.status === "REQUESTED") ? (
                  <>
                    <button onClick={() => handleReview(t.id, "APPROVED")} className="text-emerald-600 hover:underline font-medium text-xs">
                      Approve
                    </button>
                    <button onClick={() => handleReview(t.id, "REJECTED")} className="text-rose-600 hover:underline font-medium text-xs">
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs">Reviewed</span>
                )}
              </td>
            </tr>
          ))}
          {transfers.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-slate-500">No transfer requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
