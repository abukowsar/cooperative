import { getDb, oid } from "@/lib/db";
import { fail, isDate, ok, readJson, samityId } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Record a breeding event:
 *  ai       → new insemination (resets pregnancy status)
 *  pregnant → pregnancy confirmed
 *  open     → not pregnant / heat returned
 *  calved   → gave birth
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const { type, date } = await readJson(req);
  if (!isDate(date)) return fail("তারিখ সঠিক নয়");
  const set: Record<string, unknown> =
    type === "ai" ? { aiDate: date, pregnant: null }
    : type === "pregnant" ? { pregnant: true }
    : type === "open" ? { pregnant: false }
    : type === "calved" ? { calvedDate: date, pregnant: null, aiDate: null }
    : {};
  if (!Object.keys(set).length) return fail("ঘটনা সঠিক নয়");
  const r = await (await getDb())
    .collection("cows")
    .updateOne({ _id: id, samityId: sid }, { $set: set, $push: { history: { type, date } } as never });
  if (!r.matchedCount) return fail("পাওয়া যায়নি", 404);
  return ok({ updated: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  await (await getDb()).collection("cows").deleteOne({ _id: id, samityId: sid });
  return ok({ deleted: true });
}
