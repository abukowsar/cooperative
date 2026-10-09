import { getDb } from "@/lib/db";
import { fail, num, ok, readJson, samityId, str } from "@/lib/api";
import { hashPin, setSamitySession } from "@/lib/auth";
import { DEFAULT_PRICE, toLatin } from "@/lib/shared";

export const dynamic = "force-dynamic";

/** Current logged-in samity (without the PIN hash). */
export async function GET() {
  const id = await samityId();
  if (!id) return fail("লগইন করুন", 401);
  const s = await (await getDb()).collection("samities").findOne({ _id: id }, { projection: { pin: 0 } });
  if (!s) return fail("লগইন করুন", 401);
  const { _id, ...rest } = s;
  return ok({ id: String(_id), ...rest });
}

/** Register a new samity and log in. */
export async function POST(req: Request) {
  const b = await readJson(req);
  const code = toLatin(str(b.code, 30)).toLowerCase();
  const pin = toLatin(str(b.pin, 20));
  const d = { name: str(b.name, 100), upz: str(b.upz, 80), manager: str(b.manager, 60) };
  if (!d.name || !d.upz || !d.manager) return fail("সব ঘর পূরণ করুন");
  if (!/^[a-z0-9-]{3,30}$/.test(code)) return fail("সমিতি কোড ৩–৩০ অক্ষরের ইংরেজি ছোট হাতের অক্ষর, সংখ্যা বা - হতে হবে");
  if (!/^\d{4,12}$/.test(pin)) return fail("পিন ৪–১২ সংখ্যার হতে হবে");
  const db = await getDb();
  try {
    const r = await db
      .collection("samities")
      .insertOne({ ...d, code, pin: hashPin(pin), price: DEFAULT_PRICE, at: Date.now() });
    await setSamitySession({ samityId: String(r.insertedId), code });
    return ok({ id: String(r.insertedId) }, 201);
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return fail("এই সমিতি কোড আগেই নেওয়া হয়েছে, অন্য কোড দিন", 409);
    throw e;
  }
}

/** Update milk price rule. */
export async function PATCH(req: Request) {
  const id = await samityId();
  if (!id) return fail("লগইন করুন", 401);
  const b = await readJson(req);
  const baseRate = num(b.baseRate, 1, 500);
  const stdFat = num(b.stdFat, 2, 8);
  const perPoint = num(b.perPoint, 0, 20);
  if (baseRate == null || stdFat == null || perPoint == null) return fail("দরের তথ্য সঠিক নয়");
  await (await getDb()).collection("samities").updateOne({ _id: id }, { $set: { price: { baseRate, stdFat, perPoint } } });
  return ok({ price: { baseRate, stdFat, perPoint } });
}
