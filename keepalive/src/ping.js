import "dotenv/config";

const SERVICE_ID = "backend";
const DEFAULT_URL = "https://hack-backend-h3eq.onrender.com/health";
const TIMEOUT_MS = Number(process.env.KEEPALIVE_TIMEOUT_MS || 45000);

function resolveUrl() {
  return (process.env.KEEPALIVE_URL || DEFAULT_URL).trim();
}

export async function ping() {
  const url = resolveUrl();
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "hackthone-keepalive-backend/1.0",
        Accept: "application/json,text/html,*/*",
      },
    });
    const ms = Date.now() - started;
    const label = res.status >= 200 && res.status < 400 ? "OK" : "WAKE";
    console.log(`[keepalive] ${label} ${SERVICE_ID} ${res.status} ${ms}ms → ${url}`);
    return { id: SERVICE_ID, url, status: res.status, ms, ok: res.status > 0 };
  } catch (err) {
    const ms = Date.now() - started;
    console.error(
      `[keepalive] FAIL ${SERVICE_ID} ${ms}ms → ${url}`,
      err?.name === "AbortError" ? "timeout" : err?.message || err
    );
    return { id: SERVICE_ID, url, status: 0, ms, ok: false, error: String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}

import { fileURLToPath } from "node:url";

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  ping()
    .then((r) => process.exit(r.ok ? 0 : 1))
    .catch((err) => {
      console.error("[keepalive] fatal", err);
      process.exit(1);
    });
}
