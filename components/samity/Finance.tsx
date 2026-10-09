"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, toast } from "../client";
import { ArmedButton } from "../Moderation";
import type { Member } from "./Ledger";
import { dueBy, loanSchedule } from "@/lib/calc";
import { LOAN_PURPOSES } from "@/lib/content";
import { bn, fmtDate, fmtMonth, liters, money, today, toLatin } from "@/lib/shared";

const tk = (x: number) => money(Math.round(x));

/* ---------------- Dashboard ---------------- */

type Summary = { members: number; monthLiters: number; monthAmount: number; todayLiters: number; savings: number; cows: number; pregnant: number };

export function Dashboard({ go }: { go: (tab: string) => void }) {
  const [s, setS] = useState<Summary | null>(null);
  const [loans, setLoans] = useState<Loan[] | null>(null);
  useEffect(() => {
    api<Summary>("/api/samity/summary").then(setS).catch((e) => toast(e.message));
    api<Loan[]>("/api/samity/loans").then(setLoans).catch(() => setLoans([]));
  }, []);
  const ls = useMemo(() => loanStats(loans ?? []), [loans]);
  if (!s) return <p className="hint">লোড হচ্ছে…</p>;
  const month = today().slice(0, 7);
  return (
    <div className="page">
      <div className="kpis">
        <div className="kpi accent"><span>আজকের দুধ সংগ্রহ</span><b>{liters(s.todayLiters)}</b><small>{fmtDate(today())}</small></div>
        <div className="kpi"><span>{fmtMonth(month)}: মোট দুধ</span><b>{liters(s.monthLiters)}</b><small>পাওনা {tk(s.monthAmount)}</small></div>
        <div className="kpi"><span>সদস্যদের মোট সঞ্চয়</span><b>{tk(s.savings)}</b><small>{bn(s.members)} জন সক্রিয় সদস্য</small></div>
        <div className="kpi"><span>বকেয়া ঋণ</span><b>{tk(ls.outstanding)}</b><small>{bn(ls.active)}টি চলমান ঋণ</small></div>
        <div className={`kpi ${ls.arrears > 0 ? "warn" : ""}`}><span>কিস্তি খেলাপি</span><b>{tk(ls.arrears)}</b><small>{bn(ls.arrearsCount)} জন সদস্য</small></div>
        <div className="kpi"><span>গাভী (গর্ভবতী)</span><b>{bn(s.cows)} ({bn(s.pregnant)})</b><small><Link href="/samity/breeding">প্রজনন ক্যালেন্ডার</Link></small></div>
      </div>
      <div className="features" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))" }}>
        {[
          ["collect", "আজকের দুধ লিখুন", "সকাল-বিকালের সংগ্রহ", "green"],
          ["savings", "সঞ্চয় জমা নিন", "সদস্যের পাসবই হালনাগাদ", "gold"],
          ["loans", "কিস্তি আদায় লিখুন", "ঋণ ও খেলাপি তালিকা", "teal"],
          ["month", "মাসিক পাওনা প্রিন্ট", "সদস্যভিত্তিক দুধের হিসাব", "violet"],
        ].map(([tab, t, d, hue]) => (
          <button key={tab} className={`feature hue-${hue}`} style={{ textAlign: "left", cursor: "pointer", font: "inherit" }} onClick={() => go(tab)}>
            <h3>{t}</h3><p>{d}</p><span className="go">খুলুন →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Savings ---------------- */

type SavingsData = {
  entries: { id: string; memberId: string; date: string; amount: number; note: string }[];
  balances: { memberId: string; balance: number; deposits: number; last: string }[];
};

export function Savings({ members }: { members: Member[] }) {
  const [data, setData] = useState<SavingsData | null>(null);
  const [view, setView] = useState<"balances" | "entries">("balances");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    api<SavingsData>("/api/samity/savings").then(setData).catch((e) => toast(e.message));
  }, []);
  useEffect(load, [load]);
  const byId = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const balance = useMemo(() => Object.fromEntries((data?.balances ?? []).map((b) => [b.memberId, b])), [data]);
  const total = (data?.balances ?? []).reduce((s, b) => s + b.balance, 0);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setBusy(true);
    setErr("");
    try {
      await api("/api/samity/savings", { body: { ...f, amount: toLatin(f.amount) } });
      toast(f.type === "withdraw" ? "উত্তোলন লেখা হয়েছে" : "সঞ্চয় জমা হয়েছে");
      (form.elements.namedItem("amount") as HTMLInputElement).value = "";
      (form.elements.namedItem("note") as HTMLInputElement).value = "";
      load();
    } catch (x) {
      setErr((x as Error).message);
    }
    setBusy(false);
  }

  if (!members.some((m) => m.active)) return <div className="empty"><h3>প্রথমে সদস্য যোগ করুন</h3>&quot;সদস্য তালিকা&quot; থেকে সদস্য যোগ করলে সঞ্চয় নেওয়া যাবে।</div>;

  return (
    <div className="split">
      <form className="form" onSubmit={submit}>
        <h3>সঞ্চয় জমা / উত্তোলন</h3>
        <label>সদস্য
          <select name="memberId" required defaultValue="">
            <option value="" disabled>বাছাই করুন</option>
            {members.filter((m) => m.active).map((m) => (
              <option key={m.id} value={m.id}>{bn(m.no)}. {m.name} (জমা {tk(balance[m.id]?.balance ?? 0)})</option>
            ))}
          </select>
        </label>
        <div className="grid2">
          <label>ধরন
            <select name="type" defaultValue="deposit">
              <option value="deposit">জমা</option>
              <option value="withdraw">উত্তোলন</option>
            </select>
          </label>
          <label>টাকা<input name="amount" required inputMode="decimal" placeholder="যেমন: ২০০" /></label>
          <label>তারিখ<input name="date" type="date" required defaultValue={today()} max={today()} /></label>
          <label>মন্তব্য (ঐচ্ছিক)<input name="note" maxLength={100} placeholder="যেমন: অক্টোবর মাসের সঞ্চয়" /></label>
        </div>
        {err && <div className="err">{err}</div>}
        <div className="row"><button className="btn" disabled={busy}>সংরক্ষণ করুন</button></div>
      </form>

      <div className="page">
        <div className="kpis">
          <div className="kpi accent"><span>সমিতির মোট সঞ্চয়</span><b>{tk(total)}</b></div>
          <div className="kpi"><span>সঞ্চয়কারী সদস্য</span><b>{bn((data?.balances ?? []).filter((b) => b.balance > 0).length)} জন</b></div>
        </div>
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={view === "balances"} onClick={() => setView("balances")}>সদস্যভিত্তিক স্থিতি</button>
          <button role="tab" aria-selected={view === "entries"} onClick={() => setView("entries")}>সাম্প্রতিক লেনদেন</button>
        </div>
        {data == null ? <p className="hint">লোড হচ্ছে…</p> : view === "balances" ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th className="num">নং</th><th>সদস্য</th><th className="num">স্থিতি</th><th>শেষ জমা</th></tr></thead>
              <tbody>
                {members.filter((m) => m.active || balance[m.id]).map((m) => (
                  <tr key={m.id} className={m.active ? "" : "inactive"}>
                    <td className="num">{bn(m.no)}</td><td>{m.name}</td>
                    <td className="num"><b>{tk(balance[m.id]?.balance ?? 0)}</b></td>
                    <td className="hint">{balance[m.id]?.last ? fmtDate(balance[m.id].last) : "–"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td></td><td>মোট</td><td className="num">{tk(total)}</td><td></td></tr></tfoot>
            </table>
          </div>
        ) : data.entries.length === 0 ? <div className="empty"><h3>কোনো লেনদেন নেই</h3>বাম পাশের ফর্ম থেকে প্রথম সঞ্চয় জমা নিন।</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>তারিখ</th><th>সদস্য</th><th className="num">টাকা</th><th></th></tr></thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>{byId[e.memberId]?.name ?? "–"}{e.note && <span className="hint"> · {e.note}</span>}</td>
                    <td className="num" style={{ color: e.amount < 0 ? "var(--red)" : "var(--green-ink)", fontWeight: 600 }}>{e.amount < 0 ? "−" : "+"}{tk(Math.abs(e.amount))}</td>
                    <td style={{ textAlign: "right" }}>
                      <ArmedButton label="মুছুন" armedLabel="নিশ্চিত?" onConfirm={async () => {
                        try { await api(`/api/samity/savings/${e.id}`, { method: "DELETE" }); toast("লেনদেন মুছে ফেলা হয়েছে"); load(); } catch (x) { toast((x as Error).message); }
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Loans ---------------- */

type Loan = {
  id: string; memberId: string; purpose: string; principal: number; rate: number; graceMonths: number; termMonths: number;
  graceMode: "interest" | "capitalize"; start: string; repayments: { date: string; amount: number }[];
};

function loanState(l: Loan) {
  const s = loanSchedule(l);
  const paid = l.repayments.reduce((x, r) => x + r.amount, 0);
  const due = dueBy(l, today());
  const remaining = Math.max(0, s.totalPaid - paid);
  const next = s.rows.find((r) => r.date > today());
  return { ...s, paid, remaining, arrears: Math.max(0, due - paid), next, closed: remaining < 1 };
}

function loanStats(loans: Loan[]) {
  return loans.reduce(
    (t, l) => {
      const st = loanState(l);
      return {
        outstanding: t.outstanding + st.remaining,
        arrears: t.arrears + st.arrears,
        arrearsCount: t.arrearsCount + (st.arrears >= 1 ? 1 : 0),
        active: t.active + (st.closed ? 0 : 1),
      };
    },
    { outstanding: 0, arrears: 0, arrearsCount: 0, active: 0 },
  );
}

export function Loans({ members }: { members: Member[] }) {
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => {
    api<Loan[]>("/api/samity/loans").then(setLoans).catch((e) => toast(e.message));
  }, []);
  useEffect(load, [load]);
  const byId = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const stats = loanStats(loans ?? []);

  return (
    <div className="page">
      <div className="kpis">
        <div className="kpi accent"><span>মোট বকেয়া (চার্জসহ)</span><b>{tk(stats.outstanding)}</b></div>
        <div className="kpi"><span>চলমান ঋণ</span><b>{bn(stats.active)}টি</b></div>
        <div className={`kpi ${stats.arrears > 0 ? "warn" : ""}`}><span>কিস্তি খেলাপি</span><b>{tk(stats.arrears)}</b><small>{bn(stats.arrearsCount)} জন</small></div>
      </div>
      <div className="row-between">
        <h3>সদস্যদের ঋণ</h3>
        <button className="btn" onClick={() => setAdding((v) => !v)} disabled={!members.some((m) => m.active)}>+ নতুন ঋণ বিতরণ</button>
      </div>
      {adding && <AddLoan members={members} onCancel={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
      {loans == null ? <p className="hint">লোড হচ্ছে…</p> : loans.length === 0 ? (
        <div className="empty"><h3>কোনো ঋণ লেখা হয়নি</h3>বকনা ক্রয়, লালন-পালন বা খাদ্যের জন্য বিতরণ করা ঋণ এখানে লিখুন। গ্রেস পিরিয়ড ও কিস্তি নিজে থেকেই হিসাব হবে।</div>
      ) : (
        <div className="cows">
          {loans.map((l) => <LoanCard key={l.id} loan={l} member={byId[l.memberId]} onChanged={load} />)}
        </div>
      )}
    </div>
  );
}

function LoanCard({ loan, member, onChanged }: { loan: Loan; member?: Member; onChanged: () => void }) {
  const st = loanState(loan);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const pct = st.totalPaid ? Math.min(100, (st.paid / st.totalPaid) * 100) : 0;
  async function repay(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/samity/loans/${loan.id}`, { method: "PATCH", body: { amount: toLatin(amount), date } });
      toast("কিস্তি আদায় লেখা হয়েছে");
      setAmount("");
      onChanged();
    } catch (x) {
      toast((x as Error).message);
    }
  }
  return (
    <div className="cow">
      <div className="row-between">
        <h3>{member ? `${bn(member.no)}. ${member.name}` : "সদস্য"}</h3>
        {st.closed ? <span className="pill preg">পরিশোধিত</span> : st.arrears >= 1 ? <span className="pill open">খেলাপি {tk(st.arrears)}</span> : <span className="pill wait">নিয়মিত</span>}
      </div>
      <div className="hint">{LOAN_PURPOSES[loan.purpose]} · {fmtDate(loan.start)} · {bn(loan.rate)}% চার্জ · গ্রেস {bn(loan.graceMonths)} মাস</div>
      <ul className="rlist">
        <li><span>আসল</span><b>{tk(loan.principal)}</b></li>
        <li><span>মাসিক কিস্তি</span><b>{tk(st.emi)}</b></li>
        <li><span>আদায় হয়েছে</span><b>{tk(st.paid)}</b></li>
        <li><span>বাকি</span><b>{tk(st.remaining)}</b></li>
        {st.next && !st.closed && <li><span>পরের কিস্তি</span><b>{fmtDate(st.next.date)} · {tk(st.next.payment)}</b></li>}
      </ul>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      {!st.closed && (
        <form onSubmit={repay} className="grid2 no-print" style={{ alignItems: "end" }}>
          <label>আদায় (৳)<input inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(Math.round(st.next?.payment ?? st.emi))} /></label>
          <label>তারিখ<input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
          <button className="btn small" style={{ gridColumn: "1/-1" }}>কিস্তি আদায় লিখুন</button>
        </form>
      )}
      {loan.repayments.length > 0 && (
        <details>
          <summary className="hint" style={{ cursor: "pointer" }}>আদায়ের ইতিহাস ({bn(loan.repayments.length)})</summary>
          <ul className="timeline" style={{ marginTop: 6 }}>
            {[...loan.repayments].reverse().map((r, i) => <li key={i}><span>{fmtDate(r.date)}</span><span>{tk(r.amount)}</span></li>)}
          </ul>
        </details>
      )}
      <div style={{ textAlign: "right" }} className="no-print">
        <ArmedButton label="মুছুন" armedLabel="নিশ্চিত, মুছুন" onConfirm={async () => {
          try { await api(`/api/samity/loans/${loan.id}`, { method: "DELETE" }); toast("ঋণ মুছে ফেলা হয়েছে"); onChanged(); } catch (x) { toast((x as Error).message); }
        }} />
      </div>
    </div>
  );
}

function AddLoan({ members, onCancel, onDone }: { members: Member[]; onCancel: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    for (const k of ["principal", "rate", "graceMonths", "termMonths"]) f[k] = toLatin(f[k]);
    setBusy(true);
    setErr("");
    try {
      await api("/api/samity/loans", { body: f });
      toast("ঋণ বিতরণ লেখা হয়েছে");
      onDone();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h3>নতুন ঋণ</h3>
      <div className="grid2">
        <label>সদস্য
          <select name="memberId" required defaultValue="">
            <option value="" disabled>বাছাই করুন</option>
            {members.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{bn(m.no)}. {m.name}</option>)}
          </select>
        </label>
        <label>উদ্দেশ্য
          <select name="purpose" defaultValue="heifer">
            {Object.entries(LOAN_PURPOSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>ঋণের পরিমাণ (৳)<input name="principal" required inputMode="decimal" /></label>
        <label>বার্ষিক সার্ভিস চার্জ (%)<input name="rate" required inputMode="decimal" defaultValue="5" /></label>
        <label>গ্রেস পিরিয়ড (মাস)<input name="graceMonths" required inputMode="numeric" defaultValue="12" /></label>
        <label>কিস্তির সংখ্যা (মাস)<input name="termMonths" required inputMode="numeric" defaultValue="36" /></label>
        <label>বিতরণের তারিখ<input name="start" type="date" required defaultValue={today()} /></label>
        <label>গ্রেস পিরিয়ডে
          <select name="graceMode" defaultValue="interest">
            <option value="interest">শুধু সার্ভিস চার্জ দেবেন</option>
            <option value="capitalize">কিছুই দেবেন না</option>
          </select>
        </label>
      </div>
      {err && <div className="err">{err}</div>}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>বাতিল</button>
        <button className="btn" disabled={busy}>সংরক্ষণ করুন</button>
      </div>
    </form>
  );
}
