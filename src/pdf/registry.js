/**
 * Maps Hackthone form slugs → Oceane-Marine DOCX generators
 * (ported from Oceane-Marine/src/jobs/services/pdf/).
 */
import { generateOpsOfd001Doc } from "./templates/OPS-OFD-001.js";
import { generateOpsOfd001ADoc } from "./templates/OPS-OFD-001A.js";
import { generateOpsOfd002Doc } from "./templates/OPS-OFD-002.js";
import { generateOpsOfd003Doc } from "./templates/OPS-OFD-003.js";
import { generateOpsOfd004Doc } from "./templates/OPS-OFD-004.js";
import { generateOpsOfd005Doc } from "./templates/OPS-OFD-005.js";
import { generateOpsOfd005bDoc } from "./templates/OPS-OFD-005B.js";
import { generateOpsOfd005CDoc } from "./templates/OPS-OFD-005C.js";
import { generateOpsOfd005DDoc } from "./templates/OPS-OFD-005D.js";
import { generateDeclarationOfSeaDoc } from "./templates/OPS-OFD-005E.js";
import { generateOpsOfd009Doc } from "./templates/OPS-OFD-009.js";
import { generateOpsOfd011Doc } from "./templates/OPS-OFD-011.js";
import { generateOpsOfd014Doc } from "./templates/OPS-OFD-014.js";
import { generateOpsOfd015Doc } from "./templates/OPS-OFD-015.js";
import { generateOpsOfd018Doc } from "./templates/OPS-OFD-018.js";
import { generateOpsOfd020Doc } from "./templates/OPS-OFD-020.js";
import { generateOpsOfd023Doc } from "./templates/OPS-OFD-023.js";
import { generateOpsOfd028Doc } from "./templates/OPS-OFD-028.js";
import { generateOpsOfd029Doc } from "./templates/OPS-OFD-029.js";

/** @type {Record<string, (data: object, fullPath: string) => Promise<void>>} */
const GENERATORS = {
  "OPS-OFD-001": generateOpsOfd001Doc,
  "OPS-OFD-001A": generateOpsOfd001ADoc,
  "OPS-OFD-002": generateOpsOfd002Doc,
  "OPS-OFD-003": generateOpsOfd003Doc,
  "OPS-OFD-004": generateOpsOfd004Doc,
  "OPS-OFD-005": generateOpsOfd005Doc,
  "OPS-OFD-0051": generateOpsOfd005Doc,
  "OPS-OFD-005B": generateOpsOfd005bDoc,
  "OPS-OFD-005C": generateOpsOfd005CDoc,
  "OPS-OFD-005D": generateOpsOfd005DDoc,
  "OPS-OFD-005E": generateDeclarationOfSeaDoc,
  "OPS-OFD-009": generateOpsOfd009Doc,
  "OPS-OFD-011": generateOpsOfd011Doc,
  "OPS-OFD-014": generateOpsOfd014Doc,
  "OPS-OFD-014-A": generateOpsOfd014Doc,
  "OPS-OFD-014-B": generateOpsOfd014Doc,
  "OPS-OFD-015": generateOpsOfd015Doc,
  "OPS-OFD-018": generateOpsOfd018Doc,
  "OPS-OFD-020": generateOpsOfd020Doc,
  "OPS-OFD-020-CHS": generateOpsOfd020Doc,
  "OPS-OFD-020-MS": generateOpsOfd020Doc,
  "OPS-OFD-023": generateOpsOfd023Doc,
  "OPS-OFD-028": generateOpsOfd028Doc,
  "OPS-OFD-029": generateOpsOfd029Doc,
};

export function normalizeSlug(slug) {
  return String(slug || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, "-");
}

export function getGenerator(slug) {
  const key = normalizeSlug(slug);
  if (GENERATORS[key]) return { key, generate: GENERATORS[key] };

  // OPS-OFD-014A → OPS-OFD-014-A
  const withHyphen = key.replace(/^(OPS-OFD-\d+)([A-Z])$/, "$1-$2");
  if (GENERATORS[withHyphen]) return { key: withHyphen, generate: GENERATORS[withHyphen] };

  return null;
}

export function listTemplateSlugs() {
  return Object.keys(GENERATORS).sort();
}
