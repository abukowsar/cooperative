import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import HeroArt from "@/components/HeroArt";
import Stats from "@/components/Stats";
import Icon from "@/components/Icon";
import { DailyTip, LatestQuestions, UpcomingTrainings } from "@/components/HomeFeeds";
import { FEATURES } from "@/lib/content";
import { bn } from "@/lib/shared";

const STEPS = [
  ["সমিতি নিবন্ধন", "সমিতির কোড ও পিন দিয়ে একবার নিবন্ধন করুন। মোবাইল থেকেই চলবে।"],
  ["সদস্য যোগ", "সদস্যদের নাম ও নম্বর দিয়ে তালিকা তৈরি করুন।"],
  ["প্রতিদিন হিসাব", "দুধ, সঞ্চয় ও ঋণ আদায় লিখুন। দাম ও পাওনা নিজে থেকেই হিসাব হবে।"],
  ["মাস শেষে প্রিন্ট", "সদস্যভিত্তিক পাওনা প্রিন্ট করে নোটিশ বোর্ডে দিন।"],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <span className="kicker"><Sparkles size={14} aria-hidden /> সমবায় অধিদপ্তর · ৫০ থেকে ৮১ উপজেলায় সম্প্রসারিত</span>
          <h1>খামারীর পাশে, <em>সমিতির হাতে</em> ডিজিটাল খাতা</h1>
          <p>প্রশ্ন করুন বিশেষজ্ঞকে, দুধ-সঞ্চয়-ঋণের হিসাব রাখুন মোবাইলে, আর গাভীর প্রজনন থেকে বায়োগ্যাস পর্যন্ত সব হিসাব করুন এক জায়গায়।</p>
          <div className="hero-ctas">
            <Link href="/forum" className="btn">সমস্যা জানান <ArrowRight size={16} /></Link>
            <Link href="/samity" className="btn ghost">সমিতির খাতা খুলুন</Link>
          </div>
          <Stats />
        </div>
        <div className="hero-art"><HeroArt /></div>
      </section>

      <div className="section"><DailyTip /></div>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">প্রকল্পের ১০টি কার্যক্রম</div>
            <h2>প্রতিটি কাজের জন্য একটি ডিজিটাল টুল</h2>
            <p>প্রকল্পের প্রতিটি কার্যক্রমের সাথে মিলিয়ে তৈরি সহজ টুল। যেকোনোটিতে চাপ দিয়ে শুরু করুন।</p>
          </div>
        </div>
        <div className="features">
          {FEATURES.map((f) => (
            <Link key={f.n} href={f.href} className={`feature hue-${f.hue}`}>
              <span className="num">{bn(f.n)}</span>
              <span className="ic"><Icon name={f.icon} size={24} /></span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span className="go">{f.cta} <ArrowRight size={15} aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section split">
        <LatestQuestions />
        <UpcomingTrainings />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">সমিতির ব্যবস্থাপকদের জন্য</div>
            <h2>চার ধাপে কাগজের খাতা থেকে ডিজিটাল খাতায়</h2>
          </div>
          <Link href="/samity" className="btn">এখনই শুরু করুন <ArrowRight size={16} /></Link>
        </div>
        <ol className="acts">
          {STEPS.map(([t, d], i) => (
            <li key={t}><span className="n">{bn(i + 1)}</span><span><strong>{t}</strong><br /><span className="hint">{d}</span></span></li>
          ))}
        </ol>
      </section>
    </>
  );
}
