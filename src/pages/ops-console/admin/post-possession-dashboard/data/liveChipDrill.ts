import type { DrillContent } from '../types';
import type { EndpointResults, PostPossessionTab } from '../api';

/**
 * Filter chip -> API mapping (per the dashboard API spec):
 *  - every chip's count comes from overview/kpi-cards (top_strip.*)
 *  - the detail list / breakdown comes from the chip's own endpoint
 */
export interface ChipSource {
  tab: PostPossessionTab;
  endpoints: string[];
}

export const CHIP_SOURCES: Record<string, ChipSource[]> = {
  rb: [
    { tab: 'overview', endpoints: ['kpis'] },
    { tab: 'helpdesk', endpoints: ['escalations'] },
  ],
  pv: [
    { tab: 'overview', endpoints: ['kpis'] },
    { tab: 'security', endpoints: ['patrolAndFlagged'] },
  ],
  cp: [
    { tab: 'overview', endpoints: ['kpis'] },
    { tab: 'club', endpoints: ['membershipBreakdown'] },
  ],
  fp: [
    { tab: 'overview', endpoints: ['kpis'] },
    { tab: 'fitout', endpoints: ['pendingCompliance'] },
  ],
  we: [{ tab: 'staff', endpoints: ['coverage'] }],
  po: [{ tab: 'helpdesk', endpoints: ['kpis'] }],
};

export type Rec = Record<string, unknown>;

export const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
export const asRec = (v: unknown): Rec => (isRec(v) ? v : {});
export const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const num = (v: unknown): string =>
  typeof v === 'number' && Number.isFinite(v)
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(v)
    : v === null || v === undefined || v === ''
      ? '—'
      : esc(v);

export const row = (label: string, value: unknown, color?: string) =>
  `<div class="drow"><span class="dl">${esc(label)}</span><span class="dv"${color ? ` style="color:var(${color})"` : ''}>${typeof value === 'number' ? num(value) : esc(value ?? '—')}</span></div>`;

export const section = (title: string, inner: string) =>
  `<div class="dsec"><div class="dst">${esc(title)}</div>${inner}</div>`;

export const note = (text: unknown) =>
  text
    ? `<div style="font-size:11px;line-height:1.7;background:var(--surface);padding:10px;border-radius:8px;margin-bottom:14px">${esc(text)}</div>`
    : '';

export const empty = (text: string) =>
  `<div style="font-size:11px;line-height:1.7;color:var(--sto);padding:6px 0">${esc(text)}</div>`;

export const card = (title: string, sub: string) =>
  `<div class="dflat"><div><div class="dflat-tower" style="font-size:13px">${esc(title)}</div><div class="dflat-res">${esc(sub)}</div></div></div>`;

export const fmtDate = (v: unknown): string => {
  if (typeof v !== 'string' || !v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const unavailable = (v: unknown): string | null =>
  isRec(v) && v.available === false ? String(v.reason ?? 'Data not available') : null;

export const errorBlock = (message: string): DrillContent => ({
  t: 'Could not load data',
  s: 'The API request failed',
  b: section('Error', note(message)),
});

function firstError(results: EndpointResults[]): string | null {
  for (const endpoints of results) {
    for (const result of Object.values(endpoints)) {
      if (result.error) return result.error;
    }
  }
  return null;
}

/** Build the drill-panel content for a chip from its mapped API responses. */
export function buildChipDrill(
  chipKey: string,
  results: Record<string, EndpointResults>
): DrillContent {
  const overviewKpis = asRec(results.overview?.kpis?.data);
  const strip = asRec(overviewKpis.top_strip);
  const err = firstError(Object.values(results));
  const needsStrip = chipKey !== 'we' && chipKey !== 'po';
  if (err && (needsStrip ? !overviewKpis.top_strip : true) && !Object.values(results).some((r) => Object.values(r).some((x) => x.data))) {
    return errorBlock(err);
  }

  switch (chipKey) {
    case 'rb': {
      const rb = asRec(strip.response_breached);
      const esc2 = asRec(results.helpdesk?.escalations?.data);
      const levels = asRec(esc2.escalation_levels);
      const exec = asRec(esc2.executive_escalation);
      const total = Number(rb.total ?? 0);
      const count = Number(rb.count ?? 0);
      return {
        t: `${num(rb.count)} Response Escalation Breaches`,
        s: `${num(rb.breach_rate_percent)}% of ${num(rb.total)} tickets breached first-response SLA`,
        b:
          section(
            'Scale of problem',
            row('Total tickets', rb.total) +
              row('Response breached', `${num(rb.count)} (${num(rb.breach_rate_percent)}%)`, '--crim') +
              row('Response achieved', total ? `${num(total - count)} (${num(Math.round(((total - count) / total) * 1000) / 10)}%)` : '—', '--for')
          ) +
          section(
            'Escalation levels',
            row('Tickets escalated', levels.total_tickets) +
              asArr(levels.levels)
                .map((l) => row(String(asRec(l).level ?? '').toUpperCase(), asRec(l).tickets))
                .join('') || empty('No escalation data.')
          ) +
          section(
            'Executive escalation',
            row('Open', exec.open) + row('Closed', exec.closed) + row('Avg days to close', exec.avg_days_to_close)
          ),
      };
    }

    case 'pv': {
      const pv = asRec(strip.pending_post_approval);
      const flagged = asRec(asRec(results.security?.patrolAndFlagged?.data).denied_and_flagged);
      const items = asArr(flagged.items).map(asRec);
      return {
        t: `${num(pv.count)} Visitors Pending Post Approval`,
        s: `${num(pv.waiting_70_plus_min)} waiting 70+ min`,
        b:
          section(
            'Scale of problem',
            row('Pending post approval', pv.count, '--amb') + row('Waiting 70+ min', pv.waiting_70_plus_min, '--crim')
          ) +
          section(
            `Denied & flagged visitors (${num(flagged.total ?? items.length)})`,
            items.length
              ? items
                  .map((item) => {
                    const title = String(item.guest_name ?? item.name ?? item.visitor_name ?? `Visitor #${item.id ?? ''}`);
                    const details = Object.entries(item)
                      .filter(([k, v]) => !['guest_name', 'name', 'visitor_name', 'id'].includes(k) && v !== null && typeof v !== 'object')
                      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${/_at$|date|time/.test(k) ? fmtDate(v) || v : v}`)
                      .join(' · ');
                    return card(title, details);
                  })
                  .join('')
              : empty('No denied or flagged visitors.')
          ) +
          note(flagged.note),
      };
    }

    case 'cp': {
      const club = asRec(strip.club_active);
      const data = asRec(results.club?.membershipBreakdown?.data);
      const statuses = asArr(data.member_status_chart).map(asRec);
      const plans = asArr(data.plan_dist_chart).map(asRec);
      const facilityTypes = asArr(data.facility_type_chart).map(asRec);
      const notes = asRec(data.global_notes);
      return {
        t: `${num(club.pending_activation)} Club Members Pending Activation`,
        s: `${num(club.active)} active of ${num(club.total)} members`,
        b:
          section(
            'Scale of problem',
            row('Pending activation', club.pending_activation, '--amb') + row('Active', club.active, '--for') + row('Total members', club.total)
          ) +
          section(
            'Member status',
            statuses.length ? statuses.map((s) => row(String(s.status), `${num(s.count)} (${num(s.percent)}%)`)).join('') : empty('No member data.')
          ) +
          section(
            'Plan distribution',
            plans.length ? plans.map((p) => row(String(p.plan), `${num(p.count)} (${num(p.percent)}%)`)).join('') : empty('No plan data.')
          ) +
          section(
            'Facilities',
            facilityTypes.length
              ? facilityTypes
                  .map((f) =>
                    card(
                      `${f.type} · ${asArr(f.facilities).join(', ') || 'None'}`,
                      `${num(f.confirmed_this_month)} confirmed · ${num(f.pending_this_month)} pending this month`
                    )
                  )
                  .join('')
              : empty('No facility data.')
          ) +
          note(notes.member_status_chart),
      };
    }

    case 'fp': {
      const fp = asRec(strip.fitout_pending);
      const data = asRec(results.fitout?.pendingCompliance?.data);
      const seen = new Set<string>();
      const requests = asArr(data.pending_requests)
        .map(asRec)
        .filter((r) => {
          const key = `${r.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      const checklist = asArr(data.compliance_checklist).map(asRec);
      return {
        t: `${num(fp.pending)} Fitout Requests Pending`,
        s: `${num(fp.closed_this_month)} closed this month`,
        b:
          section('Scale of problem', row('Pending', fp.pending, '--amb') + row('Closed this month', fp.closed_this_month, '--for')) +
          section(
            `Pending requests (${requests.length})`,
            requests.length
              ? requests
                  .map((r) =>
                    card(
                      `${r.tower ?? '—'} · ${r.flat ?? '—'} · ${r.resident ?? ''}`,
                      [
                        r.type,
                        r.status,
                        r.requested_at ? `Requested ${fmtDate(r.requested_at)}` : '',
                        r.contractor ? `Contractor: ${r.contractor}` : '',
                        r.expiry_date ? `Expiry ${fmtDate(r.expiry_date)}` : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    )
                  )
                  .join('')
              : empty('No pending fitout requests.')
          ) +
          section(
            'Compliance checklist',
            checklist.length
              ? checklist
                  .map((c) =>
                    row(
                      `${c.tower ?? ''} ${c.flat ?? ''} · ${c.resident ?? ''}`,
                      `${num(c.completed)}/${num(c.total)} (${num(c.completion_percent)}%)`,
                      Number(c.completion_percent) >= 100 ? '--for' : '--amb'
                    )
                  )
                  .join('')
              : empty('No compliance data.')
          ) +
          note(asRec(data.global_notes).pending_requests),
      };
    }

    case 'we': {
      const data = asRec(results.staff?.coverage?.data);
      const categories = asArr(data.staff_category_chart).map(asRec);
      const shifts = asArr(data.shift_coverage_chart).map(asRec);
      const evening = shifts.find((s) => String(s.shift).toLowerCase() === 'evening');
      const gap = evening && evening.scheduled === null ? null : evening ? Number(evening.scheduled) - Number(evening.present) : null;
      const notes = asRec(data.global_notes);
      return {
        t: 'Staff Coverage Gap',
        s: gap === null ? 'Evening shift gap cannot be calculated' : `Evening shift gap: ${num(gap)}`,
        b:
          section(
            'Evening shift gap',
            row('evening_shift_gap', gap === null ? 'null' : gap, '--amb') +
              note("No staff roster or shift data is linked to society staff, so a coverage gap can't be calculated.")
          ) +
          section(
            'Shift coverage',
            shifts.length ? shifts.map((s) => row(String(s.shift), `Present ${num(s.present)} · Scheduled ${num(s.scheduled)}`)).join('') : empty('No shift data.')
          ) +
          section(
            'Staff by category',
            categories.length
              ? categories.map((c) => row(String(c.category), `Present ${num(c.present)} · On record ${num(c.active_staff_on_record)}`)).join('')
              : empty('No staff data.')
          ) +
          note(notes.shift_coverage_chart),
      };
    }

    case 'po': {
      const kpis = asRec(results.helpdesk?.kpis?.data);
      const proactive = asRec(kpis.proactive_tickets);
      return {
        t: `${num(proactive.count)} Proactive Tickets`,
        s: `${num(proactive.percent)}% of ${num(kpis.total_tickets)} tickets`,
        b:
          section(
            'Proactive vs reactive',
            row('Proactive tickets', proactive.count, '--for') +
              row('Proactive share', `${num(proactive.percent)}%`) +
              row('Reactive tickets', proactive.reactive) +
              row('Target', `${num(proactive.target_percent)}%`)
          ) +
          note("Only the proactive ticket count and percentage are available — there's no \"show only proactive tickets\" filter."),
      };
    }

    default:
      return errorBlock('No API mapping for this filter.');
  }
}

export { unavailable };
