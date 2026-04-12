import { DecisionRecord, MetricsState, RiskEvaluation, DbCheck, ActionType, GuardrailState } from "./types";
import { CONFIG, OWNER_TAG } from "./constants";
import { auth } from "./firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function cls(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function toPct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function normalizeDecision(raw: any): DecisionRecord {
  return {
    id: String(raw.id ?? raw.decision_id ?? `dec_${Date.now()}`),
    ts: String(raw.ts ?? raw.timestamp ?? new Date().toLocaleString("de-DE")),
    orderRef: String(raw.orderRef ?? raw.order_ref ?? ""),
    predictionId: String(raw.predictionId ?? raw.prediction_id ?? ""),
    dbCheck: (raw.dbCheck ?? raw.db_check ?? "found") as DbCheck,
    action: (raw.action ?? "hold") as ActionType,
    drift: Boolean(raw.drift ?? raw.drift_flag),
    actor: String(raw.actor ?? "operator:unknown"),
    owner: String(raw.owner ?? OWNER_TAG),
    overrideUsed: Boolean(raw.overrideUsed ?? raw.override_used),
    overrideReason: String(raw.overrideReason ?? raw.override_reason ?? ""),
    reasonCode: String(raw.reasonCode ?? raw.reason_code ?? "unspecified"),
    sourceContext: String(raw.sourceContext ?? raw.source_context ?? "unknown"),
    guardrailState: (raw.guardrailState ?? raw.guardrail_state ?? "clean") as GuardrailState,
    comment: String(raw.comment ?? ""),
    uid: String(raw.uid ?? ""),
  };
}

export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with ${response.status}`);
  }
  return response.json();
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${url} failed with ${response.status}`);
  }
  return response.json();
}

export function downloadCsv(data: DecisionRecord[]) {
  const headers = ["Zeit", "Order", "Prediction", "DB", "Aktion", "Override", "Drift", "Override Reason", "Comment"];
  const rows = data.map(r => [
    r.ts,
    r.orderRef,
    r.predictionId,
    r.dbCheck,
    r.action,
    r.overrideUsed ? "Ja" : "Nein",
    r.drift ? "Ja" : "Nein",
    r.overrideReason,
    r.comment
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
