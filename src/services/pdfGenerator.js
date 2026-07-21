import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getGenerator, normalizeSlug } from "../pdf/registry.js";
import { normalizeChecklistPayload } from "../pdf/normalizeChecklist.js";
import { getQhsePdfGenerator } from "../pdf/qhseRegistry.js";
import { normalizeQhseRecord } from "../pdf/normalizeQhseRecord.js";
import { fixDocxTableWidths } from "../pdf/fixDocxTableWidths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, "..", "..", "data", "generated-docs");

/**
 * Generate document for a form submission.
 * - OPS-OFD_* → Oceane DOCX templates
 * - QAF-OFD_* / QHSE slugs → Oceane jsPDF templates
 * - Unknown → simple PDF fallback
 *
 * @returns {Promise<Buffer>}
 */
export async function generateFormPdf({
  formSlug,
  formTitle,
  referenceNumber,
  formData,
}) {
  const rawKey = String(formSlug || "").trim();

  // 1) STS OPS-OFD → DOCX
  const opsEntry = getGenerator(normalizeSlug(rawKey));
  if (opsEntry) {
    return generateOceaneDocx({
      slug: opsEntry.key,
      generate: opsEntry.generate,
      formTitle,
      referenceNumber,
      formData,
    });
  }

  // 2) QHSE → jsPDF (Oceane parity)
  const qhseEntry = getQhsePdfGenerator(rawKey);
  if (qhseEntry) {
    const record = normalizeQhseRecord(rawKey, referenceNumber, formData);
    if (formTitle && !record.formTitle) record.formTitle = formTitle;
    const buffer = await qhseEntry.generate(record);
    if (!Buffer.isBuffer(buffer)) {
      return Buffer.from(buffer);
    }
    return buffer;
  }

  // 3) Fallback
  return generateSimplePdfFallback({
    formSlug: rawKey,
    formTitle,
    referenceNumber,
    formData,
  });
}

async function generateOceaneDocx({
  slug,
  generate,
  formTitle,
  referenceNumber,
  formData,
}) {
  const checklist = normalizeChecklistPayload(slug, referenceNumber, formData);
  if (!checklist.formTitle && formTitle) checklist.formTitle = formTitle;

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const safeRef = String(referenceNumber || "ref").replace(/[^\w.-]+/g, "_");
  const fullPath = path.join(GENERATED_DIR, `${slug}-${safeRef}-${Date.now()}.docx`);

  try {
    await generate(checklist, fullPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template ${slug} did not write output file`);
    }
    const raw = fs.readFileSync(fullPath);
    // Percentage tables from docx@9 collapse in Zoho/browser viewers without DXA grids
    return await fixDocxTableWidths(raw);
  } finally {
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {
      /* ignore */
    }
  }
}

async function generateSimplePdfFallback({
  formSlug,
  formTitle,
  referenceNumber,
  formData,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const left = 50;
  const lineHeight = 16;

  function drawText(text, opts = {}) {
    const size = opts.size || 11;
    const f = opts.bold ? fontBold : font;
    page.drawText(String(text).slice(0, 120), {
      x: left,
      y,
      size,
      font: f,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight + (opts.gap || 0);
  }

  drawText(formTitle || formSlug, { size: 16, bold: true, gap: 4 });
  drawText(`Form: ${formSlug}`, { size: 10 });
  drawText(`Reference Number: ${referenceNumber}`, { size: 12, bold: true, gap: 8 });
  drawText(`Generated: ${new Date().toISOString()}`, { size: 9, gap: 12 });
  drawText("— Submission Data —", { bold: true, gap: 4 });

  const entries = flattenObject(formData);
  for (const [key, value] of entries.slice(0, 40)) {
    if (y < 60) break;
    drawText(`${key}: ${value}`, { size: 9 });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function flattenObject(obj, prefix = "") {
  const result = [];
  if (!obj || typeof obj !== "object") return result;

  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenObject(value, p));
    } else if (Array.isArray(value)) {
      result.push([p, JSON.stringify(value)]);
    } else if (value != null && value !== "") {
      result.push([p, String(value)]);
    }
  }
  return result;
}

/**
 * Filename for Creator / download.
 * OPS-OFD → .docx | QHSE → .pdf | unknown → .pdf
 */
export function buildPdfFileName(formSlug, referenceNumber) {
  const safeRef = String(referenceNumber || "ref").replace(/[^\w.-]+/g, "_");
  const raw = String(formSlug || "").trim();
  const ops = getGenerator(normalizeSlug(raw));
  if (ops) return `${ops.key}-${safeRef}.docx`;
  const qhse = getQhsePdfGenerator(raw);
  const key = (qhse && qhse.key) || normalizeSlug(raw) || "FORM";
  return `${key}-${safeRef}.pdf`;
}

export const buildDocxFileName = buildPdfFileName;
