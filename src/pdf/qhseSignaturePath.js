import fs from "node:fs";
import path from "node:path";

/**
 * Resolve a stored QHSE signature value to an absolute file path (if on disk).
 * Base64 / data-URIs return null (callers handle those separately).
 */
export function getQhseSignatureAbsolutePathForRead(storedValue) {
  if (!storedValue || typeof storedValue !== "string") return null;
  if (storedValue.startsWith("data:")) return null;

  let rel = storedValue;
  if (rel.startsWith("http://") || rel.startsWith("https://")) {
    try {
      rel = new URL(rel).pathname;
    } catch {
      return null;
    }
  }

  const cleaned = rel.replace(/^\/+/, "");
  const candidates = [
    path.join(process.cwd(), "public", cleaned),
    path.join(process.cwd(), cleaned),
  ];
  for (const abs of candidates) {
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}
