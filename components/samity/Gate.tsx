"use client";
import { createContext, FormEvent, useCallback, useContext, useEffect, useState } from "react";
import { api, toast } from "../client";
import { PriceRule } from "@/lib/shared";
import PageHeader from "../PageHeader";
import { LogOut } from "lucide-react";
import type { IconName } from "@/lib/content";

export type Samity = { id: string; name: string; upz: string; manager: string; code: string; price: PriceRule };
type Ctx = { samity: Samity; reload: () => void; logout: () => void };

const SamityCtx = createContext<Ctx | null>(null);
export const useSamity = () => useContext(SamityCtx)!;

/** Renders login/register until a samity session exists, then the children. */
type Head = { icon?: IconName; hue?: string; title?: string };

export default function SamityGate({ children, icon = "milk", hue = "gold", title }: { children: React.ReactNode } & Head) {
  const [samity, setSamity] = useState<Samity | null | undefined>(undefined);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    api<Samity>("/api/samity")
      .then((s) => { setSamity(s); setError(""); })
      .catch((e) => (e.status === 401 ? setSamity(null) : setError(e.message)));
  }, []);
  useEffect(reload, [reload]);

  const logout = async () => {
    await api("/api/samity/session", { method: "DELETE" }).catch(() => {});
    setSamity(null);
    toast("লগআউট হয়েছে");
  };

  if (error) return <div className="notice">{error}</div>;
  if (samity === undefined) return <p className="hint">লোড হচ্ছে…</p>;
  if (samity === null) return <Auth onDone={reload} />;
  const sub = `${samity.upz} · ব্যবস্থাপক: ${samity.manager} · কোড: ${samity.code}`;
  return (
    <SamityCtx.Provider value={{ samity, reload, logout }}>
      <div className="page">
        <PageHeader icon={icon} hue={hue} title={title ? `${title}: ${samity.name}` : samity.name} sub={sub}>
          <button className="btn ghost small" onClick={logout}><LogOut size={15} aria-hidden /> লগআউট</button>
        </PageHeader>
        {children}
      </div>
    </SamityCtx.Provider>
  );
}

function Auth({ onDone }: { onDone: () => void }) {
  const [err, setErr] = useState({ login: "", reg: "" });
  const [busy, setBusy] = useState(false);

  const submit = (kind: "login" | "reg") => async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setErr({ login: "", reg: "" });
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      await api(kind === "login" ? "/api/samity/session" : "/api/samity", { body });
      toast(kind === "login" ? "স্বাগতম" : "সমিতি নিবন্ধিত হয়েছে");
      onDone();
    } catch (x) {
      setErr((s) => ({ ...s, [kind]: (x as Error).message }));
    }
    setBusy(false);
  };

  return (
    <section className="page">
      <PageHeader icon="milk" hue="gold" title="সমিতির ডিজিটাল খাতা" sub="দুধ সংগ্রহ, সঞ্চয়, ঋণ ও কিস্তি, সদস্য তালিকা আর গাভীর প্রজনন ক্যালেন্ডার। কাগজের খাতার সব কাজ মোবাইলে, হিসাব নিজে থেকেই।" />
      <div className="login-grid">
        <form className="form" onSubmit={submit("login")}>
          <h3>লগইন</h3>
          <label>সমিতি কোড<input name="code" required autoComplete="username" placeholder="যেমন: ramgati-dairy" /></label>
          <label>পিন<input name="pin" type="password" inputMode="numeric" required autoComplete="current-password" /></label>
          {err.login && <div className="err">{err.login}</div>}
          <div className="row"><button className="btn" disabled={busy}>প্রবেশ করুন</button></div>
        </form>
        <form className="form" onSubmit={submit("reg")}>
          <h3>নতুন সমিতি নিবন্ধন</h3>
          <label>সমিতির নাম<input name="name" required maxLength={100} placeholder="যেমন: চর আলগী দুগ্ধ উৎপাদনকারী সমবায় সমিতি" /></label>
          <div className="grid2">
            <label>উপজেলা, জেলা<input name="upz" required maxLength={80} /></label>
            <label>ব্যবস্থাপকের নাম<input name="manager" required maxLength={60} /></label>
            <label>সমিতি কোড (লগইনের জন্য)<input name="code" required pattern="[a-zA-Z0-9-]{3,30}" placeholder="ইংরেজিতে, যেমন ramgati-dairy" autoComplete="username" /></label>
            <label>পিন (৪–১২ সংখ্যা)<input name="pin" type="password" inputMode="numeric" required pattern="[0-9০-৯]{4,12}" autoComplete="new-password" /></label>
          </div>
          <p className="hint" style={{ margin: 0 }}>কোড ও পিন মনে রাখুন। এগুলো দিয়ে যেকোনো মোবাইল বা কম্পিউটার থেকে খাতায় প্রবেশ করা যাবে।</p>
          {err.reg && <div className="err">{err.reg}</div>}
          <div className="row"><button className="btn" disabled={busy}>নিবন্ধন করুন</button></div>
        </form>
      </div>
    </section>
  );
}
