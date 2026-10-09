"use client";
import { useEffect, useMemo, useState } from "react";
import { Beef, Flame, HandCoins, Info, Store, Syringe, Wheat } from "lucide-react";
import { biogas, dairyProducts, fattening, feedPlan, loanSchedule, addMonths } from "@/lib/calc";
import { VACCINES } from "@/lib/content";
import { bn, fmtDate, money, toLatin, today } from "@/lib/shared";

const TABS = [
  { id: "loan", label: "ঋণ ও কিস্তি", icon: HandCoins, hue: "teal" },
  { id: "feed", label: "দৈনিক খাদ্য", icon: Wheat, hue: "green" },
  { id: "vaccine", label: "টিকার সূচি", icon: Syringe, hue: "red" },
  { id: "dairy", label: "দুগ্ধজাত পণ্য", icon: Store, hue: "violet" },
  { id: "biogas", label: "বায়োগ্যাস ও কম্পোস্ট", icon: Flame, hue: "orange" },
  { id: "fattening", label: "মোটাতাজাকরণ", icon: Beef, hue: "brown" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Tools() {
  const [tab, setTab] = useState<TabId>("loan");
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1) as TabId;
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const hue = TABS.find((t) => t.id === tab)!.hue;

  return (
    <div className="page">
      <div className="seg" role="tablist" aria-label="ক্যালকুলেটর">
        {TABS.map(({ id, label, icon: I }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); history.replaceState(null, "", "#" + id); }}>
            <I size={17} aria-hidden /> {label}
          </button>
        ))}
      </div>
      <div className={`hue-${hue}`}>
        {tab === "loan" && <LoanTool />}
        {tab === "feed" && <FeedTool />}
        {tab === "vaccine" && <VaccineTool />}
        {tab === "dairy" && <DairyTool />}
        {tab === "biogas" && <BiogasTool />}
        {tab === "fattening" && <FattenTool />}
      </div>
    </div>
  );
}

/* ---------- shared bits ---------- */

/** Numeric input that accepts Bengali digits and keeps the raw text while typing. */
function useNum(initial: number) {
  const [raw, setRaw] = useState(String(initial));
  const n = parseFloat(toLatin(raw));
  return { raw, setRaw, n: Number.isFinite(n) ? n : 0 };
}
function Num({ label, f, suffix, hint }: { label: string; f: ReturnType<typeof useNum>; suffix?: string; hint?: string }) {
  return (
    <label>
      <span>{label}{suffix && <span className="hint"> ({suffix})</span>}</span>
      <input inputMode="decimal" value={f.raw} onChange={(e) => f.setRaw(e.target.value)} />
      {hint && <span className="hint" style={{ fontWeight: 400 }}>{hint}</span>}
    </label>
  );
}
const n2 = (x: number, d = 1) => bn(x.toLocaleString("en-IN", { maximumFractionDigits: d }));
const tk = (x: number) => money(Math.round(x));

function Note({ children }: { children: React.ReactNode }) {
  return <p className="disclaimer"><Info size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden /> <span>{children}</span></p>;
}

/* ---------- 1. Loan ---------- */

function LoanTool() {
  const principal = useNum(150000);
  const rate = useNum(5);
  const grace = useNum(12);
  const term = useNum(36);
  const [mode, setMode] = useState<"interest" | "capitalize">("interest");
  const [start, setStart] = useState(today());
  const r = useMemo(
    () => loanSchedule({ principal: principal.n, rate: rate.n, graceMonths: Math.round(grace.n), termMonths: Math.max(1, Math.round(term.n)), graceMode: mode, start }),
    [principal.n, rate.n, grace.n, term.n, mode, start],
  );
  const share = principal.n ? (principal.n / r.totalPaid) * 100 : 0;
  return (
    <div className="split">
      <div className="form">
        <h3>বকনা / খাদ্য ঋণের কিস্তি হিসাব</h3>
        <div className="grid2">
          <Num label="ঋণের পরিমাণ" suffix="৳" f={principal} hint="যেমন: দুটি উন্নত বকনা ক্রয়" />
          <Num label="বার্ষিক সার্ভিস চার্জ" suffix="%" f={rate} hint="ক্রমহ্রাসমান স্থিতির উপর" />
          <Num label="গ্রেস পিরিয়ড" suffix="মাস" f={grace} hint="প্রকল্পে ১ বছর (১২ মাস)" />
          <Num label="কিস্তির সংখ্যা" suffix="মাস" f={term} hint="গ্রেস পিরিয়ডের পরে" />
          <label>বিতরণের তারিখ<input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} /></label>
          <label>গ্রেস পিরিয়ডে
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="interest">শুধু সার্ভিস চার্জ দেবেন</option>
              <option value="capitalize">কিছুই দেবেন না (চার্জ আসলে যোগ হবে)</option>
            </select>
          </label>
        </div>
      </div>
      <div className="result">
        <span className="hint">গ্রেস শেষে মাসিক কিস্তি</span>
        <div className="big">{tk(r.emi)}</div>
        <div className="meter" aria-hidden><div style={{ width: `${share}%`, background: "var(--hue)" }} /><div style={{ flex: 1, background: "var(--gold)" }} /></div>
        <ul className="rlist">
          {r.graceMonthly > 0 && <li><span>গ্রেস পিরিয়ডে মাসিক চার্জ ({bn(Math.round(grace.n))} মাস)</span><b>{tk(r.graceMonthly)}</b></li>}
          <li><span>প্রথম কিস্তির তারিখ</span><b>{fmtDate(addMonths(start, Math.round(grace.n) + 1))}</b></li>
          <li><span>শেষ কিস্তির তারিখ</span><b>{fmtDate(r.rows[r.rows.length - 1].date)}</b></li>
          <li><span><span style={{ color: "var(--hue)" }}>■</span> আসল</span><b>{tk(principal.n)}</b></li>
          <li><span><span style={{ color: "var(--gold)" }}>■</span> মোট সার্ভিস চার্জ</span><b>{tk(r.totalInterest)}</b></li>
          <li><span>সর্বমোট পরিশোধ</span><b>{tk(r.totalPaid)}</b></li>
        </ul>
        <details>
          <summary className="hint" style={{ cursor: "pointer" }}>পুরো কিস্তি তালিকা ({bn(r.rows.length)} মাস)</summary>
          <div className="table-wrap" style={{ marginTop: 8, maxHeight: 320 }}>
            <table>
              <thead><tr><th className="num">মাস</th><th>তারিখ</th><th className="num">কিস্তি</th><th className="num">বাকি</th></tr></thead>
              <tbody>
                {r.rows.map((row) => (
                  <tr key={row.k}><td className="num">{bn(row.k)}</td><td>{fmtDate(row.date)}{row.grace && <span className="hint"> · গ্রেস</span>}</td><td className="num">{tk(row.payment)}</td><td className="num">{tk(row.balance)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <Note>এটি একটি আনুমানিক হিসাব। প্রকৃত শর্ত ও চার্জের হার আপনার সমিতি বা প্রকল্প অফিস থেকে নিশ্চিত হোন।</Note>
      </div>
    </div>
  );
}

/* ---------- 2. Feed ---------- */

function FeedTool() {
  const weight = useNum(300);
  const milk = useNum(10);
  const [pregnant, setPregnant] = useState(false);
  const grassP = useNum(4), strawP = useNum(8), concP = useNum(50), milkP = useNum(60);
  const r = feedPlan({ weight: weight.n, milk: milk.n, pregnant, prices: { grass: grassP.n, straw: strawP.n, conc: concP.n, milk: milkP.n } });
  return (
    <div className="split">
      <div className="form">
        <h3>গাভীর দৈনিক খাদ্য তালিকা</h3>
        <div className="grid2">
          <Num label="গাভীর ওজন" suffix="কেজি" f={weight} hint="বুকের বেড় মেপে আনুমানিক" />
          <Num label="দৈনিক দুধ" suffix="লিটার" f={milk} />
        </div>
        <label className="check"><input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} /> গর্ভের শেষ ৩ মাস চলছে</label>
        <h3 style={{ fontSize: 16 }}>বাজারদর (খরচ হিসাবের জন্য)</h3>
        <div className="grid2">
          <Num label="কাঁচা ঘাস" suffix="৳/কেজি" f={grassP} />
          <Num label="খড়" suffix="৳/কেজি" f={strawP} />
          <Num label="দানাদার মিশ্রণ" suffix="৳/কেজি" f={concP} />
          <Num label="দুধের দাম" suffix="৳/লিটার" f={milkP} />
        </div>
      </div>
      <div className="result">
        <span className="hint">প্রতিদিন খাওয়াবেন</span>
        <div className="kpis">
          <div className="kpi"><span>কাঁচা ঘাস</span><b>{n2(r.grass)} কেজি</b></div>
          <div className="kpi"><span>দানাদার</span><b>{n2(r.conc)} কেজি</b></div>
          <div className="kpi"><span>খড়</span><b>{n2(r.straw)} কেজি</b></div>
          <div className="kpi"><span>পানি</span><b>{n2(r.water, 0)} লি.</b></div>
        </div>
        <ul className="rlist">
          <li><span>লবণ</span><b>{n2(r.salt, 0)} গ্রাম</b></li>
          <li><span>দৈনিক খাদ্য খরচ</span><b>{tk(r.cost)}</b></li>
          <li><span>দৈনিক দুধ বিক্রি</span><b>{tk(r.income)}</b></li>
          <li><span>খাদ্য খরচ বাদে আয়</span><b style={{ color: r.margin >= 0 ? "var(--green-ink)" : "var(--red)" }}>{tk(r.margin)}</b></li>
        </ul>
        <details open>
          <summary className="hint" style={{ cursor: "pointer" }}>{n2(r.conc)} কেজি দানাদার মিশ্রণ যেভাবে বানাবেন</summary>
          <ul className="rlist">{r.mix.map((m) => <li key={m.name}><span>{m.name}</span><b>{n2(m.kg, 2)} কেজি</b></li>)}</ul>
        </details>
        <Note>সাধারণ নিয়ম: শরীর রক্ষায় প্রতি ২০০ কেজি ওজনে ১ কেজি এবং প্রতি ২.৫ লিটার দুধে ১ কেজি দানাদার। জাত ও স্বাস্থ্য অনুযায়ী প্রাণিসম্পদ কর্মকর্তার পরামর্শ নিন।</Note>
      </div>
    </div>
  );
}

/* ---------- 3. Vaccines ---------- */

function VaccineTool() {
  const [last, setLast] = useState<Record<string, string>>({});
  const now = today();
  return (
    <div className="page">
      <Note>সরকারি টিকা উপজেলা প্রাণিসম্পদ অফিসে স্বল্পমূল্যে পাওয়া যায়। শেষ টিকার তারিখ দিলে পরের তারিখ দেখাবে।</Note>
      <div className="vax">
        {VACCINES.map((v) => {
          const next = last[v.key] ? addMonths(last[v.key], v.repeatMonths) : null;
          const overdue = next && next < now;
          return (
            <div key={v.key} className="card">
              <h3>{v.disease}</h3>
              <ul className="rlist">
                <li><span>প্রথম ডোজ</span><b>{v.first}</b></li>
                <li><span>পুনরায়</span><b>প্রতি {bn(v.repeatMonths)} মাসে</b></li>
              </ul>
              <p className="hint" style={{ margin: 0 }}>{v.note}</p>
              <label>শেষ টিকার তারিখ<input type="date" max={now} value={last[v.key] || ""} onChange={(e) => setLast({ ...last, [v.key]: e.target.value })} /></label>
              {next && (
                <div className={overdue ? "notice" : "pill preg"} style={overdue ? { borderColor: "var(--red)", background: "var(--red-soft)" } : { justifySelf: "start", fontSize: 14, padding: "3px 12px" }}>
                  {overdue ? `সময় পেরিয়ে গেছে! ${fmtDate(next)} তারিখে দেওয়ার কথা ছিল` : `পরের টিকা: ${fmtDate(next)}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 4. Dairy products ---------- */

const PRODUCT_N = { ghee: "ঘি", doi: "দই", chhana: "ছানা" } as const;

function DairyTool() {
  const liters = useNum(50), fat = useNum(4), milkP = useNum(60);
  const pGhee = useNum(1500), pDoi = useNum(180), pChhana = useNum(450);
  const cGhee = useNum(80), cDoi = useNum(40), cChhana = useNum(20);
  const rows = dairyProducts({
    liters: liters.n, fat: fat.n, milkPrice: milkP.n,
    price: { ghee: pGhee.n, doi: pDoi.n, chhana: pChhana.n },
    cost: { ghee: cGhee.n, doi: cDoi.n, chhana: cChhana.n },
  });
  const best = rows.reduce((a, b) => (b.gain > a.gain ? b : a));
  return (
    <div className="split">
      <div className="form">
        <h3>কাঁচা দুধ বিক্রি না পণ্য বানাবেন?</h3>
        <div className="grid3">
          <Num label="দুধ" suffix="লিটার" f={liters} />
          <Num label="ফ্যাট" suffix="%" f={fat} />
          <Num label="কাঁচা দুধের দাম" suffix="৳/লি." f={milkP} />
        </div>
        <h3 style={{ fontSize: 16 }}>বিক্রয়মূল্য (৳/কেজি)</h3>
        <div className="grid3"><Num label="ঘি" f={pGhee} /><Num label="দই" f={pDoi} /><Num label="ছানা" f={pChhana} /></div>
        <h3 style={{ fontSize: 16 }}>বাড়তি খরচ: জ্বালানি, চিনি, পাত্র (৳/কেজি)</h3>
        <div className="grid3"><Num label="ঘি" f={cGhee} /><Num label="দই" f={cDoi} /><Num label="ছানা" f={cChhana} /></div>
      </div>
      <div className="result">
        <span className="hint">কাঁচা দুধ বিক্রি করলে পাবেন {tk(rows[0].raw)}। সবচেয়ে লাভজনক:</span>
        <div className="big">{PRODUCT_N[best.key]} {best.gain > 0 ? `+${tk(best.gain)}` : ""}</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>পণ্য</th><th className="num">উৎপাদন</th><th className="num">বিক্রয়</th><th className="num">বাড়তি লাভ</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>{PRODUCT_N[r.key]}</td>
                  <td className="num">{n2(r.kg)} কেজি</td>
                  <td className="num">{tk(r.value)}</td>
                  <td className="num" style={{ color: r.gain >= 0 ? "var(--green-ink)" : "var(--red)", fontWeight: 600 }}>{r.gain >= 0 ? "+" : ""}{tk(r.gain)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>আনুমানিক রূপান্তর: ঘি ফ্যাটের প্রায় ৮৫% আদায়, দই প্রায় সমপরিমাণ, ছানা প্রতি লিটারে প্রায় ১৭০ গ্রাম। বাড়তি লাভ = বিক্রয় − বাড়তি খরচ − কাঁচা দুধের দাম।</Note>
      </div>
    </div>
  );
}

/* ---------- 5. Biogas & compost ---------- */

function BiogasTool() {
  const cows = useNum(4), dung = useNum(10), lpg = useNum(1450);
  const r = biogas(cows.n, dung.n, lpg.n);
  return (
    <div className="split">
      <div className="form">
        <h3>গোবর থেকে গ্যাস ও সার</h3>
        <div className="grid3">
          <Num label="গরুর সংখ্যা" f={cows} />
          <Num label="প্রতি গরুর গোবর" suffix="কেজি/দিন" f={dung} hint="বড় গরু ১০–১৫ কেজি" />
          <Num label="১২ কেজি এলপিজির দাম" suffix="৳" f={lpg} />
        </div>
        <Note>বায়োগ্যাস প্লান্ট স্থাপনে ইডকল (IDCOL) ও সহযোগী প্রতিষ্ঠানের মাধ্যমে সহায়তা পাওয়া যায়।</Note>
      </div>
      <div className="result">
        <span className="hint">প্রতিদিন গ্যাস</span>
        <div className="big">{n2(r.gas, 2)} ঘনমিটার</div>
        <div className="kpis">
          <div className="kpi"><span>চুলা জ্বলবে</span><b>{n2(r.burnerHours)} ঘণ্টা</b><small>প্রতিদিন</small></div>
          <div className="kpi"><span>মাসে সাশ্রয়</span><b>{tk(r.savingMonth)}</b><small>{n2(r.lpgKgMonth)} কেজি এলপিজির সমান</small></div>
          <div className="kpi"><span>ভার্মি কম্পোস্ট</span><b>{n2(r.compostMonth, 0)} কেজি</b><small>প্রতি মাসে</small></div>
        </div>
        <ul className="rlist">
          <li><span>দৈনিক গোবর</span><b>{n2(r.dung, 0)} কেজি</b></li>
          <li><span>উপযুক্ত প্লান্টের আকার</span><b>{r.plant ? `${n2(r.plant)} ঘনমিটার` : "গোবর কম, অন্তত ৩টি গরু দরকার"}</b></li>
          <li><span>পরিবারের রান্নার চাহিদা (৪–৫ জন)</span><b>{r.gas >= 1.5 ? "পূরণ হবে ✓" : "আংশিক পূরণ হবে"}</b></li>
        </ul>
        <Note>ধরা হয়েছে: ১ কেজি গোবরে ০.০৪ ঘনমিটার গ্যাস, চুলায় ঘণ্টায় ০.৪ ঘনমিটার, ১ ঘনমিটার ≈ ০.৪৫ কেজি এলপিজি। গ্যাসের পর স্লারিও সার হিসেবে ব্যবহার করুন।</Note>
      </div>
    </div>
  );
}

/* ---------- 6. Fattening ---------- */

function FattenTool() {
  const buyWeight = useNum(200), buyPrice = useNum(90000), days = useNum(120), gain = useNum(0.7);
  const feed = useNum(180), other = useNum(3000), sell = useNum(520);
  const r = fattening({ buyWeight: buyWeight.n, buyPrice: buyPrice.n, days: days.n, dailyGain: gain.n, feedPerDay: feed.n, other: other.n, sellPerKg: sell.n });
  const profitable = r.profit >= 0;
  return (
    <div className="split">
      <div className="form">
        <h3>গরু মোটাতাজাকরণের লাভ-ক্ষতি</h3>
        <div className="grid2">
          <Num label="কেনার সময় ওজন" suffix="কেজি" f={buyWeight} />
          <Num label="ক্রয়মূল্য" suffix="৳" f={buyPrice} />
          <Num label="পালনের সময়" suffix="দিন" f={days} hint="সাধারণত ৯০–১২০ দিন" />
          <Num label="দৈনিক ওজন বৃদ্ধি" suffix="কেজি" f={gain} hint="ভালো খাদ্যে ০.৬–০.৯ কেজি" />
          <Num label="দৈনিক খাদ্য খরচ" suffix="৳" f={feed} />
          <Num label="অন্যান্য খরচ" suffix="৳" f={other} hint="ওষুধ, টিকা, পরিবহন" />
          <Num label="বিক্রয়মূল্য (জীবিত ওজন)" suffix="৳/কেজি" f={sell} />
        </div>
      </div>
      <div className="result">
        <span className="hint">{profitable ? "সম্ভাব্য লাভ" : "সম্ভাব্য ক্ষতি"}</span>
        <div className="big" style={{ color: profitable ? undefined : "var(--red)" }}>{tk(Math.abs(r.profit))}</div>
        <div className="kpis">
          <div className="kpi"><span>বিক্রির সময় ওজন</span><b>{n2(r.finalWeight, 0)} কেজি</b></div>
          <div className="kpi"><span>বিনিয়োগে মুনাফা</span><b>{n2(r.roi)}%</b></div>
          <div className="kpi"><span>দৈনিক আয়</span><b>{tk(r.perDay)}</b></div>
        </div>
        <ul className="rlist">
          <li><span>সম্ভাব্য বিক্রয়</span><b>{tk(r.revenue)}</b></li>
          <li><span>ক্রয়মূল্য</span><b>{tk(buyPrice.n)}</b></li>
          <li><span>মোট খাদ্য খরচ</span><b>{tk(r.feed)}</b></li>
          <li><span>অন্যান্য খরচ</span><b>{tk(other.n)}</b></li>
          <li><span>মোট খরচ</span><b>{tk(r.cost)}</b></li>
        </ul>
        <Note>ঈদুল আজহার আগে বিক্রির পরিকল্পনা করলে দাম বেশি পাওয়া যায়। কৃমিনাশক দিয়ে মোটাতাজাকরণ শুরু করুন; হরমোন বা স্টেরয়েড কখনো ব্যবহার করবেন না।</Note>
      </div>
    </div>
  );
}
