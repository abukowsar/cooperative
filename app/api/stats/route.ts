import { getDb } from "@/lib/db";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const [questions, answers, experts, samities, trainings] = await Promise.all(
    ["questions", "answers", "experts", "samities", "trainings"].map((c) => db.collection(c).estimatedDocumentCount()),
  );
  return ok({ questions, answers, experts, samities, trainings });
}
