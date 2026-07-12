"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { downloadQr, QrCode } from "@/components/employee/qr-code";
import { useToast } from "@/components/ui/toast";

export function AssetList() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showQr, setShowQr] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [isBookable, setIsBookable] = useState(false);
  const [holderId, setHolderId] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  // Allocate Modal
  const [showAllocate, setShowAllocate] = useState<any | null>(null);
  const [allocateHolderId, setAllocateHolderId] = useState("");
  
  
  const { toast } = useToast();

  useEffect(() => {
    loadAssets();
    loadCategories();
    loadUsers();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/admin/assets");
      if (res.ok && res.data?.data) setAssets(res.data.data);
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await apiFetch<any>("/api/admin/categories");
      if (res.ok && res.data?.data) setCategories(res.data.data);
    } catch {
      // ignore
    }
  }

  async function loadUsers() {
    try {
      const res = await apiFetch<any>("/api/admin/users?pageSize=100");
      if (res.ok && res.data?.data) setUsers(res.data.data);
    } catch {
      // ignore
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/admin/assets", {
        method: "POST",
        body: JSON.stringify({ name, assetTag, categoryId, isBookable, holderId: holderId || null }),
      });
      if (res.ok) {
        toast("Asset created!", "success");
        setShowCreate(false);
        setName("");
        setAssetTag("");
        setHolderId("");
        setIsBookable(false);
        loadAssets();
      }
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  if (loading) return <div className="text-slate-500">Loading assets...</div>;

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/admin/assets/${showAllocate.id}/allocate`, {
        method: "POST",
        body: JSON.stringify({ holderId: allocateHolderId || null }),
      });
      if (res.ok) {
        toast("Asset allocated!", "success");
        setShowAllocate(null);
        loadAssets();
      }
    } catch (e: any) {
      toast(e.message, "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Registered Assets</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          Register New Asset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full text-left text-sm">
          <thead>
            <tr className="border-b text-slate-500 uppercase text-xs font-semibold bg-slate-50">
              <th className="p-3">Asset Tag</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-3 font-medium text-slate-800">{a.assetTag}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.category?.name || "N/A"}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                    {a.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => {
                    setShowAllocate(a);
                    setAllocateHolderId(a.holder?.id || "");
                  }} className="text-brand-600 text-xs font-medium hover:underline">
                    Allocate
                  </button>
                  <button onClick={() => setShowQr(a)} className="text-brand-600 text-xs font-medium hover:underline">
                    View QR
                  </button>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">No assets found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Register New Asset</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Asset Tag (Unique)</label>
                <input required className="input" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="e.g. AF-001" />
              </div>
              <div>
                <label className="label">Name</label>
                <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MacBook Pro M3" />
              </div>
              <div>
                <label className="label">Category</label>
                <select required className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assign to Employee</label>
                <select className="input" value={holderId} onChange={(e) => setHolderId(e.target.value)}>
                  <option value="">Leave unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={isBookable} onChange={(e) => setIsBookable(e.target.checked)} className="rounded" />
                Bookable resource
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAllocate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Allocate Asset</h3>
            <p className="text-sm text-slate-500 mb-4">Assigning {showAllocate.name} ({showAllocate.assetTag})</p>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="label">Assign to Employee</label>
                <select className="input" value={allocateHolderId} onChange={(e) => setAllocateHolderId(e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAllocate(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQr(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{showQr.name}</h3>
            <p className="text-slate-500 text-sm mb-4">Asset Tag: {showQr.assetTag}</p>
            
            <div className="flex justify-center mb-6 border p-4 rounded-xl bg-slate-50">
              <QrCode value={`${window.location.origin}/dashboard/employee/book?assetId=${showQr.id}`} size={200} />
            </div>

            <div className="flex justify-center gap-3">
              <button onClick={() => setShowQr(null)} className="btn-secondary">Close</button>
              <button onClick={() => downloadQr(`${window.location.origin}/dashboard/employee/book?assetId=${showQr.id}`, `qr-${showQr.assetTag}.svg`)} className="btn-primary">
                Download SVG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
