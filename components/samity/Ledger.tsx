"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api, toast } from "../client";
import { useSamity } from "./Gate";
import { Dashboard, Loans, Savings } from "./Finance";
import { FileText, HandCoins, LayoutDashboard, Milk, PiggyBank, Settings2, Users } from "lucide-react";
import { bn, fmtDate, fmtMonth, liters, money, ratePerLiter, today, toLatin } from "@/lib/shared";

export type Member = { id: string; no: number; name: string; village: string; phone: string; active: boolean };

const TABS = [
  { id: "dashboard", label: "সারসংক্ষেপ", icon: LayoutDashboard },
  { id: "collect", label: "দৈনিক দুধ", icon: Milk },
  { id: "month", label: "মাসিক হিসাব", icon: FileText },
  { id: "savings", label: "সঞ্চয়", icon: PiggyBank },
  { id: "loans", label: "ঋণ ও কিস্তি", icon: HandCoins },
  { id: "members", label: "সদস্য", icon: Users },
  { id: "price", label: "দুধের দর", icon: Settings2 },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Ledger() {
  const [tab, setTabState] = useState<TabId>("dashboard");
  const [members, setMembers] = useState<Member[] | null>(null);
  const loadMembers = useCallback(() => {
    api<Member[]>("/api/samity/members").then(setMembers).catch((e) => toast(e.message));
  }, []);
  useEffect(loadMembers, [loadMembers]);

  // Tabs are linkable (/samity#savings) so home-page feature cards can deep-link.
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1);
      if (TABS.some((t) => t.id === h)) setTabState(h as TabId);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const setTab = (t: string) => {
    setTabState(t as TabId);
    history.replaceState(null, "", "#" + t);
  };

  return (
    <>
      <div className="seg no-print" role="tablist" aria-label="খাতার বিভাগ">
        {TABS.map(({ id, label, icon: I }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            <I size={16} aria-hidden /> {label}
          </button>
        ))}
      </div>
      {members == null ? (
        <p className="hint">লোড হচ্ছে…</p>
      ) : tab === "dashboard" ? (
        <Dashboard go={setTab} />
      ) : tab === "collect" ? (
        members.some((m) => m.active) ? <Collection members={members} /> : <NoMembers onGo={() => setTab("members")} />
      ) : tab === "month" ? (
        <Monthly members={members} />
      ) : tab === "savings" ? (
        <Savings members={members} />
      ) : tab === "loans" ? (
        <Loans members={members} />
      ) : tab === "members" ? (
        <Members members={members} reload={loadMembers} />
      ) : (
        <PriceSettings />
      )}
    </>
  );
}

function NoMembers({ onGo }: { onGo: () => void }) {
  return (
    <div className="empty">
      <h3>প্রথমে সদস্য যোগ করুন</h3>
      দুধ সংগ্রহ লিখতে সমিতির সদস্যদের তালিকা দরকার।
      <div style={{ marginTop: 12 }}><button className="btn" onClick={onGo}>সদস্য যোগ করুন</button></div>
    </div>
  );
}

/* ---------------- Daily collection sheet ---------------- */

type Entry = { memberId: string; shift: "am" | "pm"; liters: number; fat: number | null };
type Row = { liters: string; fat: string };

function Collection({ members }: { members: Member[] }) {
  const { samity } = useSamity();
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState<"am" | "pm">(new Date().getHours() < 13 ? "am" : "pm");
  const [day, setDay] = useState<Entry[] | null>(null);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDay(null);
    api<Entry[]>(`/api/samity/milk?date=${date}`).then(setDay).catch((e) => toast(e.message));
  }, [date]);

  useEffect(() => {
    if (!day) return;
    const r: Record<string, Row> = {};
    for (const e of day.filter((e) => e.shift === shift))
      r[e.memberId] = { liters: String(e.liters), fat: e.fat == null ? "" : String(e.fat) };
    setRows(r);
    setDirty(false);
  }, [day, shift]);

  // Active members, plus inactive ones who already have an entry on this sheet.
  const list = members.filter((m) => m.active || rows[m.id]);
  const parse = (s: string | undefined) => {
    const n = parseFloat(toLatin(s || ""));
    return Number.isFinite(n) ? n : null;
  };
  const calc = (r?: Row) => {
    const l = parse(r?.liters) || 0;
    const rate = ratePerLiter(parse(r?.fat), samity.price);
    return { l, rate, amount: l * rate };
  };
  const totals = list.reduce(
    (t, m) => {
      const c = calc(rows[m.id]);
      return { l: t.l + c.l, amount: t.amount + (c.l ? c.amount : 0), n: t.n + (c.l ? 1 : 0) };
    },
    { l: 0, amount: 0, n: 0 },
  );
  const other = day?.filter((e) => e.shift !== shift).reduce((s, e) => s + e.liters, 0) ?? 0;

  function set(id: string, field: keyof Row, v: string) {
    setRows((r) => ({ ...r, [id]: { ...(r[id] ?? { liters: "", fat: "" }), [field]: v } }));
    setDirty(true);
  }

  async function save() {
    setBusy(true);
    try {
      const entries = list.map((m) => ({ memberId: m.id, liters: parse(rows[m.id]?.liters) || 0, fat: parse(rows[m.id]?.fat) }));
      await api("/api/samity/milk", { body: { date, shift, entries } });
      setDay(await api<Entry[]>(`/api/samity/milk?date=${date}`));
      toast(`${fmtDate(date)}, ${shift === "am" ? "সকালের" : "বিকালের"} হিসাব সংরক্ষিত হয়েছে`);
    } catch (e) {
      toast((e as Error).message);
    }
    setBusy(false);
  }

  // Enter key jumps to the next input, like a paper register.
  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const inputs = [...document.querySelectorAll<HTMLInputElement>("#sheet input")];
    inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
  }

  return (
    <div className="page">
      <div className="toolbar no-print">
        <label style={{ flex: "0 1 200px" }}>তারিখ<input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
        <div className="subtabs" role="group" aria-label="বেলা">
          <button className="chip" aria-pressed={shift === "am"} onClick={() => setShift("am")}>☀ সকাল</button>
          <button className="chip" aria-pressed={shift === "pm"} onClick={() => setShift("pm")}>☾ বিকাল</button>
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>এই বেলায় সংগ্রহ</span><b>{liters(totals.l)}</b></div>
        <div className="kpi"><span>এই বেলার মূল্য</span><b>{money(+totals.amount.toFixed(2))}</b></div>
        <div className="kpi"><span>দুধ দিয়েছেন</span><b>{bn(totals.n)} জন</b></div>
        <div className="kpi"><span>আজ মোট (দুই বেলা)</span><b>{liters(totals.l + other)}</b></div>
      </div>
      <p className="hint" style={{ margin: 0 }}>
        দর: ফ্যাট {bn(samity.price.stdFat)}% হলে {money(samity.price.baseRate)}/লিটার, প্রতি ০.১% বেশি/কম হলে {money(samity.price.perPoint)} বেশি/কম।
        ফ্যাট না লিখলে মূল দর ধরা হবে। Enter চাপলে পরের ঘরে যাবে।
      </p>
      {day == null ? <p className="hint">লোড হচ্ছে…</p> : (
        <div className="table-wrap">
          <table id="sheet">
            <thead>
              <tr><th className="num">নং</th><th>সদস্য</th><th className="num">লিটার</th><th className="num">ফ্যাট %</th><th className="num">দর</th><th className="num">টাকা</th></tr>
            </thead>
            <tbody>
              {list.map((m) => {
                const r = rows[m.id];
                const c = calc(r);
                return (
                  <tr key={m.id} className={m.active ? "" : "inactive"}>
                    <td className="num">{bn(m.no)}</td>
                    <td>{m.name}</td>
                    <td className="num"><input inputMode="decimal" value={r?.liters ?? ""} onChange={(e) => set(m.id, "liters", e.target.value)} onKeyDown={onKey} aria-label={`${m.name} লিটার`} /></td>
                    <td className="num"><input inputMode="decimal" value={r?.fat ?? ""} onChange={(e) => set(m.id, "fat", e.target.value)} onKeyDown={onKey} aria-label={`${m.name} ফ্যাট`} style={{ width: 70 }} /></td>
                    <td className="num">{c.l ? money(c.rate) : "–"}</td>
                    <td className="num">{c.l ? money(+c.amount.toFixed(2)) : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr><td></td><td>মোট</td><td className="num">{liters(totals.l)}</td><td></td><td></td><td className="num">{money(+totals.amount.toFixed(2))}</td></tr>
            </tfoot>
          </table>
        </div>
      )}
      <div className="row-between no-print">
        <span className="hint">{dirty ? "সংরক্ষণ করা হয়নি এমন পরিবর্তন আছে" : "সব সংরক্ষিত"}</span>
        <button className="btn" onClick={save} disabled={busy || !dirty || day == null}>সংরক্ষণ করুন</button>
      </div>
    </div>
  );
}

/* ---------------- Monthly statement ---------------- */

type MonthData = {
  members: { memberId: string; liters: number; amount: number; avgFat: number | null; days: number }[];
  days: { date: string; liters: number; amount: number }[];
};

function Monthly({ members }: { members: Member[] }) {
  const { samity } = useSamity();
  const [month, setMonth] = useState(today().slice(0, 7));
  const [data, setData] = useState<MonthData | null>(null);

  useEffect(() => {
    setData(null);
    api<MonthData>(`/api/samity/milk?month=${month}`).then(setData).catch((e) => toast(e.message));
  }, [month]);

  const byId = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const rows = (data?.members ?? [])
    .map((r) => ({ ...r, m: byId[r.memberId] }))
    .filter((r) => r.m)
    .sort((a, b) => a.m.no - b.m.no);
  const total = rows.reduce((t, r) => ({ l: t.l + r.liters, a: t.a + r.amount }), { l: 0, a: 0 });
  const fatRows = rows.filter((r) => r.avgFat != null);
  const fatL = fatRows.reduce((s, r) => s + r.liters, 0);
  const avgFat = fatL ? fatRows.reduce((s, r) => s + r.avgFat! * r.liters, 0) / fatL : null;
  const max = Math.max(1, ...(data?.days ?? []).map((d) => d.liters));

  return (
    <div className="page">
      <div className="toolbar no-print">
        <label style={{ flex: "0 1 200px" }}>মাস<input type="month" value={month} max={today().slice(0, 7)} onChange={(e) => e.target.value && setMonth(e.target.value)} /></label>
        <button className="btn ghost" onClick={() => window.print()} disabled={!rows.length}>🖨 প্রিন্ট করুন</button>
      </div>
      <div className="page-head">
        <h2>{fmtMonth(month)}: সদস্যভিত্তিক দুধের হিসাব</h2>
        <p>{samity.name}, {samity.upz}</p>
      </div>
      {data == null ? <p className="hint">লোড হচ্ছে…</p> : !rows.length ? (
        <div className="empty"><h3>এই মাসে কোনো সংগ্রহ লেখা হয়নি</h3>&quot;দৈনিক দুধ সংগ্রহ&quot; থেকে প্রতিদিনের হিসাব লিখুন।</div>
      ) : (
        <>
          <div className="kpis">
            <div className="kpi"><span>মোট সংগ্রহ</span><b>{liters(total.l)}</b></div>
            <div className="kpi"><span>সদস্যদের মোট পাওনা</span><b>{money(+total.a.toFixed(2))}</b></div>
            <div className="kpi"><span>গড় ফ্যাট</span><b>{avgFat == null ? "–" : bn(avgFat.toFixed(2)) + "%"}</b></div>
            <div className="kpi"><span>দৈনিক গড়</span><b>{liters(total.l / Math.max(1, data.days.length))}</b></div>
          </div>
          <div className="card no-print">
            <div className="hint">প্রতিদিনের মোট সংগ্রহ (লিটার)</div>
            <div className="bars" aria-hidden>
              {data.days.map((d) => (
                <div key={d.date} style={{ height: `${(d.liters / max) * 100}%` }} title={`${fmtDate(d.date)}: ${liters(d.liters)}`} />
              ))}
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th className="num">নং</th><th>সদস্য</th><th className="num">দিন</th><th className="num">মোট লিটার</th><th className="num">গড় ফ্যাট</th><th className="num">পাওনা</th><th className="print-only">স্বাক্ষর</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.memberId}>
                    <td className="num">{bn(r.m.no)}</td>
                    <td>{r.m.name}{r.m.village && <span className="hint"> · {r.m.village}</span>}</td>
                    <td className="num">{bn(r.days)}</td>
                    <td className="num">{liters(r.liters)}</td>
                    <td className="num">{r.avgFat == null ? "–" : bn(r.avgFat) + "%"}</td>
                    <td className="num">{money(r.amount)}</td>
                    <td className="print-only"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td></td><td>মোট</td><td></td><td className="num">{liters(total.l)}</td><td></td><td className="num">{money(+total.a.toFixed(2))}</td><td className="print-only"></td></tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Members ---------------- */

function Members({ members, reload }: { members: Member[]; reload: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const nextNo = Math.max(0, ...members.map((m) => m.no)) + 1;

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setErr("");
    try {
      await api("/api/samity/members", { body: Object.fromEntries(new FormData(form)) });
      form.reset();
      toast("সদস্য যোগ হয়েছে");
      reload();
      (form.elements.namedItem("name") as HTMLInputElement).focus();
    } catch (x) {
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  async function toggle(m: Member) {
    try {
      await api(`/api/samity/members/${m.id}`, { method: "PATCH", body: { active: !m.active } });
      toast(m.active ? `${m.name} নিষ্ক্রিয় করা হয়েছে` : `${m.name} সক্রিয় করা হয়েছে`);
      reload();
    } catch (x) {
      toast((x as Error).message);
    }
  }

  return (
    <div className="page">
      <form className="form" onSubmit={add} key={nextNo}>
        <h3>নতুন সদস্য</h3>
        <div className="grid2">
          <label>সদস্য নং<input name="no" required inputMode="numeric" defaultValue={nextNo} /></label>
          <label>নাম<input name="name" required maxLength={60} /></label>
          <label>গ্রাম / পাড়া<input name="village" maxLength={60} /></label>
          <label>মোবাইল (ঐচ্ছিক)<input name="phone" inputMode="tel" maxLength={20} /></label>
        </div>
        {err && <div className="err">{err}</div>}
        <div className="row"><button className="btn" disabled={busy}>যোগ করুন</button></div>
      </form>
      {members.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th className="num">নং</th><th>নাম</th><th>গ্রাম</th><th>মোবাইল</th><th></th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className={m.active ? "" : "inactive"}>
                  <td className="num">{bn(m.no)}</td>
                  <td>{m.name}</td>
                  <td>{m.village || "–"}</td>
                  <td>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : "–"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn ghost small" onClick={() => toggle(m)}>{m.active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint" style={{ margin: 0 }}>নিষ্ক্রিয় সদস্য দৈনিক সংগ্রহের তালিকায় দেখাবে না, তবে তার পুরনো হিসাব থেকে যাবে।</p>
    </div>
  );
}

/* ---------------- Price rule ---------------- */

function PriceSettings() {
  const { samity, reload } = useSamity();
  const [p, setP] = useState({
    baseRate: String(samity.price.baseRate),
    stdFat: String(samity.price.stdFat),
    perPoint: String(samity.price.perPoint),
  });
  const [busy, setBusy] = useState(false);
  const rule = { baseRate: +toLatin(p.baseRate) || 0, stdFat: +toLatin(p.stdFat) || 0, perPoint: +toLatin(p.perPoint) || 0 };

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/samity", { method: "PATCH", body: rule });
      toast("দর হালনাগাদ হয়েছে");
      reload();
    } catch (x) {
      toast((x as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="page">
      <form className="form" onSubmit={save}>
        <h3>ফ্যাটভিত্তিক দুধের দর</h3>
        <div className="grid2">
          <label>মূল দর (৳/লিটার)<input inputMode="decimal" value={p.baseRate} onChange={(e) => setP({ ...p, baseRate: e.target.value })} /></label>
          <label>আদর্শ ফ্যাট (%)<input inputMode="decimal" value={p.stdFat} onChange={(e) => setP({ ...p, stdFat: e.target.value })} /></label>
          <label>প্রতি ০.১% ফ্যাটে সমন্বয় (৳)<input inputMode="decimal" value={p.perPoint} onChange={(e) => setP({ ...p, perPoint: e.target.value })} /></label>
        </div>
        <p className="hint" style={{ margin: 0 }}>নতুন দর শুধু এরপর থেকে লেখা হিসাবে প্রযোজ্য হবে; আগের সংরক্ষিত হিসাবের দর বদলাবে না।</p>
        <div className="row"><button className="btn" disabled={busy}>সংরক্ষণ করুন</button></div>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ফ্যাট</th>{[3.0, 3.5, 4.0, 4.5, 5.0].map((f) => <th key={f} className="num">{bn(f.toFixed(1))}%</th>)}</tr></thead>
          <tbody><tr><td>দর/লিটার</td>{[3.0, 3.5, 4.0, 4.5, 5.0].map((f) => <td key={f} className="num">{money(ratePerLiter(f, rule))}</td>)}</tr></tbody>
        </table>
      </div>
    </div>
  );
}
