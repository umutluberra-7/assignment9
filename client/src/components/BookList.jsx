import BookItem from './BookItem.jsx';

export default function BookList({ books, loading, error, busyId, ...handlers }) {
  if (error) return <p className="card error">Could not load books: {error}</p>;
  if (loading && books.length === 0) return <p className="card muted">Loading books…</p>;
  if (books.length === 0) return <p className="card muted">No books match these filters.</p>;

  return (
    <section className="card">
      {loading && <p className="muted">Refreshing…</p>}
      <ul className="book-list">
        {books.map((book) => (
          <BookItem key={book.id} book={book} busy={busyId === book.id} {...handlers} />
        ))}
      </ul>
    </section>
  );
}