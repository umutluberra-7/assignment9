import express from 'express';
import cors from 'cors';
import { getAllBooks, getBookById, addBook, isDuplicate } from './booksStore.js';
import { parseId, validateBook } from './validate.js';

const PORT = process.env.PORT ?? 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();

// All errors have the shape { error: "message" }
const sendError = (res, status, message) => res.status(status).json({ error: message });

// write every request to terminal
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Only allow the full origin of the client. ('*' not)
app.use(cors({ origin: CLIENT_ORIGIN }));

// To read JSON bodies, BEFORE THE ROUTES
app.use(express.json());

// GET /api/books - list all books (query options come later)
app.get('/api/books', async (req, res) => {
  const books = await getAllBooks();
  return res.status(200).json(books);
});
// GET /api/books/:id - one book
app.get('/api/books/:id', async (req, res) => {
  const idResult = parseId(req.params.id);
  if (!idResult.ok) {
    return sendError(res, 400, idResult.error);
  }
  const book = await getBookById(idResult.value);
  if (!book) {
    return sendError(res, 404, `Book with id ${idResult.value} not found`);
  }
  return res.status(200).json(book);
});

// POST /api/books - create a book
app.post('/api/books', async (req, res) => {
  const result = validateBook(req.body);
  if (!result.ok) {
    return sendError(res, 400, result.error);
  }
  const data = result.value;
  if (await isDuplicate(data.title, data.author)) {
    return sendError(res, 409, `A book titled "${data.title}" by ${data.author} already exists`);
  }
  const created = await addBook(data);
  res.location(`/api/books/${created.id}`);
  return res.status(201).json(created);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});