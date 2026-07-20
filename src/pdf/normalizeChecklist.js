/**
 * Shape Hackthone form submit payloads so Oceane DOCX builders receive
 * the same nested fields they expect (vesselDetails, genericChecks, etc.).
 */
export function normalizeChecklistPayload(formSlug, referenceNumber, formData = {}) {
  const data = formData && typeof formData === "object" ? { ...formData } : {};

  if (!data.operationRef) data.operationRef = referenceNumber;
  if (!data.Operation_Ref_No) data.Operation_Ref_No = referenceNumber;

  if (!data.formNo) data.formNo = formSlug;
  if (!data.documentInfo) {
    data.documentInfo = {
      formNo: data.formNo || formSlug,
      revisionNo: data.revisionNo || data.revNo || "00",
      issueDate: data.issueDate || data.revisionDate || null,
      approvedBy: data.approvedBy || "",
    };
  }

  // Many builders read vesselDetails — lift flat vessel keys if needed
  if (!data.vesselDetails || typeof data.vesselDetails !== "object") {
    data.vesselDetails = {
      chsName: data.chsName || data.CHS_Name || data.constantHeadingShip || "",
      msName: data.msName || data.MS_Name || data.manoeuvringShip || "",
      location: data.location || data.Location || "",
      date: data.date || data.operationDate || "",
      ...((typeof data.vessel === "object" && data.vessel) || {}),
    };
  }

  if (!Array.isArray(data.genericChecks) && Array.isArray(data.checks)) {
    data.genericChecks = data.checks;
  }
  if (!Array.isArray(data.genericChecks)) {
    data.genericChecks = data.genericChecks || [];
  }

  if (!data.signatureBlock || typeof data.signatureBlock !== "object") {
    data.signatureBlock = {
      name: data.signerName || data.mooringMasterName || data.name || "",
      rank: data.rank || "",
      date: data.signatureDate || data.date || "",
      signature: data.signature || data.signatureData || data.signatureImage || "",
      ...(typeof data.signatures === "object" ? data.signatures : {}),
    };
  }

  // Sequence used in Oceane filenames — keep if present
  if (data.sequenceNumber == null && data.sequence != null) {
    data.sequenceNumber = data.sequence;
  }

  return data;
}
