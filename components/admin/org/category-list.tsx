"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/hooks/use-api";
import { CategoryForm } from "./category-form";

export function CategoryList() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>("/api/admin/categories");
      if (res.ok && res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (cat: any) => {
    setEditingCat(cat);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCat(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadCategories();
      }
    } catch (e) {
      alert("Failed to delete category");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Asset Categories</h2>
        <button onClick={handleCreate} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
          Add Category
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
                <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Assets</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-500">{cat.description}</td>
                  <td className="px-4 py-3 text-right">{cat._count?.assets || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(cat)} className="text-brand-600 hover:text-brand-800 mr-3">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-rose-600 hover:text-rose-800">Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">{editingCat ? "Edit Category" : "New Category"}</h3>
            <CategoryForm 
              initialData={editingCat} 
              onCancel={() => setIsModalOpen(false)} 
              onSuccess={() => {
                setIsModalOpen(false);
                loadCategories();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
