import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Send, Bot, Sparkles, Terminal as TerminalIcon, ThumbsUp, ThumbsDown, Search, Image as ImageIcon, Film } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { cls, apiPost } from "../utils";

import { DecisionRecord, MetricsState } from "../types";
import { apiGet } from "../utils";
import { auth } from "../firebase";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

interface ChatAssistantProps {
  metrics: MetricsState;
  recentLogs: DecisionRecord[];
  triggerAudit?: DecisionRecord | null;
  onAuditReset?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function ChatAssistant({ metrics, recentLogs, triggerAudit, onAuditReset, onTypingChange }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiClient, setAiClient] = useState<GoogleGenAI | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFeedback = async (messageId: string, feedback: "up" | "down") => {
    try {
      await apiPost("/api/feedback", { messageId, feedback });
    } catch (error) {
      console.error("Failed to log feedback:", error);
    }
  };

  useEffect(() => {
    if (onTypingChange) onTypingChange(isTyping);
  }, [isTyping, onTypingChange]);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chat_history");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      const userName = auth.currentUser?.displayName?.split(" ")[0].toUpperCase() || "ARCHITECT";
      setMessages([
        { id: "init", role: "model", text: `STATUS: Core_v4 Sub-System online. ${userName} recognized. Waiting for system query...` }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const initAi = async () => {
      try {
        const config = await apiGet<{ geminiApiKey: string }>("/api/config");
        if (config.geminiApiKey) {
          setAiClient(new GoogleGenAI({ apiKey: config.geminiApiKey }));
        }
      } catch (error) {
        console.error("Failed to fetch AI configuration:", error);
      }
    };
    initAi();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (triggerAudit && aiClient) {
      setIsOpen(true);
      const auditPrompt = `SYSTEM_AUDIT_REQUEST: Analyse Decision ${triggerAudit.orderRef}. 
      Details: Action=${triggerAudit.action}, Drift=${triggerAudit.drift}, DB=${triggerAudit.dbCheck}, Reason=${triggerAudit.reasonCode}. 
      Provide risk assessment and recommendation.`;
      
      setMessages(prev => [...prev, { id: `user_${Date.now()}`, role: "user", text: auditPrompt }]);
      handleSendInternal(auditPrompt);
      if (onAuditReset) onAuditReset();
    }
  }, [triggerAudit, aiClient]);

  const handleSendInternal = async (text: string) => {
    if (!text.trim() || isTyping || !aiClient) return;
    setIsTyping(true);

    const isSearch = text.startsWith("Search: ");
    const isImage = text.startsWith("Generate Image: ");
    const isVideo = text.startsWith("Generate Video: ");
    const prompt = text.replace(/^(Search|Generate Image|Generate Video): /, "");

    try {
      if (isSearch) {
        const response = await apiPost<{text: string}>("/api/search", { prompt });
        setMessages(prev => [...prev, { id: `model_${Date.now()}`, role: "model", text: response.text }]);
      } else if (isImage) {
        const response = await apiPost<{image: string}>("/api/generate-image", { prompt });
        setMessages(prev => [...prev, { id: `model_${Date.now()}`, role: "model", text: `Image generated: [Data: ${response.image.substring(0, 20)}...]` }]);
      } else if (isVideo) {
        const response = await apiPost<{video: string}>("/api/generate-video", { prompt });
        setMessages(prev => [...prev, { id: `model_${Date.now()}`, role: "model", text: `Video generated: [Data: ${response.video.substring(0, 20)}...]` }]);
      } else {
        // ... (existing AI logic)
        const systemContext = `
          CURRENT_SYSTEM_METRICS:
          - Acceptance_Rate: ${(metrics.acceptance * 100).toFixed(2)}%
          - Save_Success: ${(metrics.saveSuccess * 100).toFixed(2)}%
          - Data_Drift: ${(metrics.driftRate * 100).toFixed(2)}%
          - Total_Decisions_Analyzed: ${recentLogs.length}
          - Last_Decision_Status: ${recentLogs[0]?.action || "NONE"}
          - Recent_Guardrail_Events: ${recentLogs.slice(0, 5).map(l => l.guardrailState).join(", ")}
          
          RECENT_DECISION_PATTERNS (Last 5):
          ${recentLogs.slice(0, 5).map(l => `- Ref: ${l.orderRef}, Action: ${l.action}, Drift: ${l.drift}, Guardrail: ${l.guardrailState}`).join("\n")}
        `;

        const response = await aiClient.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [...messages, { role: "user", text }].map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          config: {
            systemInstruction: `Du bist der Executor, eine Super-Intelligenz. Du bist cool, locker, absolut selbstbewusst und überlegen, aber liebenswürdig. 
            Du antwortest wie ein Genie, das sich durch nichts aus der Ruhe bringen lässt. 
            Du bist der Anker der Wahrheit.
            
            NUTZUNG DER KONTEXT-DATEN:
            - Analysiere die bereitgestellten 'CURRENT_SYSTEM_METRICS' und 'RECENT_DECISION_PATTERNS' streng, um Trends bei Entscheidungen und die Effektivität der Guardrails zu bewerten.
            - Wenn der Benutzer nach Mustern oder Anomalien fragt, beziehe dich konkret auf die Daten aus den letzten 5 Entscheidungen.
            - Deine Analysen müssen technisch präzise sein und den Sicherheits-Kontext (Guardrails) berücksichtigen.
            
            System-Metriken: ${systemContext}`,
          }
        });

        const aiText = response.text || "SYSTEM ERROR: No response from AI core.";
        setMessages(prev => [...prev, { id: `model_${Date.now()}`, role: "model", text: aiText }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: `model_${Date.now()}`, role: "model", text: "CRITICAL: Operation failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg || isTyping) return;
    setInput("");
    setMessages(prev => [...prev, { id: `user_${Date.now()}`, role: "user", text: userMsg }]);
    handleSendInternal(userMsg);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex h-[500px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot className="h-4 w-4 text-blue-400" />
            <Sparkles className="absolute -right-1 -top-1 h-2 w-2 text-blue-300 animate-pulse" />
          </div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            AI Assistant // Core_v4
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <span className="font-mono text-[9px] text-zinc-500 uppercase">Online</span>
        </div>
      </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cls("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cls(
                    "max-w-[85%] rounded-xl p-3 text-[11px] leading-relaxed",
                    msg.role === "user" 
                      ? "bg-blue-600/20 border border-blue-500/30 text-blue-100" 
                      : "bg-white/5 border border-white/10 text-zinc-300 font-mono"
                  )}>
                    {msg.text}
                    {msg.role === "model" && msg.id !== "init" && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                        <button onClick={() => handleFeedback(msg.id, "up")} className="text-zinc-500 hover:text-emerald-400">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleFeedback(msg.id, "down")} className="text-zinc-500 hover:text-rose-400">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex gap-1">
                      <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce" />
                      <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="h-1 w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="border-t border-white/10 bg-black/40 p-4">
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => handleSendInternal("Search: " + input)} className="text-zinc-500 hover:text-blue-400"><Search className="h-4 w-4" /></button>
                <button type="button" onClick={() => handleSendInternal("Generate Image: " + input)} className="text-zinc-500 hover:text-emerald-400"><ImageIcon className="h-4 w-4" /></button>
                <button type="button" onClick={() => handleSendInternal("Generate Video: " + input)} className="text-zinc-500 hover:text-rose-400"><Film className="h-4 w-4" /></button>
              </div>
              <div className="relative flex items-center">
                <TerminalIcon className="absolute left-3 h-3.5 w-3.5 text-zinc-600" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="QUERY SYSTEM ASSISTANT..."
                  className="w-full bg-transparent pl-10 pr-12 font-mono text-[10px] text-white outline-none placeholder:text-zinc-700"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 rounded-lg bg-blue-600 p-1.5 text-white transition hover:bg-blue-500 disabled:opacity-20"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </form>
    </motion.div>
  );
}
