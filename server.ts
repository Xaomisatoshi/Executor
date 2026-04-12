import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { DecisionEngine } from "./src/engine.ts";
import { normalizeDecision } from "./src/utils.ts";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpunkte
  app.post("/api/search", async (req, res) => {
    const { prompt } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      res.json({ text: response.text });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    try {
      const response = await ai.models.generateImages({
        model: "gemini-3.1-flash-image-preview",
        prompt: prompt,
        config: { numberOfImages: 1 }
      });
      res.json({ image: response.generatedImages[0].image.imageBytes });
    } catch (error) {
      res.status(500).json({ error: "Image generation failed" });
    }
  });

  app.post("/api/generate-video", async (req, res) => {
    const { prompt, aspectRatio } = req.body;
    try {
      const response: any = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt: prompt,
        config: { aspectRatio: aspectRatio || "16:9" }
      });
      res.json({ video: response.generatedVideos[0].video.videoBytes });
    } catch (error) {
      res.status(500).json({ error: "Video generation failed" });
    }
  });

  // In-memory Speicher
  let rawLogs: any[] = [
    {
      id: "dec_1001",
      ts: new Date().toISOString(),
      order_ref: "ORD-LIVE-001",
      prediction_id: "pred_live_1",
      db_check: "found",
      action: "accept",
      drift: false,
      actor: "system:init",
      owner: "SYSTEM",
      override_used: false,
      override_reason: "",
      reason_code: "initial_load",
      source_context: "system_boot",
      guardrail_state: "clean",
      comment: "System erfolgreich gestartet."
    }
  ];
  let feedbackLogs: any[] = [];

  // Hilfsfunktion: Erstellt eine Engine-Instanz mit aktuellen Daten
  const getEngine = () => {
    const normalized = rawLogs.map(normalizeDecision);
    return new DecisionEngine(normalized);
  };

  // API Endpunkte
  app.get("/api/logs", (req, res) => {
    console.log(`[System] Logs abgefragt: ${rawLogs.length} Einträge`);
    res.json(rawLogs);
  });

  app.post("/api/feedback", (req, res) => {
    const feedback = {
      id: `fb_${Date.now()}`,
      ts: new Date().toISOString(),
      ...req.body
    };
    feedbackLogs.push(feedback);
    console.log(`[Feedback] Neue Rückmeldung erhalten: "${feedback.text.substring(0, 30)}..."`);
    res.status(201).json({ status: "ok" });
  });

  app.get("/api/metrics", (req, res) => {
    const engine = getEngine();
    const metrics = engine.getMetrics();
    console.log(`[System] Metriken berechnet: Acceptance ${Math.round(metrics.acceptance * 100)}%`);
    res.json(metrics);
  });

  app.get("/api/config", (req, res) => {
    res.json({
      geminiApiKey: process.env.GEMINI_API_KEY || ""
    });
  });

  app.post("/api/decisions", (req, res) => {
    const engine = getEngine();
    const payload = req.body;

    // SERVER-SIDE VALIDATION
    // Wir nutzen die Engine, um den Guardrail-Status zu erzwingen
    const guardrailState = engine.validateDecision({
      dbCheck: payload.db_check,
      drift: payload.drift,
      overrideUsed: payload.override_used
    });

    if (guardrailState === "blocked" && !payload.override_used) {
      console.error(`[Security] Blockierte Entscheidung abgelehnt: ${payload.order_ref}`);
      return res.status(403).json({ 
        error: "Guardrail Violation", 
        message: "Diese Entscheidung wird vom System blockiert." 
      });
    }

    const newDecision = {
      id: `dec_${Date.now()}`,
      ts: new Date().toISOString(),
      ...payload,
      guardrail_state: guardrailState // Der Server hat das letzte Wort
    };

    rawLogs = [newDecision, ...rawLogs];
    console.log(`[System] Neue Entscheidung gespeichert: ${newDecision.id} (${newDecision.action})`);
    res.status(201).json(newDecision);
  });

  // Vite Middleware für Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Operator Console System aktiv`);
    console.log(`   Schnittstelle: http://localhost:${PORT}`);
    console.log(`   Modus: Full-Stack (Engine-Validated)\n`);
  });
}

startServer();
