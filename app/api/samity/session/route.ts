import { getDb } from "@/lib/db";
import { fail, ok, readJson, str } from "@/lib/api";
import { checkPin, clearSamitySession, setSamitySession } from "@/lib/auth";
import { toLatin } from "@/lib/shared";

export async function POST(req: Request) {
  const b = await readJson(req);
  const code = toLatin(str(b.code, 30)).toLowerCase();
  const pin = toLatin(str(b.pin, 20));
  if (!code || !pin) return fail("কোড ও পিন লিখুন");
  const s = await (await getDb()).collection("samities").findOne({ code });
  if (!s || !checkPin(pin, s.pin)) return fail("সমিতি কোড বা পিন ভুল", 401);
  await setSamitySession({ samityId: String(s._id), code });
  return ok({ id: String(s._id) });
}

export async function DELETE() {
  await clearSamitySession();
  return ok({ loggedOut: true });
}
