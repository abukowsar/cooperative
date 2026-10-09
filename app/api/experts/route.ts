import { getDb, plain } from "@/lib/db";
import { fail, ok, readJson, str } from "@/lib/api";
import { CATN, toLatin } from "@/lib/shared";
import type { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const docs = await (await getDb())
    .collection<{ _id: ObjectId }>("experts")
    .find()
    .sort({ at: -1 })
    .limit(500)
    .toArray();
  return ok(docs.map(plain));
}

export async function POST(req: Request) {
  const b = await readJson(req);
  const d = {
    name: str(b.name, 60),
    org: str(b.org, 100),
    cat: str(b.cat, 20),
    area: str(b.area, 80),
    phone: toLatin(str(b.phone, 20)),
  };
  if (!d.name || !d.org || !d.area) return fail("সব ঘর পূরণ করুন");
  if (!CATN[d.cat]) return fail("বিশেষজ্ঞতার বিষয় বাছাই করুন");
  if (d.phone && !/^\+?[0-9\- ]{6,20}$/.test(d.phone)) return fail("মোবাইল নম্বর সঠিকভাবে লিখুন, যেমন 01XXXXXXXXX");
  const r = await (await getDb()).collection("experts").insertOne({ ...d, at: Date.now() });
  return ok({ id: String(r.insertedId) }, 201);
}
