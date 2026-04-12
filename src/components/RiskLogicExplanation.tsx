import React from "react";
import { Info, AlertCircle, CheckCircle } from "lucide-react";
import { RiskEvaluation, MetricsState } from "../types";
import { CONFIG } from "../constants";
import { toPct } from "../utils";

export function RiskLogicExplanation({ evaluation, metrics }: { evaluation: RiskEvaluation; metrics: MetricsState }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-5 text-[11px]">
      <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-widest text-zinc-400">
        <Info className="h-3 w-3" />
        System Logic Protocol // Ruleset
      </div>
      
      <div className="grid gap-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className="text-zinc-500">Save Success Integrity</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400">{toPct(metrics.saveSuccess)}</span>
            {metrics.saveSuccess >= CONFIG.thresholds.minSaveSuccess ? (
              <CheckCircle className="h-3 w-3 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-rose-400" />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className="text-zinc-500">System Acceptance Threshold</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400">{toPct(metrics.acceptance)}</span>
            {metrics.acceptance >= CONFIG.thresholds.minAcceptance ? (
              <CheckCircle className="h-3 w-3 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-400" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <span className="text-zinc-500">Data Drift Variance</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-blue-400">{toPct(metrics.driftRate)}</span>
            {metrics.driftRate <= CONFIG.thresholds.maxDriftRate ? (
              <CheckCircle className="h-3 w-3 text-emerald-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-400" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 border-t border-white/5 pt-2 font-mono text-[9px] uppercase tracking-tighter text-zinc-600">
        PROTOCOL: Hard Stops (RED) block execution. Soft Stops (YELLOW) require Owner Override justification.
      </div>
    </div>
  );
}
