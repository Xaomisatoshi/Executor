import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "Ein unerwarteter Systemfehler ist aufgetreten.";
      try {
        const parsed = JSON.parse(error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore Fehler (${parsed.operationType}): ${parsed.error}`;
        }
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-midnight-bg p-8 text-center">
          <div className="mb-6 rounded-full bg-rose-500/10 p-6 ring-1 ring-rose-500/20">
            <ShieldAlert className="h-12 w-12 text-rose-500" />
          </div>
          <h1 className="mb-2 font-mono text-xl font-bold uppercase tracking-widest text-white">System Critical Error</h1>
          <p className="mb-8 max-w-md font-mono text-xs text-zinc-500 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Reboot System
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
