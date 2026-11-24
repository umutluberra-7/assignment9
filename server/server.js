import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT ?? 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();

// Her isteği terminale yazar
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Sadece istemcinin tam origin'ine izin ver ('*' DEĞİL)
app.use(cors({ origin: CLIENT_ORIGIN }));

// JSON body'leri okumak için, ROTALARDAN ÖNCE
app.use(express.json());

// Geçici test rotası
app.get('/api/hello', async (req, res) => {
  res.json({ message: 'Server is working' });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT} (allowed origin: ${CLIENT_ORIGIN})`);
});