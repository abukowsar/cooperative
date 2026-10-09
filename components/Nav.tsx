"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen, Calculator, CalendarHeart, GraduationCap, Grid2x2, Home, Info, MessageCircle, Moon, NotebookPen, Sun, Users,
} from "lucide-react";
import { CalendarDays, Facebook, MessageCirclePlus, Youtube } from "lucide-react";
import { lsSet } from "./client";
import { banglaDate, bn, fmtDate, today, weekday } from "@/lib/shared";

const LINKS = [
  { href: "/", label: "হোম", icon: Home, hue: "green" },
  { href: "/forum", label: "পরামর্শ", icon: MessageCircle, hue: "sky" },
  { href: "/samity", label: "সমিতির খাতা", icon: NotebookPen, hue: "gold" },
  { href: "/samity/breeding", label: "প্রজনন", icon: CalendarHeart, hue: "rose" },
  { href: "/tools", label: "খামার টুলস", icon: Calculator, hue: "teal" },
  { href: "/training", label: "প্রশিক্ষণ", icon: GraduationCap, hue: "violet" },
  { href: "/learn", label: "জ্ঞানভাণ্ডার", icon: BookOpen, hue: "leaf" },
  { href: "/experts", label: "বিশেষজ্ঞ", icon: Users, hue: "orange" },
  { href: "/about", label: "প্রকল্প", icon: Info, hue: "brown" },
];
const BOTTOM = ["/", "/forum", "/samity", "/tools"];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || (href !== "/samity" && path.startsWith(href + "/")));

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 2h8l-1 4 2.5 3.5c.33.46.5 1 .5 1.57V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8.93c0-.57.17-1.11.5-1.57L9 6 8 2Z" fill="#fff" fillOpacity=".95" />
      <path d="M6.2 13.5c2-1.2 3.9-1.2 5.8 0s3.9 1.2 5.8 0V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6.5Z" fill="#FFD87A" />
      <path d="M12 15.2c-.9 1.2-1.4 2-1.4 2.6a1.4 1.4 0 0 0 2.8 0c0-.6-.5-1.4-1.4-2.6Z" fill="#0F7F5C" />
    </svg>
  );
}

/** Gregorian + Bangla calendar date with season, computed on the client to match the viewer's day. */
function TodayLine() {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => setD(today()), []);
  if (!d) return <span className="infostrip-date" />;
  const b = banglaDate(d);
  return (
    <span className="infostrip-date">
      <CalendarDays size={13} aria-hidden /> {weekday(d)}, {fmtDate(d)}
      <span className="sep">·</span>{bn(b.day)} {b.month} {bn(b.year)} বঙ্গাব্দ
      <span className="season">{b.season}কাল</span>
    </span>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches));
  }, []);
  return (
    <button className="iconbtn" aria-label={dark ? "লাইট মোড" : "ডার্ক মোড"} title={dark ? "লাইট মোড" : "ডার্ক মোড"} onClick={() => {
      const next = dark ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      lsSet("theme", next);
      setDark(!dark);
    }}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function Nav() {
  const path = usePathname();
  const [sheet, setSheet] = useState(false);
  useEffect(() => setSheet(false), [path]);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <div className="infostrip no-print">
        <div className="wrap">
          <span className="infostrip-dept">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · সমবায় অধিদপ্তর</span>
          <TodayLine />
          <span className="infostrip-social">
            <a href="https://www.facebook.com/share/g/1By3MpRsVw/" target="_blank" rel="noopener noreferrer" aria-label="ফেসবুক গ্রুপ"><Facebook size={14} /></a>
            <a href="https://youtube.com/@tofayelahamed9004" target="_blank" rel="noopener noreferrer" aria-label="ইউটিউব চ্যানেল"><Youtube size={15} /></a>
          </span>
        </div>
      </div>

      <header className={`topbar no-print ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap brandrow">
          <Link href="/" className="brand" aria-label="দুগ্ধ সমবায় পোর্টাল, হোম">
            <span className="brand-mark"><Logo /><i className="drip" aria-hidden /></span>
            <span>
              <b>দুগ্ধ সমবায় পোর্টাল</b>
              <small>দুগ্ধ ঘাটতি উপজেলায় দুগ্ধ সমবায়ের কার্যক্রম সম্প্রসারণ প্রকল্প</small>
            </span>
          </Link>
          <div className="brandrow-actions">
            <Link href="/forum" className="btn cta"><MessageCirclePlus size={17} aria-hidden /> <span>সমস্যা জানান</span></Link>
            <ThemeToggle />
          </div>
        </div>
        <nav className="navrow" aria-label="প্রধান মেনু">
          <div className="wrap navlinks">
            {LINKS.map(({ href, label, icon: I, hue }) => (
              <Link key={href} href={href} className={`hue-${hue}`} aria-current={isActive(path, href) ? "page" : undefined}>
                <I size={16} aria-hidden /> {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="ribbon" aria-hidden />
      </header>

      <nav className="bottomnav no-print" aria-label="মোবাইল মেনু">
        {LINKS.filter((l) => BOTTOM.includes(l.href)).map(({ href, label, icon: I }) => (
          <Link key={href} href={href} aria-current={isActive(path, href) ? "page" : undefined}>
            <I size={22} aria-hidden /> {label.split(" ")[0]}
          </Link>
        ))}
        <button onClick={() => setSheet(true)} aria-expanded={sheet} aria-current={!BOTTOM.some((h) => isActive(path, h)) ? "page" : undefined}>
          <Grid2x2 size={22} aria-hidden /> আরও
        </button>
      </nav>

      {sheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setSheet(false)} />
          <div className="sheet" role="dialog" aria-label="সব বিভাগ">
            <div className="grab" />
            <div className="sheet-grid">
              {LINKS.map(({ href, label, icon: I, hue }) => (
                <Link key={href} href={href} className={`hue-${hue}`}>
                  <span><I size={22} aria-hidden /></span>{label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
