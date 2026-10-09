// Constants and pure helpers shared by server and client code.

export const CATS: [string, string][] = [
  ["savings", "সঞ্চয়"],
  ["training", "প্রশিক্ষণ"],
  ["loan", "ঋণ ও বকনা ক্রয়"],
  ["care", "লালন-পালন ও কৃত্রিম প্রজনন"],
  ["health", "টিকা ও রোগ"],
  ["fodder", "ঘাস ও খাদ্য"],
  ["market", "দুধ বাজারজাতকরণ"],
  ["processing", "দুগ্ধজাত পণ্য"],
  ["manure", "গোবর, বায়োগ্যাস ও ভার্মি কম্পোস্ট"],
  ["investment", "মোটাতাজাকরণ ও বিনিয়োগ"],
  ["organic", "নিরাপদ সবজি ও ফসল"],
  ["other", "অন্যান্য"],
];
export const CATN: Record<string, string> = Object.fromEntries(CATS);

export const ROLES: [string, string][] = [
  ["farmer", "খামারী / সমবায়ী"],
  ["expert", "বিশেষজ্ঞ / চিকিৎসক"],
  ["officer", "সমবায় কর্মকর্তা"],
];
export const ROLEN: Record<string, string> = Object.fromEntries(ROLES);

export const ACTS = [
  "সমবায়ীদের সঞ্চয়ে উদ্বুদ্ধ করা",
  "গাভী পালন বিষয়ক আধুনিক প্রশিক্ষণ",
  "দুটি উন্নত জাতের বকনা ক্রয়ে সহজ শর্তে ঋণ, এক বছর গ্রেস পিরিয়ড",
  "বকনার লালন-পালন, কৃত্রিম প্রজনন ও খাদ্য ক্রয়ে সহজ শর্তে ঋণ",
  "টিকা এবং ঘাসের কাটিং বা বীজ সরবরাহ",
  "উৎপাদিত দুধ বাজারজাতকরণে সহযোগিতা",
  "দুগ্ধজাত পণ্য উৎপাদনে সহযোগিতা",
  "গোবর ব্যবস্থাপনা: ভার্মি কম্পোস্ট ও বায়োগ্যাস",
  "সমিতির মূলধনে গরু মোটাতাজাকরণ ও কৃষিভিত্তিক বিনিয়োগ",
  "অর্গানিক ও নিরাপদ সবজি-ফসল চাষে উদ্বুদ্ধকরণ",
];

export const BREEDS = ["শাহীওয়াল ক্রস", "ফ্রিজিয়ান ক্রস", "জার্সি ক্রস", "শাহীওয়াল", "দেশি", "অন্যান্য"];

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[+d]);

/** Accepts Bengali or Latin digits typed by users. */
export const toLatin = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

export const money = (n: number) =>
  "৳" + bn(n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));

export const liters = (n: number) => bn(+n.toFixed(2)) + " লি.";

export function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "এইমাত্র";
  if (m < 60) return bn(m) + " মিনিট আগে";
  const h = Math.floor(m / 60);
  if (h < 24) return bn(h) + " ঘণ্টা আগে";
  const d = Math.floor(h / 24);
  if (d < 30) return bn(d) + " দিন আগে";
  return fmtDate(new Date(t).toISOString().slice(0, 10));
}

const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

/** "2026-10-09" → "৯ অক্টোবর ২০২৬" */
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${bn(d)} ${MONTHS[m - 1]} ${bn(y)}`;
}
/** "2026-10" → "অক্টোবর ২০২৬" */
export const fmtMonth = (ym: string) => `${MONTHS[+ym.slice(5, 7) - 1]} ${bn(ym.slice(0, 4))}`;

/** Local calendar date as YYYY-MM-DD (Bangladesh users, so avoid UTC shift). */
export function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

/* ---------- Milk pricing ---------- */

export type PriceRule = { baseRate: number; stdFat: number; perPoint: number };
export const DEFAULT_PRICE: PriceRule = { baseRate: 60, stdFat: 3.5, perPoint: 1 };

/** Taka per liter: base rate adjusted by `perPoint` taka for every 0.1% fat above/below standard. */
export function ratePerLiter(fat: number | null | undefined, rule: PriceRule) {
  if (fat == null || !Number.isFinite(fat)) return rule.baseRate;
  const r = rule.baseRate + Math.round((fat - rule.stdFat) * 10) * rule.perPoint;
  return Math.max(0, +r.toFixed(2));
}

/* ---------- Breeding calendar (cattle) ---------- */

export const GESTATION_DAYS = 283;

export type Milestone = { key: string; label: string; hint: string; date: string };

/** Key dates after an artificial insemination (AI). */
export function breedingPlan(aiDate: string): Milestone[] {
  return [
    { key: "heat", label: "হিট ফিরে আসে কিনা দেখুন", hint: "১৮–২৪ দিনের মধ্যে আবার গরম হলে গর্ভধারণ হয়নি, আবার কৃত্রিম প্রজনন করান।", date: addDays(aiDate, 21) },
    { key: "pd", label: "গর্ভ পরীক্ষা", hint: "৬০–৯০ দিনে প্রাণিসম্পদ অফিস বা AI কর্মীকে দিয়ে গর্ভ নিশ্চিত করুন।", date: addDays(aiDate, 60) },
    { key: "dry", label: "দুধ দোহন বন্ধ (ড্রাই পিরিয়ড)", hint: "প্রসবের ৬০ দিন আগে দোহন বন্ধ করুন, যাতে ওলান বিশ্রাম পায় ও পরের দুধ বাড়ে।", date: addDays(aiDate, GESTATION_DAYS - 60) },
    { key: "steam", label: "বাড়তি দানাদার খাদ্য শুরু", hint: "প্রসবের ৩ সপ্তাহ আগে থেকে দানাদার খাদ্য ধীরে ধীরে বাড়ান, ক্যালসিয়াম-খনিজ দিন।", date: addDays(aiDate, GESTATION_DAYS - 21) },
    { key: "calving", label: "সম্ভাব্য বাচ্চা প্রসব", hint: "পরিষ্কার, শুকনো জায়গা প্রস্তুত রাখুন। জন্মের ১ ঘণ্টার মধ্যে বাছুরকে শাল দুধ খাওয়ান।", date: addDays(aiDate, GESTATION_DAYS) },
  ];
}

/** After calving: when to start watching for heat and when to re-inseminate. */
export function postCalvingPlan(calvedDate: string): Milestone[] {
  return [
    { key: "vaccine", label: "বাছুরের কৃমিনাশক ও টিকা", hint: "জন্মের ১ মাসে কৃমিনাশক দিন, প্রাণিসম্পদ অফিসের পরামর্শে টিকা দিন।", date: addDays(calvedDate, 30) },
    { key: "reai", label: "আবার কৃত্রিম প্রজননের সময়", hint: "প্রসবের ৬০–৯০ দিনের মধ্যে গরম হলে প্রজনন করান, তাহলে বছরে একটি বাছুর পাবেন।", date: addDays(calvedDate, 60) },
  ];
}

/* ---------- Bangla calendar (Bangladesh revised, 2019) ---------- */

const BN_MONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
const SEASONS = ["গ্রীষ্ম", "বর্ষা", "শরৎ", "হেমন্ত", "শীত", "বসন্ত"];
const WEEKDAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

/** "2026-10-09" → { day: 24, month: "আশ্বিন", year: 1433, season: "শরৎ" }. Pohela Boishakh is 14 April. */
export function banglaDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const afterNewYear = m > 4 || (m === 4 && d >= 14);
  const startYear = afterNewYear ? y : y - 1;
  let n = daysBetween(`${startYear}-04-14`, iso);
  // Falgun falls in the next Gregorian year; it has 30 days when that year is a leap year.
  const leap = ((startYear + 1) % 4 === 0 && (startYear + 1) % 100 !== 0) || (startYear + 1) % 400 === 0;
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
  let i = 0;
  while (n >= lengths[i]) n -= lengths[i++];
  return { day: n + 1, month: BN_MONTHS[i], year: startYear - 593, season: SEASONS[Math.floor(i / 2)] };
}

export const weekday = (iso: string) => WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()];
