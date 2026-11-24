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
// ---------- book body ----------
export const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkText(name, value) {
  if (typeof value !== 'string') {
    return `${name} is required and must be a string`;
  }
  const length = value.trim().length;
  if (length < 1 || length > 100) {
    return `${name} must be 1 to 100 characters after trimming (got ${length})`;
  }
  return null;
}

// Validates a complete book (POST, PUT, and PATCH after merging).
// Only known fields are read: anything else, including id, is ignored.
export function validateBook(body) {
  if (!isPlainObject(body)) {
    return fail('Request body must be a JSON object');
  }

  const { title, author, year, genre } = body;
  const read = body.read === undefined ? false : body.read;
  const rating = body.rating === undefined ? null : body.rating;

  const titleError = checkText('title', title);
  if (titleError) return fail(titleError);

  const authorError = checkText('author', author);
  if (authorError) return fail(authorError);

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
    return fail(`year must be an integer between 1000 and ${currentYear}`);
  }

  if (!GENRES.includes(genre)) {
    return fail(`genre must be one of: ${GENRES.join(', ')}`);
  }

  if (typeof read !== 'boolean') {
    return fail('read must be a boolean (true or false)');
  }

  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return fail('rating must be an integer from 1 to 5, or null');
  }

  if (rating !== null && read !== true) {
    return fail('rating is only allowed when read is true');
  }

  // Return a NEW clean object with only the allowed fields
  return pass({ title: title.trim(), author: author.trim(), year, genre, read, rating });
}