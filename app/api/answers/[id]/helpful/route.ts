import { getDb, oid } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { cookies } from "next/headers";

/** One "helpful" vote per browser per answer, tracked in a cookie. */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id;
  const id = oid(raw);
  if (!id) return fail("পাওয়া যায়নি", 404);
  const jar = await cookies();
  const voted = (jar.get("helpful")?.value || "").split(",").filter(Boolean);
  if (voted.includes(raw)) return fail("আপনি আগেই ভোট দিয়েছেন", 409);
  const r = await (await getDb())
    .collection("answers")
    .findOneAndUpdate({ _id: id }, { $inc: { helpful: 1 } }, { returnDocument: "after" });
  if (!r) return fail("পাওয়া যায়নি", 404);
  jar.set("helpful", [...voted, raw].slice(-150).join(","), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });
  return ok({ helpful: r.helpful });
}
