import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity, Cpu, Database, Shield, Zap } from "lucide-react";
import { db, collection, query, orderBy, limit, onSnapshot } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils";

interface SystemEvent {
  id: string;
  ts: string;
  type: "info" | "success" | "warning" | "security";
  message: string;
}

const ICON_MAP = {
  info: Database,
  success: Activity,
  warning: Zap,
  security: Shield
};

export function EventStream() {
  const [events, setEvents] = useState<SystemEvent[]>([]);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("ts", "desc"), limit(6));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemEvent[];
      setEvents(newEvents);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "events");
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
        <Activity className="h-3 w-3 text-blue-500" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Live System Stream
        </span>
      </div>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {events.map((event) => {
            const Icon = ICON_MAP[event.type] || Activity;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.05]"
              >
                <Icon className="h-3 w-3 text-blue-500/50" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
                      {event.message}
                    </span>
                    <span className="font-mono text-[8px] text-zinc-700">{event.ts}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
