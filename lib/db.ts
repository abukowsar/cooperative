import { MongoClient, Db, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is missing from .env.local");

// Reuse one client across hot reloads in dev and across requests in prod.
const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexed?: Promise<void> };

// A failed connect (e.g. IP not yet allowed in Atlas) is forgotten so the next request retries.
function client() {
  return (g._mongo ??= new MongoClient(uri!, { serverSelectionTimeoutMS: 10000 }).connect().catch((e) => {
    g._mongo = undefined;
    throw e;
  }));
}

export async function getDb(): Promise<Db> {
  const db = (await client()).db(process.env.MONGODB_DB || "dairy_coop");
  g._indexed ??= ensureIndexes(db).catch((e) => {
    g._indexed = undefined;
    throw e;
  });
  await g._indexed;
  return db;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("questions").createIndex({ at: -1 }),
    db.collection("questions").createIndex({ title: "text", body: "text", upz: "text" }),
    db.collection("answers").createIndex({ qid: 1, at: 1 }),
    db.collection("experts").createIndex({ at: -1 }),
    db.collection("samities").createIndex({ code: 1 }, { unique: true }),
    db.collection("members").createIndex({ samityId: 1, no: 1 }, { unique: true }),
    db.collection("milk").createIndex({ samityId: 1, date: 1, memberId: 1, shift: 1 }, { unique: true }),
    db.collection("cows").createIndex({ samityId: 1, at: -1 }),
    db.collection("savings").createIndex({ samityId: 1, date: -1 }),
    db.collection("loans").createIndex({ samityId: 1, at: -1 }),
    db.collection("trainings").createIndex({ date: 1 }),
    db.collection("trainingRegs").createIndex({ tid: 1, phone: 1 }, { unique: true }),
  ]);
}

export function oid(id: string): ObjectId | null {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
}

/** Converts Mongo's _id to a plain string id for JSON responses. */
export function plain<T extends { _id: ObjectId }>(doc: T) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}
