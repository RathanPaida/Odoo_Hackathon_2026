// components/employee/ui/confirm.tsx
"use client";
import { useState } from "react";
import { Modal } from "@/components/employee/ui/modal";

export function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onClose,
  busy = false,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  busy?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading || busy}>
            Cancel
          </button>
          <button
            className={destructive ? "btn-danger" : "btn-primary"}
            onClick={handle}
            disabled={loading || busy}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
