import { getDb, oid } from "@/lib/db";
import { fail, isDate, num, ok, readJson, samityId } from "@/lib/api";
import { LOAN_PURPOSES } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const docs = await (await getDb()).collection("loans").find({ samityId: sid }).sort({ at: -1 }).toArray();
  return ok(docs.map(({ _id, samityId, memberId, ...l }) => ({ id: String(_id), memberId: String(memberId), ...l })));
}

export async function POST(req: Request) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const b = await readJson(req);
  const mid = typeof b.memberId === "string" ? oid(b.memberId) : null;
  const principal = num(b.principal, 100, 100_000_000);
  const rate = num(b.rate, 0, 50);
  const graceMonths = num(b.graceMonths, 0, 36);
  const termMonths = num(b.termMonths, 1, 120);
  if (!mid) return fail("সদস্য বাছাই করুন");
  if (principal == null) return fail("ঋণের পরিমাণ লিখুন");
  if (rate == null || graceMonths == null || termMonths == null) return fail("সার্ভিস চার্জ, গ্রেস ও কিস্তির সংখ্যা সঠিকভাবে লিখুন");
  if (!isDate(b.start)) return fail("বিতরণের তারিখ সঠিক নয়");
  const purpose = typeof b.purpose === "string" && Object.hasOwn(LOAN_PURPOSES, b.purpose) ? b.purpose : "other";
  const graceMode = b.graceMode === "capitalize" ? "capitalize" : "interest";
  const db = await getDb();
  if (!(await db.collection("members").countDocuments({ _id: mid, samityId: sid }, { limit: 1 }))) return fail("সদস্য পাওয়া যায়নি", 404);
  const r = await db.collection("loans").insertOne({
    samityId: sid, memberId: mid, purpose, principal, rate,
    graceMonths: Math.round(graceMonths), termMonths: Math.round(termMonths), graceMode,
    start: b.start, repayments: [], at: Date.now(),
  });
  return ok({ id: String(r.insertedId) }, 201);
}
