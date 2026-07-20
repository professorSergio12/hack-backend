import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Hackthone/backend/public/image/image.png (resolved from this file) */
const LOGO_CANDIDATES = [
  path.join(process.cwd(), "public", "image", "image.png"),
  path.join(process.cwd(), "public", "image", "pdf_logo.png"),
  path.join(__dirname, "..", "..", "public", "image", "image.png"),
  path.join(__dirname, "..", "..", "public", "image", "pdf_logo.png"),
];

export function getDocumentLogoPath() {
  for (const p of LOGO_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return LOGO_CANDIDATES[0];
}

export function readDocumentLogo() {
  const p = getDocumentLogoPath();
  if (!fs.existsSync(p)) {
    throw new Error(`Document logo not found (tried ${LOGO_CANDIDATES.join(", ")})`);
  }
  return fs.readFileSync(p);
}
