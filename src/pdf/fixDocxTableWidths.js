import JSZip from "jszip";

/** Usable page width in DXA (~A4/Letter content width with default margins). */
export const DOCX_CONTENT_WIDTH_DXA = 9026;

/**
 * docx@9 emits `w:gridCol w:w="100"` for percentage tables (no columnWidths).
 * Word Online / Zoho / many PDF converters then collapse tables to thin vertical lines.
 * Rewrite stub grids to real DXA widths from first-row cell percentages.
 *
 * @param {Buffer} docxBuffer
 * @returns {Promise<Buffer>}
 */
export async function fixDocxTableWidths(docxBuffer) {
  const zip = await JSZip.loadAsync(docxBuffer);
  const file = zip.file("word/document.xml");
  if (!file) return Buffer.isBuffer(docxBuffer) ? docxBuffer : Buffer.from(docxBuffer);

  let xml = await file.async("string");
  xml = xml.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (tbl) => expandCollapsedTable(tbl));
  zip.file("word/document.xml", xml);

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  return Buffer.from(out);
}

function expandCollapsedTable(tblXml) {
  const gridMatch = tblXml.match(/<w:tblGrid>([\s\S]*?)<\/w:tblGrid>/);
  if (!gridMatch) return tblXml;

  const colTags = [...gridMatch[1].matchAll(/<w:gridCol\b[^/]*\/>/g)];
  if (!colTags.length) return tblXml;

  const existing = colTags.map((m) => {
    const w = m[0].match(/\bw:w="(\d+)"/);
    return w ? Number(w[1]) : 100;
  });

  // Already real DXA column widths
  if (existing.some((w) => w > 500)) return tblXml;

  const colCount = existing.length;
  const pcts = readFirstRowPercents(tblXml, colCount);
  const sum = pcts.reduce((a, b) => a + b, 0) || 1;
  const dxas = pcts.map((p) => Math.max(200, Math.round((DOCX_CONTENT_WIDTH_DXA * p) / sum)));
  const drift = DOCX_CONTENT_WIDTH_DXA - dxas.reduce((a, b) => a + b, 0);
  dxas[dxas.length - 1] += drift;

  const newGrid =
    "<w:tblGrid>" +
    dxas.map((w) => `<w:gridCol w:w="${w}"/>`).join("") +
    "</w:tblGrid>";

  let out = tblXml.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/, newGrid);

  out = out.replace(
    /<w:tblW\b[^/]*\/>/,
    `<w:tblW w:type="dxa" w:w="${DOCX_CONTENT_WIDTH_DXA}"/>`
  );

  if (!/<w:tblLayout\b/.test(out)) {
    out = out.replace(/<w:tblPr>/, '<w:tblPr><w:tblLayout w:type="fixed"/>');
  }

  // Convert cell pct widths to DXA per row (reset column cursor each row)
  out = out.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, (rowXml) => {
    let colCursor = 0;
    return rowXml.replace(/<w:tc\b[\s\S]*?<\/w:tc>/g, (cell) => {
      const spanMatch = cell.match(/<w:gridSpan\b[^>]*w:val="(\d+)"/);
      const span = spanMatch ? Number(spanMatch[1]) : 1;
      const start = colCursor;
      colCursor += span;
      if (start >= dxas.length) return cell;

      let width = 0;
      for (let i = start; i < start + span && i < dxas.length; i++) width += dxas[i];

      if (/<w:tcW\b/.test(cell)) {
        return cell.replace(
          /<w:tcW\b[^/]*\/>/,
          `<w:tcW w:type="dxa" w:w="${width}"/>`
        );
      }
      if (/<w:tcPr>/.test(cell)) {
        return cell.replace(
          /<w:tcPr>/,
          `<w:tcPr><w:tcW w:type="dxa" w:w="${width}"/>`
        );
      }
      return cell.replace(
        /<w:tc([^>]*)>/,
        `<w:tc$1><w:tcPr><w:tcW w:type="dxa" w:w="${width}"/></w:tcPr>`
      );
    });
  });

  return out;
}

function readFirstRowPercents(tblXml, colCount) {
  const equal = () => Array.from({ length: colCount }, () => 100 / colCount);
  const rowMatch = tblXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/);
  if (!rowMatch) return equal();

  const cells = [...rowMatch[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)];
  if (!cells.length) return equal();

  const pcts = [];
  for (const cell of cells) {
    const spanMatch = cell[0].match(/<w:gridSpan\b[^>]*w:val="(\d+)"/);
    const span = spanMatch ? Number(spanMatch[1]) : 1;
    let pct = null;
    const tcW = cell[0].match(/<w:tcW\b[^/]*\/>/);
    if (tcW) {
      const type = (tcW[0].match(/\bw:type="([^"]+)"/) || [])[1];
      const raw = (tcW[0].match(/\bw:w="([^"]+)"/) || [])[1];
      if (type === "pct" && raw != null) {
        pct = String(raw).includes("%") ? parseFloat(raw) : Number(raw) / 50;
      } else if (type === "dxa" && raw != null) {
        pct = (Number(raw) / DOCX_CONTENT_WIDTH_DXA) * 100;
      }
    }
    if (pct == null || Number.isNaN(pct)) pct = 100 / colCount;
    const each = pct / span;
    for (let i = 0; i < span; i++) pcts.push(each);
  }

  while (pcts.length < colCount) pcts.push(100 / colCount);
  return pcts.slice(0, colCount);
}
