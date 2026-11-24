import { GENRES } from '../api/books.js';

export default function Filters({ filters, onChange }) {
  const update = (field) => (event) => onChange({ ...filters, [field]: event.target.value });

  return (
    <section className="card filters">
      <label>
        Search
        <input type="search" placeholder="Title or author…" value={filters.q} onChange={update('q')} />
      </label>
      <label>
        Genre
        <select value={filters.genre} onChange={update('genre')}>
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
      <label>
        Status
        <select value={filters.read} onChange={update('read')}>
          <option value="">All</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>
      </label>
      <label>
        Sort by
        <select value={filters.sort} onChange={update('sort')}>
          <option value="">Added (id)</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>
      </label>
      <label>
        Direction
        <select value={filters.order} onChange={update('order')}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
    </section>
  );
}