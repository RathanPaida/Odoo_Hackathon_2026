// components/user/logout-button.tsx
"use client";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      toast("Logged out.", "success");
      router.push("/login");
      router.refresh();
    } catch {
      toast("Logout failed.", "error");
      setLoading(false);
    }
  };

  return (
    <button onClick={onLogout} className="btn-secondary" disabled={loading}>
      {loading && <Spinner />} Log out
    </button>
  );
}
