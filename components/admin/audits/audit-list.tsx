"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";

export function AuditList() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadAudits();
  }, []);

  async function loadAudits() {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/admin/audits");
      if (res.ok && res.data?.data) setAudits(res.data.data);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/admin/audits", {
        method: "POST",
        body: JSON.stringify({ name, startDate }),
      });
      if (res.ok) {
        toast("Audit cycle created!", "success");
        setShowCreate(false);
        setName("");
        setStartDate("");
        loadAudits();
      }
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  if (loading) return <div className="text-slate-500">Loading audit cycles...</div>;

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Audit Cycles</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          New Audit Cycle
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full text-left text-sm">
          <thead>
            <tr className="border-b text-slate-500 uppercase text-xs font-semibold bg-slate-50">
              <th className="p-3">Name</th>
              <th className="p-3">Start Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Auditor</th>
              <th className="p-3">Items</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-3 font-medium text-slate-800">{a.name}</td>
                <td className="p-3 whitespace-nowrap">
                  {format(new Date(a.startDate), "MMM d, yyyy")}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    a.status === "PLANNED" ? "bg-amber-100 text-amber-700" :
                    a.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3">
                  {a.auditor ? `${a.auditor.firstName} ${a.auditor.lastName}` : "Unassigned"}
                </td>
                <td className="p-3 font-medium text-slate-500">
                  {a.items?.length || 0}
                </td>
              </tr>
            ))}
            {audits.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">No audit cycles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Create Audit Cycle</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Audit Name</label>
                <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 Hardware Audit" />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input required type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
