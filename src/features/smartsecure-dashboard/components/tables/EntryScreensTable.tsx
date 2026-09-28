import type { EntryScreenRow } from '../../data/metrics';

// "app_permissions_requested" -> "App Permissions Requested"
// "main_home6" -> "Main Home 6"
const formatScreenName = (path?: string | null) => {
  if (!path) return path || '';
  const spaced = path.replace(/_/g, ' ').replace(/([a-zA-Z])(\d)/g, '$1 $2');
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/** "Top entry screens" (F-entry) — org-wide, not module-filtered. */
export function EntryScreensTable({ rows }: { rows: EntryScreenRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted, #a09d94)', fontSize: 13 }}>
        No entry screen data recorded for this period.
      </div>
    );
  }
  return (
    <table className="pathtbl">
      <thead>
        <tr>
          <th>Screen</th>
          <th className="num">Visitors</th>
          <th className="num">Views</th>
          <th className="num">Bounce</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.screen}>
            <td className="strong" title={r.screen}>{formatScreenName(r.screen)}</td>
            <td className="num">{r.visitors.toLocaleString()}</td>
            <td className="num">{r.views.toLocaleString()}</td>
            <td className="num">{r.bounce}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
