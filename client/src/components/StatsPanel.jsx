export default function StatsPanel({ stats, error }) {
  if (error) return <section className="card"><p className="error">Statistics: {error}</p></section>;
  if (!stats) return <section className="card"><p className="muted">Loading statistics…</p></section>;

  return (
    <section className="card stats">
      <div className="stat"><strong>{stats.total}</strong><span>Total</span></div>
      <div className="stat"><strong>{stats.read}</strong><span>Read</span></div>
      <div className="stat"><strong>{stats.unread}</strong><span>Unread</span></div>
      <div className="stat"><strong>{stats.averageRating ?? '—'}</strong><span>Avg. rating</span></div>
      <ul className="genres">
        {Object.entries(stats.byGenre).map(([genre, count]) => (
          <li key={genre}>{genre}: <b>{count}</b></li>
        ))}
      </ul>
    </section>
  );
}