import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, X, Send, Command } from "lucide-react";
import { cls, apiPost } from "../utils";
import { CONFIG } from "../constants";

export function FeedbackTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "SYSTEM: Feedback Protocol Initialized.",
    "SYSTEM: Please provide system performance feedback or report anomalies.",
  ]);
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger 1: 5 Minutes (300,000 ms)
    const timer = setTimeout(() => {
      if (!isOpen) setIsOpen(true);
    }, 300000);

    // Trigger 2: Exit Intent (Mouse leaves window)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setIsOpen(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "sending") return;

    const userMsg = `OPERATOR: ${input}`;
    setHistory(prev => [...prev, userMsg]);
    setStatus("sending");

    try {
      await apiPost(CONFIG.endpoints.feedback || "/api/feedback", { text: input });
      setHistory(prev => [...prev, "SYSTEM: Feedback transmitted successfully. Node synchronized."]);
      setStatus("success");
      setInput("");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
      }, 3000);
    } catch (err) {
      setHistory(prev => [...prev, "ERROR: Transmission failed. Local buffer only."]);
      setStatus("idle");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-[400px] overflow-hidden rounded-xl border border-blue-500/30 bg-black/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-3 w-3 text-blue-400" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Feedback Terminal // Node_01
              </span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Terminal Body */}
          <div className="h-48 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed custom-scrollbar" ref={terminalRef}>
            {history.map((line, i) => (
              <div key={i} className={cls(
                "mb-1",
                line.startsWith("SYSTEM:") ? "text-blue-400" : 
                line.startsWith("ERROR:") ? "text-rose-400" : "text-zinc-300"
              )}>
                <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                {line}
              </div>
            ))}
            {status === "sending" && (
              <div className="animate-pulse text-blue-400">SYSTEM: Transmitting...</div>
            )}
          </div>

          {/* Terminal Input */}
          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/40 p-3">
            <div className="relative flex items-center">
              <Command className="absolute left-2 h-3 w-3 text-zinc-600" />
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-transparent pl-7 pr-10 font-mono text-[10px] text-white outline-none placeholder:text-zinc-700"
                placeholder="TYPE FEEDBACK AND PRESS ENTER..."
              />
              <button type="submit" className="absolute right-1 text-blue-500 hover:text-blue-400 transition">
                <Send className="h-3 w-3" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
