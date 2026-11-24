// Hand-written validation (no schema libraries allowed).
// Every function returns { ok: true, value } or { ok: false, error }.

const fail = (error) => ({ ok: false, error });
const pass = (value) => ({ ok: true, value });

// ---------- id (route parameter) ----------
export function parseId(raw) {
  // Digits only: rejects "-1", "1.5", "abc", "1e3"
  if (!/^\d+$/.test(raw)) {
    return fail(`id must be a positive integer, received "${raw}"`);
  }
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id < 1) {
    return fail(`id must be a positive integer, received "${raw}"`);
  }
  return pass(id);
}