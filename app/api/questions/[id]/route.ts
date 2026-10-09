import { getDb, oid } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { isModerator } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const db = await getDb();
  const q = await db.collection("questions").findOne({ _id: id });
  if (!q) return fail("পাওয়া যায়নি", 404);
  const answers = await db.collection("answers").find({ qid: id }).sort({ helpful: -1, at: 1 }).toArray();
  const { _id, ...rest } = q;
  return ok({
    id: String(_id),
    ...rest,
    answers: answers.map(({ _id, qid, ...a }) => ({ id: String(_id), helpful: 0, ...a })),
  });
}

/** Moderator: toggle resolved. */
export async function PATCH(_: Request, { params }: Ctx) {
  if (!(await isModerator())) return fail("অনুমতি নেই", 403);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const db = await getDb();
  const q = await db.collection("questions").findOne({ _id: id }, { projection: { resolved: 1 } });
  if (!q) return fail("পাওয়া যায়নি", 404);
  await db.collection("questions").updateOne({ _id: id }, { $set: { resolved: !q.resolved } });
  return ok({ resolved: !q.resolved });
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!(await isModerator())) return fail("অনুমতি নেই", 403);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const db = await getDb();
  await db.collection("answers").deleteMany({ qid: id });
  await db.collection("questions").deleteOne({ _id: id });
  return ok({ deleted: true });
}
