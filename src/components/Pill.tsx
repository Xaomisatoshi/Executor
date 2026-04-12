import React from "react";
import { cls } from "../utils";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "yellow" | "red" | "blue" }) {
  const tones = {
    neutral: "bg-zinc-800 text-zinc-400 border-zinc-700",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return <span className={cls("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider", tones[tone])}>{children}</span>;
}
