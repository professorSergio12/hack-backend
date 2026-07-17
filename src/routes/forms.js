import { Router } from "express";
import { getFormBySlug, FORM_CATALOGUE } from "../config/forms.js";
import { generateFormPdf, buildPdfFileName } from "../services/pdfGenerator.js";
import { uploadPdfByReference } from "../services/zohoCreator.js";
import { config } from "../config/env.js";

const router = Router();

/** List available form slugs */
router.get("/", (_req, res) => {
  res.json({
    forms: FORM_CATALOGUE.map((f) => ({
      slug: f.slug,
      title: f.title,
      creatorField: f.creatorField,
    })),
  });
});

/**
 * POST /api/forms/:slug/submit
 * Body: { operationRef: "2026-001", data: { ... } }
 *
 * 1. Generate PDF from data
 * 2. Upload to Zoho Creator field for that Reference_Number
 */
router.post("/:slug/submit", async (req, res) => {
  try {
    const form = getFormBySlug(req.params.slug);

    if (!form) {
      return res.status(404).json({ error: `Unknown form slug: ${req.params.slug}` });
    }

    const operationRef = req.body?.operationRef || req.body?.referenceNumber;
    const formData = req.body?.data || req.body;

    if (!operationRef) {
      return res.status(400).json({ error: "operationRef (Reference_Number) is required" });
    }

    const pdfBuffer = await generateFormPdf({
      formSlug: form.slug,
      formTitle: form.title,
      referenceNumber: operationRef,
      formData: typeof formData === "object" ? formData : { raw: formData },
    });

    const fileName = buildPdfFileName(form.slug, operationRef);

    let uploadResult = null;
    let uploadSkipped = false;

    if (config.zoho.clientId && config.zoho.refreshToken) {
      uploadResult = await uploadPdfByReference(
        operationRef,
        form.creatorField,
        pdfBuffer,
        fileName
      );
    } else {
      uploadSkipped = true;
    }

    res.json({
      success: true,
      form: form.slug,
      operationRef,
      creatorField: form.creatorField,
      fileName,
      pdfSize: pdfBuffer.length,
      uploadSkipped,
      creatorUpload: uploadResult,
    });
  } catch (err) {
    console.error("[forms/submit]", err);
    res.status(500).json({
      error: err.message || "Submission failed",
    });
  }
});

export default router;
