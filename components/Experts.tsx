"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, toast } from "./client";
import { ArmedButton, ModBar, useModerator } from "./Moderation";
import { CATN, CATS } from "@/lib/shared";

type Expert = { id: string; name: string; org: string; cat: string; area: string; phone: string };

export default function Experts() {
  const [list, setList] = useState<Expert[] | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [cat, setCat] = useState("all");
  const [area, setArea] = useState("");
  const mod = useModerator();

  const load = useCallback(() => {
    api<Expert[]>("/api/experts").then(setList).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const shown = (list ?? []).filter(
    (x) => (cat === "all" || x.cat === cat) && (!area || (x.area + " " + x.org + " " + x.name).toLowerCase().includes(area.toLowerCase())),
  );

  return (
    <section className="page">
      <div className="toolbar">
        <p className="hint" style={{ margin: 0, maxWidth: "60ch" }}>
          প্রাণিসম্পদ, ডেইরি ও সমবায় বিষয়ে অভিজ্ঞ ব্যক্তিরা এখানে নাম নিবন্ধন করুন, যাতে উপজেলা পর্যায়ের খামারীরা সরাসরি যোগাযোগ করতে পারেন।
        </p>
        <button className="btn" onClick={() => setAdding((v) => !v)}>+ বিশেষজ্ঞ হিসেবে যুক্ত হোন</button>
      </div>
      {adding && <AddExpert onCancel={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
      <div className="toolbar">
        <input className="search" type="search" placeholder="এলাকা বা নাম দিয়ে খুঁজুন (যেমন: বগুড়া)" value={area}
          onChange={(e) => setArea(e.target.value)} aria-label="এলাকা দিয়ে খুঁজুন" />
        <select style={{ flex: "0 1 260px" }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="বিষয়">
          <option value="all">সব বিষয়</option>
          {CATS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <div className="notice">{error}</div>}
      {list && list.length === 0 && (
        <div className="empty"><h3>এখনো কেউ নিবন্ধন করেননি</h3>প্রথম বিশেষজ্ঞ হিসেবে যুক্ত হতে উপরের বোতাম চাপুন।</div>
      )}
      {list && list.length > 0 && shown.length === 0 && <div className="empty"><h3>মিল পাওয়া যায়নি</h3>অন্য এলাকা বা বিষয় দিয়ে খুঁজুন।</div>}
      <div className="experts">
        {shown.map((x) => (
          <div className="ex" key={x.id}>
            <span className="avatar">{x.name.replace(/^(ডা\.|ড\.|মো\.|মোঃ)\s*/, "").charAt(0)}</span>
            <b>{x.name}</b>
            <span className="org">{x.org}</span>
            <span className="tag">{CATN[x.cat] || ""}</span>
            <span className="hint">কর্মএলাকা: {x.area}</span>
            {x.phone && <a className="phone" href={`tel:${x.phone.replace(/[\s-]/g, "")}`}>{x.phone}</a>}
            {mod.on && (
              <div>
                <ArmedButton label="তালিকা থেকে সরান" armedLabel="নিশ্চিত, মুছুন" onConfirm={async () => {
                  try {
                    await api(`/api/experts/${x.id}`, { method: "DELETE" });
                    toast("তালিকা থেকে সরানো হয়েছে");
                    load();
                  } catch (e) { toast((e as Error).message); }
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <ModBar {...mod} />
    </section>
  );
}

function AddExpert({ onCancel, onDone }: { onCancel: () => void; onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/experts", { body: Object.fromEntries(new FormData(e.currentTarget)) });
      toast("নিবন্ধন সম্পন্ন হয়েছে");
      onDone();
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h3>বিশেষজ্ঞ নিবন্ধন</h3>
      <div className="grid2">
        <label>নাম<input name="name" required maxLength={60} autoFocus /></label>
        <label>প্রতিষ্ঠান ও পদবি<input name="org" required maxLength={100} placeholder="যেমন: উপজেলা প্রাণিসম্পদ অফিস" /></label>
        <label>বিশেষজ্ঞতার বিষয়
          <select name="cat" required defaultValue="">
            <option value="">বিষয় বাছাই করুন</option>
            {CATS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>কর্মএলাকা (জেলা/উপজেলা)<input name="area" required maxLength={80} /></label>
        <label>মোবাইল নম্বর (ঐচ্ছিক)<input name="phone" inputMode="tel" maxLength={20} placeholder="01XXXXXXXXX" /></label>
      </div>
      <p className="hint" style={{ margin: 0 }}>মোবাইল নম্বর দিলে এই পোর্টালের সব ব্যবহারকারী তা দেখতে পাবেন।</p>
      {err && <div className="err">{err}</div>}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>বাতিল</button>
        <button className="btn" type="submit" disabled={busy}>নিবন্ধন করুন</button>
      </div>
    </form>
  );
}
