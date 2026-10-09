import { getDb, oid } from "@/lib/db";
import { fail, ok, readJson, samityId, str } from "@/lib/api";
import { toLatin } from "@/lib/shared";

type Ctx = { params: Promise<{ id: string }> };

/** Edit name/village/phone or toggle active. Members are never hard-deleted so old ledgers stay intact. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const b = await readJson(req);
  const set: Record<string, unknown> = {};
  if (typeof b.active === "boolean") set.active = b.active;
  if (typeof b.name === "string") {
    if (!str(b.name, 60)) return fail("সদস্যের নাম লিখুন");
    set.name = str(b.name, 60);
  }
  if (typeof b.village === "string") set.village = str(b.village, 60);
  if (typeof b.phone === "string") set.phone = toLatin(str(b.phone, 20));
  const r = await (await getDb()).collection("members").updateOne({ _id: id, samityId: sid }, { $set: set });
  if (!r.matchedCount) return fail("পাওয়া যায়নি", 404);
  return ok({ updated: true });
}
