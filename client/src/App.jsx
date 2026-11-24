import { useEffect, useState } from 'react';
import { getBooks, getStats, createBook, replaceBook, updateBook, deleteBook } from './api/books.js';
import Filters from './components/Filters.jsx';
import BookList from './components/BookList.jsx';
import BookForm from './components/BookForm.jsx';
import StatsPanel from './components/StatsPanel.jsx';

const INITIAL_FILTERS = { q: '', genre: '', read: '', sort: '', order: 'asc' };

export default function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [listVersion, setListVersion] = useState(0);

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [statsVersion, setStatsVersion] = useState(0);

  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // List: a new server request whenever a control changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError(null);

    // Short delay so typing does not send one request per key
    const timer = setTimeout(async () => {
      try {
        const params = {
          q: filters.q.trim(),
          genre: filters.genre,
          read: filters.read,
          sort: filters.sort,
          order: filters.sort ? filters.order : '',
        };
        const data = await getBooks(params, controller.signal);
        setBooks(data);
        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return; // a newer request replaced this one
        setListError(err.message);
        setLoading(false);
      }
    }, 250);

    // Cleanup: cancel the timer and any request still running
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, listVersion]);

  // Statistics
  useEffect(() => {
    const controller = new AbortController();
    setStatsError(null);
    getStats(controller.signal)
      .then(setStats)
      .catch((err) => {
        if (err.name !== 'AbortError') setStatsError(err.message);
      });
    return () => controller.abort();
  }, [statsVersion]);

  const refreshAll = () => {
    setListVersion((v) => v + 1);
    setStatsVersion((v) => v + 1);
  };

  // Add (POST) and edit (PUT): errors are shown by BookForm
  async function handleCreate(data) {
    await createBook(data);
    refreshAll();
  }

  async function handleReplace(data) {
    await replaceBook(editing.id, data);
    setEditing(null);
    refreshAll();
  }

  // Toggle read / rate (PATCH) and delete
  async function runRowAction(book, action) {
    setActionError(null);
    setBusyId(book.id);
    try {
      await action();
      setStatsVersion((v) => v + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const handleToggleRead = (book) =>
    runRowAction(book, async () => {
      // Un-reading must also clear the rating, otherwise the server answers 400
      const changes = book.read ? { read: false, rating: null } : { read: true };
      const updated = await updateBook(book.id, changes);
      // Only after the server confirms: new array with the updated book
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (filters.read !== '') setListVersion((v) => v + 1);
    });

  const handleRate = (book, rating) =>
    runRowAction(book, async () => {
      const updated = await updateBook(book.id, { rating });
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (filters.sort === 'rating') setListVersion((v) => v + 1);
    });

  const handleDelete = (book) => {
    if (!window.confirm(`Delete “${book.title}”?`)) return;
    runRowAction(book, async () => {
      await deleteBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      if (editing?.id === book.id) setEditing(null);
    });
  };

  return (
    <div className="app">
      <h1>📚 Reading List</h1>
      <StatsPanel stats={stats} error={statsError} />
      <div className="layout">
        <main>
          <Filters filters={filters} onChange={setFilters} />
          {actionError && <p className="card error">{actionError}</p>}
          <BookList
            books={books}
            loading={loading}
            error={listError}
            busyId={busyId}
            onToggleRead={handleToggleRead}
            onRate={handleRate}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </main>
        <aside>
          {editing ? (
            <BookForm key={editing.id} book={editing} onSubmit={handleReplace} onCancel={() => setEditing(null)} />
          ) : (
            <BookForm key="new" book={null} onSubmit={handleCreate} />
          )}
        </aside>
      </div>
    </div>
  );
}