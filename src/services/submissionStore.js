import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBMISSIONS_DIR = path.join(__dirname, "../../data/submissions");
const QHSE_DIR = path.join(__dirname, "../../data/qhse-submissions");
const SERIAL_DIR = path.join(__dirname, "../../data/serial-counters");

function sanitizeKey(value) {
  return String(value || "unknown")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function saveStsSubmission(operationRef, slug, data) {
  const ref = sanitizeKey(operationRef);
  const filePath = path.join(SUBMISSIONS_DIR, ref, `${sanitizeKey(slug)}.json`);
  await writeJson(filePath, {
    operationRef,
    slug,
    savedAt: new Date().toISOString(),
    data,
  });
}

export async function getStsSubmission(operationRef, slug) {
  const ref = sanitizeKey(operationRef);
  const filePath = path.join(SUBMISSIONS_DIR, ref, `${sanitizeKey(slug)}.json`);
  const record = await readJson(filePath);
  return record?.data || null;
}

export async function findStsSubmissionByApiPath(operationRef, apiPath) {
  const ref = sanitizeKey(operationRef);
  const dir = path.join(SUBMISSIONS_DIR, ref);

  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }

  const normalized = String(apiPath || "").toLowerCase();
  const candidates = entries.filter((name) => name.endsWith(".json"));

  if (normalized === "ops-ofd-014") {
    for (const slug of ["OPS-OFD-014-B", "OPS-OFD-014-A"]) {
      const data = await getStsSubmission(operationRef, slug);
      if (data) return data;
    }
    return null;
  }

  if (normalized === "ops-ofd-020") {
    for (const slug of ["OPS-OFD-020-CHS", "OPS-OFD-020-MS"]) {
      const data = await getStsSubmission(operationRef, slug);
      if (data) return data;
    }
    return null;
  }

  for (const file of candidates) {
    const record = await readJson(path.join(dir, file));
    if (record?.data) return record.data;
  }

  return null;
}

export async function nextSerialNumber(prefix, year = new Date().getFullYear()) {
  const filePath = path.join(SERIAL_DIR, `${sanitizeKey(prefix)}-${year}.json`);
  const current = (await readJson(filePath)) || { seq: 0 };
  const next = (current.seq || 0) + 1;
  await writeJson(filePath, { seq: next, year });
  return `${year}-${String(next).padStart(3, "0")}`;
}

export async function saveQhseSubmission(formSlug, payload, serialNumber) {
  const filePath = path.join(QHSE_DIR, `${sanitizeKey(formSlug)}`, `${sanitizeKey(serialNumber)}.json`);
  await writeJson(filePath, {
    formSlug,
    serialNumber,
    savedAt: new Date().toISOString(),
    data: payload,
  });
}
