export default function BookItem({ book, busy, onToggleRead, onRate, onEdit, onDelete }) {
  return (
    <li className="book">
      <div>
        <h3>{book.title} {book.read && '✓'}</h3>
        <p className="muted">{book.author} · {book.year} · {book.genre}</p>
      </div>
      <div className="book-controls">
        <label className="checkbox">
          <input type="checkbox" checked={book.read} disabled={busy} onChange={() => onToggleRead(book)} />
          Read
        </label>
        <select
          value={book.rating ?? ''}
          disabled={busy || !book.read}
          onChange={(e) => onRate(book, e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
        </select>
        <button type="button" className="secondary" disabled={busy} onClick={() => onEdit(book)}>Edit</button>
        <button type="button" className="danger" disabled={busy} onClick={() => onDelete(book)}>Delete</button>
      </div>
    </li>
  );
}