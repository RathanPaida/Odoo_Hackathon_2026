"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { DepartmentForm } from "./department-form";

export function DepartmentList() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/admin/departments");
      if (res.ok && res.data?.data) {
        setDepartments(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingDept(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this department?")) return;
    try {
      const res = await apiFetch(`/api/admin/departments/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadDepartments();
      }
    } catch (e) {
      alert("Failed to delete department");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Departments</h2>
        <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
          Add Department
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Code</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Head</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{dept.name}</td>
                  <td className="px-4 py-3">{dept.code}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${dept.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {dept.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(dept)} className="text-brand-600 hover:text-brand-800 mr-3">Edit</button>
                    {dept.status === 'ACTIVE' && (
                      <button onClick={() => handleDelete(dept.id)} className="text-rose-600 hover:text-rose-800">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No departments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingDept ? "Edit Department" : "New Department"}</h3>
            <DepartmentForm 
              initialData={editingDept} 
              onCancel={() => setIsModalOpen(false)} 
              onSuccess={() => {
                setIsModalOpen(false);
                loadDepartments();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
