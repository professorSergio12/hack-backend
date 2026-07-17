#!/usr/bin/env node
/**
 * Zoho OAuth helper for Hackthone backend.
 *
 * Usage:
 *   node scripts/zoho-oauth.js url          → print authorization URL
 *   node scripts/zoho-oauth.js exchange CODE → exchange auth code for tokens
 *   node scripts/zoho-oauth.js refresh       → test refresh token from .env
 *
 * Prerequisites:
 *   1. Zoho API Console client (Server-based Application)
 *   2. Redirect URI registered in client (default: http://localhost:4000/oauth/callback)
 *   3. ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET in .env
 */

import "dotenv/config";

const SCOPES = [
  "ZohoCreator.report.READ",
  "ZohoCreator.report.UPDATE",
  "ZohoCreator.report.CREATE",
].join(",");

const DEFAULT_REDIRECT_URI = "http://localhost:4000/oauth/callback";

function getConfig() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";
  const redirectUri = process.env.ZOHO_REDIRECT_URI || DEFAULT_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    console.error("Missing ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET in .env");
    process.exit(1);
  }

  return { clientId, clientSecret, accountsUrl, redirectUri };
}

function printAuthUrl() {
  const { clientId, accountsUrl, redirectUri } = getConfig();

  const params = new URLSearchParams({
    scope: SCOPES,
    client_id: clientId,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    redirect_uri: redirectUri,
  });

  const url = `${accountsUrl}/oauth/v2/auth?${params}`;

  console.log("\n=== Step 1: Open this URL in your browser ===\n");
  console.log(url);
  console.log("\n=== Step 2: After approving, copy the ?code=... from the redirect URL ===\n");
  console.log(`Redirect URI must be registered in Zoho API Console:\n  ${redirectUri}\n`);
  console.log("=== Step 3: Run ===\n");
  console.log("  node scripts/zoho-oauth.js exchange YOUR_CODE_HERE\n");
}

async function exchangeCode(code) {
  const { clientId, clientSecret, accountsUrl, redirectUri } = getConfig();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code.trim(),
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error("Token exchange failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\n=== Success! Add this to your .env ===\n");
  console.log(`ZOHO_REFRESH_TOKEN=${data.refresh_token}`);
  console.log("\n=== Access token (expires in ~1 hour, auto-refreshed by backend) ===\n");
  console.log(data.access_token);
  console.log(`\nExpires in: ${data.expires_in} seconds\n`);
}

async function testRefresh() {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!refreshToken) {
    console.error("ZOHO_REFRESH_TOKEN is empty in .env. Run exchange step first.");
    process.exit(1);
  }

  const { clientId, clientSecret, accountsUrl } = getConfig();

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params}`, { method: "POST" });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    console.error("Refresh failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\n=== Refresh token works! ===\n");
  console.log("Access token (first 20 chars):", data.access_token.slice(0, 20) + "...");
  console.log("Expires in:", data.expires_in, "seconds\n");
}

const [,, command, arg] = process.argv;

switch (command) {
  case "url":
    printAuthUrl();
    break;
  case "exchange":
    if (!arg) {
      console.error("Usage: node scripts/zoho-oauth.js exchange YOUR_CODE");
      process.exit(1);
    }
    await exchangeCode(arg);
    break;
  case "refresh":
    await testRefresh();
    break;
  default:
    console.log(`
Zoho OAuth helper

Commands:
  url                 Print authorization URL (open in browser)
  exchange <code>       Exchange authorization code for refresh token
  refresh             Test ZOHO_REFRESH_TOKEN from .env

Required in .env before running:
  ZOHO_CLIENT_ID
  ZOHO_CLIENT_SECRET

Optional:
  ZOHO_ACCOUNTS_URL     (default: https://accounts.zoho.com)
                        Use https://accounts.zoho.in if your account is India DC
  ZOHO_REDIRECT_URI     (default: http://localhost:4000/oauth/callback)
`);
}
