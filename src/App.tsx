import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  Settings,
  KeyRound,
  RefreshCw
} from "lucide-react";

import { DecisionRecord, ApiDecisionPayload } from "./types";
import { CONFIG, OWNER_TAG, seedLogs } from "./constants";
import { 
  normalizeDecision, 
  handleFirestoreError,
  OperationType
} from "./utils";
import { DecisionEngine } from "./engine";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  setDoc,
  where,
  User 
} from "./firebase";

import { ChatAssistant } from "./components/ChatAssistant";
import { NeuralLattice } from "./components/NeuralLattice";
import { SettingsModal } from "./components/SettingsModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LivePowerBar } from "./components/Header";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [logs, setLogs] = useState<DecisionRecord[]>(CONFIG.useMockData ? seedLogs : []);
  
  const engine = useMemo(() => new DecisionEngine(logs), [logs]);
  
  const [selected, setSelected] = useState<DecisionRecord | null>(logs[0] ?? null);
  const metrics = engine.getMetrics();
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [loadError, setLoadError] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string>("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user || CONFIG.useMockData) return;

    const q = query(
      collection(db, "decisions"), 
      where("uid", "==", user.uid),
      orderBy("ts", "desc"), 
      limit(100)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[SNAPSHOT] Received ${snapshot.size} docs for UID: ${user.uid}`);
      const newLogs = snapshot.docs.map(doc => normalizeDecision({ ...doc.data(), id: doc.id }));
      setLogs(newLogs);
      if (!selected && newLogs.length > 0) {
        setSelected(newLogs[0]);
      }
    }, (error) => {
      console.error("[SNAPSHOT_ERROR]", error);
      handleFirestoreError(error, OperationType.LIST, "decisions");
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  if (!isAuthReady) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight-bg">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">Initializing Core...</span>
        </div>
      </div>
    );
  }

  if (!user && !CONFIG.useMockData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-midnight-bg p-8">
        <div className="mb-8 rounded-full bg-blue-500/10 p-6 ring-1 ring-blue-500/20">
          <KeyRound className="h-12 w-12 text-blue-500" />
        </div>
        <h1 className="mb-2 font-mono text-xl font-bold uppercase tracking-widest text-white">Executor Lab Access</h1>
        <p className="mb-8 max-w-xs text-center font-mono text-[10px] text-zinc-500 leading-relaxed">
          Sicherheits-Uplink erforderlich. Bitte mit autorisierter ARCHITECT-Identität anmelden.
        </p>
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="flex items-center gap-3 rounded-lg bg-blue-600 px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-white transition hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="h-5 w-5 bg-white rounded-full p-1" alt="Google" referrerPolicy="no-referrer" />
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#000B1E] font-sans text-zinc-300 pb-24 relative overflow-hidden">
        {/* Hologram Background */}
        <div className="fixed inset-0 z-0 opacity-40 pointer-events-none flex items-center justify-center">
          <img 
            src="https://storage.googleapis.com/gen-lang-client-0474847336/brain_hologram.png" 
            alt="Background Hologram" 
            className="w-full h-full object-cover blur-2xl scale-110"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10">
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          
          <main className="p-8 flex flex-col items-center h-screen gap-8">
            <div className="w-full flex-1">
              <NeuralLattice />
            </div>
            
            <div className="w-full max-w-4xl">
              <ChatAssistant metrics={metrics} recentLogs={logs} triggerAudit={null} onAuditReset={() => {}} onTypingChange={setIsThinking} />
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
