import type { ScreenRow } from '../../data/metrics';

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

/** "All screens in this module" (F-scr) — wireframe's pathtbl markup. */
export function ScreensTable({ rows }: { rows: ScreenRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted, #a09d94)', fontSize: 13 }}>
        No screen path data recorded for this module.
      </div>
    );
  }
  return (
    <table className="pathtbl">
      <thead>
        <tr>
          <th>Screen</th>
          <th className="num">Users</th>
          <th className="num">Events</th>
          <th className="num">Sessions</th>
          <th className="num">Completion</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.screen}>
            <td className="strong" title={r.screen}>{formatScreenName(r.screen)}</td>
            <td className="num">{r.users.toLocaleString()}</td>
            <td className="num">{r.events.toLocaleString()}</td>
            <td className="num">{r.sessions.toLocaleString()}</td>
            <td className="num">{r.completion}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
