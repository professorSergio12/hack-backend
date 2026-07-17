import { config, getCreatorBaseUrl } from "../config/env.js";

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Refresh Zoho OAuth access token.
 */
export async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const { clientId, clientSecret, refreshToken, accountsUrl } = config.zoho;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Zoho OAuth credentials not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN in .env");
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(`${accountsUrl}/oauth/v2/token?${params}`, { method: "POST" });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(data.error || data.message || "Failed to refresh Zoho access token");
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
}

/**
 * Find Creator operation record by Reference_Number.
 * @returns {Promise<{ id: string, data: object } | null>}
 */
export async function findOperationByReference(referenceNumber) {
  const token = await getAccessToken();
  const { creatorOwner, creatorApp, creatorReport, referenceField } = config.zoho;
  const base = getCreatorBaseUrl();

  const criteria = `(${referenceField} == "${referenceNumber}")`;
  const url = `${base}/${creatorOwner}/${creatorApp}/report/${creatorReport}?criteria=${encodeURIComponent(criteria)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.code || "Creator search failed");
  }

  const record = json.data?.[0];
  if (!record) return null;

  return {
    id: record.ID,
    data: record,
  };
}

/**
 * Upload PDF buffer to a Creator file field on an operation record.
 */
export async function uploadPdfToCreator(recordId, fieldLinkName, pdfBuffer, fileName) {
  const token = await getAccessToken();
  const { creatorOwner, creatorApp, creatorReport } = config.zoho;
  const base = getCreatorBaseUrl();

  const url = `${base}/${creatorOwner}/${creatorApp}/report/${creatorReport}/${recordId}/${fieldLinkName}/upload`;

  const blob = new Blob([pdfBuffer], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("file", blob, fileName);

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
    body: formData,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || json.code || `Creator upload failed (${res.status})`);
  }

  return json;
}

/**
 * Upload PDF to operation by Reference_Number.
 */
export async function uploadPdfByReference(referenceNumber, creatorField, pdfBuffer, fileName) {
  const operation = await findOperationByReference(referenceNumber);
  if (!operation) {
    throw new Error(`Operation not found for Reference_Number: ${referenceNumber}`);
  }

  return uploadPdfToCreator(operation.id, creatorField, pdfBuffer, fileName);
}
