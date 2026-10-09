import { getDb } from "@/lib/db";
import { fail, isDate, num, ok, readJson, str } from "@/lib/api";
import { isModerator } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Trainings sorted by date, with registration counts. */
export async function GET() {
  const docs = await (await getDb())
    .collection("trainings")
    .aggregate([
      { $sort: { date: 1 } },
      { $limit: 200 },
      { $lookup: { from: "trainingRegs", localField: "_id", foreignField: "tid", as: "r", pipeline: [{ $project: { _id: 1 } }] } },
      { $project: { _id: 0, id: { $toString: "$_id" }, title: 1, date: 1, venue: 1, org: 1, seats: 1, desc: 1, registered: { $size: "$r" } } },
    ])
    .toArray();
  return ok(docs);
}

/** Moderator: announce a training. */
export async function POST(req: Request) {
  if (!(await isModerator())) return fail("অনুমতি নেই", 403);
  const b = await readJson(req);
  const d = { title: str(b.title, 120), venue: str(b.venue, 120), org: str(b.org, 120), desc: str(b.desc, 1000) };
  const seats = num(b.seats, 1, 1000);
  if (!d.title || !d.venue) return fail("শিরোনাম ও স্থান লিখুন");
  if (!isDate(b.date)) return fail("তারিখ সঠিক নয়");
  if (seats == null) return fail("আসন সংখ্যা লিখুন");
  const r = await (await getDb()).collection("trainings").insertOne({ ...d, date: b.date, seats: Math.round(seats), at: Date.now() });
  return ok({ id: String(r.insertedId) }, 201);
}
