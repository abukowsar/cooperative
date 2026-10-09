"use client";
import { useEffect, useRef, useState } from "react";
import { api, toast } from "./client";

export function useModerator() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    api<{ moderator: boolean }>("/api/mod").then((r) => setOn(r.moderator)).catch(() => {});
  }, []);
  return { on, setOn };
}

/** Small footer control so project staff can log in to moderate. */
export function ModBar({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  const [show, setShow] = useState(false);
  const [key, setKey] = useState("");
  if (on)
    return (
      <div className="mod-bar no-print">
        মডারেটর হিসেবে লগইন করা আছে
        <button className="btn ghost small" onClick={async () => { await api("/api/mod", { method: "DELETE" }); setOn(false); }}>
          লগআউট
        </button>
      </div>
    );
  return (
    <div className="mod-bar no-print">
      {show ? (
        <form style={{ display: "contents" }} onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("/api/mod", { body: { key } });
            setOn(true);
            setKey("");
            toast("মডারেটর লগইন সফল");
          } catch (x) { toast((x as Error).message); }
        }}>
          <input type="password" placeholder="মডারেটর কী" value={key} onChange={(e) => setKey(e.target.value)} aria-label="মডারেটর কী" autoFocus />
          <button className="btn small">প্রবেশ</button>
        </form>
      ) : (
        <button className="btn ghost small" onClick={() => setShow(true)}>মডারেটর প্রবেশ</button>
      )}
    </div>
  );
}

/** Two-step destructive button: first click arms, second confirms. Disarms after 4s. */
export function ArmedButton({ label, armedLabel, onConfirm }: { label: string; armedLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button type="button" className={`btn danger small ${armed ? "armed" : ""}`} onClick={() => {
      if (!armed) {
        setArmed(true);
        t.current = setTimeout(() => setArmed(false), 4000);
        return;
      }
      clearTimeout(t.current);
      setArmed(false);
      onConfirm();
    }}>
      {armed ? armedLabel : label}
    </button>
  );
}
