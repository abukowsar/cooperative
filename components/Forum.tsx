"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, lsGet, lsSet, toast } from "./client";
import { useModerator, ModBar, ArmedButton } from "./Moderation";
import { ago, bn, CATN, CATS, ROLEN, ROLES } from "@/lib/shared";

type QSummary = {
  id: string; name: string; upz: string; cat: string; title: string; at: number;
  resolved: boolean; answers: number; expertAnswered: boolean;
};
type Answer = { id: string; name: string; role: string; body: string; at: number; helpful: number };
type QDetail = QSummary & { body: string; answers: Answer[] };

export default function Forum() {
  const [items, setItems] = useState<QSummary[] | null>(null);
  const [error, setError] = useState("");
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const mod = useModerator();

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (cat !== "all") p.set("cat", cat);
    if (query) p.set("q", query);
    try {
      setItems(await api<QSummary[]>("/api/questions?" + p));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [cat, query]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const shown = items?.filter((q) => !onlyOpen || (!q.resolved && q.answers === 0)) ?? [];
  const waiting = items?.filter((q) => !q.resolved && q.answers === 0).length ?? 0;

  return (
    <section className="page">
      <div className="toolbar">
        <input className="search" type="search" placeholder="প্রশ্ন খুঁজুন (যেমন: ওলান ফোলা, ঘাস)" aria-label="প্রশ্ন খুঁজুন"
          value={query} onChange={(e) => setQuery(e.target.value.trim())} />
        <button className="btn" onClick={() => setAsking((v) => !v)}>+ সমস্যা জানান</button>
        <div className="chips" role="group" aria-label="বিষয় অনুযায়ী বাছাই">
          <button className="chip" aria-pressed={onlyOpen} onClick={() => setOnlyOpen((v) => !v)}>
            পরামর্শের অপেক্ষায় ({bn(waiting)})
          </button>
          <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>সব বিষয়</button>
          {CATS.map(([k, v]) => (
            <button key={k} className="chip" aria-pressed={cat === k} onClick={() => setCat(k)}>{v}</button>
          ))}
        </div>
      </div>

      {asking && (
        <AskForm
          onCancel={() => setAsking(false)}
          onDone={(id) => {
            setAsking(false);
            setCat("all");
            setQuery("");
            setOpenId(id);
            load();
          }}
        />
      )}

      {error && <div className="notice">{error}</div>}

      <div className="qlist">
        {items == null && !error && <Empty title="প্রশ্ন লোড হচ্ছে">খামারীদের পাঠানো সমস্যা ও বিশেষজ্ঞদের পরামর্শ এখানে দেখা যাবে।</Empty>}
        {items?.length === 0 && !query && cat === "all" && (
          <Empty title="এখনো কোনো প্রশ্ন নেই">গাভী পালনে কোনো সমস্যা থাকলে &quot;সমস্যা জানান&quot; চাপুন। প্রথম প্রশ্নটি আপনিই করুন।</Empty>
        )}
        {items && items.length > 0 && shown.length === 0 && <Empty title="মিল পাওয়া যায়নি">অন্য বিষয় বা শব্দ দিয়ে খুঁজে দেখুন।</Empty>}
        {items?.length === 0 && (query || cat !== "all") && <Empty title="মিল পাওয়া যায়নি">অন্য বিষয় বা শব্দ দিয়ে খুঁজে দেখুন।</Empty>}
        {shown.map((q) => (
          <Question key={q.id} q={q} open={openId === q.id} mod={mod.on}
            onToggle={() => setOpenId(openId === q.id ? null : q.id)} onChanged={load} />
        ))}
      </div>

      <ModBar {...mod} />
    </section>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty"><h3>{title}</h3>{children}</div>;
}

function AskForm({ onCancel, onDone }: { onCancel: () => void; onDone: (id: string) => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ id: string }>("/api/questions", { body: f });
      lsSet("name", f.name);
      lsSet("upz", f.upz);
      toast("আপনার প্রশ্ন প্রকাশিত হয়েছে");
      onDone(r.id);
    } catch (x) {
      setErr((x as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h3>আপনার সমস্যা লিখুন</h3>
      <div className="grid2">
        <label>আপনার নাম<input name="name" required maxLength={60} defaultValue={lsGet("name")} autoFocus /></label>
        <label>উপজেলা / সমিতি<input name="upz" required maxLength={80} placeholder="যেমন: রামগতি, লক্ষ্মীপুর" defaultValue={lsGet("upz")} /></label>
      </div>
      <label>বিষয়
        <select name="cat" required defaultValue="">
          <option value="">বিষয় বাছাই করুন</option>
          {CATS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label>সংক্ষেপে সমস্যা<input name="title" required maxLength={140} placeholder="যেমন: বকনা গরু ঠিকমতো খাচ্ছে না" /></label>
      <label>বিস্তারিত
        <textarea name="body" required maxLength={3000}
          placeholder="গাভীর বয়স, জাত, কতদিন ধরে সমস্যা, কী খাওয়ানো হয়, দৈনিক কত লিটার দুধ দেয় ইত্যাদি লিখুন" />
      </label>
      {err && <div className="err">{err}</div>}
      <div className="row">
        <button type="button" className="btn ghost" onClick={onCancel}>বাতিল</button>
        <button className="btn" type="submit" disabled={busy}>প্রকাশ করুন</button>
      </div>
    </form>
  );
}

function Question({ q, open, mod, onToggle, onChanged }: {
  q: QSummary; open: boolean; mod: boolean; onToggle: () => void; onChanged: () => void;
}) {
  const [detail, setDetail] = useState<QDetail | null>(null);
  const [err, setErr] = useState("");

  const loadDetail = useCallback(async () => {
    try {
      setDetail(await api<QDetail>(`/api/questions/${q.id}`));
    } catch (e) {
      setErr((e as Error).message);
    }
  }, [q.id]);

  useEffect(() => {
    if (open) loadDetail();
  }, [open, loadDetail]);

  const tally = q.resolved ? "done" : q.answers ? "ans" : "";
  return (
    <article className="q">
      <button className="q-head" aria-expanded={open} onClick={onToggle}>
        <div className={`tally ${tally}`}><b>{bn(q.answers)}</b>পরামর্শ</div>
        <div style={{ minWidth: 0 }}>
          <div className="q-title">{q.title}</div>
          <div className="meta">
            <span className="tag">{CATN[q.cat] || "অন্যান্য"}</span>
            <span>{q.name}, {q.upz}</span>
            <span>{ago(q.at)}</span>
            {q.resolved ? <span className="status done">সমাধান হয়েছে</span>
              : q.answers ? (q.expertAnswered && <span className="badge-expert">বিশেষজ্ঞ উত্তর দিয়েছেন</span>)
              : <span className="status open">পরামর্শের অপেক্ষায়</span>}
          </div>
        </div>
      </button>
      {open && (
        <div className="q-body">
          {err && <div className="err">{err}</div>}
          {!detail && !err && <p className="hint" style={{ margin: 0 }}>লোড হচ্ছে…</p>}
          {detail && (
            <>
              <p className="q-text">{detail.body}</p>
              <div className="answers">
                {detail.answers.length === 0 && <p className="hint" style={{ margin: 0 }}>এখনো কেউ পরামর্শ দেননি।</p>}
                {detail.answers.map((a) => (
                  <AnswerItem key={a.id} a={a} mod={mod} onChanged={() => { loadDetail(); onChanged(); }} />
                ))}
              </div>
              <AnswerForm qid={q.id} onDone={() => { loadDetail(); onChanged(); }} />
              {mod && (
                <div className="mod">
                  <button className="btn ghost small" onClick={async () => {
                    try {
                      const r = await api<{ resolved: boolean }>(`/api/questions/${q.id}`, { method: "PATCH" });
                      toast(r.resolved ? "সমাধান হয়েছে চিহ্নিত" : "অমীমাংসিত চিহ্নিত হয়েছে");
                      onChanged();
                    } catch (e) { toast((e as Error).message); }
                  }}>
                    {q.resolved ? "অমীমাংসিত চিহ্নিত করুন" : "সমাধান হয়েছে চিহ্নিত করুন"}
                  </button>
                  <ArmedButton label="প্রশ্ন মুছুন" armedLabel="নিশ্চিত, প্রশ্ন মুছুন" onConfirm={async () => {
                    try {
                      await api(`/api/questions/${q.id}`, { method: "DELETE" });
                      toast("প্রশ্ন মুছে ফেলা হয়েছে");
                      onChanged();
                    } catch (e) { toast((e as Error).message); }
                  }} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

function AnswerItem({ a, mod, onChanged }: { a: Answer; mod: boolean; onChanged: () => void }) {
  const [count, setCount] = useState(a.helpful);
  const [voted, setVoted] = useState(false);
  useEffect(() => setVoted(lsGet("voted").split(",").includes(a.id)), [a.id]);
  async function vote() {
    if (voted) return;
    try {
      const r = await api<{ helpful: number }>(`/api/answers/${a.id}/helpful`, { method: "POST" });
      setCount(r.helpful);
    } catch (e) {
      if ((e as { status?: number }).status !== 409) return toast((e as Error).message);
    }
    setVoted(true);
    lsSet("voted", [...lsGet("voted").split(",").filter(Boolean), a.id].slice(-300).join(","));
  }
  return (
    <div className={`a ${a.role === "expert" ? "expert" : ""}`}>
      <div className="meta" style={{ margin: "0 0 4px" }}>
        <b style={{ color: "var(--fg)" }}>{a.name}</b>
        <span className="role">{ROLEN[a.role] || ""}</span>
        <span>{ago(a.at)}</span>
        <button className="helpful" aria-pressed={voted} onClick={vote} title="এই পরামর্শটি কাজে লেগেছে">
          👍 কাজে লেগেছে {count ? bn(count) : ""}
        </button>
        {mod && (
          <ArmedButton label="মুছুন" armedLabel="নিশ্চিত, মুছুন" onConfirm={async () => {
            try {
              await api(`/api/answers/${a.id}`, { method: "DELETE" });
              toast("পরামর্শ মুছে ফেলা হয়েছে");
              onChanged();
            } catch (e) { toast((e as Error).message); }
          }} />
        )}
      </div>
      <p>{a.body}</p>
    </div>
  );
}

function AnswerForm({ qid, onDone }: { qid: string; onDone: () => void }) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setBusy(true);
    setErr("");
    try {
      await api(`/api/questions/${qid}/answers`, { body: f });
      lsSet("name", f.name);
      lsSet("role", f.role);
      (form.elements.namedItem("body") as HTMLTextAreaElement).value = "";
      toast("পরামর্শ প্রকাশিত হয়েছে");
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    }
    setBusy(false);
  }
  return (
    <form className="form" onSubmit={submit} style={{ background: "var(--bg)" }}>
      <div className="grid2">
        <label>আপনার নাম<input name="name" required maxLength={60} defaultValue={lsGet("name")} /></label>
        <label>পরিচয়
          <select name="role" defaultValue={lsGet("role") || "farmer"}>
            {ROLES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <label>পরামর্শ<textarea name="body" required maxLength={3000} placeholder="আপনার অভিজ্ঞতা বা পরামর্শ লিখুন" /></label>
      {err && <div className="err">{err}</div>}
      <div className="row"><button className="btn" type="submit" disabled={busy}>পরামর্শ দিন</button></div>
    </form>
  );
}
