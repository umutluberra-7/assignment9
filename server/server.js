import express from 'express';
import cors from 'cors';
import { getAllBooks, getBookById } from './booksStore.js';
import { parseId } from './validate.js';

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

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});