import { getDb, oid } from "@/lib/db";
import { fail, ok, readJson, str } from "@/lib/api";
import { isModerator } from "@/lib/auth";
import { today, toLatin } from "@/lib/shared";

type Ctx = { params: Promise<{ id: string }> };

/** Moderator: list who registered. */
export async function GET(_: Request, { params }: Ctx) {
  if (!(await isModerator())) return fail("অনুমতি নেই", 403);
  const tid = oid((await params).id);
  if (!tid) return fail("পাওয়া যায়নি", 404);
  const regs = await (await getDb()).collection("trainingRegs").find({ tid }).sort({ at: 1 }).toArray();
  return ok(regs.map(({ _id, tid, ...r }) => ({ id: String(_id), ...r })));
}

/** Public: register for a training (one registration per phone number). */
export async function POST(req: Request, { params }: Ctx) {
  const tid = oid((await params).id);
  if (!tid) return fail("পাওয়া যায়নি", 404);
  const b = await readJson(req);
  const d = { name: str(b.name, 60), phone: toLatin(str(b.phone, 20)).replace(/[\s-]/g, ""), samity: str(b.samity, 100) };
  if (!d.name) return fail("নাম লিখুন");
  if (!/^\+?\d{10,14}$/.test(d.phone)) return fail("সঠিক মোবাইল নম্বর লিখুন, যেমন 01XXXXXXXXX");
  const db = await getDb();
  const t = await db.collection("trainings").findOne({ _id: tid });
  if (!t) return fail("প্রশিক্ষণটি পাওয়া যায়নি", 404);
  if (t.date < today()) return fail("এই প্রশিক্ষণের তারিখ পেরিয়ে গেছে");
  const regs = db.collection("trainingRegs");
  if (await regs.countDocuments({ tid, phone: d.phone }, { limit: 1 })) return fail("এই নম্বর দিয়ে আগেই নিবন্ধন হয়েছে", 409);
  if ((await regs.countDocuments({ tid })) >= t.seats) return fail("দুঃখিত, সব আসন পূর্ণ হয়ে গেছে", 409);
  await regs.insertOne({ ...d, tid, at: Date.now() });
  return ok({ registered: true }, 201);
}
