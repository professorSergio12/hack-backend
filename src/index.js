import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import formsRouter from "./routes/forms.js";
import operationsRouter from "./routes/operations.js";
import oauthRouter from "./routes/oauth.js";
import stsChecklistRouter from "./routes/stsChecklist.js";
import qhseRouter from "./routes/qhse.js";

/**
 * Hackthone backend — external form submissions only.
 * NOT used by Zoho Creator widgets (widgets use Creator JS SDK in-browser).
 * Clients: operations-sts-checklist, QHSE-FORMS (via server-side proxy).
 * See Hackthone/ARCHITECTURE.md
 */

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/** Optional API key for external forms (skip OAuth + health routes) */
app.use((req, res, next) => {
  if (
    !config.apiKey ||
    req.path === "/health" ||
    req.path.startsWith("/oauth")
  ) {
    return next();
  }

  const key = req.headers["x-api-key"] || req.query.apiKey;
  if (key !== config.apiKey) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    zohoConfigured: !!(config.zoho.clientId && config.zoho.refreshToken),
  });
});

app.use("/oauth", oauthRouter);
app.use("/api/forms", formsRouter);
app.use("/api/operations", operationsRouter);
app.use("/api/sts-checklist", stsChecklistRouter);
app.use("/api/qhse", qhseRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`Hackthone backend running on http://localhost:${config.port}`);
  console.log(`  Health:  GET  /health`);
  console.log(`  OAuth:   GET  /oauth/info   (shows redirect URI to register)`);
  console.log(`  OAuth:   GET  /oauth/start  (generate refresh + access tokens)`);
  console.log(`  Forms:   POST /api/forms/:slug/submit`);
  console.log(`  STS:     POST /api/sts-checklist/:path/create`);
  console.log(`  QHSE:    POST /api/qhse/:path`);
  console.log(`  Lookup:  GET  /api/operations/:referenceNumber`);
});
