import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Prefer Helios assets; accept .jpg/.jpeg/.png (magic bytes decide format). */
const LOGO_CANDIDATES = [
  path.join(process.cwd(), "public", "image", "helios-logo.jpg"),
  path.join(process.cwd(), "public", "image", "helios-logo.png"),
  path.join(process.cwd(), "public", "image", "image.jpg"),
  path.join(process.cwd(), "public", "image", "image.png"),
  path.join(process.cwd(), "public", "image", "pdf_logo.jpg"),
  path.join(process.cwd(), "public", "image", "pdf_logo.png"),
  path.join(__dirname, "..", "..", "public", "image", "helios-logo.jpg"),
  path.join(__dirname, "..", "..", "public", "image", "helios-logo.png"),
  path.join(__dirname, "..", "..", "public", "image", "image.jpg"),
  path.join(__dirname, "..", "..", "public", "image", "image.png"),
  path.join(__dirname, "..", "..", "public", "image", "pdf_logo.jpg"),
  path.join(__dirname, "..", "..", "public", "image", "pdf_logo.png"),
];

/** Square Helios mark — display size in DOCX (px) / PDF (mm scale separate). */
export const LOGO_DOCX_SIZE = { width: 110, height: 110 };
export const LOGO_FALLBACK_TEXT = "HELIOS";

/**
 * @param {Buffer} buf
 * @returns {{ jsPdf: "JPEG"|"PNG", docxType: "jpg"|"png" }}
 */
export function detectImageFormat(buf) {
  if (buf?.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    return { jsPdf: "JPEG", docxType: "jpg" };
  }
  return { jsPdf: "PNG", docxType: "png" };
}

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

/** @returns {{ data: Buffer, jsPdf: "JPEG"|"PNG", docxType: "jpg"|"png" }} */
export function loadDocumentLogo() {
  const data = readDocumentLogo();
  return { data, ...detectImageFormat(data) };
}
