import type { ScreenRow } from '../../data/metrics';

/** "All screens in this module" (F-scr) — wireframe's pathtbl markup. */
export function ScreensTable({ rows }: { rows: ScreenRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ss-text-sub, #6b7280)', fontSize: 13 }}>
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
            <td>{r.screen}</td>
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
