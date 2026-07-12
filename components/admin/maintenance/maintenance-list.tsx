"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";

export function MaintenanceList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/admin/maintenance");
      if (res.ok && res.data?.data) setRequests(res.data.data);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string, status: "IN_PROGRESS" | "COMPLETED" | "REJECTED") {
    try {
      const res = await apiFetch(`/api/admin/maintenance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast(`Maintenance ${status.toLowerCase().replace('_', ' ')}`, "success");
        loadRequests();
      }
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  if (loading) return <div className="text-slate-500">Loading maintenance requests...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-left text-sm">
        <thead>
          <tr className="border-b text-slate-500 uppercase text-xs font-semibold bg-slate-50">
            <th className="p-3">Date</th>
            <th className="p-3">Asset</th>
            <th className="p-3">Requested By</th>
            <th className="p-3">Issue</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-3 whitespace-nowrap">
                {format(new Date(r.createdAt), "MMM d, yyyy")}
              </td>
              <td className="p-3 font-medium">
                {r.asset?.name} <span className="text-slate-400 text-xs block">{r.asset?.assetTag}</span>
              </td>
              <td className="p-3">
                {r.requestedBy?.firstName} {r.requestedBy?.lastName}
              </td>
              <td className="p-3 text-slate-500 max-w-xs truncate">
                {r.issueDescription}
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                  r.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                  r.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                  "bg-rose-100 text-rose-700"
                }`}>
                  {r.status}
                </span>
              </td>
              <td className="p-3 text-right space-x-2">
                {r.status === "PENDING" ? (
                  <>
                    <button onClick={() => handleReview(r.id, "IN_PROGRESS")} className="text-blue-600 hover:underline font-medium text-xs">
                      Approve
                    </button>
                    <button onClick={() => handleReview(r.id, "REJECTED")} className="text-rose-600 hover:underline font-medium text-xs">
                      Reject
                    </button>
                  </>
                ) : r.status === "IN_PROGRESS" ? (
                  <button onClick={() => handleReview(r.id, "COMPLETED")} className="text-emerald-600 hover:underline font-medium text-xs">
                    Mark Complete
                  </button>
                ) : (
                  <span className="text-slate-400 text-xs">Closed</span>
                )}
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-slate-500">No maintenance requests found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
