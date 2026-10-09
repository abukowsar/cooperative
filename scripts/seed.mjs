// Seeds realistic Bengali test data. Every seeded document carries `seed: true`.
//
//   npm run seed           → remove old seed data, insert fresh
//   npm run seed -- --clear → only remove seed data
//
// Demo samity login: code "demo-samity", PIN "1234".
// Names and phone numbers are fictional (phones use the unassigned 01700-0000xx range).

import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { MongoClient } from "mongodb";

/* ---------- env ---------- */
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
}
const uri = process.env.MONGODB_URI || env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || env.MONGODB_DB || "dairy_coop";
if (!uri) throw new Error("MONGODB_URI missing");

/* ---------- helpers ---------- */
const DAY = 86400000;
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysAgo = (n) => iso(new Date(Date.now() - n * DAY));
const daysAhead = (n) => iso(new Date(Date.now() + n * DAY));
const hoursAgo = (h) => Date.now() - h * 3600000;
let s = 42; // deterministic pseudo-random so reruns give the same numbers
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const hashPin = (pin) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
};
const PRICE = { baseRate: 62, stdFat: 3.5, perPoint: 1 };
const rate = (fat) => Math.max(0, round(PRICE.baseRate + Math.round((fat - PRICE.stdFat) * 10) * PRICE.perPoint, 2));

/* ---------- forum ---------- */
const QUESTIONS = [
  {
    name: "রহিমা বেগম", upz: "রামগতি, লক্ষ্মীপুর", cat: "health", h: 5, resolved: true,
    title: "গাভীর একটি বাঁট ফুলে গেছে, দুধে ছানা ছানা ভাব",
    body: "আমার ৪ বছরের শাহীওয়াল ক্রস গাভী, দিনে ৯ লিটার দুধ দেয়। ৩ দিন ধরে পেছনের ডান বাঁট শক্ত ও গরম, দুধে ছোট ছোট দলা দেখা যাচ্ছে। গাভী খাওয়া কমিয়ে দিয়েছে।",
    answers: [
      { name: "ডা. মাহফুজুর রহমান", role: "expert", h: 4, helpful: 7, body: "লক্ষণ শুনে ক্লিনিক্যাল ম্যাস্টাইটিস (ওলান প্রদাহ) মনে হচ্ছে। দেরি না করে উপজেলা প্রাণিসম্পদ অফিসে যোগাযোগ করুন, চিকিৎসক বাঁটে ওষুধ (ইন্ট্রাম্যামারি) দেবেন।\n\nততক্ষণ: আক্রান্ত বাঁটের দুধ দিনে ৩–৪ বার পুরোপুরি দোহন করে ফেলে দিন, এই দুধ বাছুরকে বা বিক্রির দুধে মেশাবেন না। আক্রান্ত বাঁট সবশেষে দোহন করুন।" },
      { name: "আব্দুল কাদের", role: "farmer", h: 3, helpful: 3, body: "আমার গাভীরও গত বছর এমন হয়েছিল। চিকিৎসার পর থেকে দোহনের আগে-পরে বাঁট পভিডন আয়োডিনে ডুবাই, আর মেঝে শুকনো রাখি। এরপর আর হয়নি।" },
    ],
  },
  {
    name: "আবুল কাশেম", upz: "সুবর্ণচর, নোয়াখালী", cat: "fodder", h: 22,
    title: "নেপিয়ার ঘাসের কাটিং কোথায় পাব? ১০ শতাংশ জমিতে লাগাতে চাই",
    body: "বাড়ির পাশে ১০ শতাংশ উঁচু জমি আছে। আমার ৩টি গাভী। নেপিয়ার না পাকচং কোনটা ভালো হবে, আর কাটিং কোথায় পাওয়া যায়?",
    answers: [
      { name: "মো. শফিকুল ইসলাম", role: "officer", h: 20, helpful: 4, body: "উপজেলা প্রাণিসম্পদ অফিসে প্রকল্পের আওতায় বিনামূল্যে ঘাসের কাটিং দেওয়া হয়, সমিতির মাধ্যমে চাহিদা দিন। ১০ শতাংশে প্রায় ১,২০০–১,৫০০ কাটিং লাগবে। পাকচং দ্রুত বাড়ে ও নরম, গাভী বেশি পছন্দ করে।" },
    ],
  },
  {
    name: "নাসরিন আক্তার", upz: "শাহজাদপুর, সিরাজগঞ্জ", cat: "care", h: 30,
    title: "কৃত্রিম প্রজননের ২১ দিন পর আবার গরম হয়েছে, কী করব?",
    body: "গত মাসের ১২ তারিখে কৃত্রিম প্রজনন করিয়েছিলাম। আজ সকাল থেকে আবার ডাকছে আর শ্লেষ্মা ঝুলছে। এটা কি দ্বিতীয়বার প্রজনন করানো যাবে?",
    answers: [
      { name: "ডা. ফারহানা ইয়াসমিন", role: "expert", h: 28, helpful: 9, body: "হ্যাঁ, ২১ দিন পর আবার গরম হওয়া মানে আগের বার গর্ভধারণ হয়নি। আজ সকালে লক্ষণ দেখা দিলে আজ বিকেলে প্রজনন করান। পরপর ৩ বার না হলে প্রজননতন্ত্রের সংক্রমণ বা পুষ্টির ঘাটতি পরীক্ষা করাতে হবে; খনিজ মিশ্রণ নিয়মিত দিন।" },
    ],
  },
  {
    name: "জসিম উদ্দিন", upz: "বেড়া, পাবনা", cat: "market", h: 50,
    title: "শীতে দুধের দাম কমে যায়, সমিতি কীভাবে ভালো দাম পেতে পারে?",
    body: "আমাদের সমিতি দিনে প্রায় ৪০০ লিটার দুধ সংগ্রহ করে। শীতকালে ঘোষ ও মিষ্টির দোকান দাম অনেক কমিয়ে দেয়। কোনো উপায় আছে?",
    answers: [
      { name: "মো. শফিকুল ইসলাম", role: "officer", h: 45, helpful: 5, body: "মিল্কভিটার চিলিং সেন্টারের সাথে চুক্তির জন্য জেলা সমবায় অফিসে আবেদন করুন; সারা বছর ফ্যাটভিত্তিক নির্দিষ্ট দাম পাবেন। পাশাপাশি বাড়তি দুধ দিয়ে দই-ঘি তৈরির কথা ভাবুন। পোর্টালের \"দুগ্ধজাত পণ্য\" ক্যালকুলেটরে লাভ হিসাব করে দেখুন।" },
      { name: "সাইফুল আলম", role: "farmer", h: 40, helpful: 2, body: "আমরা সমিতি থেকে একটা ছোট দই ইউনিট করেছি। শীতে বাড়তি দুধ দই বানিয়ে উপজেলা বাজারে দিই, কাঁচা দুধের চেয়ে লিটারে ১৫–২০ টাকা বেশি থাকে।" },
    ],
  },
  {
    name: "মোছা. শাহানাজ পারভীন", upz: "ঘিওর, মানিকগঞ্জ", cat: "loan", h: 70,
    title: "বকনা ক্রয়ের ঋণে গ্রেস পিরিয়ডে কি কিস্তি দিতে হয়?",
    body: "সমিতি থেকে দুটি বকনা কেনার জন্য ঋণ নিতে চাই। শুনেছি ১ বছর গ্রেস পিরিয়ড আছে। এই সময়ে কি কিছুই দিতে হবে না?",
    answers: [
      { name: "রেজাউল করিম", role: "officer", h: 66, helpful: 6, body: "গ্রেস পিরিয়ডে আসলের কিস্তি দিতে হয় না। তবে সার্ভিস চার্জ মাসে মাসে দিতে হবে কিনা তা আপনার সমিতির নীতিমালার উপর নির্ভর করে। পোর্টালের \"খামার টুলস → ঋণ ও কিস্তি\" থেকে দুই নিয়মেই কিস্তি হিসাব করে দেখতে পারবেন।" },
    ],
  },
  {
    name: "আনোয়ার হোসেন", upz: "কালিহাতী, টাঙ্গাইল", cat: "manure", h: 96,
    title: "৫টি গরুর গোবরে কত বড় বায়োগ্যাস প্লান্ট হবে?",
    body: "আমার ৫টি গরু, পরিবারে ৬ জন। এলপিজি সিলিন্ডারে মাসে প্রায় ১,৫০০ টাকা খরচ হয়। বায়োগ্যাস করলে পুরো রান্না চলবে কি?",
    answers: [],
  },
  {
    name: "ফাতেমা খাতুন", upz: "রামগতি, লক্ষ্মীপুর", cat: "processing", h: 120,
    title: "ঘরে ঘি বানালে প্রতি কেজিতে কত লিটার দুধ লাগে?",
    body: "আমাদের গাভীর দুধে ফ্যাট সাধারণত ৪.২%। ঘি বানিয়ে বিক্রি করলে লাভ হবে কিনা বুঝতে চাই।",
    answers: [
      { name: "ডা. মাহফুজুর রহমান", role: "expert", h: 110, helpful: 4, body: "৪.২% ফ্যাটের দুধে প্রায় ২৩–২৫ লিটারে ১ কেজি ঘি হয়। দুধ থেকে সরাসরি না করে আগে ক্রিম সেপারেটর দিয়ে ক্রিম আলাদা করলে আদায় বেশি হয় এবং ছানা/মাঠা আলাদা বিক্রি করা যায়।" },
    ],
  },
  {
    name: "মিজানুর রহমান", upz: "দৌলতপুর, কুষ্টিয়া", cat: "investment", h: 150,
    title: "কোরবানির জন্য ৪ মাসে গরু মোটাতাজা করতে কী খাওয়াব?",
    body: "দুটি দেশি ষাঁড় কিনেছি, ওজন আনুমানিক ১৮০ কেজি করে। স্টেরয়েড ছাড়া প্রাকৃতিকভাবে কীভাবে ওজন বাড়ানো যায়?",
    answers: [
      { name: "ডা. ফারহানা ইয়াসমিন", role: "expert", h: 140, helpful: 8, body: "শুরুতেই কৃমিনাশক দিন ও টিকা দিয়ে নিন। দৈনিক কাঁচা ঘাস ১০–১২ কেজি, খড় ২–৩ কেজি (ইউরিয়া-মোলাসেস দিয়ে প্রক্রিয়াজাত করলে ভালো), আর দানাদার ওজনের ১–১.৫%। প্রচুর পরিষ্কার পানি দিন। এভাবে দিনে ৬০০–৮০০ গ্রাম ওজন বাড়ে। স্টেরয়েড মানুষের স্বাস্থ্যের জন্য ক্ষতিকর ও আইনত দণ্ডনীয়।" },
    ],
  },
  {
    name: "সালমা আক্তার", upz: "সুবর্ণচর, নোয়াখালী", cat: "savings", h: 200,
    title: "সমিতিতে মাসিক সঞ্চয়ের হার কত রাখা ভালো?",
    body: "আমরা ২৫ জন নারী মিলে নতুন সমিতি করেছি। সবাই খুব বেশি টাকা দিতে পারবে না। কত টাকা দিয়ে শুরু করা উচিত?",
    answers: [],
  },
  {
    name: "রফিকুল ইসলাম", upz: "শাহজাদপুর, সিরাজগঞ্জ", cat: "health", h: 260,
    title: "বাছুরের পাতলা পায়খানা, ২ দিন ধরে খাচ্ছে না",
    body: "১৫ দিনের এঁড়ে বাছুর। দুধ খাওয়ার পর হলুদ পাতলা পায়খানা করছে, দুর্বল হয়ে শুয়ে থাকছে।",
    answers: [
      { name: "ডা. মাহফুজুর রহমান", role: "expert", h: 255, helpful: 11, body: "বাছুরের পানিশূন্যতা খুব দ্রুত বিপজ্জনক হয়। এখনই খাবার স্যালাইন (১ লিটার ফুটানো ঠান্ডা পানিতে ১ প্যাকেট) দিনে ৩–৪ বার খাওয়ান, দুধ একবারে বেশি না দিয়ে অল্প অল্প করে দিন। আজই চিকিৎসক দেখান, প্রয়োজনে শিরায় স্যালাইন লাগতে পারে।" },
    ],
  },
];

const EXPERTS = [
  { name: "ডা. মাহফুজুর রহমান", org: "উপজেলা প্রাণিসম্পদ কর্মকর্তা, রামগতি", cat: "health", area: "লক্ষ্মীপুর", phone: "01700000101" },
  { name: "ডা. ফারহানা ইয়াসমিন", org: "ভেটেরিনারি সার্জন, উপজেলা প্রাণিসম্পদ হাসপাতাল", cat: "care", area: "সিরাজগঞ্জ, পাবনা", phone: "01700000102" },
  { name: "মো. শফিকুল ইসলাম", org: "উপজেলা সমবায় অফিসার", cat: "market", area: "নোয়াখালী", phone: "01700000103" },
  { name: "রেজাউল করিম", org: "সহকারী প্রকল্প পরিচালক (ঋণ)", cat: "loan", area: "ঢাকা বিভাগ", phone: "01700000104" },
  { name: "নুসরাত জাহান", org: "প্রশিক্ষক, আঞ্চলিক সমবায় প্রশিক্ষণ ইন্সটিটিউট", cat: "training", area: "কুমিল্লা", phone: "" },
  { name: "মো. আরিফুল হক", org: "এআই টেকনিশিয়ান", cat: "care", area: "শাহজাদপুর, সিরাজগঞ্জ", phone: "01700000106" },
  { name: "তানভীর আহমেদ", org: "বায়োগ্যাস কারিগরি পরামর্শক", cat: "manure", area: "টাঙ্গাইল, ময়মনসিংহ", phone: "01700000107" },
  { name: "শামীমা নাসরিন", org: "দুগ্ধজাত পণ্য উদ্যোক্তা ও প্রশিক্ষক", cat: "processing", area: "বগুড়া", phone: "01700000108" },
];

const TRAININGS = [
  { title: "আধুনিক পদ্ধতিতে গাভী পালন (৫ দিন)", date: daysAhead(9), venue: "উপজেলা সমবায় কার্যালয়, রামগতি", org: "আঞ্চলিক সমবায় প্রশিক্ষণ ইন্সটিটিউট, নোয়াখালী", seats: 30, regs: 18, desc: "গাভীর জাত নির্বাচন, খাদ্য ব্যবস্থাপনা, রোগ প্রতিরোধ ও পরিষ্কার দুধ উৎপাদন। প্রশিক্ষণার্থীদের দৈনিক ভাতা দেওয়া হবে।" },
  { title: "দুগ্ধজাত পণ্য তৈরি: দই, ঘি ও ছানা (৩ দিন)", date: daysAhead(16), venue: "আরডিএ, বগুড়া", org: "পল্লী উন্নয়ন একাডেমী (RDA)", seats: 25, regs: 23, desc: "হাতে-কলমে দই, মিষ্টি দই, ঘি ও ছানা তৈরি; প্যাকেজিং ও বাজারজাতকরণ।" },
  { title: "বায়োগ্যাস ও ভার্মি কম্পোস্ট ব্যবস্থাপনা (২ দিন)", date: daysAhead(24), venue: "উপজেলা পরিষদ হলরুম, কালিহাতী", org: "ইডকল ও সবুজ শক্তি", seats: 40, regs: 9, desc: "প্লান্টের আকার নির্বাচন, রক্ষণাবেক্ষণ, স্লারি ব্যবহার ও কেঁচো সার উৎপাদন।" },
  { title: "সমিতির হিসাব ও সুশাসন (ব্যবস্থাপকদের জন্য)", date: daysAhead(38), venue: "বাংলাদেশ সমবায় একাডেমী, কোটবাড়ী, কুমিল্লা", org: "বাংলাদেশ সমবায় একাডেমী", seats: 35, regs: 4, desc: "সঞ্চয়-ঋণের হিসাব, নিরীক্ষা প্রস্তুতি এবং পোর্টালের ডিজিটাল খাতা ব্যবহার।" },
  { title: "কৃত্রিম প্রজনন ও বাছুর পালন", date: daysAgo(20), venue: "বাকৃবি, ময়মনসিংহ", org: "বাংলাদেশ কৃষি বিশ্ববিদ্যালয়", seats: 30, regs: 30, desc: "হিট চেনা, প্রজননের সঠিক সময় ও নবজাতক বাছুরের যত্ন।" },
];
const REG_NAMES = ["রহিমা বেগম", "আবুল কাশেম", "নাসরিন আক্তার", "জসিম উদ্দিন", "ফাতেমা খাতুন", "মিজানুর রহমান", "সালমা আক্তার", "রফিকুল ইসলাম", "শিউলি রানী", "মো. হাবিবুর রহমান", "পারভীন সুলতানা", "আলমগীর হোসেন"];

/* ---------- demo samity ---------- */
const MEMBERS = [
  ["রহিমা বেগম", "চর আলগী"], ["আবুল কাশেম", "চর আলগী"], ["নাসরিন আক্তার", "চর রমিজ"], ["জসিম উদ্দিন", "চর আলগী"],
  ["ফাতেমা খাতুন", "চর পোড়াগাছা"], ["মো. হাবিবুর রহমান", "চর রমিজ"], ["শিউলি রানী দাস", "চর আলগী"], ["আলমগীর হোসেন", "চর পোড়াগাছা"],
  ["পারভীন সুলতানা", "চর রমিজ"], ["আব্দুল কাদের", "চর আলগী"], ["মোছা. রাশিদা খাতুন", "চর পোড়াগাছা"], ["সাইফুল আলম", "চর রমিজ"],
];
const COWS = [
  { name: "লালী", owner: "রহিমা বেগম", breed: "শাহীওয়াল ক্রস", tag: "BD-LX-1021", ai: 248, pregnant: true },
  { name: "ধলি", owner: "আবুল কাশেম", breed: "ফ্রিজিয়ান ক্রস", tag: "BD-LX-1022", ai: 15, pregnant: null },
  { name: "কালী", owner: "নাসরিন আক্তার", breed: "দেশি", tag: "", ai: 75, pregnant: null },
  { name: "ময়না", owner: "ফাতেমা খাতুন", breed: "শাহীওয়াল ক্রস", tag: "BD-LX-1025", ai: 130, pregnant: true },
  { name: "সোনালী", owner: "শিউলি রানী দাস", breed: "জার্সি ক্রস", tag: "BD-LX-1027", ai: 26, pregnant: false },
  { name: "রাঙা", owner: "আলমগীর হোসেন", breed: "ফ্রিজিয়ান ক্রস", tag: "BD-LX-1028", calved: 45 },
  { name: "চাঁপা", owner: "পারভীন সুলতানা", breed: "শাহীওয়াল", tag: "", ai: 278, pregnant: true },
];

async function clear(db) {
  const samity = await db.collection("samities").findOne({ code: "demo-samity" });
  const out = {};
  for (const c of ["questions", "answers", "experts", "trainings", "trainingRegs"]) out[c] = (await db.collection(c).deleteMany({ seed: true })).deletedCount;
  if (samity) {
    for (const c of ["members", "milk", "savings", "loans", "cows"]) out[c] = (await db.collection(c).deleteMany({ samityId: samity._id })).deletedCount;
    await db.collection("samities").deleteOne({ _id: samity._id });
    out.samities = 1;
  }
  return out;
}

async function seed(db) {
  const seed = true;
  // Forum
  for (const q of QUESTIONS) {
    const { insertedId } = await db.collection("questions").insertOne({
      name: q.name, upz: q.upz, cat: q.cat, title: q.title, body: q.body, at: hoursAgo(q.h), resolved: !!q.resolved, seed,
    });
    if (q.answers.length)
      await db.collection("answers").insertMany(q.answers.map((a) => ({ qid: insertedId, name: a.name, role: a.role, body: a.body, at: hoursAgo(a.h), helpful: a.helpful, seed })));
  }
  await db.collection("experts").insertMany(EXPERTS.map((e, i) => ({ ...e, at: hoursAgo(300 - i * 20), seed })));

  // Trainings
  for (const t of TRAININGS) {
    const { regs, ...doc } = t;
    const { insertedId } = await db.collection("trainings").insertOne({ ...doc, at: Date.now(), seed });
    await db.collection("trainingRegs").insertMany(Array.from({ length: regs }, (_, i) => ({
      tid: insertedId, name: REG_NAMES[i % REG_NAMES.length] + (i >= REG_NAMES.length ? ` (${i + 1})` : ""),
      phone: "017000" + String(10000 + i).slice(-5), samity: i % 3 ? "চর আলগী দুগ্ধ উৎপাদনকারী সমবায় সমিতি" : "", at: hoursAgo(200 - i), seed,
    })));
  }

  // Samity
  const { insertedId: samityId } = await db.collection("samities").insertOne({
    name: "চর আলগী দুগ্ধ উৎপাদনকারী সমবায় সমিতি লি.", upz: "রামগতি, লক্ষ্মীপুর", manager: "মো. নুরুল আমিন",
    code: "demo-samity", pin: hashPin("1234"), price: PRICE, at: Date.now() - 90 * DAY,
  });
  const members = MEMBERS.map(([name, village], i) => ({
    samityId, no: i + 1, name, village, phone: i % 4 === 3 ? "" : "01700000" + String(200 + i), active: i !== 11, at: Date.now() - 90 * DAY,
  }));
  const { insertedIds } = await db.collection("members").insertMany(members);
  const mids = Object.values(insertedIds);

  // Milk: last 60 days, two shifts. Each member has their own yield and fat profile.
  const profile = mids.map((_, i) => ({ base: 3 + (i % 5) * 1.2 + rnd() * 1.5, fat: 3.4 + rnd() * 0.9, skips: i === 7 ? 0.25 : 0.04 }));
  const milk = [];
  for (let d = 60; d >= 0; d--) {
    const date = daysAgo(d);
    for (const shift of ["am", "pm"]) {
      mids.forEach((mid, i) => {
        if (!members[i].active && d < 20) return; // inactive member stopped supplying 20 days ago
        if (rnd() < profile[i].skips) return;
        const liters = round(profile[i].base * (shift === "am" ? 1.1 : 0.9) * (0.85 + rnd() * 0.3), 1);
        const fat = round(profile[i].fat + (rnd() - 0.5) * 0.3, 1);
        const r = rate(fat);
        milk.push({ samityId, date, shift, memberId: mid, liters, fat, rate: r, amount: round(liters * r, 2), at: Date.now() });
      });
    }
  }
  await db.collection("milk").insertMany(milk);

  // Savings: ৳200 monthly deposits for 3 months, a few extra deposits and one withdrawal.
  const savings = [];
  for (let m = 3; m >= 1; m--)
    mids.forEach((mid, i) => {
      if (i === 11 && m === 1) return;
      savings.push({ samityId, memberId: mid, date: daysAgo(m * 30 - 2), amount: i % 3 === 0 ? 500 : 200, note: "মাসিক সঞ্চয়", at: Date.now() });
    });
  savings.push({ samityId, memberId: mids[0], date: daysAgo(12), amount: 1000, note: "বাড়তি সঞ্চয়", at: Date.now() });
  savings.push({ samityId, memberId: mids[3], date: daysAgo(6), amount: -300, note: "চিকিৎসার জন্য উত্তোলন", at: Date.now() });
  await db.collection("savings").insertMany(savings);

  // Loans: two heifer loans in grace, one feed loan with repayments, one in arrears.
  const monthsAgo = (n) => daysAgo(n * 30);
  await db.collection("loans").insertMany([
    { samityId, memberId: mids[0], purpose: "heifer", principal: 160000, rate: 5, graceMonths: 12, termMonths: 36, graceMode: "interest", start: monthsAgo(4), repayments: [1, 2, 3].map((k) => ({ date: monthsAgo(4 - k), amount: 667, at: Date.now() })), at: Date.now() - 4 * 30 * DAY },
    { samityId, memberId: mids[4], purpose: "heifer", principal: 150000, rate: 5, graceMonths: 12, termMonths: 36, graceMode: "capitalize", start: monthsAgo(2), repayments: [], at: Date.now() - 2 * 30 * DAY },
    { samityId, memberId: mids[2], purpose: "feed", principal: 30000, rate: 8, graceMonths: 0, termMonths: 12, graceMode: "interest", start: monthsAgo(6), repayments: [1, 2, 3, 4, 5].map((k) => ({ date: monthsAgo(6 - k), amount: 2610, at: Date.now() })), at: Date.now() - 6 * 30 * DAY },
    { samityId, memberId: mids[7], purpose: "rearing", principal: 40000, rate: 8, graceMonths: 0, termMonths: 18, graceMode: "interest", start: monthsAgo(7), repayments: [1, 2].map((k) => ({ date: monthsAgo(7 - k), amount: 2370, at: Date.now() })), at: Date.now() - 7 * 30 * DAY },
  ]);

  // Cows
  await db.collection("cows").insertMany(COWS.map((c) => {
    const history = [];
    if (c.calved) history.push({ type: "calved", date: daysAgo(c.calved) });
    if (c.ai) {
      history.push({ type: "ai", date: daysAgo(c.ai) });
      if (c.pregnant === true) history.push({ type: "pregnant", date: daysAgo(c.ai - 65) });
      if (c.pregnant === false) history.push({ type: "open", date: daysAgo(c.ai - 21) });
    }
    return {
      samityId, name: c.name, owner: c.owner, tag: c.tag, breed: c.breed,
      aiDate: c.ai ? daysAgo(c.ai) : null, calvedDate: c.calved ? daysAgo(c.calved) : null,
      pregnant: c.pregnant ?? null, history, at: Date.now(),
    };
  }));

  return { questions: QUESTIONS.length, experts: EXPERTS.length, trainings: TRAININGS.length, members: mids.length, milkEntries: milk.length, savings: savings.length, loans: 4, cows: COWS.length };
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
try {
  await client.connect();
  const db = client.db(dbName);
  const removed = await clear(db);
  console.log("Removed old seed data:", removed);
  if (!process.argv.includes("--clear")) {
    console.log("Inserted:", await seed(db));
    console.log('Demo samity login → code: demo-samity  PIN: 1234');
  }
} catch (e) {
  console.error("Seed failed:", e.message);
  if (/SSL|tls|ServerSelection/i.test(e.message)) console.error("→ Atlas blocked this IP. Add it under Network Access in MongoDB Atlas.");
  process.exitCode = 1;
} finally {
  await client.close();
}
