import express from 'express';
import cors from 'cors';
import { getAllBooks } from './booksStore.js';

const PORT = process.env.PORT ?? 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();

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

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});