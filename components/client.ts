"use client";

/** fetch wrapper: JSON in/out, throws Error with the server's Bengali message. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method || (opts.body ? "POST" : "GET"),
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।", res.status);
  return data as T;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("toast", { detail: msg }));
}

export function lsGet(k: string) {
  try {
    return localStorage.getItem(k) || "";
  } catch {
    return "";
  }
}
export function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {}
}
