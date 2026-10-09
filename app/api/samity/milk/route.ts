import { getDb, oid } from "@/lib/db";
import { fail, isDate, num, ok, readJson, samityId } from "@/lib/api";
import { DEFAULT_PRICE, PriceRule, ratePerLiter } from "@/lib/shared";
import type { AnyBulkWriteOperation } from "mongodb";

export const dynamic = "force-dynamic";

/**
 * ?date=YYYY-MM-DD → that day's entries (both shifts)
 * ?month=YYYY-MM   → per-member totals for the month + daily totals
 */
export async function GET(req: Request) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");
  const db = await getDb();
  const milk = db.collection("milk");

  if (date) {
    if (!isDate(date)) return fail("তারিখ সঠিক নয়");
    const docs = await milk.find({ samityId: sid, date }).toArray();
    return ok(docs.map((e) => ({ memberId: String(e.memberId), shift: e.shift, liters: e.liters, fat: e.fat, rate: e.rate, amount: e.amount })));
  }

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const match = { samityId: sid, date: { $gte: `${month}-01`, $lte: `${month}-31` } };
    const [members, days] = await Promise.all([
      milk
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: "$memberId",
              liters: { $sum: "$liters" },
              amount: { $sum: "$amount" },
              fatWeighted: { $sum: { $multiply: [{ $ifNull: ["$fat", 0] }, "$liters"] } },
              fatLiters: { $sum: { $cond: [{ $gt: ["$fat", null] }, "$liters", 0] } },
              days: { $addToSet: "$date" },
            },
          },
        ])
        .toArray(),
      milk
        .aggregate([
          { $match: match },
          { $group: { _id: "$date", liters: { $sum: "$liters" }, amount: { $sum: "$amount" } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ]);
    return ok({
      members: members.map((m) => ({
        memberId: String(m._id),
        liters: +m.liters.toFixed(2),
        amount: +m.amount.toFixed(2),
        avgFat: m.fatLiters ? +(m.fatWeighted / m.fatLiters).toFixed(2) : null,
        days: m.days.length,
      })),
      days: days.map((d) => ({ date: d._id, liters: +d.liters.toFixed(2), amount: +d.amount.toFixed(2) })),
    });
  }
  return fail("date বা month দিন");
}

/** Save one shift's collection sheet. Empty / zero liters removes that member's entry. */
export async function POST(req: Request) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const b = await readJson(req);
  const { date, shift } = b;
  if (!isDate(date)) return fail("তারিখ সঠিক নয়");
  if (shift !== "am" && shift !== "pm") return fail("সকাল বা বিকাল বাছাই করুন");
  if (!Array.isArray(b.entries) || b.entries.length > 2000) return fail("এন্ট্রি সঠিক নয়");

  const db = await getDb();
  const samity = await db.collection("samities").findOne({ _id: sid }, { projection: { price: 1 } });
  const rule: PriceRule = samity?.price ?? DEFAULT_PRICE;
  const validMembers = new Set(
    (await db.collection("members").find({ samityId: sid }, { projection: { _id: 1 } }).toArray()).map((m) => String(m._id)),
  );

  const ops: AnyBulkWriteOperation[] = [];
  for (const raw of b.entries as Record<string, unknown>[]) {
    const mid = typeof raw.memberId === "string" && validMembers.has(raw.memberId) ? oid(raw.memberId) : null;
    if (!mid) continue;
    const key = { samityId: sid, date, shift, memberId: mid };
    const l = num(raw.liters, 0, 500);
    if (!l) {
      ops.push({ deleteOne: { filter: key } });
      continue;
    }
    const fat = num(raw.fat, 1, 12);
    const rate = ratePerLiter(fat, rule);
    ops.push({
      updateOne: {
        filter: key,
        update: { $set: { liters: l, fat, rate, amount: +(l * rate).toFixed(2), at: Date.now() } },
        upsert: true,
      },
    });
  }
  if (ops.length) await db.collection("milk").bulkWrite(ops, { ordered: false });
  return ok({ saved: ops.length });
}
