import React, { useState, useEffect, useRef } from "react";
import { Zap, Play, Square, Activity } from "lucide-react";
import { cls } from "../utils";

interface StressTestControlProps {
  onSimulate: (decision: any) => Promise<void>;
  onEvent: (type: "info" | "success" | "warning" | "security", message: string) => Promise<void>;
}

export function StressTestControl({ onSimulate, onEvent }: StressTestControlProps) {
  const [isActive, setIsActive] = useState(false);
  const [intensity, setIntensity] = useState(1); // Decisions per second
  const [stats, setStats] = useState({ total: 0, blocked: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateRandomDecision = () => {
    const types = ["clean", "drift", "missing", "violation"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const base = {
      order_ref: `SIM-${Math.random().toString(36).substring(7).toUpperCase()}`,
      prediction_id: `pred_sim_${Math.floor(Math.random() * 10000)}`,
      actor: "simulation_engine:v1",
      owner: "STRESS_TEST",
      source_context: "load_test_active",
      comment: "Automatisierter Lasttest-Eintrag."
    };

    switch (type) {
      case "drift":
        return { ...base, db_check: "found", action: "hold", drift: true, override_used: false, reason_code: "drift_detected" };
      case "missing":
        return { ...base, db_check: "not_found", action: "reject", drift: false, override_used: false, reason_code: "db_mismatch" };
      case "violation":
        return { ...base, db_check: "not_found", action: "accept", drift: true, override_used: false, reason_code: "security_breach_attempt" };
      default:
        return { ...base, db_check: "found", action: "accept", drift: false, override_used: false, reason_code: "nominal_flow" };
    }
  };

  useEffect(() => {
    if (isActive) {
      onEvent("info", `Simulation Engine gestartet // Intensität: ${intensity} OPS`);
      timerRef.current = setInterval(async () => {
        const decision = generateRandomDecision();
        try {
          await onSimulate(decision);
          setStats(s => ({ ...s, total: s.total + 1 }));
        } catch (err) {
          setStats(s => ({ ...s, blocked: s.blocked + 1 }));
          onEvent("security", `SIMULATION BLOCKED: ${decision.order_ref} // Guardrail Breach`);
        }
      }, 1000 / intensity);
    } else {
      if (isActive === false && timerRef.current) {
         onEvent("info", "Simulation Engine gestoppt.");
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, intensity, onSimulate, onEvent]);

  return (
    <div className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={cls("w-5 h-5", isActive ? "text-yellow-400 animate-pulse" : "text-slate-500")} />
          <h3 className="text-sm font-mono font-bold text-blue-100 uppercase tracking-wider">Simulation Engine</h3>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={cls(
            "flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-bold transition-all",
            isActive 
              ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30" 
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30"
          )}
        >
          {isActive ? <><Square className="w-3 h-3" /> STOP TEST</> : <><Play className="w-3 h-3" /> START TEST</>}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>INTENSITÄT: {intensity} OPS</span>
            <span>MAX: 10 OPS</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Processed</div>
            <div className="text-lg font-mono font-bold text-blue-400">{stats.total}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Blocked</div>
            <div className="text-lg font-mono font-bold text-red-400">{stats.blocked}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
