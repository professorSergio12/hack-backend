import { ImageRun } from "docx";
import {
  loadDocumentLogo,
  LOGO_DOCX_SIZE,
} from "../../documentLogo.js";

/**
 * Helios logo ImageRun for DOCX headers (JPEG/PNG auto-detected).
 * @param {{ width?: number, height?: number }} [size]
 */
export function createLogoImageRun(size = LOGO_DOCX_SIZE) {
  const { data, docxType } = loadDocumentLogo();
  return new ImageRun({
    type: docxType,
    data,
    transformation: {
      width: size.width ?? LOGO_DOCX_SIZE.width,
      height: size.height ?? LOGO_DOCX_SIZE.height,
    },
  });
}
