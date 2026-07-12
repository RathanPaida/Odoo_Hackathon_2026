"use client";

import { useState } from "react";

type Asset = {
  id: string;
  name: string;
  category: string;
  status: string;
  assignedTo: string | null;
};

// Mock data
const mockAssets: Asset[] = [
  { id: "AF-001", name: "MacBook Pro M2", category: "Electronics", status: "ALLOCATED", assignedTo: "Jane Doe" },
  { id: "AF-002", name: "Dell UltraSharp 27", category: "Electronics", status: "AVAILABLE", assignedTo: null },
  { id: "AF-003", name: "Conference Table", category: "Furniture", status: "AVAILABLE", assignedTo: null },
];

export function AssetsTable() {
  const [assets] = useState<Asset[]>(mockAssets);

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-500">
        <thead className="bg-slate-50 text-xs uppercase text-slate-700">
          <tr>
            <th className="px-6 py-3">Asset ID</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Assigned To</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {assets.map((asset) => (
            <tr key={asset.id} className="bg-white hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-slate-900">{asset.id}</td>
              <td className="px-6 py-4">{asset.name}</td>
              <td className="px-6 py-4">{asset.category}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${asset.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : ''}
                  ${asset.status === 'ALLOCATED' ? 'bg-blue-100 text-blue-800' : ''}
                  ${asset.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : ''}
                `}>
                  {asset.status.toLowerCase()}
                </span>
              </td>
              <td className="px-6 py-4">{asset.assignedTo || <span className="text-slate-400">Unassigned</span>}</td>
            </tr>
          ))}
          {assets.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No assets found for this department.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
