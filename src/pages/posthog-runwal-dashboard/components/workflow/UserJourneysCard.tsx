import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../common/Card';
import '../../styles/userJourneys.css';
import { ErrorState } from '../common/DashboardStates';
import { TableSkeleton } from '../common/Skeleton';
import { fetchUserJourneys } from '../../api/api';
import type {
  DashboardFilters,
  SiteLookupItem,
  UserJourneyEnding,
  UserJourneyListParams,
  UserJourneyPerson,
  UserJourneySession,
  UserJourneyStep,
} from '../../api/types';
import {
  useUserJourneySessions,
  useUserJourneySteps,
  useUserJourneys,
} from '../../hooks/useDashboardAnalytics';

/**
 * User journeys (bottom of Workflow Usage on the residential dashboards), laid out as in the Runwal Connect
 * wireframe: people -> one person's sessions -> every step of one session. Live data from the analytics API;
 * every page filter applies (dates, platform, Post Sales / Post Possession, society), the module chosen above
 * does not. showSociety={false} (Runwal CP, My Piramal, Kalpataru: apps that stamp no society) drops the
 * Site ID and Society columns.
 */

const PER = 20;
type SortKey = NonNullable<UserJourneyListParams['sort']>;
type SessionSortKey = 'start' | 'dur' | 'screens' | 'taps' | 'entry' | 'end' | 'errs';
type StepFilter = 'all' | 'screen' | 'tap' | 'prob';

/* ---------- formatting (as in the wireframe) ---------- */
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
const fmtN = (n: number) => n.toLocaleString('en-IN');

/** "27 Jun 2026, 8:09 AM" */
export const fmtDT = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  const h = d.getHours();
  return `${d.getDate()} ${MONS[d.getMonth()]} ${d.getFullYear()}, ${h % 12 || 12}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};
const hms = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
/** "7m 36s" */
export const fmtDur = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${pad(s % 60)}s`;
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};
/** "Today" or "5 d ago", by calendar day. */
export const ago = (iso: string, now = new Date()): string => {
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 86_400_000);
  return days <= 0 ? 'Today' : `${days} d ago`;
};

const END_LABEL: Record<UserJourneyEnding, string> = {
  logout: 'Logged out',
  timeout: 'Timed out',
  closed: 'App closed',
  active: 'Active now',
};
const END_TEXT: Record<UserJourneyEnding, string> = {
  logout: 'Logged out',
  timeout: 'Timed out after 30 min of no activity',
  closed: 'App closed or sent to background',
  active: 'Still active: the last event was less than 30 minutes ago',
};

/* ---------- step labels (the wireframe's wording) ---------- */
const LBL: Record<string, string> = {
  app_launched: 'App opened', home_page_viewed: 'Home', push_notification_opened: 'Opened from a push notification',
  splash_routing_decided: 'Splash screen routed the user', otp_screen_viewed: 'OTP screen', login_screen_viewed: 'Login screen',
  auth_otp_requested: 'Requested an OTP', auth_otp_verified_success: 'OTP verified', auth_session_established: 'Signed in',
  visitor_approval_answered: 'Answered a visitor approval', event_rsvp_confirmed: 'RSVP confirmed', event_rsvp_failed: 'RSVP failed',
  poll_vote_submitted: 'Vote submitted', polls_vote_now_error: 'Vote failed', home_api_error: 'Home data failed to load',
  service_request_api_error: 'Service request failed (server error)', order_placed: 'Order placed', emi_calculated: 'EMI calculated',
  document_downloaded: 'Document downloaded', profile_updated: 'Profile updated',
  $pageview: 'Page view', $screen: 'Screen view', $autocapture: 'Tap', $pageleave: 'Left the page',
};
const words = (s: string) => {
  const t = s.replace(/^\$/, '').replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export function stepLabel(ev: string): string {
  if (LBL[ev]) return LBL[ev];
  let m: RegExpExecArray | null;
  if ((m = /^(.*)_tab_page_clicked$/.exec(ev))) return `Opened the ${m[1].replace(/_/g, ' ')} tab`;
  if ((m = /^(.*)_button_clicked$/.exec(ev))) return `Tapped ${words(m[1])}`;
  if ((m = /^(.*)_(clicked|tapped|pressed)$/.exec(ev))) return `Tapped ${m[1].replace(/_/g, ' ')}`;
  if ((m = /^(.*)_screen_viewed$/.exec(ev))) return words(m[1]);
  if ((m = /^(.*)_viewed$/.exec(ev))) return words(m[1]);
  if ((m = /^(.*)_opened$/.exec(ev))) return `Opened ${m[1].replace(/_/g, ' ')}`;
  if ((m = /^(.*)_(success|succeeded)$/.exec(ev))) return `${words(m[1])} succeeded`;
  if ((m = /^(.*)_(failed|error|failure)$/.exec(ev))) return `${words(m[1])} failed`;
  return words(ev);
}
const screenName = (s?: string | null) => (s ? (s.startsWith('/') ? s : words(s)) : '—');

/* ---------- CSV ---------- */
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const toCsv = (head: string[], rows: unknown[][]) =>
  [head.map(csvCell).join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');
const downloadCsv = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 400);
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'person';

/* ---------- small pieces ---------- */
const IdCell: React.FC<{ v?: string | null }> = ({ v }) =>
  v ? <span className="uj-id">{v}</span> : <span className="uj-nil">—</span>;
const EndPill: React.FC<{ e: UserJourneyEnding }> = ({ e }) => <span className={`uj-pill ${e}`}>{END_LABEL[e]}</span>;
const Pager: React.FC<{ n: number; page: number; onGo: (p: number) => void }> = ({ n, page, onGo }) => {
  const pages = Math.max(1, Math.ceil(n / PER));
  return (
    <div className="uj-pager">
      <button type="button" disabled={page <= 0} onClick={() => onGo(page - 1)}>← Prev</button>
      <span>Page {page + 1} of {fmtN(pages)}</span>
      <button type="button" disabled={page >= pages - 1} onClick={() => onGo(page + 1)}>Next →</button>
    </div>
  );
};

interface UserJourneysCardProps {
  filters: DashboardFilters;
  /** The user's societies (the society dropdown's list), to name a person's society. */
  societies?: SiteLookupItem[];
  /** The page's date range label, e.g. "Last 30 days". */
  rangeLabel?: string;
  enabled?: boolean;
  /** Site ID and Society columns; false on a dashboard whose app stamps no society (Runwal CP). */
  showSociety?: boolean;
}

export const UserJourneysCard: React.FC<UserJourneysCardProps> = ({ filters, societies = [], rangeLabel, enabled = true, showSociety = true }) => {
  const [view, setView] = useState<'users' | 'sessions' | 'timeline'>('users');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortK, setSortK] = useState<SortKey>('first_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [person, setPerson] = useState<UserJourneyPerson | null>(null);
  const [sesK, setSesK] = useState<SessionSortKey>('start');
  const [sesDir, setSesDir] = useState<1 | -1>(-1);
  const [sesPage, setSesPage] = useState(0);
  const [sid, setSid] = useState<string | null>(null);
  const [tf, setTf] = useState<StepFilter>('all');
  const [csvBusy, setCsvBusy] = useState(false);

  const societyNames = useMemo(() => new Map(societies.map((s) => [s.id, s.name])), [societies]);
  const societyName = (id?: string | null) => (id ? societyNames.get(id) || null : null);
  const range = rangeLabel || `${filters.from} – ${filters.to}`;
  // The page filters this card follows, for the note under the people table.
  const pageFilters = ['platform', filters.displayView ? 'Post Sales / Post Possession' : null, showSociety ? 'society' : null]
    .filter(Boolean).join(', ');

  // Any page filter change starts again from the people list.
  const filterKey = [filters.apiPath, filters.from, filters.to, filters.devPlatform, filters.displayView,
    (filters.societyIds || []).join(',')].join('|');
  useEffect(() => {
    setView('users');
    setPage(0);
    setPerson(null);
    setSid(null);
  }, [filterKey]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const listParams: UserJourneyListParams = { q: search, sort: sortK, dir: sortDir, page: page + 1, perPage: PER };
  const peopleQ = useUserJourneys(filters, listParams, enabled && view === 'users');
  const sessionsQ = useUserJourneySessions(filters, person?.user_key ?? null, enabled && view !== 'users');
  const stepsQ = useUserJourneySteps(filters, person?.user_key ?? null, sid, enabled && view === 'timeline');

  const sessions = useMemo(() => {
    const list = [...(sessionsQ.data?.sessions || [])];
    const val = (s: UserJourneySession): number | string => {
      switch (sesK) {
        case 'start': return new Date(s.started_at).getTime();
        case 'dur': return s.duration_s;
        case 'screens': return s.screens;
        case 'taps': return s.taps;
        case 'entry': return s.first_screen || '';
        case 'end': return END_LABEL[s.ended_by];
        case 'errs': return s.problems;
      }
    };
    return list.sort((a, b) => {
      const x = val(a), y = val(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { sensitivity: 'base' });
      return (c || new Date(a.started_at).getTime() - new Date(b.started_at).getTime()) * sesDir;
    });
  }, [sessionsQ.data, sesK, sesDir]);
  // Newest first, for "Older / Newer session".
  const byTime = useMemo(
    () => [...(sessionsQ.data?.sessions || [])].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()),
    [sessionsQ.data]
  );

  const sortPeople = (k: SortKey) => {
    if (k === sortK) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortK(k);
      setSortDir(['sessions', 'events', 'last_active'].includes(k) ? 'desc' : 'asc');
    }
    setPage(0);
  };
  const sortSessions = (k: SessionSortKey) => {
    if (k === sesK) setSesDir(sesDir === 1 ? -1 : 1);
    else {
      setSesK(k);
      setSesDir(['start', 'dur', 'screens', 'taps', 'errs'].includes(k) ? -1 : 1);
    }
    setSesPage(0);
  };

  const openPerson = (p: UserJourneyPerson) => {
    setPerson(p);
    setSesK('start');
    setSesDir(-1);
    setSesPage(0);
    setView('sessions');
  };
  const openSession = (id: string) => {
    setSid(id);
    setTf('all');
    setView('timeline');
  };

  const name = (p?: UserJourneyPerson | null) => (p ? `${p.first_name} ${p.last_name}`.trim() || p.email || `User ${p.user_key}` : '');
  const th = (label: string, active: boolean, dirUp: boolean, onClick: () => void, num = false) => (
    // analytics-header: the app's global table styles leave such headers alone.
    <th className={`analytics-header${num ? ' num' : ''}`} onClick={onClick} aria-sort={active ? (dirUp ? 'ascending' : 'descending') : undefined}>
      {label}
      {active && <span className="ar">{dirUp ? '▲' : '▼'}</span>}
    </th>
  );

  /* ---------- CSV for whichever level is shown ---------- */
  const csvNow = async () => {
    if (csvBusy) return;
    setCsvBusy(true);
    try {
      if (view === 'users') {
        const all = await fetchUserJourneys(filters, { q: search, sort: sortK, dir: sortDir, perPage: 'all' });
        const people = all.people || [];
        downloadCsv(`user_journey_people_${filters.from}_to_${filters.to}.csv`, showSociety
          ? toCsv(['First name', 'Last name', 'Email', 'Site ID', 'Society', 'Sessions', 'Last active'],
                  people.map((r) => [r.first_name, r.last_name, r.email, r.society_id, societyName(r.society_id), r.sessions, ago(r.last_seen)]))
          : toCsv(['First name', 'Last name', 'Email', 'Sessions', 'Last active'],
                  people.map((r) => [r.first_name, r.last_name, r.email, r.sessions, ago(r.last_seen)])));
      } else if (view === 'sessions' && person) {
        downloadCsv(`sessions_${slug(name(person))}.csv`, toCsv(
          ['Session ID', 'Started', 'Duration (s)', 'Screens', 'Taps', 'First screen', 'How it ended', 'Problems'],
          sessions.map((s) => [s.id, fmtDT(s.started_at), s.duration_s, s.screens, s.taps, screenName(s.first_screen), END_LABEL[s.ended_by], s.problems])
        ));
      } else if (view === 'timeline' && stepsQ.data) {
        downloadCsv(`session_${slug(sid || 'session')}.csv`, toCsv(
          ['Time', 'Seconds into session', 'Type', 'Step', 'Event', 'Screen'],
          stepsQ.data.steps.map((x) => [hms(x.at), x.offset_s, x.kind, stepLabel(x.event), x.event, screenName(x.screen)])
        ));
      }
    } catch (e) {
      console.error('User journeys download failed', e);
    } finally {
      setCsvBusy(false);
    }
  };

  const crumbs = (
    <div className="uj-crumbs">
      <button type="button" onClick={() => setView('users')}>All people</button>
      <span>›</span>
      {view === 'timeline' ? (
        <>
          <button type="button" onClick={() => setView('sessions')}>{name(person)}</button>
          <span>›</span>
          <span className="cur">Session {fmtDT(byTime.find((s) => s.id === sid)?.started_at)}</span>
        </>
      ) : (
        <span className="cur">{name(person)}</span>
      )}
    </div>
  );

  let body: React.ReactNode;

  /* ---------- level 1: people ---------- */
  if (view === 'users') {
    const data = peopleQ.data;
    const total = data?.meta.total ?? 0;
    const rows = data?.people || [];
    body = (
      <>
        <div className="uj-bar">
          <input
            type="search"
            placeholder={showSociety ? 'Search name, email, site ID or society…' : 'Search name or email…'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search people"
          />
          <span className="uj-count">
            {peopleQ.isLoading ? 'Loading…' : total ? `Showing ${fmtN(page * PER + 1)}–${fmtN(page * PER + rows.length)} of ${fmtN(total)}` : 'No matches'}
          </span>
          <button type="button" className="uj-btn" onClick={csvNow} disabled={csvBusy || !total}>
            {csvBusy ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
        {peopleQ.isError ? (
          <ErrorState error={peopleQ.error as Error} onRetry={() => peopleQ.refetch()} />
        ) : peopleQ.isLoading ? (
          <div className="uj-scroll"><TableSkeleton rows={8} cols={showSociety ? 7 : 5} /></div>
        ) : !rows.length ? (
          <div className="uj-empty">{search ? 'No people match this search.' : 'No signed-in people in this range and filters.'}</div>
        ) : (
          <>
            <div className="uj-scroll">
              <table className="uj-tbl">
                <thead>
                  <tr>
                    {th('First name', sortK === 'first_name', sortDir === 'asc', () => sortPeople('first_name'))}
                    {th('Last name', sortK === 'last_name', sortDir === 'asc', () => sortPeople('last_name'))}
                    {th('Email', sortK === 'email', sortDir === 'asc', () => sortPeople('email'))}
                    {showSociety && th('Site ID', sortK === 'society_id', sortDir === 'asc', () => sortPeople('society_id'))}
                    {showSociety && <th className="analytics-header">Society</th>}
                    {th('Sessions', sortK === 'sessions', sortDir === 'asc', () => sortPeople('sessions'), true)}
                    {th('Last active', sortK === 'last_active', sortDir === 'asc', () => sortPeople('last_active'), true)}
                    <th className="analytics-header uj-go" aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_key} tabIndex={0} onClick={() => openPerson(r)} onKeyDown={(e) => e.key === 'Enter' && openPerson(r)}>
                      <td className="uj-name">{r.first_name || '—'}</td>
                      <td className="uj-name">{r.last_name || '—'}</td>
                      <td className="uj-mail">{r.email || <span className="uj-nil">—</span>}</td>
                      {showSociety && <td><IdCell v={r.society_id} /></td>}
                      {showSociety && <td>{societyName(r.society_id) || <span className="uj-nil">—</span>}</td>}
                      <td className="num">{fmtN(r.sessions)}</td>
                      <td className="num">{ago(r.last_seen)}</td>
                      <td className="uj-go">›</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager n={total} page={page} onGo={setPage} />
          </>
        )}
        <div className="uj-note">
          <b>Live data.</b> Every signed-in person active in {range.toLowerCase().startsWith('last') ? `the ${range.toLowerCase()}` : range} with the
          filters above ({pageFilters}). A person is their user ID; their name and email are the
          latest the app sent. Sessions are grouped by the app&rsquo;s session ID. Click a person to see their sessions.
        </div>
      </>
    );
  } else if (view === 'sessions') {
    /* ---------- level 2: one person's sessions ---------- */
    const data = sessionsQ.data;
    const p = data?.person || person;
    const sum = data?.summary;
    const slice = sessions.slice(sesPage * PER, sesPage * PER + PER);
    const soc = societyName(p?.society_id);
    body = (
      <>
        {crumbs}
        {p && (
          <div className="uj-head">
            <div className="tt">
              <h3>{name(p)}</h3>
              <div className="ss">
                {[
                  p.email || null,
                  p.society_id ? <>Site ID <span className="uj-id">{p.society_id}</span></> : null,
                  soc,
                ]
                  .filter(Boolean)
                  .map((x, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <>&nbsp;·&nbsp; </>}
                      {x}
                    </React.Fragment>
                  ))}
                {p.phase && <> &nbsp;·&nbsp; <span className="uj-pill closed">{p.phase}</span></>}
              </div>
            </div>
          </div>
        )}
        {sessionsQ.isError ? (
          <ErrorState error={sessionsQ.error as Error} onRetry={() => sessionsQ.refetch()} />
        ) : sessionsQ.isLoading || !data ? (
          <div className="uj-scroll"><TableSkeleton rows={6} cols={7} /></div>
        ) : (
          <>
            <div className="uj-chips">
              <div className="uj-chip"><div className="k">Sessions</div><div className="v">{fmtN(sum?.sessions ?? 0)}</div></div>
              <div className="uj-chip"><div className="k">Screens opened</div><div className="v">{fmtN(sum?.screens ?? 0)}</div></div>
              <div className="uj-chip"><div className="k">Taps</div><div className="v">{fmtN(sum?.taps ?? 0)}</div></div>
              <div className="uj-chip"><div className="k">Average session</div><div className="v">{fmtDur(sum?.avg_duration_s ?? 0)}</div></div>
              <div className="uj-chip"><div className="k">Problems seen</div><div className="v">{fmtN(sum?.problems ?? 0)}</div></div>
            </div>
            <div className="uj-bar">
              <span className="uj-count" style={{ marginLeft: 0 }}>
                {range} &nbsp;·&nbsp; {fmtN(sessions.length)} sessions, newest first
              </span>
              <button type="button" className="uj-btn" style={{ marginLeft: 'auto' }} onClick={csvNow} disabled={csvBusy || !sessions.length}>
                Download CSV
              </button>
            </div>
            {!sessions.length ? (
              <div className="uj-empty">No sessions in this range and filters.</div>
            ) : (
              <>
                <div className="uj-scroll">
                  <table className="uj-tbl">
                    <thead>
                      <tr>
                        {th('Started', sesK === 'start', sesDir === 1, () => sortSessions('start'))}
                        {th('Duration', sesK === 'dur', sesDir === 1, () => sortSessions('dur'), true)}
                        {th('Screens', sesK === 'screens', sesDir === 1, () => sortSessions('screens'), true)}
                        {th('Taps', sesK === 'taps', sesDir === 1, () => sortSessions('taps'), true)}
                        {th('First screen', sesK === 'entry', sesDir === 1, () => sortSessions('entry'))}
                        {th('How it ended', sesK === 'end', sesDir === 1, () => sortSessions('end'))}
                        {th('Problems', sesK === 'errs', sesDir === 1, () => sortSessions('errs'), true)}
                        <th className="analytics-header uj-go" aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {slice.map((s) => (
                        <tr key={s.id} tabIndex={0} onClick={() => openSession(s.id)} onKeyDown={(e) => e.key === 'Enter' && openSession(s.id)}>
                          <td className="uj-name">{fmtDT(s.started_at)}</td>
                          <td className="num">{fmtDur(s.duration_s)}</td>
                          <td className="num">{s.screens}</td>
                          <td className="num">{s.taps}</td>
                          <td>{screenName(s.first_screen)}</td>
                          <td><EndPill e={s.ended_by} /></td>
                          <td className="num">{s.problems ? <span className="uj-prob">{s.problems}</span> : <span className="uj-nil">0</span>}</td>
                          <td className="uj-go">›</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager n={sessions.length} page={sesPage} onGo={setSesPage} />
              </>
            )}
            <div className="uj-note">
              <b>Check:</b> the session count here is the number in the Sessions column of the people table
              {p ? ` (${fmtN(p.sessions)})` : ''}, and the screens add up to {fmtN(sum?.screens ?? 0)}.
              {data.meta.truncated ? ` Only the newest ${fmtN(sessions.length)} sessions are listed.` : ''}
            </div>
          </>
        )}
      </>
    );
  } else {
    /* ---------- level 3: one session's steps ---------- */
    const data = stepsQ.data;
    const idx = byTime.findIndex((s) => s.id === sid);
    const row = idx >= 0 ? byTime[idx] : null;
    const steps: UserJourneyStep[] = data?.steps || [];
    const cnt = {
      all: steps.length,
      screen: steps.filter((x) => x.kind === 'screen').length,
      tap: steps.filter((x) => x.kind === 'tap').length,
      prob: steps.filter((x) => x.kind === 'problem').length,
    };
    const visible = steps.filter((x) => tf === 'all' || (tf === 'screen' && x.kind === 'screen') || (tf === 'tap' && x.kind === 'tap') || (tf === 'prob' && x.kind === 'problem'));
    const ending = data?.session.ended_by || row?.ended_by || null;
    const lastAt = steps.length ? steps[steps.length - 1].at : null;
    const endStep = ending && tf === 'all' && lastAt ? (
      <li className="uj-step k-end">
        <span className="tm">{ending === 'timeout' ? hms(new Date(new Date(lastAt).getTime() + 30 * 60_000).toISOString()) : hms(lastAt)}</span>
        <span className="rail"><i /></span>
        <div className="bd">
          <div className="lb">
            {ending === 'timeout' ? 'Session timed out after 30 min of inactivity'
              : ending === 'logout' ? 'Logged out'
              : ending === 'closed' ? 'App closed or sent to background'
              : 'Session still going'}
          </div>
          <div className="ev nt">
            {ending === 'timeout' ? 'worked out from a 30-minute gap after the last event'
              : ending === 'active' ? 'the last event was less than 30 minutes ago'
              : `from the event ${data?.session.end_event || row?.end_event || steps[steps.length - 1].event}`}
          </div>
        </div>
      </li>
    ) : null;
    body = (
      <>
        {crumbs}
        <div className="uj-head">
          <div className="tt">
            <h3>Session on {fmtDT(row?.started_at || data?.session.started_at)}</h3>
            <div className="ss">
              {name(person)}{person?.email ? <> &nbsp;·&nbsp; {person.email}</> : null} &nbsp;·&nbsp; <span className="uj-id">{sid}</span>
            </div>
          </div>
          <div className="uj-nav">
            <button type="button" className="uj-btn" disabled={idx < 0 || idx >= byTime.length - 1} onClick={() => openSession(byTime[idx + 1].id)}>
              ← Older session
            </button>
            <button type="button" className="uj-btn" disabled={idx <= 0} onClick={() => openSession(byTime[idx - 1].id)}>
              Newer session →
            </button>
          </div>
        </div>
        {stepsQ.isError ? (
          <ErrorState error={stepsQ.error as Error} onRetry={() => stepsQ.refetch()} />
        ) : stepsQ.isLoading || !data ? (
          <div className="uj-scroll"><TableSkeleton rows={8} cols={3} /></div>
        ) : (
          <>
            <div className="uj-chips">
              <div className="uj-chip"><div className="k">Duration</div><div className="v">{fmtDur(data.session.duration_s)}</div></div>
              <div className="uj-chip"><div className="k">Screens opened</div><div className="v">{cnt.screen}</div></div>
              <div className="uj-chip"><div className="k">Taps</div><div className="v">{cnt.tap}</div></div>
              <div className="uj-chip" style={{ minWidth: 210 }}>
                <div className="k">How it ended</div>
                <div className="v" style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{ending ? <EndPill e={ending} /> : '—'}</div>
              </div>
            </div>
            <div className="uj-bar">
              <div className="uj-seg" role="tablist" aria-label="Step type">
                {([['all', `All steps (${cnt.all})`], ['screen', `Screens (${cnt.screen})`], ['tap', `Taps (${cnt.tap})`], ['prob', `Problems (${cnt.prob})`]] as [StepFilter, string][]).map(([k, label]) => (
                  <button key={k} type="button" className={tf === k ? 'on' : ''} onClick={() => setTf(k)}>{label}</button>
                ))}
              </div>
              <span className="uj-count">{ending ? END_TEXT[ending] : ''}</span>
              <button type="button" className="uj-btn" onClick={csvNow} disabled={csvBusy || !steps.length}>Download CSV</button>
            </div>
            {!visible.length ? (
              <div className="uj-empty">{tf === 'prob' ? 'No problems in this session.' : 'No steps to show.'}</div>
            ) : (
              <ol className="uj-tl">
                {visible.map((x, i) => {
                  const kind = x.kind === 'problem' ? 'result' : x.kind === 'event' || x.kind === 'system' ? 'sys' : x.kind;
                  return (
                    <li key={`${x.at}-${i}`} className={`uj-step k-${kind}${x.kind === 'problem' ? ' f-error' : ''}`}>
                      <span className="tm">{hms(x.at)}</span>
                      <span className="rail"><i /></span>
                      <div className="bd">
                        <div className="lb">
                          {stepLabel(x.event)}
                          {x.kind === 'problem' && <span className="uj-flag error">Problem</span>}
                        </div>
                        <div className="ev">{x.event}{x.screen ? ` · ${screenName(x.screen)}` : ''}</div>
                      </div>
                    </li>
                  );
                })}
                {endStep}
              </ol>
            )}
            <div className="uj-note">
              <b>Check:</b> this session has {cnt.screen} screens and {cnt.tap} taps
              {row ? `, the same as the row you clicked (${row.screens} and ${row.taps})` : ''}. A session ends in one of three ways:
              the person logs out, the app is closed or sent to the background, or 30 minutes pass with no activity.
              {data.meta.truncated ? ` Only the first ${fmtN(steps.length)} steps are shown.` : ''}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <Card id="card-userJourneys" eyebrow="Person, session and step" title="User journeys" style={{ marginTop: '12px' }} className="uj-card">
      <div className="uj-root">
        <p className="uj-desc">
          Pick a person to see each of their sessions, then every screen and tap inside a session. Not filtered by the module chosen above.
        </p>
        {body}
      </div>
    </Card>
  );
};
