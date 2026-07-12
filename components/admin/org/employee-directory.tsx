"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { EmployeePromoteDialog } from "./employee-promote-dialog";

export function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<any>(null);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>("/api/admin/employees");
      if (res.ok && res.data?.data) {
        setEmployees(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleEditRole = (emp: any) => {
    setEditingRole(emp);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Employee Directory</h2>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Department</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{emp.department?.name || "None"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEditRole(emp)} className="text-brand-600 hover:text-brand-800">Change Role</button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingRole && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Employee Role</h3>
            <EmployeePromoteDialog 
              employee={editingRole}
              onCancel={() => setEditingRole(null)} 
              onSuccess={() => {
                setEditingRole(null);
                loadEmployees();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
