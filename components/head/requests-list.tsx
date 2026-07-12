"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

type AssetRequest = {
  id: string;
  type: string;
  requesterName: string;
  assetName: string;
  reason: string;
  status: string;
  date: string;
};

// Mock data
const mockRequests: AssetRequest[] = [
  { id: "REQ-01", type: "ALLOCATION", requesterName: "John Smith", assetName: "Dell UltraSharp 27", reason: "Need dual monitor setup", status: "PENDING", date: "2026-07-10" },
  { id: "REQ-02", type: "MAINTENANCE", requesterName: "Jane Doe", assetName: "MacBook Pro M2", reason: "Battery not holding charge", status: "PENDING", date: "2026-07-11" },
];

export function RequestsList() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AssetRequest[]>(mockRequests);

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r));
    toast(`The request has been ${action.toLowerCase()}.`, "success");
  };

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                ${req.type === 'ALLOCATION' ? 'bg-indigo-100 text-indigo-800' : ''}
                ${req.type === 'TRANSFER' ? 'bg-purple-100 text-purple-800' : ''}
                ${req.type === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' : ''}
              `}>
                {req.type.toLowerCase()}
              </span>
              <span className="text-sm font-medium text-slate-500">{req.date}</span>
            </div>
            <h4 className="text-lg font-semibold">{req.requesterName} <span className="text-slate-500 font-normal">requests</span> {req.assetName}</h4>
            <p className="text-sm text-slate-600 mt-1">&quot;{req.reason}&quot;</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {req.status === 'PENDING' ? (
              <>
                <button onClick={() => handleAction(req.id, 'APPROVED')} className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  Approve
                </button>
                <button onClick={() => handleAction(req.id, 'REJECTED')} className="flex-1 md:flex-none inline-flex justify-center items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                  Reject
                </button>
              </>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize
                ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
              `}>
                {req.status.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      ))}
      
      {requests.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-slate-500">No pending requests.</p>
        </div>
      )}
    </div>
  );
}
