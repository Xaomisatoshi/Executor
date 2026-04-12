import { DecisionRecord, MetricsState, RiskEvaluation, DbCheck, ActionType, GuardrailState, ApiDecisionPayload } from "./types";
import { CONFIG, OWNER_TAG } from "./constants";

/**
 * Die DecisionEngine ist das "Gehirn" des Systems.
 * Sie ist völlig unabhängig von der UI und könnte auch auf einem Server laufen.
 */
export class DecisionEngine {
  private logs: DecisionRecord[];
  private thresholds = CONFIG.thresholds;

  constructor(initialLogs: DecisionRecord[] = []) {
    this.logs = initialLogs;
  }

  /**
   * Berechnet die aktuellen System-Metriken basierend auf der Historie.
   */
  public getMetrics(): MetricsState {
    const total = this.logs.length || 1;
    return {
      acceptance: this.logs.filter((r) => r.action === "accept").length / total,
      driftRate: this.logs.filter((r) => r.drift).length / total,
      saveSuccess: 0.99,
      logFreshness: this.logs.length > 0 ? "live" : "stale",
    };
  }

  /**
   * Bewertet das Risiko des Gesamtsystems.
   * Dies ist die Kern-Logik, die entscheidet, ob ein Release blockiert wird.
   */
  public evaluateRisk(): RiskEvaluation {
    const metrics = this.getMetrics();
    const hardStops: string[] = [];
    const softStops: string[] = [];

    // Regel 1: Datenintegrität
    if (metrics.saveSuccess < this.thresholds.minSaveSuccess) {
      hardStops.push("CRITICAL: Save Success Rate Failure.");
    }

    // Regel 2: Beobachtbarkeit
    if (metrics.logFreshness !== "live") {
      hardStops.push("CRITICAL: System observability lost.");
    }

    // Regel 3: Performance-Korridor
    if (metrics.acceptance < this.thresholds.minAcceptance) {
      softStops.push("WARNING: Acceptance rate below target.");
    }

    if (metrics.driftRate > this.thresholds.maxDriftRate) {
      softStops.push("WARNING: High data drift detected.");
    }

    return {
      overall: hardStops.length > 0 ? "red" : softStops.length > 0 ? "yellow" : "green",
      releaseReady: hardStops.length === 0 && softStops.length === 0,
      hardStops,
      softStops,
    };
  }

  /**
   * Validiert eine neue Entscheidung gegen die Guardrails des Systems.
   */
  public validateDecision(payload: Partial<DecisionRecord>): GuardrailState {
    const needsWarning = payload.drift || payload.dbCheck === "not_found" || payload.overrideUsed;
    return needsWarning ? "warning" : "clean";
  }

  public addRecord(record: DecisionRecord) {
    this.logs = [record, ...this.logs];
  }

  public getLogs() {
    return this.logs;
  }

  /**
   * Generiert einen technischen System-Report im JSON-Format.
   * Ideal für den Export an andere Systeme oder zur Diagnose.
   */
  public generateHealthReport() {
    const metrics = this.getMetrics();
    const evaluation = this.evaluateRisk();
    
    return {
      timestamp: new Date().toISOString(),
      owner: OWNER_TAG,
      systemStatus: evaluation.overall.toUpperCase(),
      releaseReady: evaluation.releaseReady,
      metrics: {
        ...metrics,
        thresholds: this.thresholds
      },
      activeStops: {
        hard: evaluation.hardStops,
        soft: evaluation.softStops
      },
      logSummary: {
        totalRecords: this.logs.length,
        lastEntry: this.logs[0]?.ts || "none"
      }
    };
  }
}
