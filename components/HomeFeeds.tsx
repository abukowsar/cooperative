"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { api } from "./client";
import { ago, bn, CATN, fmtDate, today } from "@/lib/shared";

type Q = { id: string; title: string; cat: string; upz: string; at: number; answers: number; resolved: boolean };
type T = { id: string; title: string; date: string; venue: string; seats: number; registered: number };

const TIPS = [
  "গাভীকে দিনে অন্তত ৩ বার পরিষ্কার পানি দিন; প্রতি লিটার দুধের জন্য প্রায় ৪ লিটার পানি লাগে।",
  "দোহনের পর ৩০ মিনিট গাভীকে দাঁড় করিয়ে রাখুন (খাবার দিন), এতে ওলান ফোলা রোগ কমে।",
  "দানাদার খাদ্য দুধ দোহনের সময় বা পরে দিন, ঘাসের সাথে মিশিয়ে দিলে হজম ভালো হয়।",
  "গোয়ালঘর শুকনো রাখুন; মেঝে ঢালু হলে প্রস্রাব জমে না, খুরের রোগও কম হয়।",
  "বর্ষার আগে গলাফোলা ও বাদলা রোগের টিকা দিয়ে নিন। উপজেলা প্রাণিসম্পদ অফিসে স্বল্পমূল্যে পাওয়া যায়।",
  "গরম কালে দুপুরে গাভীর গায়ে পানি দিন ও ছায়ায় রাখুন; গরমে দুধ ২০–৩০% পর্যন্ত কমে যেতে পারে।",
  "প্রসবের পর গর্ভফুল ১২ ঘণ্টার মধ্যে না পড়লে নিজে টানবেন না, ভেটেরিনারি চিকিৎসক ডাকুন।",
  "প্রতিদিনের দুধের হিসাব লিখে রাখুন; হঠাৎ দুধ কমলে তা রোগের প্রথম লক্ষণ হতে পারে।",
  "গোবর ফেলে না রেখে বায়োগ্যাস বা ভার্মি কম্পোস্টে ব্যবহার করুন, রান্নার খরচ ও সারের খরচ দুটোই কমবে।",
  "বাছুরকে জন্মের প্রথম ঘণ্টায় শাল দুধ খাওয়ানো তার রোগ প্রতিরোধ ক্ষমতার জন্য সবচেয়ে জরুরি।",
];

export function DailyTip() {
  const n = Math.floor(Date.now() / 86400000) % TIPS.length;
  return (
    <div className="card hue-gold" style={{ background: "linear-gradient(120deg,var(--hue-soft),var(--surface) 70%)", gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
      <span className="ic" style={{ width: 46, height: 46, borderRadius: 14, display: "grid", placeItems: "center", background: "var(--hue)", color: "#fff" }}>
        <Lightbulb size={24} aria-hidden />
      </span>
      <div>
        <div className="eyebrow">আজকের খামার টিপ</div>
        <div style={{ fontSize: 17 }} suppressHydrationWarning>{TIPS[n]}</div>
      </div>
    </div>
  );
}

export function LatestQuestions() {
  const [qs, setQs] = useState<Q[] | null>(null);
  useEffect(() => {
    api<Q[]>("/api/questions").then((r) => setQs(r.slice(0, 4))).catch(() => setQs([]));
  }, []);
  return (
    <div className="card">
      <div className="row-between">
        <h3>সাম্প্রতিক প্রশ্ন</h3>
        <Link href="/forum" className="btn ghost small">সব দেখুন <ArrowRight size={15} /></Link>
      </div>
      {qs == null ? <p className="hint">লোড হচ্ছে…</p> : qs.length === 0 ? (
        <p className="hint" style={{ margin: 0 }}>এখনো কোনো প্রশ্ন নেই। <Link href="/forum">প্রথম প্রশ্নটি করুন</Link>।</p>
      ) : (
        <div className="qlist">
          {qs.map((q) => (
            <Link key={q.id} href="/forum" className="q" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="q-head" style={{ cursor: "pointer" }}>
                <div className={`tally ${q.resolved ? "done" : q.answers ? "ans" : ""}`}><b>{bn(q.answers)}</b>পরামর্শ</div>
                <div style={{ minWidth: 0 }}>
                  <div className="q-title">{q.title}</div>
                  <div className="meta"><span className="tag">{CATN[q.cat]}</span><span>{q.upz}</span><span>{ago(q.at)}</span></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function UpcomingTrainings() {
  const [ts, setTs] = useState<T[] | null>(null);
  useEffect(() => {
    api<T[]>("/api/trainings").then((r) => setTs(r.filter((t) => t.date >= today()).slice(0, 3))).catch(() => setTs([]));
  }, []);
  return (
    <div className="card">
      <div className="row-between">
        <h3>আসন্ন প্রশিক্ষণ</h3>
        <Link href="/training" className="btn ghost small">সব দেখুন <ArrowRight size={15} /></Link>
      </div>
      {ts == null ? <p className="hint">লোড হচ্ছে…</p> : ts.length === 0 ? (
        <p className="hint" style={{ margin: 0 }}>এই মুহূর্তে কোনো প্রশিক্ষণ ঘোষণা নেই। নতুন প্রশিক্ষণ এলে এখানে দেখা যাবে।</p>
      ) : (
        <div className="tasks">
          {ts.map((t) => (
            <Link key={t.id} href="/training" className="task soon" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="when"><b>{fmtDate(t.date).split(" ").slice(0, 2).join(" ")}</b></div>
              <div><strong>{t.title}</strong><p>{t.venue} · {bn(Math.max(0, t.seats - t.registered))} আসন বাকি</p></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
