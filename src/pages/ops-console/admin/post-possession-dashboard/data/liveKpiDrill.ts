import type { DrillContent } from '../types';
import type { EndpointResults, PostPossessionTab } from '../api';
import { asArr, asRec, card, empty, errorBlock, esc, isRec, note, num, row, section, type Rec } from './liveChipDrill';

/**
 * KPI-card drill panels, built from the same API responses the card reads. The top-strip cards use
 * overview/kpi-cards (top_strip + the per-module sections); cards inside a tab use that tab's own
 * endpoints, rendered generically so every value the API returns is shown.
 */

/** Drill keys that already have a richer live panel via the filter chips. */
export const CHIP_BY_DRILL_KEY: Record<string, string> = {
  resp_breach: 'rb',
  vis_pending: 'pv',
  members_pending: 'cp',
  fitout_pending: 'fp',
  staff_gap: 'we',
  proactive: 'po',
};

export interface KpiDrillSource {
  tab: PostPossessionTab;
  endpoints: string[];
  title: string;
  /** Custom builder for the top-strip cards */
  strip?: 'csat' | 'tickets' | 'visitors' | 'club' | 'fitout';
  /** Tower row from all-towers/summary */
  tower?: string;
}

const SECURITY_KPIS: Pick<KpiDrillSource, 'tab' | 'endpoints'> = { tab: 'security', endpoints: ['kpis'] };
const FITOUT_ALL: Pick<KpiDrillSource, 'tab' | 'endpoints'> = {
  tab: 'fitout',
  endpoints: ['kpis', 'outcomes', 'typeDeviation'],
};

const STATIC_SOURCES: Record<string, KpiDrillSource> = {
  possession_csat: { tab: 'overview', endpoints: ['kpis'], title: 'Possession CSAT', strip: 'csat' },
  tickets_all: { tab: 'overview', endpoints: ['kpis'], title: 'Total Tickets', strip: 'tickets' },
  vis_today: { tab: 'overview', endpoints: ['kpis'], title: 'Visitors Today', strip: 'visitors' },
  members_all: { tab: 'overview', endpoints: ['kpis'], title: 'Club Members', strip: 'club' },
  res_breach: { tab: 'helpdesk', endpoints: ['kpis'], title: 'Resolution Breached' },
  vis_pre_approved: { ...SECURITY_KPIS, title: 'Pre-Approved Visitors' },
  vis_post_approved: { ...SECURITY_KPIS, title: 'Post-Approved Visitors' },
  vis_rejected: { ...SECURITY_KPIS, title: 'Rejected Visitors' },
  patrol: { tab: 'security', endpoints: ['kpis', 'patrolAndFlagged'], title: 'Patrol Compliance' },
  patrol_incident_1: { tab: 'security', endpoints: ['patrolAndFlagged'], title: 'Missed Patrol Incidents' },
  patrol_incident_2: { tab: 'security', endpoints: ['patrolAndFlagged'], title: 'Missed Patrol Incidents' },
  vehicles_today: { tab: 'security', endpoints: ['vehicleKpis'], title: 'Vehicles Today' },
  vehicles_member: { tab: 'security', endpoints: ['vehicleKpis'], title: 'Member Vehicles' },
  vehicles_guest: { tab: 'security', endpoints: ['vehicleKpis'], title: 'Guest Vehicles' },
  vehicles_peak: { tab: 'security', endpoints: ['vehicleKpis', 'purposeGateAndVehicles'], title: 'Peak-Hour Vehicles' },
  staff_scheduled: { tab: 'staff', endpoints: ['kpis', 'coverage'], title: 'Scheduled Staff' },
  staff_present: { tab: 'staff', endpoints: ['kpis', 'coverage'], title: 'Staff Present' },
  staff_absent: { tab: 'staff', endpoints: ['kpis', 'coverage'], title: 'Staff Absent' },
  expired_mem: { tab: 'club', endpoints: ['kpis', 'membershipBreakdown'], title: 'Expired Memberships' },
  expiring_mem: { tab: 'club', endpoints: ['slotsAndExpiring'], title: 'Memberships Expiring' },
  bookings_today: { tab: 'club', endpoints: ['slotsAndExpiring'], title: 'Bookings Today' },
  payments_cls: { tab: 'club', endpoints: ['kpis'], title: 'Club Payments' },
  failed_payments: { tab: 'club', endpoints: ['kpis'], title: 'Failed Payments' },
  fitout_all: { ...FITOUT_ALL, title: 'Fitout Requests' },
  fitout_created_by: { ...FITOUT_ALL, title: 'Fitout Requests by Creator' },
  fitout_deviations: { ...FITOUT_ALL, title: 'Fitout Deviations' },
  fitout_movein: { ...FITOUT_ALL, title: 'Move-In Requests' },
  fitout_rejection_rate: { ...FITOUT_ALL, title: 'Fitout Rejection Rate' },
  fitout_deposit_held: { ...FITOUT_ALL, title: 'Deposit Held' },
  fitout_refund_due: { ...FITOUT_ALL, title: 'Refund Due' },
  fitout_compliance: { tab: 'fitout', endpoints: ['pendingCompliance'], title: 'Fitout Compliance' },
  fitout_req_det: { tab: 'fitout', endpoints: ['pendingCompliance'], title: 'Fitout Request' },
  parking_all: { tab: 'parking', endpoints: ['kpis', 'breakdown'], title: 'Parking' },
  parking_type: { tab: 'parking', endpoints: ['kpis', 'breakdown'], title: 'Parking Types' },
  parking_mismatch: { tab: 'parking', endpoints: ['kpis', 'breakdown'], title: 'Parking Data Quality' },
  parking_slot_det: { tab: 'parking', endpoints: ['kpis', 'breakdown'], title: 'Parking Slot' },
  notices: { tab: 'community', endpoints: ['kpis'], title: 'Notices' },
  events: { tab: 'community', endpoints: ['kpis'], title: 'Events' },
  polls: { tab: 'community', endpoints: ['kpis', 'pollsNotifications'], title: 'Polls' },
  notifications: { tab: 'community', endpoints: ['pollsNotifications'], title: 'Notifications' },
  quarantine: { tab: 'community', endpoints: ['quarantineDirectory'], title: 'Quarantine' },
  directory_all: { tab: 'community', endpoints: ['quarantineDirectory'], title: 'Business Directory' },
  app_adoption: { tab: 'community', endpoints: ['appAdoption'], title: 'App Adoption' },
};

export function resolveKpiDrill(key: string): KpiDrillSource | null {
  if (STATIC_SOURCES[key]) return STATIC_SOURCES[key];
  if (key.startsWith('tower_')) {
    return {
      tab: 'allTowers',
      endpoints: ['summary'],
      title: 'Tower breakdown',
      tower: key.slice('tower_'.length),
    };
  }
  return null;
}

const humanize = (key: string) =>
  key
    .replace(/_percent$/, ' %')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const SKIP_KEYS = new Set(['filters', 'window', 'trend_compared_with']);

function scalar(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return num(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

/** Show every value of an API response: scalars as rows, objects as sections, lists as cards. */
function renderGeneric(data: unknown, depth = 0): string {
  const record = asRec(data);
  const rows: string[] = [];
  const blocks: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEYS.has(key)) continue;
    if (key === 'global_notes' || key === 'notes') continue;
    if (isRec(value)) {
      if (value.available === false) {
        rows.push(row(humanize(key), 'Data Not Available'));
        if (value.reason) blocks.push(note(value.reason));
      } else if (depth < 2) {
        const inner = renderGeneric(value, depth + 1);
        if (inner) blocks.push(section(humanize(key), inner));
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        blocks.push(section(humanize(key), empty('No records.')));
      } else if (value.every((v) => !isRec(v))) {
        rows.push(row(humanize(key), value.map(scalar).join(', ')));
      } else {
        const cards = value.slice(0, 15).map((item) => {
          const rec = asRec(item);
          const title =
            rec.name ?? rec.title ?? rec.tower ?? rec.category ?? rec.type ?? rec.status ?? rec.label ?? rec.plan ?? rec.id ?? 'Item';
          const meta = Object.entries(rec)
            .filter(([k, v]) => v !== null && typeof v !== 'object' && v !== title && k !== 'id')
            .map(([k, v]) => `${humanize(k)}: ${scalar(v)}`)
            .join(' · ');
          return card(String(title), meta);
        });
        blocks.push(section(humanize(key), cards.join('') + (value.length > 15 ? empty(`+ ${value.length - 15} more`) : '')));
      }
    } else {
      rows.push(row(humanize(key), scalar(value)));
    }
  }
  return rows.join('') + blocks.join('');
}

function footnotes(...sources: unknown[]): string {
  return sources
    .flatMap((source) => {
      const rec = asRec(source);
      const notes = asRec(rec.global_notes ?? rec.notes);
      return Object.values(notes).filter((v): v is string => typeof v === 'string');
    })
    .map((text) => note(text))
    .join('');
}

function buildStrip(kind: NonNullable<KpiDrillSource['strip']>, kpis: Rec): DrillContent {
  const strip = asRec(kpis.top_strip);
  const notes = asRec(kpis.notes);
  switch (kind) {
    case 'csat': {
      const csat = asRec(strip.possession_csat);
      const available = csat.available !== false;
      return {
        t: 'Possession CSAT',
        s: available ? 'Resident possession survey' : 'Data Not Available',
        b:
          section(
            'Status',
            available
              ? Object.entries(csat).map(([k, v]) => row(humanize(k), scalar(v))).join('')
              : row('Possession CSAT', 'Data Not Available', '--amb')
          ) + (csat.reason ? note(csat.reason) : ''),
      };
    }
    case 'tickets': {
      const t = asRec(strip.total_tickets);
      const h = asRec(kpis.helpdesk);
      return {
        t: `${num(t.total)} Total Tickets`,
        s: `${num(t.open)} open · ${num(t.in_progress)} in progress`,
        b: section(
          'Ticket status',
          row('Total tickets', t.total) +
            row('Open', t.open, '--amb') +
            row('In progress', t.in_progress) +
            row('Closed', h.closed_tickets, '--for')
        ) + section('Response SLA', row('Response breached', h.response_breached, '--crim')),
      };
    }
    case 'visitors': {
      const v = asRec(strip.visitors_today);
      const sec = asRec(kpis.security);
      const patrol = asRec(sec.patrol_compliance);
      return {
        t: `${num(v.total)} Visitors Today`,
        s: `${num(v.in)} in · ${num(v.out)} out`,
        b:
          section(
            'Visitor traffic',
            row('Visitors today', v.total) + row('In', v.in, '--for') + row('Out', v.out) +
              row('Pending post approval', sec.pending_post_approval, '--amb')
          ) +
          section(
            'Patrol compliance',
            patrol.available === false ? row('Patrol compliance', 'Data Not Available') : row('Patrol compliance', patrol.compliance_percent)
          ) +
          (patrol.available === false && patrol.reason ? note(patrol.reason) : '') +
          note(notes.visitors),
      };
    }
    case 'club': {
      const c = asRec(strip.club_active);
      const f = asRec(kpis.club_facilities);
      return {
        t: `${num(c.active)} of ${num(c.total)} Club Members Active`,
        s: `${num(c.pending_activation)} pending activation`,
        b:
          section(
            'Membership',
            row('Active members', f.active_members ?? c.active, '--for') + row('Total members', f.total_members ?? c.total) +
              row('Pending activation', f.pending_members ?? c.pending_activation, '--amb')
          ) +
          section(
            'Facility slots today',
            row('Booked today', f.facility_slots_booked_today) + row('Total slots today', f.facility_slots_today) +
              row('Vacant today', f.vacant_slots_today)
          ) +
          note(notes.club_pending),
      };
    }
    case 'fitout': {
      const p = asRec(strip.fitout_pending);
      const f = asRec(kpis.fitout);
      const buckets = asRec(f.status_buckets);
      return {
        t: `${num(p.pending)} Fitout Requests Pending`,
        s: `${num(p.closed_this_month)} closed this month`,
        b:
          section(
            'Requests',
            row('Total requests', f.total_requests) + row('Pending', f.pending, '--amb') + row('Closed', f.closed, '--for') +
              row('Open deviations', f.open_deviations, '--crim')
          ) +
          section('By status', Object.entries(buckets).map(([k, v]) => row(humanize(k), v)).join('')) +
          note(notes.fitout_status),
      };
    }
  }
}

function findTower(summary: Rec, key: string): Rec | null {
  const wanted = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    asArr(summary.towers)
      .map(asRec)
      .find((t) => String(t.tower_name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === wanted) ?? null
  );
}

export function buildKpiDrill(
  key: string,
  source: KpiDrillSource,
  results: Record<string, EndpointResults>
): DrillContent {
  const tabResults = results[source.tab] ?? {};
  const all = Object.entries(tabResults);
  const failed = all.find(([, r]) => r.error && !r.data);
  if (all.length > 0 && all.every(([, r]) => !r.data)) return errorBlock(failed?.[1].error ?? 'The request failed.');

  if (source.strip) {
    const kpis = asRec(tabResults.kpis?.data);
    if (!kpis.top_strip) return errorBlock('No data returned for this card.');
    return buildStrip(source.strip, kpis);
  }

  if (source.tower !== undefined) {
    const summary = asRec(tabResults.summary?.data);
    const tower = findTower(summary, source.tower);
    if (!tower) return errorBlock('This tower is not in the current window.');
    const dims = asArr(tower.dimensions_used);
    return {
      t: `Tower ${tower.tower_name} — Composite ${scalar(tower.composite)}`,
      s: `Rank ${scalar(tower.rank)} of ${asArr(summary.towers).length}${tower.trend ? ` · ${tower.trend}` : ''}`,
      b:
        section('Dimensions used', dims.length ? dims.map((d) => row(humanize(String(d)), '✓')).join('') : empty('No dimensions had data.')) +
        renderGeneric(
          Object.fromEntries(
            Object.entries(tower).filter(([k]) => !['tower_id', 'tower_name', 'composite', 'rank', 'trend', 'dimensions_used'].includes(k))
          )
        ) +
        footnotes(summary),
    };
  }

  const body = all.map(([name, r]) => (r.data ? section(humanize(name), renderGeneric(r.data)) : '')).join('') +
    footnotes(...all.map(([, r]) => r.data));
  return {
    t: source.title,
    s: 'Live data for the selected period',
    b: body || section('No data', empty('The API returned no values for this card.')),
  };
}
