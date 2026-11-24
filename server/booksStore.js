// In-memory data store. Functions are async (simulated slow data source)
// and the stored array/objects are NEVER modified in place.

const DELAY_MS = 50;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seed = [
  { id: 1, title: 'Dune', author: 'Frank Herbert', year: 1965, genre: 'fiction', read: true, rating: 5 },
  { id: 2, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'fantasy', read: true, rating: 4 },
  { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', year: 1988, genre: 'science', read: false, rating: null },
  { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, genre: 'history', read: true, rating: 4 },
  { id: 5, title: 'A Game of Thrones', author: 'George R.R. Martin', year: 1996, genre: 'fantasy', read: false, rating: null },
  { id: 6, title: 'Educated', author: 'Tara Westover', year: 2018, genre: 'non-fiction', read: true, rating: null },
  { id: 7, title: '1984', author: 'George Orwell', year: 1949, genre: 'fiction', read: false, rating: null },
];

// Object.freeze: if anyone tries to change these in place, JS throws an error
let books = Object.freeze(seed.map((b) => Object.freeze({ ...b })));
let nextId = books.length + 1;

export async function getAllBooks() {
  await wait(DELAY_MS);
  return books;
}

export async function getBookById(id) {
  await wait(DELAY_MS);
  return books.find((b) => b.id === id) ?? null;
}
// True when ANOTHER book (not excludeId) has the same title and author, ignoring case
export async function isDuplicate(title, author, excludeId = null) {
  await wait(DELAY_MS);
  const t = title.trim().toLowerCase();
  const a = author.trim().toLowerCase();
  return books.some(
    (b) => b.id !== excludeId && b.title.toLowerCase() === t && b.author.toLowerCase() === a,
  );
}
export async function addBook(data) {
  await wait(DELAY_MS);
  const book = Object.freeze({ id: nextId, ...data });
  nextId += 1;
  books = Object.freeze([...books, book]); // NEW array, old one untouched
  return book;
}
export async function replaceBook(id, data) {
  await wait(DELAY_MS);
  const updated = Object.freeze({ id, ...data });
  // NEW array: the matching book is swapped for a NEW object
  books = Object.freeze(books.map((b) => (b.id === id ? updated : b)));
  return updated;
}
export async function removeBook(id) {
  await wait(DELAY_MS);
  const before = books.length;
  books = Object.freeze(books.filter((b) => b.id !== id)); // NEW array
  return books.length < before; // true if something was removed
}

// ---------- list with filter / sort / pagination ----------
const textCompare = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' });

function compareBooks(field, order) {
  const dir = order === 'desc' ? -1 : 1;
  return (a, b) => {
    if (field === 'rating') {
      // Unrated books ALWAYS go last, whatever the order
      if (a.rating === null && b.rating === null) return a.id - b.id;
      if (a.rating === null) return 1;
      if (b.rating === null) return -1;
      return (a.rating - b.rating) * dir || a.id - b.id;
    }
    const result = field === 'title' || field === 'author'
      ? textCompare(a[field], b[field])   // alphabetical, ignores case
      : a[field] - b[field];              // id or year (numbers)
    return result * dir || a.id - b.id;  // ties broken by id
  };
}

export async function queryBooks({ genre, read, q, sort, order, limit, page }) {
  const all = await getAllBooks();

  const filtered = all.filter(
    (b) =>
      (genre === null || b.genre === genre) &&
      (read === null || b.read === read) &&
      (q === '' || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)),
  );

  // toSorted returns a NEW array: the stored one is never reordered
  const sorted = filtered.toSorted(compareBooks(sort, order));

  const start = (page - 1) * limit;
  return { total: sorted.length, items: sorted.slice(start, start + limit) };
}