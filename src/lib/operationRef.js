/**
 * Normalize operation Reference_Number / operationRef.
 * Fixes values like "STS-2026- 20" / "STS-2026-    20" → "STS-2026-20"
 */
export function normalizeOperationRef(ref) {
  const raw = String(ref ?? "")
    .replace(/,\s*$/, "")
    .replace(/\s+/g, "")
    .trim();
  if (!raw) return "";

  const m = raw.match(/^(?:STS-?)?(\d{4})-?0*(\d+)$/i);
  if (!m) return raw;

  const year = m[1];
  const seq = String(parseInt(m[2], 10));
  return `STS-${year}-${seq}`;
}

/** Candidate spellings for Creator lookup (space / padding variants). */
export function operationRefCandidates(ref) {
  const raw = String(ref ?? "").trim();
  const compact = raw.replace(/\s+/g, "");
  const normalized = normalizeOperationRef(ref);
  const out = [];

  function add(v) {
    if (v && !out.includes(v)) out.push(v);
  }

  add(raw);
  add(compact);
  add(normalized);

  const m = compact.match(/^(?:STS-?)?(\d{4})-?0*(\d+)$/i);
  if (m) {
    const year = m[1];
    const seqNum = parseInt(m[2], 10);
    const seq = String(seqNum);
    const padded = String(seqNum).padStart(3, "0");
    add(`STS-${year}-${seq}`);
    add(`STS-${year}-${padded}`);
    add(`${year}-${seq}`);
    add(`${year}-${padded}`);
    add(`STS-${year}- ${seq}`);
    add(`STS-${year}- ${padded}`);
  }

  return out;
}
