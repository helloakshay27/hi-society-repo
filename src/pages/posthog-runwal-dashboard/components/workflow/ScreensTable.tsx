import React from 'react';
import { FlowItem, EntryScreenItem } from '../../api/types';

interface AllScreensTableProps {
  flows?: FlowItem[];
}

export const AllScreensTable: React.FC<AllScreensTableProps> = ({ flows = [] }) => {
  if (!flows || flows.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        No screen path flows found for this module.
      </div>
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="pathtbl">
        <thead>
          <tr>
            <th>Screen / Path</th>
            <th className="num">Users</th>
            <th className="num">Events</th>
            <th className="num">Sessions</th>
            <th className="num">Completion Rate</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((r, idx) => (
            <tr key={r.path || idx}>
              <td className="strong">{r.path}</td>
              <td className="num">{r.users != null ? r.users.toLocaleString() : '—'}</td>
              <td className="num">{r.events != null ? r.events.toLocaleString() : '—'}</td>
              <td className="num">{r.sessions != null ? r.sessions.toLocaleString() : '—'}</td>
              <td className="num">
                {r.f_comp != null
                  ? `${Math.round(r.f_comp <= 1 ? r.f_comp * 100 : r.f_comp)}%`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface EntryScreensTableProps {
  entryScreens?: EntryScreenItem[];
}

export const EntryScreensTable: React.FC<EntryScreensTableProps> = ({ entryScreens = [] }) => {
  if (!entryScreens || entryScreens.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
        No entry screens recorded for this filter.
      </div>
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="pathtbl">
        <thead>
          <tr>
            <th>Entry Screen</th>
            <th className="num">Visitors</th>
            <th className="num">Views</th>
            <th className="num">Bounce Rate</th>
          </tr>
        </thead>
        <tbody>
          {entryScreens.map((r, idx) => (
            <tr key={r.path || idx}>
              <td className="strong">{r.path}</td>
              <td className="num">{r.visitors != null ? r.visitors.toLocaleString() : '—'}</td>
              <td className="num">{r.views != null ? r.views.toLocaleString() : '—'}</td>
              <td className="num">
                {r.bounce != null
                  ? `${Math.round(r.bounce <= 1 ? r.bounce * 100 : r.bounce)}%`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
