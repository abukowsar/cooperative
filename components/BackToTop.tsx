"use client";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  return (
    <button className="totop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <ArrowUp size={16} aria-hidden /> উপরে যান
    </button>
  );
}
