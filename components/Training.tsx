"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CalendarDays, MapPin, Building2 } from "lucide-react";
import { api, lsGet, lsSet, toast } from "./client";
import { ArmedButton, ModBar, useModerator } from "./Moderation";
import { bn, fmtDate, today } from "@/lib/shared";

type T = { id: string; title: string; date: string; venue: string; org: string; seats: number; desc: string; registered: number };
type Reg = { id: string; name: string; phone: string; samity: string };

const MONTH_SHORT = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলাই", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];

export default function Training() {
  const [list, setList] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const mod = useModerator();
  const load = useCallback(() => {
    api<T[]>("/api/trainings").then(setList).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const now = today();
  const upcoming = (list ?? []).filter((t) => t.date >= now);
  const past = (list ?? []).filter((t) => t.date < now).reverse();

  return (
    <div className="page">
      {mod.on && (
        <div className="row-between">
          <span className="hint">মডারেটর হিসেবে আপনি নতুন প্রশিক্ষণ ঘোষণা করতে পারবেন।</span>
          <button className="btn" onClick={() => setAdding((v) => !v)}>+ প্রশিক্ষণ ঘোষণা</button>
        </div>
      )}
      {adding && <AddTraining onCancel={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
      {error && <div className="notice">{error}</div>}
      {list == null && !error && <p className="hint">লোড হচ্ছে…</p>}
      {list && upcoming.length === 0 && (
        <div className="empty"><h3>এই মুহূর্তে কোনো প্রশিক্ষণ ঘোষণা নেই</h3>প্রকল্পের প্রশিক্ষণ পার্টনারদের নতুন প্রশিক্ষণ এখানে প্রকাশ হবে।</div>
      )}
      {upcoming.length > 0 && <h2>আসন্ন প্রশিক্ষণ</h2>}
      <div className="events">{upcoming.map((t) => <Event key={t.id} t={t} mod={mod.on} onChanged={load} />)}</div>
      {past.length > 0 && (
        <>
          <h2>সম্পন্ন প্রশিক্ষণ</h2>
          <div className="events">{past.map((t) => <Event key={t.id} t={t} mod={mod.on} onChanged={load} past />)}</div>
        </>
      )}
      <ModBar {...mod} />
    </div>
  );
}

function Event({ t, mod, past, onChanged }: { t: T; mod: boolean; past?: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [regs, setRegs] = useState<Reg[] | null>(null);
  const left = Math.max(0, t.seats - t.registered);
  const [, m, d] = t.date.split("-").map(Number);
  return (
    <div className={`event hue-violet ${past ? "past" : ""}`}>
      <div className="date"><b>{bn(d)}</b><span>{MONTH_SHORT[m - 1]}</span></div>
      <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
        <h3>{t.title}</h3>
        <div className="meta" style={{ margin: 0 }}>
          <span><CalendarDays size={14} aria-hidden /> {fmtDate(t.date)}</span>
          <span><MapPin size={14} aria-hidden /> {t.venue}</span>
          {t.org && <span><Building2 size={14} aria-hidden /> {t.org}</span>}
        </div>
        {t.desc && <p className="hint" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{t.desc}</p>}
        <div>
          <div className="row-between hint"><span>{bn(t.registered)} জন নিবন্ধিত</span><span>{past ? "সম্পন্ন" : left ? `${bn(left)} আসন বাকি` : "আসন পূর্ণ"}</span></div>
          <div className="seats"><div style={{ width: `${Math.min(100, (t.registered / t.seats) * 100)}%` }} /></div>
        </div>
        {!past && left > 0 && !open && <div><button className="btn small" onClick={() => setOpen(true)}>নিবন্ধন করুন</button></div>}
        {open && <RegisterForm tid={t.id} onDone={() => { setOpen(false); onChanged(); }} onCancel={() => setOpen(false)} />}
        {mod && (
          <div className="actions">
            <button className="btn ghost small" onClick={async () => {
              try { setRegs(regs ? null : await api<Reg[]>(`/api/trainings/${t.id}/register`)); } catch (e) { toast((e as Error).message); }
            }}>{regs ? "তালিকা লুকান" : "নিবন্ধিতদের তালিকা"}</button>
            <ArmedButton label="মুছুন" armedLabel="নিশ্চিত, মুছুন" onConfirm={async () => {
              try { await api(`/api/trainings/${t.id}`, { method: "DELETE" }); toast("প্রশিক্ষণ মুছে ফেলা হয়েছে"); onChanged(); } catch (e) { toast((e as Error).message); }
            }} />
          </div>
        )}
        {regs && (regs.length ? (
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
            {regs.map((r) => <li key={r.id}>{r.name} · <a href={`tel:${r.phone}`}>{r.phone}</a>{r.samity && ` · ${r.samity}`}</li>)}
          </ol>
        ) : <p className="hint" style={{ margin: 0 }}>এখনো কেউ নিবন্ধন করেননি।</p>)}
      </div>
    </div>
  );
}

function RegisterForm({ tid, onDone, onCancel }: { tid: string; onDone: () => void; onCancel: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setErr("");
    try {
      await api(`/api/trainings/${tid}/register`, { body: f });
      lsSet("name", f.name);
      lsSet("phone", f.phone);
      toast("নিবন্ধন সম্পন্ন হয়েছে। প্রশিক্ষণের দিন সময়মতো উপস্থিত থাকুন।");
      onDone();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit} style={{ boxShadow: "none", background: "var(--surface-2)" }}>
      <label>নাম<input name="name" required maxLength={60} defaultValue={lsGet("name")} autoFocus /></label>
      <label>মোবাইল<input name="phone" required inputMode="tel" maxLength={20} defaultValue={lsGet("phone")} placeholder="01XXXXXXXXX" /></label>
      <label>সমিতির নাম (ঐচ্ছিক)<input name="samity" maxLength={100} /></label>
      {err && <div className="err">{err}</div>}
      <div className="row">
        <button type="button" className="btn ghost small" onClick={onCancel}>বাতিল</button>
        <button className="btn small" disabled={busy}>নিশ্চিত করুন</button>
      </div>
    </form>
  );
}

function AddTraining({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await api("/api/trainings", { body: Object.fromEntries(new FormData(e.currentTarget)) });
      toast("প্রশিক্ষণ ঘোষণা করা হয়েছে");
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h3>নতুন প্রশিক্ষণ</h3>
      <label>শিরোনাম<input name="title" required maxLength={120} placeholder="যেমন: আধুনিক পদ্ধতিতে গাভী পালন (৫ দিন)" /></label>
      <div className="grid2">
        <label>তারিখ<input name="date" type="date" required min={today()} /></label>
        <label>আসন সংখ্যা<input name="seats" required inputMode="numeric" defaultValue={30} /></label>
        <label>স্থান<input name="venue" required maxLength={120} placeholder="যেমন: উপজেলা সমবায় কার্যালয়, রামগতি" /></label>
        <label>আয়োজক<input name="org" maxLength={120} placeholder="যেমন: আঞ্চলিক সমবায় প্রশিক্ষণ ইন্সটিটিউট" /></label>
      </div>
      <label>বিস্তারিত<textarea name="desc" maxLength={1000} placeholder="বিষয়বস্তু, সময়, ভাতা ইত্যাদি" /></label>
      {err && <div className="err">{err}</div>}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>বাতিল</button>
        <button className="btn">প্রকাশ করুন</button>
      </div>
    </form>
  );
}
