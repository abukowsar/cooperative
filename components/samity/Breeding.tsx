"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, toast } from "../client";
import { ArmedButton } from "../Moderation";
import {
  addDays, bn, BREEDS, breedingPlan, daysBetween, fmtDate, GESTATION_DAYS, Milestone, postCalvingPlan, today,
} from "@/lib/shared";

type Cow = {
  id: string; name: string; owner: string; tag: string; breed: string;
  aiDate: string | null; calvedDate: string | null; pregnant: boolean | null;
  history: { type: string; date: string }[];
};

type Task = Milestone & { cow: Cow; overdue: boolean };

// Missed heat checks matter for a week; a missed pregnancy check until near dry-off; calving until recorded (30 days).
const OVERDUE_GRACE: Record<string, number> = { heat: 7, pd: 150, calving: 30, reai: 60 };

const EVENT_N:Record<string, string> = { ai: "কৃত্রিম প্রজনন", pregnant: "গর্ভ নিশ্চিত", open: "গর্ভ হয়নি", calved: "বাচ্চা প্রসব" };

/** Milestones that still matter for this cow, given what has already been recorded. */
function plan(c: Cow): Milestone[] {
  if (c.aiDate) {
    if (c.pregnant === false)
      return [{ key: "reai", label: "আবার কৃত্রিম প্রজনন করান", hint: "গর্ভ হয়নি। পরবর্তী হিট দেখা দিলে ১২–১৮ ঘণ্টার মধ্যে প্রজনন করান।", date: addDays(c.aiDate, 21) }];
    const all = breedingPlan(c.aiDate);
    return c.pregnant ? all.filter((m) => m.key !== "heat" && m.key !== "pd") : all;
  }
  if (c.calvedDate) return postCalvingPlan(c.calvedDate);
  return [];
}

export default function Breeding() {
  const [cows, setCows] = useState<Cow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const now = today();

  const load = useCallback(() => {
    api<Cow[]>("/api/samity/cows").then(setCows).catch((e) => toast(e.message));
  }, []);
  useEffect(load, [load]);

  // Upcoming 30 days, plus anything overdue that still needs action.
  const tasks: Task[] = (cows ?? [])
    .flatMap((cow) =>
      plan(cow).map((m) => {
        const d = daysBetween(now, m.date);
        // How many days a missed task stays on the list before it stops being useful.
        const grace = OVERDUE_GRACE[m.key] ?? 3;
        return { ...m, cow, overdue: d < 0 && m.key in OVERDUE_GRACE, _keep: d <= 30 && d >= -grace };
      }),
    )
    .filter((t) => t._keep)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="page">
      <div className="page-head">
        <p>কৃত্রিম প্রজননের তারিখ লিখলেই হিট পর্যবেক্ষণ, গর্ভ পরীক্ষা, দোহন বন্ধ ও সম্ভাব্য প্রসবের তারিখ হিসাব হয়ে যাবে (গর্ভকাল {bn(GESTATION_DAYS)} দিন ধরে)।</p>
      </div>

      <div className="card">
        <div className="row-between">
          <h3>আগামী ৩০ দিনের কাজ</h3>
          <span className="hint">আজ {fmtDate(now)}</span>
        </div>
        {cows == null ? <p className="hint">লোড হচ্ছে…</p> : tasks.length === 0 ? (
          <p className="hint" style={{ margin: 0 }}>{cows.length ? "আগামী ৩০ দিনে কোনো কাজ নেই।" : "গাভী যোগ করলে এখানে কাজের তালিকা দেখা যাবে।"}</p>
        ) : (
          <div className="tasks">
            {tasks.map((t) => {
              const d = daysBetween(now, t.date);
              return (
                <div key={t.cow.id + t.key} className={`task ${t.overdue ? "overdue" : d <= 3 ? "soon" : ""}`}>
                  <div className="when">
                    <b>{d === 0 ? "আজ" : d === 1 ? "আগামীকাল" : d < 0 ? `${bn(-d)} দিন আগে` : `${bn(d)} দিন পর`}</b>
                    {fmtDate(t.date)}
                  </div>
                  <div>
                    <strong>{t.label}</strong>: {t.cow.name} <span className="hint">({t.cow.owner})</span>
                    <p>{t.hint}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="row-between">
        <h3>গাভীসমূহ {cows && cows.length > 0 && <span className="hint">({bn(cows.length)})</span>}</h3>
        <button className="btn" onClick={() => setAdding((v) => !v)}>+ গাভী যোগ করুন</button>
      </div>
      {adding && <AddCow onCancel={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
      {cows?.length === 0 && !adding && (
        <div className="empty"><h3>এখনো কোনো গাভী নেই</h3>সদস্যদের গাভী যোগ করে প্রজননের তারিখ লিখুন।</div>
      )}
      <div className="cows">
        {cows?.map((c) => <CowCard key={c.id} cow={c} onChanged={load} />)}
      </div>
    </div>
  );
}

function CowCard({ cow, onChanged }: { cow: Cow; onChanged: () => void }) {
  const [date, setDate] = useState(today());
  const now = today();
  const ms = plan(cow);
  const nextKey = ms.find((m) => m.date >= now)?.key;
  const days = cow.aiDate ? daysBetween(cow.aiDate, now) : null;

  async function record(type: string) {
    try {
      await api(`/api/samity/cows/${cow.id}`, { method: "PATCH", body: { type, date } });
      toast(`${cow.name}: ${EVENT_N[type]} লেখা হয়েছে`);
      onChanged();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  const status = cow.aiDate
    ? cow.pregnant === true ? <span className="pill preg">গর্ভবতী</span>
      : cow.pregnant === false ? <span className="pill open">গর্ভ হয়নি</span>
      : <span className="pill wait">প্রজনন হয়েছে, নিশ্চিত হয়নি</span>
    : cow.calvedDate ? <span className="pill wait">প্রসবের পর</span>
    : <span className="pill">তথ্য নেই</span>;

  return (
    <div className="cow">
      <div className="row-between">
        <h3>{cow.name}</h3>
        {status}
      </div>
      <div className="hint">
        মালিক: {cow.owner}{cow.breed && ` · ${cow.breed}`}{cow.tag && ` · ট্যাগ ${cow.tag}`}
      </div>
      {cow.aiDate && cow.pregnant !== false && days != null && (
        <div>
          <div className="row-between hint"><span>গর্ভকাল: {bn(Math.max(0, days))}/{bn(GESTATION_DAYS)} দিন</span><span>{bn(Math.min(100, Math.round((days / GESTATION_DAYS) * 100)))}%</span></div>
          <div className="progress"><div style={{ width: `${Math.min(100, Math.max(0, (days / GESTATION_DAYS) * 100))}%` }} /></div>
        </div>
      )}
      {ms.length > 0 && (
        <ul className="timeline">
          {ms.map((m) => (
            <li key={m.key} className={m.key === nextKey ? "next" : m.date < now ? "past" : ""}>
              <span>{m.label}</span><span>{fmtDate(m.date)}</span>
            </li>
          ))}
        </ul>
      )}
      <label className="no-print">ঘটনার তারিখ<input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
      <div className="actions no-print">
        <button className="btn small" onClick={() => record("ai")}>কৃত্রিম প্রজনন</button>
        {cow.aiDate && cow.pregnant !== true && <button className="btn ghost small" onClick={() => record("pregnant")}>গর্ভ নিশ্চিত</button>}
        {cow.aiDate && cow.pregnant !== false && <button className="btn ghost small" onClick={() => record("open")}>হিট ফিরেছে / গর্ভ হয়নি</button>}
        {cow.aiDate && <button className="btn ghost small" onClick={() => record("calved")}>বাচ্চা প্রসব</button>}
      </div>
      {cow.history.length > 0 && (
        <details>
          <summary className="hint" style={{ cursor: "pointer" }}>ইতিহাস ({bn(cow.history.length)})</summary>
          <ul className="timeline" style={{ marginTop: 6 }}>
            {[...cow.history].reverse().map((h, i) => <li key={i}><span>{EVENT_N[h.type]}</span><span>{fmtDate(h.date)}</span></li>)}
          </ul>
        </details>
      )}
      <div style={{ textAlign: "right" }} className="no-print">
        <ArmedButton label="মুছুন" armedLabel="নিশ্চিত, মুছুন" onConfirm={async () => {
          try {
            await api(`/api/samity/cows/${cow.id}`, { method: "DELETE" });
            toast("গাভী মুছে ফেলা হয়েছে");
            onChanged();
          } catch (e) { toast((e as Error).message); }
        }} />
      </div>
    </div>
  );
}

function AddCow({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/samity/cows", { body: Object.fromEntries(new FormData(e.currentTarget)) });
      toast("গাভী যোগ হয়েছে");
      onDone();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h3>নতুন গাভী</h3>
      <div className="grid2">
        <label>গাভীর নাম<input name="name" required maxLength={40} placeholder="যেমন: লালী" autoFocus /></label>
        <label>মালিক (সদস্য)<input name="owner" required maxLength={60} /></label>
        <label>জাত
          <select name="breed" defaultValue="">
            <option value="">বাছাই করুন</option>
            {BREEDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
        <label>ইয়ার ট্যাগ নং (ঐচ্ছিক)<input name="tag" maxLength={30} /></label>
        <label>শেষ কৃত্রিম প্রজননের তারিখ<input name="aiDate" type="date" max={today()} /></label>
        <label>শেষ প্রসবের তারিখ (ঐচ্ছিক)<input name="calvedDate" type="date" max={today()} /></label>
      </div>
      <p className="hint" style={{ margin: 0 }}>প্রজনন না হয়ে থাকলে শুধু প্রসবের তারিখ দিন, পরবর্তী প্রজননের সময় জানিয়ে দেওয়া হবে।</p>
      {err && <div className="err">{err}</div>}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>বাতিল</button>
        <button className="btn" disabled={busy}>যোগ করুন</button>
      </div>
    </form>
  );
}
