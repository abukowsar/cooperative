import Link from "next/link";
import { Facebook, MapPin, UserRound, Youtube } from "lucide-react";
import BackToTop from "./BackToTop";
import { bn } from "@/lib/shared";

const SECTIONS = [
  ["/forum", "সমস্যা ও পরামর্শ"],
  ["/samity", "সমিতির ডিজিটাল খাতা"],
  ["/samity/breeding", "প্রজনন ক্যালেন্ডার"],
  ["/training", "প্রশিক্ষণ"],
  ["/learn", "জ্ঞানভাণ্ডার"],
  ["/experts", "বিশেষজ্ঞ তালিকা"],
];

const TOOLS = [
  ["/tools#loan", "ঋণ ও কিস্তি ক্যালকুলেটর"],
  ["/tools#feed", "দৈনিক খাদ্য তালিকা"],
  ["/tools#vaccine", "টিকার সময়সূচি"],
  ["/tools#dairy", "দুগ্ধজাত পণ্যের লাভ"],
  ["/tools#biogas", "বায়োগ্যাস ও কম্পোস্ট"],
  ["/tools#fattening", "মোটাতাজাকরণের হিসাব"],
];

const PARTNERS = ["প্রাণিসম্পদ অধিদপ্তর", "মিল্কভিটা", "ব্র্যাক এআই", "আরডিএ, বগুড়া", "বার্ড, কুমিল্লা", "বাকৃবি", "সিভাসু", "ইডকল", "সমবায় একাডেমী"];

/** Rolling pasture with a grazing cow, sitting on top of the footer. */
function Pasture() {
  return (
    <svg className="pasture" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
      <path className="hill-back" d="M0 70 C 180 30 340 30 520 58 S 860 96 1040 60 S 1320 20 1440 44 V120 H0Z" />
      <path className="hill-front" d="M0 92 C 220 60 420 64 640 84 S 1040 112 1240 82 S 1400 70 1440 74 V120 H0Z" />
    </svg>
  );
}

function GrazingCow() {
  return (
    <svg className="grazer" viewBox="0 0 120 70" aria-hidden>
      <g className="cow-body">
        <rect x="22" y="14" width="70" height="34" rx="16" fill="#FFFDF8" />
        <path d="M40 15c8 3 10 13 3 19-6 5-16 3-19-3 2-9 8-15 16-16Z" fill="#2B211B" />
        <path d="M72 24c6-2 14 0 16 7 1 6-3 11-10 11-6 0-11-4-11-10 0-4 2-7 5-8Z" fill="#2B211B" />
        <g fill="#2B211B"><rect x="30" y="44" width="7" height="20" rx="3" /><rect x="42" y="45" width="7" height="19" rx="3" /><rect x="70" y="45" width="7" height="19" rx="3" /><rect x="81" y="44" width="7" height="20" rx="3" /></g>
        <ellipse cx="58" cy="47" rx="8" ry="4" fill="#F6B8B3" />
        <path d="M92 24c4 1 6 6 5 12" stroke="#2B211B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* head lowered to graze */}
        <g className="cow-head">
          <rect x="4" y="32" width="22" height="28" rx="10" fill="#FFFDF8" />
          <rect x="5" y="49" width="20" height="12" rx="6" fill="#F6B8B3" />
          <circle cx="11" cy="41" r="1.8" fill="#1D1A18" />
          <ellipse cx="2" cy="34" rx="5" ry="3" fill="#FFFDF8" transform="rotate(-30 2 34)" />
          <path d="M8 31c-3-4-7-4-8-2" stroke="#E7D6B8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g stroke="#7CC46A" strokeWidth="2" strokeLinecap="round"><path d="M6 68l-2-6M10 68v-8M14 68l2-6" /></g>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="site-foot no-print">
      <div className="foot-top">
        <Pasture />
        <GrazingCow />
      </div>
      <div className="foot-main">
        <div className="wrap foot-grid">
          <div className="foot-brand">
            <div className="foot-logo">
              <span className="brand-mark"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden><path d="M8 2h8l-1 4 2.5 3.5c.33.46.5 1 .5 1.57V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8.93c0-.57.17-1.11.5-1.57L9 6 8 2Z" fill="#fff" /><path d="M6.2 13.5c2-1.2 3.9-1.2 5.8 0s3.9 1.2 5.8 0V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6.5Z" fill="#FFD87A" /></svg></span>
              <b>দুগ্ধ সমবায় পোর্টাল</b>
            </div>
            <p>দুগ্ধ চাষী ও খামারীদের সমবায়ে সংগঠিত করে উন্নত জাতের গাভী পালনের মাধ্যমে দুধের উৎপাদন বাড়ানো। এখন ৮১টি উপজেলায়।</p>
            <div className="foot-goals"><span>দুধ উৎপাদন বৃদ্ধি</span><span>কর্মসংস্থান</span><span>নারীর ক্ষমতায়ন</span></div>
          </div>

          <nav aria-label="বিভাগ">
            <h4>বিভাগ</h4>
            <ul>{SECTIONS.map(([href, l]) => <li key={href}><Link href={href}>{l}</Link></li>)}</ul>
          </nav>

          <nav aria-label="খামার টুলস">
            <h4>খামার টুলস</h4>
            <ul>{TOOLS.map(([href, l]) => <li key={href}><Link href={href}>{l}</Link></li>)}</ul>
          </nav>

          <div>
            <h4>যোগাযোগ</h4>
            <ul className="foot-contact">
              <li><UserRound size={16} aria-hidden /><span><b>তোফায়েল আহম্মদ</b><br />প্রকল্প পরিচালক (যুগ্ম-নিবন্ধক)</span></li>
              <li><MapPin size={16} aria-hidden /><span>সমবায় অধিদপ্তর, পল্লী উন্নয়ন ও সমবায় বিভাগ</span></li>
            </ul>
            <div className="foot-social">
              <a href="https://www.facebook.com/share/g/1By3MpRsVw/" target="_blank" rel="noopener noreferrer" aria-label="ফেসবুক গ্রুপ"><Facebook size={18} /></a>
              <a href="https://youtube.com/@tofayelahamed9004" target="_blank" rel="noopener noreferrer" aria-label="ইউটিউব চ্যানেল"><Youtube size={18} /></a>
              <a href="https://www.facebook.com/profile.php?id=61555812547446" target="_blank" rel="noopener noreferrer" aria-label="প্রকল্প পরিচালকের ফেসবুক"><UserRound size={18} /></a>
            </div>
          </div>
        </div>

        <div className="wrap foot-partners">
          <span>অংশীদার</span>
          {PARTNERS.map((p) => <em key={p}>{p}</em>)}
        </div>

        <div className="foot-bottom">
          <div className="wrap">
            <span>© {bn(new Date().getFullYear())} সমবায় অধিদপ্তর · ১০টি কার্যক্রম, একটি পোর্টাল</span>
            <Link href="/about">প্রকল্প পরিচিতি</Link>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
