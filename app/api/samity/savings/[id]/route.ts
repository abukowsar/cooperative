import { getDb, oid } from "@/lib/db";
import { fail, ok, samityId } from "@/lib/api";

/** Remove a mistaken entry. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const sid = await samityId();
  if (!sid) return fail("লগইন করুন", 401);
  const id = oid((await params).id);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const r = await (await getDb()).collection("savings").deleteOne({ _id: id, samityId: sid });
  if (!r.deletedCount) return fail("পাওয়া যায়নি", 404);
  return ok({ deleted: true });
}
