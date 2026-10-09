import { getDb, oid } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { isModerator } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isModerator())) return fail("অনুমতি নেই", 403);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  await (await getDb()).collection("answers").deleteOne({ _id: id });
  return ok({ deleted: true });
}
