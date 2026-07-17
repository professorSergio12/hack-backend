import { Router } from "express";
import { config } from "../config/env.js";
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getRedirectUri,
} from "../services/zohoOAuth.js";

const router = Router();

/**
 * GET /oauth/start
 * Opens Zoho login/consent — after approval redirects to /oauth/callback
 */
router.get("/start", (_req, res) => {
  if (!config.zoho.clientId || !config.zoho.clientSecret) {
    return res.status(500).send("Set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in .env first.");
  }

  res.redirect(buildAuthorizationUrl());
});

/**
 * GET /oauth/callback?code=...
 * Zoho redirects here after user approves. Auto-exchanges code for tokens.
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;
  // Zoho appends these after login — use accounts-server for token exchange DC
  const accountsServer = req.query["accounts-server"] || req.query.accounts_server;
  const location = req.query.location;

  if (error) {
    return res.status(400).send(`
      <h2>Zoho OAuth failed</h2>
      <p>${error}</p>
      <p><a href="/oauth/start">Try again</a></p>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <h2>Missing authorization code</h2>
      <p>Start from: <a href="/oauth/start">/oauth/start</a></p>
    `);
  }

  try {
    const tokens = await exchangeAuthorizationCode(code, accountsServer);

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Zoho Tokens Generated</title>
  <style>
    body { font-family: system-ui; max-width: 720px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #166534; }
    pre { background: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; word-break: break-all; }
    .label { font-weight: 600; margin-top: 20px; }
    .note { background: #fef3c7; padding: 12px; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Tokens created successfully</h1>

  <p class="label">1. Copy this into your <code>.env</code> file (permanent — use this):</p>
  <pre>ZOHO_REFRESH_TOKEN=${tokens.refreshToken}</pre>

  <p class="label">2. Access token (temporary — backend auto-refreshes this, ~1 hour):</p>
  <pre>${tokens.accessToken}</pre>

  <p>Expires in: ${tokens.expiresIn} seconds</p>
  <p>Accounts server: ${tokens.accountsServer || "n/a"}${location ? ` | Location: ${location}` : ""}</p>

  <div class="note">
    <strong>Next step:</strong> Paste into <code>.env</code>:<br/>
    <code>ZOHO_REFRESH_TOKEN=${tokens.refreshToken}</code><br/>
    <code>ZOHO_ACCOUNTS_URL=${tokens.accountsServer || "https://accounts.zoho.com"}</code>
  </div>
</body>
</html>
    `);

    console.log("\n=== ZOHO REFRESH TOKEN (add to .env) ===");
    console.log(`ZOHO_REFRESH_TOKEN=${tokens.refreshToken}`);
    console.log("=========================================\n");
  } catch (err) {
    const dcHint =
      accountsServer && accountsServer !== config.zoho.accountsUrl
        ? `<li><strong>Data center mismatch!</strong> Callback says <code>${accountsServer}</code> but .env has <code>${config.zoho.accountsUrl}</code>. Update <code>ZOHO_ACCOUNTS_URL</code> and retry.</li>`
        : "";

    res.status(500).send(`
      <h2>Token exchange failed</h2>
      <pre>${err.message}</pre>
      ${location ? `<p>Callback location: <code>${location}</code></p>` : ""}
      ${accountsServer ? `<p>Callback accounts-server: <code>${accountsServer}</code></p>` : ""}
      <p>Common fixes for <strong>invalid_client</strong>:</p>
      <ul>
        ${dcHint}
        <li>Use <strong>Server-based Application</strong> (not Self Client) in <a href="https://api-console.zoho.com/">API Console</a></li>
        <li>Client ID + Secret must be from the <strong>same</strong> API Console domain as login (.com vs .in)</li>
        <li>India account: set <code>ZOHO_ACCOUNTS_URL=https://accounts.zoho.in</code> in .env</li>
        <li>Register redirect URI: <code>${getRedirectUri()}</code></li>
        <li>Code expires in ~1 minute — <a href="/oauth/start">try again</a> immediately</li>
      </ul>
    `);
  }
});

/**
 * GET /oauth/info — show redirect URI to register in Zoho Console
 */
router.get("/info", (_req, res) => {
  res.json({
    redirectUri: getRedirectUri(),
    registerAt: "https://api-console.zoho.com/",
    steps: [
      "Open your Server-based Application client",
      "Add the redirectUri below under Authorized Redirect URIs",
      "Save, then open /oauth/start in browser",
    ],
    startUrl: `http://localhost:${config.port}/oauth/start`,
  });
});

export default router;
