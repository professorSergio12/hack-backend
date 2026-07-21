import { ImageRun } from "docx";
import { detectImageFormat } from "../../documentLogo.js";

/**
 * ImageRun with correct type from magic bytes (required by docx@9).
 * @param {Buffer|Uint8Array|null|undefined} data
 * @param {{ width: number, height: number }} transformation
 * @returns {ImageRun|null}
 */
export function createTypedImageRun(data, transformation) {
  if (!data) return null;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (buf.length < 4) return null;
  const { docxType } = detectImageFormat(buf);
  return new ImageRun({
    type: docxType,
    data: buf,
    transformation,
  });
}
