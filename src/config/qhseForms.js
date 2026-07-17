/** QHSE external form routes (legacy Oceane-Marine API paths) */
export const QHSE_FORM_ROUTES = [
  {
    path: "qhse/due-diligence/audit-sub-contractor/create",
    slug: "audit-form",
    formCode: "QAF-OFD-055",
    title: "Sub Contractor Audit",
  },
  {
    path: "qhse/form-checklist/hse-induction-checklist/create",
    slug: "hse-induction-checklist",
    formCode: "QAF-OFD-008",
    title: "HSE Induction Checklist",
  },
  {
    path: "near-miss-form/create",
    slug: "near-miss",
    formCode: "QAF-OFD-015",
    title: "Near Miss / Incident Report",
  },
  {
    path: "qhse/cross-competency/create",
    slug: "poac-cross-competency",
    formCode: "QAF-OFD-009",
    title: "POAC Cross Competency",
  },
  {
    path: "qhse/due-diligence/due-diligence-questionnaire/create",
    slug: "supplier-questionnaire",
    formCode: "QAF-OFD-043",
    title: "Supplier Due Diligence Questionnaire",
  },
  {
    path: "qhse/form-checklist/transfer-audit/create",
    slug: "transfer-audit-report",
    formCode: "QAF-OFD-003",
    title: "STS Transfer Audit Report",
  },
];

export function getQhseRouteByPath(pathSegment) {
  const normalized = String(pathSegment || "").replace(/^\/+|\/+$/g, "");
  return QHSE_FORM_ROUTES.find((route) => route.path === normalized) || null;
}
