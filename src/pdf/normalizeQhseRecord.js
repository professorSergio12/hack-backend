/**
 * Ensure Hackthone QHSE submit payloads have fields Oceane PDF builders expect
 * (formCode, serialNumber, revNo, nested header/completedBy, etc.).
 */
export function normalizeQhseRecord(formSlugOrCode, serialNumber, formData = {}) {
  const data = formData && typeof formData === "object" ? { ...formData } : {};

  if (!data.formCode && String(formSlugOrCode || "").toUpperCase().startsWith("QAF-")) {
    data.formCode = String(formSlugOrCode).toUpperCase();
  }
  if (!data.serialNumber && serialNumber) data.serialNumber = serialNumber;
  if (!data.revNo && data.revisionNo) data.revNo = data.revisionNo;
  if (!data.revNo) data.revNo = data.version || "1.0";
  if (!data.issueDate && data.revisionDate) data.issueDate = data.revisionDate;

  // Common nested shapes used by Transfer Audit / HSE
  if (!data.header && (data.location || data.jobNo || data.date)) {
    data.header = {
      locationName: data.location || data.locationName || "",
      jobNo: data.jobNo || data.JobRefNo || "",
      date: data.date || data.operationDate || null,
      dischargingVessel: data.dischargingVessel || data.chsName || "",
      receivingVessel: data.receivingVessel || data.msName || "",
    };
  }

  if (!data.completedBy && (data.completedByName || data.signature)) {
    data.completedBy = {
      name: data.completedByName || data.name || "",
      date: data.completedDate || data.date || null,
      signaturePhoto: data.signature || data.signaturePhoto || "",
      signatureUrl: data.signatureUrl || "",
    };
  }

  return data;
}
