import { config } from "../config/env.js";

export const ZOHO_SCOPES = [
  "ZohoCreator.report.READ",
  "ZohoCreator.report.UPDATE",
  "ZohoCreator.report.CREATE",
].join(",");

export function getRedirectUri() {
  return process.env.ZOHO_REDIRECT_URI || `http://localhost:${config.port}/oauth/callback`;
}

export function buildAuthorizationUrl() {
  const { clientId, accountsUrl } = config.zoho;
  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    scope: ZOHO_SCOPES,
    client_id: clientId,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    redirect_uri: redirectUri,
  });

  return `${accountsUrl}/oauth/v2/auth?${params}`;
}

/**
 * Exchange authorization code for access + refresh tokens.
 * @param {string} code - Authorization code from callback
 * @param {string} [accountsServer] - From callback ?accounts-server= (must match user's DC)
 */
export async function exchangeAuthorizationCode(code, accountsServer) {
  const { clientId, clientSecret, accountsUrl } = config.zoho;
  const redirectUri = getRedirectUri();
  const tokenBase = (accountsServer || accountsUrl).replace(/\/$/, "");

  if (!clientId || !clientSecret) {
    throw new Error("ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET must be set in .env");
  }

  // Zoho expects params as query string on POST (not JSON body)
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: code.trim(),
  });

  const tokenUrl = `${tokenBase}/oauth/v2/token?${params}`;

  const res = await fetch(tokenUrl, { method: "POST" });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    const err = data.error || "token_exchange_failed";
    let hint = "";
    if (err === "invalid_client") {
      hint =
        " Usually means: (1) wrong data center — set ZOHO_ACCOUNTS_URL to accounts.zoho.in if India account, " +
        "(2) Client ID/Secret from wrong app type — must be Server-based Application, " +
        "(3) Client created on api-console.zoho.in but using .com URL (or vice versa).";
    } else if (err === "invalid_client_secret") {
      hint = " Copy Client Secret again from API Console (Server-based Application tab).";
    } else if (err === "invalid_code") {
      hint = " Code expired (~1 min). Start again from /oauth/start immediately after login.";
    }
    throw new Error(`${err}${hint} [token URL: ${tokenBase}]`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    apiDomain: data.api_domain,
    accountsServer: tokenBase,
  };
}

/**
 * Get new access token using refresh token.
 */
export async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret, accountsUrl } = config.zoho;

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params}`, { method: "POST" });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(data.error || data.message || JSON.stringify(data));
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
