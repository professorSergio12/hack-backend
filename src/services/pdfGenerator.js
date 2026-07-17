import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * Generate a simple PDF from external form submission data.
 * Replace/extend per form with proper templates later.
 *
 * @param {object} options
 * @param {string} options.formSlug
 * @param {string} options.formTitle
 * @param {string} options.referenceNumber
 * @param {object} options.formData
 * @returns {Promise<Buffer>}
 */
export async function generateFormPdf({ formSlug, formTitle, referenceNumber, formData }) {
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

  drawText(formTitle, { size: 16, bold: true, gap: 4 });
  drawText(`Form: ${formSlug}`, { size: 10 });
  drawText(`Reference Number: ${referenceNumber}`, { size: 12, bold: true, gap: 8 });
  drawText(`Generated: ${new Date().toISOString()}`, { size: 9, gap: 12 });
  drawText("— Submission Data —", { bold: true, gap: 4 });

  const entries = flattenObject(formData);
  for (const [key, value] of entries.slice(0, 40)) {
    if (y < 60) break;
    drawText(`${key}: ${value}`, { size: 9 });
  }

  if (entries.length > 40) {
    drawText(`… and ${entries.length - 40} more fields`, { size: 9 });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

function flattenObject(obj, prefix = "") {
  const result = [];
  if (!obj || typeof obj !== "object") return result;

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenObject(value, path));
    } else if (Array.isArray(value)) {
      result.push([path, JSON.stringify(value)]);
    } else if (value != null && value !== "") {
      result.push([path, String(value)]);
    }
  }
  return result;
}

export function buildPdfFileName(formSlug, referenceNumber) {
  const safeRef = referenceNumber.replace(/[^\w.-]/g, "_");
  return `${formSlug}-${safeRef}.pdf`;
}
