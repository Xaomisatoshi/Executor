import React from "react";
import { motion } from "motion/react";
import { cls } from "../utils";

export function KpiCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ComponentType<any>;
  tone?: "neutral" | "green" | "yellow" | "red";
}) {
  const toneClasses = {
    green: "text-emerald-400 neon-glow-green",
    yellow: "text-amber-400 neon-glow-amber",
    red: "text-rose-400 neon-glow-rose",
    neutral: "text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] hover:border-white/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            {title}
          </p>
          <h3 className={cls("mt-2 font-mono text-3xl font-medium tracking-tight", toneClasses[tone])}>
            {value}
          </h3>
        </div>
        <div className="rounded-lg bg-white/[0.05] p-2">
          <Icon className={cls("h-5 w-5 opacity-50 transition-opacity group-hover:opacity-100", toneClasses[tone])} />
        </div>
      </div>
      {helper && (
        <p className="mt-3 text-[11px] font-medium text-zinc-500">
          {helper}
        </p>
      )}
      <div className={cls("absolute bottom-0 left-0 h-0.5 w-full opacity-20", 
        tone === "green" ? "bg-emerald-500" : 
        tone === "red" ? "bg-rose-500" : 
        tone === "yellow" ? "bg-amber-500" : "bg-zinc-700"
      )} />
    </div>
  );
}
