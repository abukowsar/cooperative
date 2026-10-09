import { NextResponse } from "next/server";
import { getSamitySession } from "./auth";
import { oid } from "./db";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Trimmed string field with a max length; returns "" when missing. */
export function str(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function num(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export const isDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const j = await req.json();
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

/** Returns the logged-in samity's ObjectId, or null. */
export async function samityId() {
  const s = await getSamitySession();
  return s ? oid(s.samityId) : null;
}
