import { getDb, oid } from "@/lib/db";
import { fail, isDate, num, ok, readJson, samityId, str } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Recent savings transactions plus each member's running balance. */
export async function GET() {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const col = (await getDb()).collection("savings");
  const [entries, balances] = await Promise.all([
    col.find({ samityId: sid }).sort({ date: -1, at: -1 }).limit(300).toArray(),
    col.aggregate([
      { $match: { samityId: sid } },
      { $group: { _id: "$memberId", balance: { $sum: "$amount" }, deposits: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } }, last: { $max: "$date" } } },
    ]).toArray(),
  ]);
  return ok({
    entries: entries.map((e) => ({ id: String(e._id), memberId: String(e.memberId), date: e.date, amount: e.amount, note: e.note })),
    balances: balances.map((b) => ({ memberId: String(b._id), balance: b.balance, deposits: b.deposits, last: b.last })),
  });
}

/** Deposit (type=deposit) or withdrawal (type=withdraw). Withdrawals cannot exceed the balance. */
export async function POST(req: Request) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const b = await readJson(req);
  const mid = typeof b.memberId === "string" ? oid(b.memberId) : null;
  const amount = num(b.amount, 1, 10_000_000);
  if (!mid) return fail("সদস্য বাছাই করুন");
  if (amount == null) return fail("টাকার পরিমাণ লিখুন");
  if (!isDate(b.date)) return fail("তারিখ সঠিক নয়");
  const db = await getDb();
  if (!(await db.collection("members").countDocuments({ _id: mid, samityId: sid }, { limit: 1 }))) return fail("সদস্য পাওয়া যায়নি", 404);
  const withdraw = b.type === "withdraw";
  if (withdraw) {
    const [agg] = await db.collection("savings").aggregate([{ $match: { samityId: sid, memberId: mid } }, { $group: { _id: null, bal: { $sum: "$amount" } } }]).toArray();
    if ((agg?.bal ?? 0) < amount) return fail("সঞ্চয়ের চেয়ে বেশি উত্তোলন করা যাবে না");
  }
  const r = await db.collection("savings").insertOne({
    samityId: sid, memberId: mid, date: b.date, amount: withdraw ? -amount : amount, note: str(b.note, 100), at: Date.now(),
  });
  return ok({ id: String(r.insertedId) }, 201);
}
