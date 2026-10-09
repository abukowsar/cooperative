import { getDb, oid } from "@/lib/db";
import { fail, ok, readJson, str } from "@/lib/api";
import { ROLEN } from "@/lib/shared";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const qid = oid((await params).id);
  if (!qid) return fail("প্রশ্ন পাওয়া যায়নি", 404);
  const b = await readJson(req);
  const d = { name: str(b.name, 60), role: str(b.role, 20), body: str(b.body, 3000) };
  if (!d.name || !d.body) return fail("নাম ও পরামর্শ লিখুন");
  if (!ROLEN[d.role]) d.role = "farmer";
  const db = await getDb();
  if (!(await db.collection("questions").countDocuments({ _id: qid }, { limit: 1 }))) return fail("প্রশ্ন পাওয়া যায়নি", 404);
  const r = await db.collection("answers").insertOne({ ...d, qid, at: Date.now(), helpful: 0 });
  return ok({ id: String(r.insertedId) }, 201);
}
