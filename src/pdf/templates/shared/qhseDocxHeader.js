import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  SimpleField,
} from "docx";
import { LOGO_FALLBACK_TEXT } from "../../documentLogo.js";
import { createLogoImageRun } from "./documentLogoImage.js";

const THIN_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

const HEADER_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
};

const META_GREY = "EDEDED";
const FONT_XS = 16;
const FALLBACK_APPROVED_BY = "JS";

function formatMetaDate(date) {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function metaLabel(text) {
  return new TableCell({
    borders: THIN_BORDER,
    shading: { fill: "FFFFFF" },
    width: { size: 45, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: FONT_XS })] })],
  });
}

function metaValue(text) {
  return new TableCell({
    borders: THIN_BORDER,
    shading: { fill: META_GREY },
    width: { size: 55, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, size: FONT_XS })] })],
  });
}

function metaPageCell() {
  return new TableCell({
    borders: THIN_BORDER,
    shading: { fill: META_GREY },
    width: { size: 55, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        children: [
          new SimpleField("PAGE", "1"),
          new TextRun({ text: " of ", size: FONT_XS }),
          new SimpleField("NUMPAGES", "1"),
        ],
      }),
    ],
  });
}

/**
 * Build the standard 5-row meta object from a DB record.
 */
export function buildDocxMeta(record, formCodeDefault) {
  return {
    formNo: record.formCode || formCodeDefault || "-",
    revNo: record.revNo || record.revisionNo || "1.0",
    issueDate: formatMetaDate(record.issueDate || record.revisionDate || record.updatedAt || record.createdAt),
    approvedBy: record.approvedByName || FALLBACK_APPROVED_BY,
  };
}

/**
 * Build the 3-column header Table for Word documents.
 * @param {{ formTitle: string, meta: { formNo, revNo, issueDate, approvedBy } }} opts
 * @returns {Table}
 */
export function buildQhseDocxHeaderTable({ formTitle, meta }) {
  let logoRun = null;
  try {
    logoRun = createLogoImageRun();
  } catch {
    /* no logo */
  }

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [metaLabel("Form No:"), metaValue(meta.formNo)] }),
      new TableRow({ children: [metaLabel("Rev.No."), metaValue(meta.revNo)] }),
      new TableRow({ children: [metaLabel("Issue Date:"), metaValue(meta.issueDate)] }),
      new TableRow({ children: [metaLabel("Approved by:"), metaValue(meta.approvedBy)] }),
      new TableRow({ children: [metaLabel("Page:"), metaPageCell()] }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: HEADER_BORDER.top,
      bottom: HEADER_BORDER.bottom,
      left: HEADER_BORDER.left,
      right: HEADER_BORDER.right,
      insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: HEADER_BORDER,
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              logoRun
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [logoRun],
                  })
                : new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: LOGO_FALLBACK_TEXT, bold: true })],
                  }),
            ],
          }),
          new TableCell({
            borders: HEADER_BORDER,
            width: { size: 45, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: formTitle, bold: true, size: 32 })],
              }),
            ],
          }),
          new TableCell({
            borders: HEADER_BORDER,
            width: { size: 30, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [metaTable],
          }),
        ],
      }),
    ],
  });
}
