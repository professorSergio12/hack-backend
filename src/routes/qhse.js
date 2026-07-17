import { Router } from "express";
import { getQhseRouteByPath } from "../config/qhseForms.js";
import { generateFormPdf, buildPdfFileName } from "../services/pdfGenerator.js";
import { nextSerialNumber, saveQhseSubmission } from "../services/submissionStore.js";

const router = Router();

function parseJsonBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return { raw: body };
    }
  }
  return body && typeof body === "object" ? body : {};
}

async function handleQhseCreate(pathSegment, req, res) {
  const route = getQhseRouteByPath(pathSegment);
  if (!route) {
    return res.status(404).json({ error: `Unknown QHSE route: ${pathSegment}` });
  }

  const payload = parseJsonBody(req.body);
  const serialNumber = await nextSerialNumber(route.formCode);
  await saveQhseSubmission(route.slug, payload, serialNumber);

  const pdfBuffer = await generateFormPdf({
    formSlug: route.formCode,
    formTitle: route.title,
    referenceNumber: serialNumber,
    formData: payload,
  });

  const fileName = buildPdfFileName(route.formCode, serialNumber);

  res.json({
    success: true,
    message: "Form submitted successfully",
    data: {
      serialNumber,
      formCode: route.formCode,
      formSlug: route.slug,
      fileName,
      pdfSize: pdfBuffer.length,
    },
  });
}

/** POST /api/qhse/* — matches legacy proxy paths without /api prefix duplication */
router.post("/*", async (req, res) => {
  try {
    const pathSegment = req.params[0] || "";
    await handleQhseCreate(pathSegment, req, res);
  } catch (err) {
    console.error("[qhse/create]", err);
    res.status(500).json({ error: err.message || "QHSE submission failed" });
  }
});

export default router;
