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

  // Preserve Oceane-shaped vesselDetails from external forms; only fill gaps
  const vesselIncoming =
    data.vesselDetails && typeof data.vesselDetails === "object"
      ? data.vesselDetails
      : {};
  const vesselFlat = {
    vesselName: data.vesselName || data.CHS_Name || data.chsName || "",
    shipOperator: data.shipOperator || "",
    charterer: data.charterer || "",
    stsOrganizer: data.stsOrganizer || "",
    plannedTransferDateTime:
      data.plannedTransferDateTime || data.operationDate || data.date || "",
    transferLocation: data.transferLocation || data.location || data.Location || "",
    cargo: data.cargo || data.Type_of_Cargo || "",
    constantHeadingOrBerthedShip:
      data.constantHeadingOrBerthedShip ||
      data.chsName ||
      data.CHS_Name ||
      data.constantHeadingShip ||
      "",
    manoeuvringOrOuterShip:
      data.manoeuvringOrOuterShip ||
      data.msName ||
      data.MS_Name ||
      data.manoeuvringShip ||
      "",
    poacOrStsSuperintendent: data.poacOrStsSuperintendent || "",
    applicableJointPlanOperation: data.applicableJointPlanOperation || "",
    chsName: data.chsName || data.CHS_Name || "",
    msName: data.msName || data.MS_Name || "",
    location: data.location || data.Location || "",
    date: data.date || data.operationDate || "",
    ...((typeof data.vessel === "object" && data.vessel) || {}),
  };
  data.vesselDetails = { ...vesselFlat, ...vesselIncoming };

  if (!Array.isArray(data.genericChecks) && Array.isArray(data.checks)) {
    data.genericChecks = data.checks;
  }
  if (!Array.isArray(data.genericChecks)) {
    data.genericChecks = [];
  }

  // Common alternate shapes used by some OPS templates
  if (!Array.isArray(data.checklistItems) && Array.isArray(data.genericChecks)) {
    data.checklistItems = data.genericChecks;
  }
  if (!data.transferInfo || typeof data.transferInfo !== "object") {
    data.transferInfo = {
      ...(typeof data.transfer === "object" ? data.transfer : {}),
      location: data.vesselDetails.transferLocation || data.vesselDetails.location || "",
      date: data.vesselDetails.plannedTransferDateTime || data.vesselDetails.date || "",
    };
  }

  const sigIncoming =
    data.signatureBlock && typeof data.signatureBlock === "object"
      ? data.signatureBlock
      : {};
  data.signatureBlock = {
    name: data.signerName || data.mooringMasterName || data.name || "",
    rank: data.rank || "",
    date: data.signatureDate || data.date || "",
    signature: data.signature || data.signatureData || data.signatureImage || "",
    ...(typeof data.signatures === "object" ? data.signatures : {}),
    ...sigIncoming,
  };
  if (!data.signature) data.signature = data.signatureBlock;

  if (data.sequenceNumber == null && data.sequence != null) {
    data.sequenceNumber = data.sequence;
  }

  return data;
}
