import { getDb } from "@/lib/db";
import { fail, num, ok, readJson, samityId, str } from "@/lib/api";
import { toLatin } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const docs = await (await getDb()).collection("members").find({ samityId: sid }).sort({ no: 1 }).toArray();
  return ok(docs.map(({ _id, samityId, ...m }) => ({ id: String(_id), ...m })));
}

export async function POST(req: Request) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const b = await readJson(req);
  const no = num(toLatin(String(b.no ?? "")), 1, 99999);
  const d = { name: str(b.name, 60), village: str(b.village, 60), phone: toLatin(str(b.phone, 20)) };
  if (no == null || !Number.isInteger(no)) return fail("সদস্য নম্বর লিখুন");
  if (!d.name) return fail("সদস্যের নাম লিখুন");
  try {
    const r = await (await getDb())
      .collection("members")
      .insertOne({ ...d, no, samityId: sid, active: true, at: Date.now() });
    return ok({ id: String(r.insertedId) }, 201);
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return fail(`সদস্য নম্বর ${no} আগেই আছে`, 409);
    throw e;
  }
}
