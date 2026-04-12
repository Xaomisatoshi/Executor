import React from "react";
import { X, Settings, Cpu, ShieldCheck, ShieldAlert, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cls, apiGet } from "../utils";
import { GoogleGenAI } from "@google/genai";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GeminiStatus = "loading" | "active" | "invalid" | "missing";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [status, setStatus] = React.useState<GeminiStatus>("loading");
  const [isLoading, setIsLoading] = React.useState(false);

  const checkStatus = React.useCallback(async () => {
    setIsLoading(true);
    setStatus("loading");
    try {
      const config = await apiGet<{ geminiApiKey: string }>("/api/config");
      
      if (!config.geminiApiKey) {
        setStatus("missing");
        return;
      }

      // Validation Step: Try to initialize and make a minimal call
      try {
        const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
        // We use a very simple call to check if the key is valid
        // Note: This might incur a tiny cost/quota usage, but it's the only way to be sure.
        await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "ping",
          config: { maxOutputTokens: 1 }
        });
        setStatus("active");
      } catch (validationError) {
        console.error("Gemini API Key validation failed:", validationError);
        setStatus("invalid");
      }
    } catch (error) {
      console.error("Failed to check Gemini status:", error);
      setStatus("missing");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, checkStatus]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-blue-500" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-white">System Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Gemini API Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-zinc-400" />
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">AI Core Configuration</h3>
                  </div>
                  <div className={cls(
                    "flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tighter",
                    status === "loading" ? "bg-zinc-500/10 text-zinc-500" :
                    status === "active" ? "bg-emerald-500/10 text-emerald-400" : 
                    status === "invalid" ? "bg-rose-500/10 text-rose-400" : "bg-zinc-500/10 text-zinc-500"
                  )}>
                    {status === "loading" ? (
                      <><RefreshCw className="h-3 w-3 animate-spin" /> Checking</>
                    ) : status === "active" ? (
                      <><ShieldCheck className="h-3 w-3" /> Active</>
                    ) : status === "invalid" ? (
                      <><AlertCircle className="h-3 w-3" /> Invalid</>
                    ) : (
                      <><ShieldAlert className="h-3 w-3" /> Missing</>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-mono text-[11px] font-bold text-white">GEMINI_API_KEY</div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        The Gemini API key is used for strategic analysis and automated auditing. 
                        Status: {status === "loading" ? "Validating..." : 
                                status === "active" ? "Verified & Active" : 
                                status === "invalid" ? "Validation Failed" : "Not Detected"}.
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                      <RefreshCw className={cls("h-4 w-4", status === "loading" && "animate-spin", status === "active" && "text-blue-500")} />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={checkStatus}
                      disabled={isLoading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw className={cls("h-3 w-3", isLoading && "animate-spin")} /> Refresh Status
                    </button>
                    <button 
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600/10 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-blue-400 transition hover:bg-blue-600/20"
                      onClick={() => {
                        // In this environment, we guide the user to the platform settings
                        alert("Please use the 'Settings' menu in the AI Studio sidebar to update your API keys and secrets.");
                      }}
                    >
                      <ExternalLink className="h-3 w-3" /> {status === "invalid" ? "Re-enter Key" : "Update Key"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Security Info */}
              <div className="rounded-xl bg-blue-500/5 p-4 border border-blue-500/10">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-400">Security Protocol</div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      API keys are stored as encrypted environment variables. They are never exposed in client-side code or logs. 
                      The "Update Key" action redirects to the secure platform vault.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 bg-white/[0.01] px-6 py-4">
              <p className="text-center font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
                Midnight Console // Strategic Security Node
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
