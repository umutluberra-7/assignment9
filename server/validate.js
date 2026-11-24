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

// For PATCH: keep only the known fields that were actually sent
export function pickPatchFields(body) {
  if (!isPlainObject(body)) {
    return fail('Request body must be a JSON object');
  }
  const allowed = ['title', 'author', 'year', 'genre', 'read', 'rating'];
  const changes = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key)),
  );
  if (Object.keys(changes).length === 0) {
    return fail(`PATCH body must contain at least one of: ${allowed.join(', ')}`);
  }
  return pass(changes);
}
// ---------- query string for GET /api/books ----------
export const SORT_FIELDS = ['title', 'author', 'year', 'rating'];
const KNOWN_QUERY = ['genre', 'read', 'q', 'sort', 'order', 'limit', 'page'];

function parseIntInRange(name, raw, min, max) {
  if (!/^\d+$/.test(raw)) return { error: `${name} must be an integer` };
  const n = Number(raw);
  if (n < min || (max !== undefined && n > max)) {
    return {
      error: max === undefined
        ? `${name} must be at least ${min}`
        : `${name} must be between ${min} and ${max}`,
    };
  }
  return { value: n };
}

export function parseListQuery(query) {
  // A repeated parameter (?genre=a&genre=b) arrives as an ARRAY: reject it
  for (const key of KNOWN_QUERY) {
    if (Array.isArray(query[key])) {
      return fail(`Query parameter "${key}" must not be repeated`);
    }
  }

  const options = { genre: null, read: null, q: '', sort: 'id', order: 'asc', limit: 50, page: 1 };

  if (query.genre !== undefined) {
    if (!GENRES.includes(query.genre)) {
      return fail(`genre must be one of: ${GENRES.join(', ')}`);
    }
    options.genre = query.genre;
  }

  if (query.read !== undefined) {
    if (query.read !== 'true' && query.read !== 'false') {
      return fail('read must be "true" or "false"');
    }
    options.read = query.read === 'true';
  }

  if (query.q !== undefined) {
    options.q = query.q.trim().toLowerCase();
  }

  if (query.sort !== undefined) {
    if (!SORT_FIELDS.includes(query.sort)) {
      return fail(`sort must be one of: ${SORT_FIELDS.join(', ')}`);
    }
    options.sort = query.sort;
  }

  if (query.order !== undefined) {
    if (query.order !== 'asc' && query.order !== 'desc') {
      return fail('order must be "asc" or "desc"');
    }
    options.order = query.order;
  }

  if (query.limit !== undefined) {
    const { value, error } = parseIntInRange('limit', query.limit, 1, 50);
    if (error) return fail(error);
    options.limit = value;
  }

  if (query.page !== undefined) {
    const { value, error } = parseIntInRange('page', query.page, 1);
    if (error) return fail(error);
    options.page = value;
  }

  return pass(options);
}