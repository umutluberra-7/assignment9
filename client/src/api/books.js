// Every request to the server goes through this module.
// Components never build URLs or call fetch themselves.

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Shared helper: Content-Type only when there is a body, checks response.ok,
// turns the server's { error } into an Error, and returns null for 204.
async function request(path, { method = 'GET', body, signal } = {}) {
  const options = { method, signal };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed with HTTP ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

// Builds "?genre=fiction&q=..." safely with encoding; empty values are skipped
function toQueryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const getBooks = (params = {}, signal) =>
  request(`/api/books${toQueryString(params)}`, { signal });

export const createBook = (book) =>
  request('/api/books', { method: 'POST', body: book });

export const replaceBook = (id, book) =>
  request(`/api/books/${encodeURIComponent(id)}`, { method: 'PUT', body: book });

export const updateBook = (id, changes) =>
  request(`/api/books/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });

export const deleteBook = (id) =>
  request(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const getStats = (signal) => request('/api/stats', { signal });

export const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];