/**
 * QHSE form codes / slugs → Oceane-Marine jsPDF generators
 * (ported from Oceane-Marine/src/jobs/services/pdf/*PdfReport.js).
 *
 * PDF generators return Promise<Buffer> (no file path).
 */
import { generateNearMissPdf } from "./templates/qhse/NearMissPdfReport.js";
import { generateHseInductionChecklistPdf } from "./templates/qhse/HseInductionChecklistReport.js";
import { generatePoacCrossCompetencyPdf } from "./templates/qhse/PoacCrossCompetencyPdfReport.js";
import { generateSupplierDueDiligencePdf } from "./templates/qhse/SupplierDueDiligencePdfReport.js";
import { generateSubContractorAuditPdf } from "./templates/qhse/SubContractorAuditPdfReport.js";
import { generateTransferAuditReportPdf } from "./templates/qhse/TransferAuditReport.js";
import { generateBestPracticePdf } from "./templates/qhse/BestPracticePdfReport.js";
import { generateVendorSupplierApprovalPdf } from "./templates/qhse/VendorSupplierApprovalReport.js";
import { generateBaseAuditReportPdf } from "./templates/qhse/BaseAuditReport.js";
import { generateNewBaseSetupChecklistPdf } from "./templates/qhse/NewBaseSetupChecklistReport.js";
import { generateMOCManagementChangePdf } from "./templates/qhse/MOCManagementChangePdfReport.js";
import { generateEquipmentDefectPdf } from "./templates/qhse/EquipmentDefectPdfReport.js";
import { generateDrillPlanPdf } from "./templates/qhse/DrillPlanPdfReport.js";
import { generateDrillReportPdf } from "./templates/qhse/DrillReportPdfReport.js";
import { generateTrainingPlanPdf } from "./templates/qhse/TrainingPlanPdfReport.js";
import { generateTrainingRecordPdf } from "./templates/qhse/TrainingRecordPdfReport.js";
import { generateTargetKpiPdf } from "./templates/qhse/TargetKpiPdfReport.js";
import { generateCidPdf } from "./templates/qhse/CidPdfReport.js";
import { generateStatutoryCertificatePdf } from "./templates/qhse/StatutoryCertificatePdfReport.js";
import { generateAuditInspectionPlannerPdf } from "./templates/qhse/AuditInspectionPlannerPdfReport.js";
import { generateStsEquipmentBaseStockLevelPdf } from "./templates/qhse/StsEquipmentBaseStockLevelReport.js";

/** @type {Record<string, (data: object) => Promise<Buffer>>} */
const BY_FORM_CODE = {
  "QAF-OFD-003": generateTransferAuditReportPdf,
  "QAF-OFD-008": generateHseInductionChecklistPdf,
  "QAF-OFD-009": generatePoacCrossCompetencyPdf,
  "QAF-OFD-015": generateNearMissPdf,
  "QAF-OFD-043": generateSupplierDueDiligencePdf,
  "QAF-OFD-055": generateSubContractorAuditPdf,
};

/** Slug aliases used by Hackthone QHSE-FORMS + backend routes */
const BY_SLUG = {
  "transfer-audit-report": generateTransferAuditReportPdf,
  "hse-induction-checklist": generateHseInductionChecklistPdf,
  "poac-cross-competency": generatePoacCrossCompetencyPdf,
  "near-miss": generateNearMissPdf,
  "supplier-questionnaire": generateSupplierDueDiligencePdf,
  "audit-form": generateSubContractorAuditPdf,
  // extras (available if routes added later)
  "best-practice": generateBestPracticePdf,
  "vendor-supplier-approval": generateVendorSupplierApprovalPdf,
  "base-audit": generateBaseAuditReportPdf,
  "new-base-setup": generateNewBaseSetupChecklistPdf,
  "moc-management-change": generateMOCManagementChangePdf,
  "equipment-defect": generateEquipmentDefectPdf,
  "drill-plan": generateDrillPlanPdf,
  "drill-report": generateDrillReportPdf,
  "training-plan": generateTrainingPlanPdf,
  "training-record": generateTrainingRecordPdf,
  "target-kpi": generateTargetKpiPdf,
  cid: generateCidPdf,
  "statutory-certificate": generateStatutoryCertificatePdf,
  "audit-inspection-planner": generateAuditInspectionPlannerPdf,
  "sts-equipment-base-stock": generateStsEquipmentBaseStockLevelPdf,
};

export function normalizeQhseKey(key) {
  return String(key || "").trim();
}

/**
 * @returns {{ key: string, generate: (data: object) => Promise<Buffer> } | null}
 */
export function getQhsePdfGenerator(formSlugOrCode) {
  const raw = normalizeQhseKey(formSlugOrCode);
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (BY_FORM_CODE[upper]) {
    return { key: upper, generate: BY_FORM_CODE[upper] };
  }

  const slug = raw.toLowerCase();
  if (BY_SLUG[slug]) {
    return { key: slug, generate: BY_SLUG[slug] };
  }

  return null;
}

export function listQhseTemplateKeys() {
  return {
    formCodes: Object.keys(BY_FORM_CODE).sort(),
    slugs: Object.keys(BY_SLUG).sort(),
  };
}
