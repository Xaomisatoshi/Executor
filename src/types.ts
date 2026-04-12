export type DbCheck = "found" | "not_found";
export type ActionType = "accept" | "hold" | "reject";
export type GuardrailState = "clean" | "warning" | "blocked";

export type DecisionRecord = {
  id: string;
  ts: string;
  orderRef: string;
  predictionId: string;
  dbCheck: DbCheck;
  action: ActionType;
  drift: boolean;
  actor: string;
  owner: string;
  overrideUsed: boolean;
  overrideReason: string;
  reasonCode: string;
  sourceContext: string;
  guardrailState: GuardrailState;
  comment?: string;
  uid?: string;
};

export type MetricsState = {
  acceptance: number;
  driftRate: number;
  saveSuccess: number;
  logFreshness: "live" | "stale";
};

export type RiskEvaluation = {
  overall: "green" | "yellow" | "red";
  releaseReady: boolean;
  hardStops: string[];
  softStops: string[];
};

export type ApiDecisionPayload = {
  order_ref: string;
  prediction_id: string;
  db_check: DbCheck;
  action: ActionType;
  drift: boolean;
  actor: string;
  owner: string;
  override_used: boolean;
  override_reason: string;
  reason_code: string;
  source_context: string;
  guardrail_state: GuardrailState;
  comment?: string;
  uid?: string;
  ts?: string;
};
