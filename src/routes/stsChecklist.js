import { Router } from "express";
import { getFormBySlug } from "../config/forms.js";
import { generateFormPdf, buildPdfFileName } from "../services/pdfGenerator.js";
import { uploadPdfByReference } from "../services/zohoCreator.js";
import { config } from "../config/env.js";
import {
  resolveFormSlug,
  getSlugCandidatesForGet,
} from "../lib/apiPathSlug.js";
import {
  saveStsSubmission,
  getStsSubmission,
} from "../services/submissionStore.js";
import { normalizeOperationRef } from "../lib/operationRef.js";

const router = Router();

function normalizeApiPath(rawPath) {
  return String(rawPath || "")
    .replace(/^\//, "")
    .replace(/\/create$/, "");
}

async function parseBodyData(req) {
  if (req.body?.data && typeof req.body.data === "object") {
    return req.body.data;
  }

  const raw = req.body?.data;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }

  if (req.body && typeof req.body === "object" && !req.body.data) {
    return req.body;
  }

  return {};
}

async function submitChecklist(apiPath, operationRef, payload) {
  const ref = normalizeOperationRef(operationRef);
  if (!ref) {
    const err = new Error("operationRef (Reference_Number) is required");
    err.status = 400;
    throw err;
  }

  if (payload && typeof payload === "object") {
    payload.operationRef = ref;
  }

  const slug = await resolveFormSlug(apiPath, payload, ref);
  const form = getFormBySlug(slug);
  if (!form) {
    const err = new Error(`Unknown form slug: ${slug}`);
    err.status = 404;
    throw err;
  }

  await saveStsSubmission(ref, slug, payload);

  const pdfBuffer = await generateFormPdf({
    formSlug: form.slug,
    formTitle: form.title,
    referenceNumber: ref,
    formData: payload,
  });

  const fileName = buildPdfFileName(form.slug, ref);
  let creatorUpload = null;
  let uploadSkipped = false;

  if (config.zoho.clientId && config.zoho.refreshToken) {
    creatorUpload = await uploadPdfByReference(
      ref,
      form.creatorField,
      pdfBuffer,
      fileName
    );
  } else {
    uploadSkipped = true;
  }

  return {
    success: true,
    message: "Checklist submitted successfully",
    operationRef: ref,
    slug: form.slug,
    creatorField: form.creatorField,
    fileName,
    uploadSkipped,
    creatorUpload,
    data: payload,
  };
}

/** GET /api/sts-checklist/ops-ofd-011?operationRef= */
router.get(/.+/, async (req, res) => {
  try {
    const apiPath = normalizeApiPath(req.path);
    const operationRef = normalizeOperationRef(req.query.operationRef || "");
    if (!operationRef) {
      return res.status(400).json({ error: "operationRef is required" });
    }

    const slugs = getSlugCandidatesForGet(apiPath);
    for (const slug of slugs) {
      const data = await getStsSubmission(operationRef, slug);
      if (data) {
        return res.json({ success: true, data });
      }
    }

    return res.status(404).json({ error: "Checklist not found for this operation" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Lookup failed" });
  }
});

/** POST /api/sts-checklist/ops-ofd-011/create */
router.post(/.+/, async (req, res) => {
  try {
    const apiPath = normalizeApiPath(req.path);
    const payload = await parseBodyData(req);
    const operationRef = String(
      payload.operationRef || req.query.operationRef || ""
    )
      .replace(/,\s*$/, "")
      .trim();

    const result = await submitChecklist(apiPath, operationRef, payload);
    res.json(result);
  } catch (err) {
    console.error("[sts-checklist/create]", err);
    res.status(err.status || 500).json({ error: err.message || "Submission failed" });
  }
});

/** PUT /api/sts-checklist/ops-ofd-011?operationRef= */
router.put(/.+/, async (req, res) => {
  try {
    const apiPath = normalizeApiPath(req.path);
    const payload = await parseBodyData(req);
    const operationRef = String(
      req.query.operationRef || payload.operationRef || ""
    )
      .replace(/,\s*$/, "")
      .trim();

    const result = await submitChecklist(apiPath, operationRef, payload);
    res.json(result);
  } catch (err) {
    console.error("[sts-checklist/update]", err);
    res.status(err.status || 500).json({ error: err.message || "Update failed" });
  }
});

export default router;
