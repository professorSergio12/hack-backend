import { findOperationByReference } from "../services/zohoCreator.js";

/** Legacy Oceane-Marine API paths → Hackthone OPS-OFD slugs */
export const API_PATH_TO_SLUG = {
  "ops-ofd-001": "OPS-OFD-001",
  "ops-ofd-001a": "OPS-OFD-001A",
  "ops-ofd-002": "OPS-OFD-002",
  "ops-ofd-003": "OPS-OFD-003",
  "ops-ofd-004": "OPS-OFD-004",
  "ops-ofd-005": "OPS-OFD-005",
  "ops-ofd-0051": "OPS-OFD-0051",
  "ops-ofd-005b": "OPS-OFD-005B",
  "ops-ofd-005c": "OPS-OFD-005C",
  "ops-ofd-005d": "OPS-OFD-005D",
  "ops-ofd-005e": "OPS-OFD-005E",
  "ops-ofd-009": "OPS-OFD-009",
  "ops-ofd-011": "OPS-OFD-011",
  "ops-ofd-015": "OPS-OFD-015",
  "ops-ofd-018": "OPS-OFD-018",
  "ops-ofd-023": "OPS-OFD-023",
  "ops-ofd-028": "OPS-OFD-028",
  "ops-ofd-029": "OPS-OFD-029",
  "declaration-of-sea": "OPS-OFD-005E",
};

function normalizeApiPath(apiPath) {
  return String(apiPath || "")
    .toLowerCase()
    .replace(/\/create$/, "")
    .replace(/^\//, "");
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

export async function resolveFormSlug(apiPath, payload, operationRef) {
  const pathKey = normalizeApiPath(apiPath);

  if (pathKey === "ops-ofd-014") {
    const phase = payload?.jobInfo?.operationPhase;
    return phase === "AFTER_OPERATION" ? "OPS-OFD-014-A" : "OPS-OFD-014-B";
  }

  if (pathKey === "ops-ofd-020") {
    const vesselName = normalizeName(payload?.jobDetails?.vesselName);
    if (operationRef) {
      try {
        const operation = await findOperationByReference(operationRef);
        const chs = normalizeName(operation?.data?.CHS_Name);
        const ms = normalizeName(operation?.data?.MS_Name);
        if (vesselName && ms && vesselName === ms) return "OPS-OFD-020-MS";
        if (vesselName && chs && vesselName === chs) return "OPS-OFD-020-CHS";
        if (ms && !chs) return "OPS-OFD-020-MS";
        if (chs && !ms) return "OPS-OFD-020-CHS";
      } catch {
        /* fall through */
      }
    }
    return "OPS-OFD-020-CHS";
  }

  const slug = API_PATH_TO_SLUG[pathKey];
  if (!slug) {
    throw new Error(`Unknown checklist API path: ${apiPath}`);
  }
  return slug;
}

export function getSlugCandidatesForGet(apiPath) {
  const pathKey = normalizeApiPath(apiPath);
  if (pathKey === "ops-ofd-014") return ["OPS-OFD-014-B", "OPS-OFD-014-A"];
  if (pathKey === "ops-ofd-020") return ["OPS-OFD-020-CHS", "OPS-OFD-020-MS"];
  const slug = API_PATH_TO_SLUG[pathKey];
  return slug ? [slug] : [];
}
