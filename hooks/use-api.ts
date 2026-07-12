// hooks/use-api.ts
"use client";
// Thin fetch wrapper that returns parsed JSON and throws on non-ok.
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    const err: any = new Error(data?.message ?? "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return { ok: true, status: res.status, data };
}
