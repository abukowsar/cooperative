import { getDb, oid } from "@/lib/db";
import { fail, isDate, num, ok, readJson, samityId } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Record a repayment. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const b = await readJson(req);
  const amount = num(b.amount, 1, 100_000_000);
  if (amount == null) return fail("আদায়ের পরিমাণ লিখুন");
  if (!isDate(b.date)) return fail("তারিখ সঠিক নয়");
  const r = await (await getDb())
    .collection("loans")
    .updateOne({ _id: id, samityId: sid }, { $push: { repayments: { date: b.date, amount, at: Date.now() } } as never });
  if (!r.matchedCount) return fail("পাওয়া যায়নি", 404);
  return ok({ updated: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  await (await getDb()).collection("loans").deleteOne({ _id: id, samityId: sid });
  return ok({ deleted: true });
}
