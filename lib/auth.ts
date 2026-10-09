import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "";
const SAMITY_COOKIE = "samity_session";
const MOD_COOKIE = "mod_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string) {
  if (!SECRET) throw new Error("SESSION_SECRET is missing from .env.local");
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeToken(data: object) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

function readToken<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    return data.exp > Date.now() ? (data as T) : null;
  } catch {
    return null;
  }
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

export function checkPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = scryptSync(pin, salt, 32);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type SamitySession = { samityId: string; code: string };

export async function getSamitySession() {
  return readToken<SamitySession>((await cookies()).get(SAMITY_COOKIE)?.value);
}
export async function setSamitySession(s: SamitySession) {
  (await cookies()).set(SAMITY_COOKIE, makeToken(s), cookieOpts);
}
export async function clearSamitySession() {
  (await cookies()).delete(SAMITY_COOKIE);
}

export async function isModerator() {
  return !!readToken<{ mod: true }>((await cookies()).get(MOD_COOKIE)?.value)?.mod;
}
export async function setModerator() {
  (await cookies()).set(MOD_COOKIE, makeToken({ mod: true }), cookieOpts);
}
export async function clearModerator() {
  (await cookies()).delete(MOD_COOKIE);
}

export function moderatorKeyMatches(key: string) {
  const real = process.env.MODERATOR_KEY || "";
  if (!real) return false;
  const a = Buffer.from(sign(key));
  const b = Buffer.from(sign(real));
  return timingSafeEqual(a, b);
}
