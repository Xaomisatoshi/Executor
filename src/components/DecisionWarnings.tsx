import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { DbCheck } from "../types";

export function DecisionWarnings({ dbCheck, drift }: { dbCheck: DbCheck; drift: boolean }) {
  const warnings: string[] = [];
  if (drift) warnings.push("DRIFT DETECTED: Manual audit required before execution.");
  if (dbCheck === "not_found") warnings.push("RECORD MISSING: Verify order reference or hold decision.");

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {warnings.map((warning) => (
          <motion.div
            key={warning}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            className="flex items-start gap-2 border border-amber-500/20 bg-amber-500/5 p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-amber-400 neon-glow-amber"
          >
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>{warning}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {warnings.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2 border border-emerald-500/20 bg-emerald-500/5 p-3 font-mono text-[10px] font-bold uppercase tracking-tight text-emerald-400 neon-glow-green"
        >
          <CheckCircle2 className="h-3 w-3 shrink-0 animate-pulse" />
          <span>SYSTEM CLEAR: No guardrail conflicts detected.</span>
        </motion.div>
      )}
    </div>
  );
}
