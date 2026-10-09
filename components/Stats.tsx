"use client";
import { useEffect, useState } from "react";
import { api } from "./client";
import { bn } from "@/lib/shared";

type S = { questions: number; answers: number; experts: number; samities: number; trainings: number };

/** Live portal counters shown in the home hero. */
export default function Stats() {
  const [s, setS] = useState<S | null>(null);
  useEffect(() => {
    api<S>("/api/stats").then(setS).catch(() => {});
  }, []);
  const v = (n?: number) => (n == null ? "–" : bn(n));
  return (
    <div className="stats" aria-label="পোর্টালের সংক্ষিপ্ত তথ্য">
      <div className="stat"><b>৮১</b><span>উপজেলা</span></div>
      <div className="stat"><b>{v(s?.samities)}</b><span>সমিতি অনলাইনে</span></div>
      <div className="stat"><b>{v(s?.questions)}</b><span>প্রশ্ন</span></div>
      <div className="stat"><b>{v(s?.answers)}</b><span>পরামর্শ</span></div>
      <div className="stat"><b>{v(s?.experts)}</b><span>বিশেষজ্ঞ</span></div>
    </div>
  );
}
