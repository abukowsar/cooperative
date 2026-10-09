import { getDb } from "@/lib/db";
import { fail, isDate, ok, readJson, samityId, str } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const docs = await (await getDb()).collection("cows").find({ samityId: sid }).sort({ at: -1 }).toArray();
  return ok(docs.map(({ _id, samityId, ...c }) => ({ id: String(_id), ...c })));
}

export async function POST(req: Request) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const b = await readJson(req);
  const d = { name: str(b.name, 40), owner: str(b.owner, 60), tag: str(b.tag, 30), breed: str(b.breed, 40) };
  if (!d.name || !d.owner) return fail("গাভীর নাম ও মালিকের নাম লিখুন");
  const history: { type: string; date: string }[] = [];
  let aiDate: string | null = null;
  let calvedDate: string | null = null;
  if (b.aiDate) {
    if (!isDate(b.aiDate)) return fail("প্রজননের তারিখ সঠিক নয়");
    aiDate = b.aiDate;
    history.push({ type: "ai", date: b.aiDate });
  }
  if (b.calvedDate) {
    if (!isDate(b.calvedDate)) return fail("প্রসবের তারিখ সঠিক নয়");
    calvedDate = b.calvedDate;
    history.push({ type: "calved", date: b.calvedDate });
  }
  const r = await (await getDb())
    .collection("cows")
    .insertOne({ ...d, samityId: sid, aiDate, calvedDate, pregnant: null, history, at: Date.now() });
  return ok({ id: String(r.insertedId) }, 201);
}
