import { getDb } from "@/lib/db";
import { fail, ok, readJson, str } from "@/lib/api";
import { CATN } from "@/lib/shared";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cat = url.searchParams.get("cat");
  const q = str(url.searchParams.get("q"), 100);
  const filter: Record<string, unknown> = {};
  if (cat && CATN[cat]) filter.cat = cat;
  if (q) {
    // Substring match works better than $text for Bengali, which Mongo does not stem.
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ title: rx }, { body: rx }, { upz: rx }];
  }
  const db = await getDb();
  const docs = await db
    .collection("questions")
    .aggregate([
      { $match: filter },
      { $sort: { at: -1 } },
      { $limit: 300 },
      { $lookup: { from: "answers", localField: "_id", foreignField: "qid", as: "a", pipeline: [{ $project: { role: 1 } }] } },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          name: 1,
          upz: 1,
          cat: 1,
          title: 1,
          at: 1,
          resolved: 1,
          answers: { $size: "$a" },
          expertAnswered: { $in: ["expert", "$a.role"] },
        },
      },
    ])
    .toArray();
  return ok(docs);
}

export async function POST(req: Request) {
  const b = await readJson(req);
  const d = {
    name: str(b.name, 60),
    upz: str(b.upz, 80),
    cat: str(b.cat, 20),
    title: str(b.title, 140),
    body: str(b.body, 3000),
  };
  if (!d.name || !d.upz || !d.title || !d.body) return fail("সব ঘর পূরণ করুন");
  if (!CATN[d.cat]) return fail("বিষয় বাছাই করুন");
  const db = await getDb();
  const r = await db.collection("questions").insertOne({ ...d, at: Date.now(), resolved: false });
  return ok({ id: String(r.insertedId) }, 201);
}
