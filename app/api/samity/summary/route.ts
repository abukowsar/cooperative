import { getDb } from "@/lib/db";
import { fail, ok, samityId } from "@/lib/api";
import { today } from "@/lib/shared";

export const dynamic = "force-dynamic";

/** Headline numbers for the samity dashboard. */
export async function GET() {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const db = await getDb();
  const d = today();
  const month = d.slice(0, 7);
  const sum = (field: string) => ({ $sum: field });
  const [members, monthMilk, todayMilk, savings, cows, pregnant] = await Promise.all([
    db.collection("members").countDocuments({ samityId: sid, active: true }),
    db.collection("milk").aggregate([{ $match: { samityId: sid, date: { $gte: `${month}-01`, $lte: `${month}-31` } } }, { $group: { _id: null, l: sum("$liters"), a: sum("$amount") } }]).toArray(),
    db.collection("milk").aggregate([{ $match: { samityId: sid, date: d } }, { $group: { _id: null, l: sum("$liters") } }]).toArray(),
    db.collection("savings").aggregate([{ $match: { samityId: sid } }, { $group: { _id: null, s: sum("$amount") } }]).toArray(),
    db.collection("cows").countDocuments({ samityId: sid }),
    db.collection("cows").countDocuments({ samityId: sid, pregnant: true }),
  ]);
  return ok({
    members,
    monthLiters: monthMilk[0]?.l ?? 0,
    monthAmount: monthMilk[0]?.a ?? 0,
    todayLiters: todayMilk[0]?.l ?? 0,
    savings: savings[0]?.s ?? 0,
    cows,
    pregnant,
  });
}
