import { useState } from 'react';
import { GENRES } from '../api/books.js';

const EMPTY = { title: '', author: '', year: '', genre: 'fiction', read: false, rating: '' };

function toFormValues(book) {
  if (!book) return EMPTY;
  return {
    title: book.title,
    author: book.author,
    year: String(book.year),
    genre: book.genre,
    read: book.read,
    rating: book.rating === null ? '' : String(book.rating),
  };
}

// Used for adding (POST) and editing (PUT). onSubmit must return a promise.
export default function BookForm({ book, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(book));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = Boolean(book);

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    // Light client-side check; the server validates again
    if (!values.title.trim() || !values.author.trim()) {
      setError('Title and author are required.');
      return;
    }
    const payload = {
      title: values.title,
      author: values.author,
      year: values.year === '' ? null : Number(values.year),
      genre: values.genre,
      read: values.read,
      rating: values.rating === '' ? null : Number(values.rating),
    };
    setSubmitting(true);
    try {
      await onSubmit(payload);
      if (!isEdit) setValues(EMPTY);
    } catch (err) {
      setError(err.message); // the server's own message
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card book-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? `Edit “${book.title}”` : 'Add a book'}</h2>
      <label>Title<input value={values.title} onChange={update('title')} /></label>
      <label>Author<input value={values.author} onChange={update('author')} /></label>
      <div className="row">
        <label>Year<input type="number" value={values.year} onChange={update('year')} /></label>
        <label>
          Genre
          <select value={values.genre} onChange={update('genre')}>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label>
          Rating
          <select value={values.rating} onChange={update('rating')}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
          </select>
        </label>
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={values.read} onChange={update('read')} />
        I have read this book
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add book'}
        </button>
        {isEdit && (
          <button type="button" className="secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        )}
      </div>
    </form>
  );
}