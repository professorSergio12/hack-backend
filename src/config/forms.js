/**
 * Maps external form slugs to Zoho Creator field link names.
 */
export const FORM_CATALOGUE = [
  { slug: "OPS-OFD-001", creatorField: "OPS_OFD_001", title: "Before Operation Commence" },
  { slug: "OPS-OFD-001A", creatorField: "OPS_OFD_001_A", title: "Ship Standard Questionnaire" },
  { slug: "OPS-OFD-002", creatorField: "OPS_OFD_002", title: "Before Run In & Mooring" },
  { slug: "OPS-OFD-003", creatorField: "OPS_OFD_003", title: "Before Cargo Transfer" },
  { slug: "OPS-OFD-004", creatorField: "OPS_OFD_004", title: "Pre-Transfer Agreements" },
  { slug: "OPS-OFD-005", creatorField: "OPS_OFD_005", title: "During Transfer" },
  { slug: "OPS-OFD-0051", creatorField: "OPS_OFD_0051", title: "During Transfer 5.1" },
  { slug: "OPS-OFD-005B", creatorField: "OPS_OFD_005B", title: "Before Disconnection" },
  { slug: "OPS-OFD-005C", creatorField: "OPS_OFD_005C", title: "Terminal Transfer" },
  { slug: "OPS-OFD-005D", creatorField: "OPS_OFD_005D", title: "Declaration (Port)" },
  { slug: "OPS-OFD-005E", creatorField: "OPS_OFD_005E", title: "Declaration At Sea" },
  { slug: "OPS-OFD-009", creatorField: "OPS_OFD_009", title: "Mooring Master Job Report" },
  { slug: "OPS-OFD-011", creatorField: "OPS_OFD_011", title: "STS Standing Order" },
  { slug: "OPS-OFD-014-A", creatorField: "OPS_OFD_014_A", title: "Equipment Checklist A" },
  { slug: "OPS-OFD-014-B", creatorField: "OPS_OFD_014_B", title: "Equipment Checklist B" },
  { slug: "OPS-OFD-015", creatorField: "OPS_OFD_015", title: "Hourly Quantity Log" },
  { slug: "OPS-OFD-018", creatorField: "OPS_OFD_018", title: "STS Timesheet" },
  { slug: "OPS-OFD-020-CHS", creatorField: "OPS_OFD_020_CHS", title: "Master Feedback CHS" },
  { slug: "OPS-OFD-020-MS", creatorField: "OPS_OFD_020_MS", title: "Master Feedback MS" },
  { slug: "OPS-OFD-023", creatorField: "OPS_OFD_023", title: "Record of Work Hours" },
  { slug: "OPS-OFD-028", creatorField: "OPS_OFD_028", title: "Personnel Transfer Basket" },
  { slug: "OPS-OFD-029", creatorField: "OPS_OFD_029", title: "Mooring Master Expense Sheet" },
];

export function getFormBySlug(slug) {
  const input = String(slug).trim().toUpperCase().replace(/_/g, "-");
  return FORM_CATALOGUE.find((f) => {
    const catalogue = f.slug.toUpperCase();
    return catalogue === input || catalogue.replace(/-/g, "") === input.replace(/-/g, "");
  });
}

export function slugToApiPath(slug) {
  return slug.toLowerCase().replace(/-/g, "-");
}
