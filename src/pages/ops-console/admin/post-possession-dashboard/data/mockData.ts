import {
  Car,
  ClipboardList,
  HardHat,
  LayoutDashboard,
  Megaphone,
  Shield,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  DashboardEvent,
  DirectoryVendor,
  FilterChipConfig,
  KpiStripItem,
  TabConfig,
} from '../types';
import { PP_PALETTE } from '../charts/chartPalette';

export const SOCIETY_NAME = 'Veda Gardens';
export const SOCIETY_SUBTITLE = 'Post Possession · 4 Towers';
export const USER_INITIALS = 'KD';

export const TOWER_FILTERS = ['All', 'FM', 'T1', 'T2', 'T3'];

export const TABS: TabConfig[] = [
  { id: 't-lb', label: 'All Towers', icon: Trophy, badge: '1', badgeVariant: 'a' },
  { id: 't-ov', label: 'Overview', icon: LayoutDashboard },
  { id: 't-op', label: 'Helpdesk', icon: ClipboardList, badge: '14' },
  { id: 't-sc', label: 'Security', icon: Shield, badge: '18', badgeVariant: 'a' },
  { id: 't-st', label: 'Staff', icon: UserCheck, badge: '5', badgeVariant: 'a' },
  { id: 't-cl', label: 'Club & Facilities', icon: Users, badge: '78' },
  { id: 't-ft', label: 'Fitout', icon: HardHat, badge: '24', badgeVariant: 'a' },
  { id: 't-pk', label: 'Parking', icon: Car, badge: '1', badgeVariant: 'a' },
  { id: 't-co', label: 'Community', icon: Megaphone },
];

export const KPI_STRIP: KpiStripItem[] = [
  {
    id: 'csat',
    label: 'Possession CSAT',
    value: '3.9',
    suffix: '/5',
    trend: '↓ Timeliness declining (3.1)',
    trendClass: 'wa',
    alertClass: 'alert-a',
    tabId: 't-ov',
    drillKey: 'possession_csat',
  },
  {
    id: 'tickets',
    label: 'Total Tickets',
    value: '59',
    trend: '↑ 49 open · 8 in progress',
    trendClass: 'up',
    alertClass: 'alert-r',
    tabId: 't-op',
    drillKey: 'tickets_all',
  },
  {
    id: 'resp',
    label: 'Response Breached',
    value: '42',
    suffix: '/59',
    trend: '↑ 71% breach rate',
    trendClass: 'dn',
    alertClass: 'alert-r',
    tabId: 't-op',
    drillKey: 'resp_breach',
  },
  {
    id: 'visitors',
    label: 'Visitors Today',
    value: '234',
    trend: '→ 118 in · 116 out',
    trendClass: 'ok',
    alertClass: 'alert-g',
    tabId: 't-sc',
    drillKey: 'vis_today',
  },
  {
    id: 'pending-vis',
    label: 'Pending Post Approval',
    value: '18',
    trend: '↑ 1 waiting 70+ min',
    trendClass: 'up',
    alertClass: 'alert-a',
    tabId: 't-sc',
    drillKey: 'vis_pending',
  },
  {
    id: 'club',
    label: 'Club Active',
    value: '15',
    suffix: '/117',
    trend: '↓ 78 pending activation',
    trendClass: 'dn',
    alertClass: 'alert-r',
    tabId: 't-cl',
    drillKey: 'members_all',
  },
  {
    id: 'fitout',
    label: 'Fitout Pending',
    value: '24',
    trend: '→ 0 closed this month',
    trendClass: 'dn',
    alertClass: 'alert-r',
    tabId: 't-ft',
    drillKey: 'fitout_pending',
  },
];

export const FILTER_CHIPS: FilterChipConfig[] = [
  { key: 'rb', label: 'Response Breached', chipClass: 'qc-rb', tabId: 't-op', drillKey: 'resp_breach', flashId: 'resp_breach_section' },
  { key: 'pv', label: 'Pending Post Approval', chipClass: 'qc-pv', tabId: 't-sc', drillKey: 'vis_pending' },
  { key: 'cp', label: 'Club Pending', chipClass: 'qc-cp', tabId: 't-cl', drillKey: 'members_pending' },
  { key: 'fp', label: 'Fitout Pending', chipClass: 'qc-fp', tabId: 't-ft', drillKey: 'fitout_pending' },
  { key: 'we', label: 'Staff Coverage Gap', chipClass: 'qc-we', tabId: 't-st', drillKey: 'staff_gap' },
  { key: 'po', label: 'Proactive Only', chipClass: 'qc-po', tabId: 't-op', drillKey: 'proactive' },
];

export const EVENTS: DashboardEvent[] = [
  { t: '08:12', title: 'Response escalation breached — Ticket #S010-10045', sub: 'Electrical, Apartment · Assigned to Anya Pande · Mobile · Still Work in Progress', domain: 'Helpdesk', color: PP_PALETTE.crim, drill: 'resp_breach' },
  { t: '09:03', title: 'Visitor pending Post Approval 70+ min — Gate, today', sub: 'Status: Pending · Guest type: Guest · Host not responding', domain: 'Security', color: PP_PALETTE.amb, drill: 'vis_pending' },
  { t: '09:42', title: 'Wrong Entry attempt logged at gate', sub: 'Visitor bypassed approval flow entirely · Gate team notified', domain: 'Security', color: PP_PALETTE.crim, drill: 'vis_today' },
  { t: '10:15', title: 'Fitout request #2867 pending review — T1-201', sub: 'FIT OUT REQUEST FOR WORK · Contractor: AJ GROUP · Requested 29 Apr 2026', domain: 'Fitout', color: PP_PALETTE.vio, drill: 'fitout_req_det' },
  { t: '10:58', title: 'Club membership payment received — ₹2,124', sub: 'ClubMember · SUCCESS · Transaction UPI23423-TXN', domain: 'Club', color: PP_PALETTE.for, drill: 'payments_cls' },
  { t: '11:20', title: 'Evening shift flagged as understaffed for today', sub: '3 staff short vs schedule · Overlaps 5–7 PM visitor peak', domain: 'Staff', color: PP_PALETTE.crim, drill: 'staff_gap' },
  { t: '12:05', title: '2 patrol checkpoints missed — Gate 3, Sector B', sub: '22 of 24 completed today · Same guard on both misses', domain: 'Security', color: PP_PALETTE.amb, drill: 'patrol' },
  { t: '13:40', title: 'Membership expiring — Ajay Ghenand, Summer Plan', sub: 'Expiry 8 May 2026 · Already overdue for renewal outreach', domain: 'Club', color: PP_PALETTE.amb, drill: 'expiring_mem' },
  { t: '14:22', title: 'Failed payment — ₹1,000, Govind Patil, ClubMember', sub: 'Transaction failure · Needs manual follow-up', domain: 'Club', color: PP_PALETTE.crim, drill: 'failed_payments' },
  { t: '15:10', title: 'Resident-raised fitout request stuck 6 days — #2803', sub: 'kumar latpate · T1-201 · No contractor assigned yet', domain: 'Fitout', color: PP_PALETTE.vio, drill: 'fitout_req_det' },
  { t: '16:05', title: 'Poll "Kids Play Area Poll" closed with 0 votes', sub: 'Shared with All · No resident engagement recorded', domain: 'Community', color: PP_PALETTE.amb, drill: 'polls' },
  { t: '17:30', title: 'Gate 1 (Komal Gate) crossed 60% of daily volume by 5:30 PM', sub: 'Highest single-gate share today · Peak window starting', domain: 'Security', color: PP_PALETTE.sky, drill: 'patrol' },
  { t: '18:15', title: 'Structural deviation still open 8 days — A-204 equivalent unit', sub: 'Load-bearing modification without approval · Stop-work recommended', domain: 'Fitout', color: PP_PALETTE.crim, drill: 'fitout_deviations' },
  { t: '19:02', title: 'Large facility payment confirmed — Banquet Hall, ₹2,000', sub: 'FacilityBooking · SUCCESS · Komal Demo', domain: 'Club', color: PP_PALETTE.for, drill: 'bookings_today' },
];

export const DIRECTORY: DirectoryVendor[] = [
  { company: 'SafeGuard Security Solutions 2', cat: 'Interior Painting · Laundry', status: 'Inactive' },
  { company: 'Lockated', cat: 'Milk Supply · Milk Product Supplier', status: 'Active' },
  { company: 'Lockated', cat: 'Milk Supply · Milk Product Supplier', status: 'Inactive' },
  { company: 'New', cat: 'Interior Painting · All Types Of Painting Work', status: 'Active' },
  { company: 'Regal Super Market', cat: 'Grocery Supplier · Grocery Store', status: 'Active' },
  { company: 'title', cat: 'Interior Painting · All Types Of Painting Work', status: 'Active' },
];

export const TOWER_TICKET_BARS = [
  { n: 'FM', v: 22, c: PP_PALETTE.coral },
  { n: 'T1', v: 18, c: PP_PALETTE.vio },
  { n: 'T3', v: 12, c: PP_PALETTE.sky },
  { n: 'T2', v: 7, c: PP_PALETTE.amb },
];

export const GATE_BARS = [
  { n: 'Komal Gate', v: 98, c: PP_PALETTE.coral },
  { n: 'Devash Gate', v: 72, c: PP_PALETTE.vio },
  { n: 'Dinash Gate', v: 64, c: PP_PALETTE.sky },
];

export const PARKING_TOWER_BARS = [
  { n: 'T3', v4: 2, v2: 1, c4: PP_PALETTE.sky },
  { n: 'FM', v4: 2, v2: 0, c4: PP_PALETTE.coral },
  { n: 'T4', v4: 1, v2: 0, c4: PP_PALETTE.for },
];

export const SLOT_DATA = [
  { n: 'Yoga Room', mBook: 2, mCap: 4, eBook: 4, eCap: 4 },
  { n: 'Swimming Pool', mBook: 1, mCap: 3, eBook: 3, eCap: 3 },
  { n: 'Banquet Hall', mBook: 0, mCap: 1, eBook: 1, eCap: 1 },
  { n: 'Running Track', mBook: 2, mCap: 4, eBook: 1, eCap: 4 },
  { n: 'Golf Club N', mBook: 0, mCap: 2, eBook: 1, eCap: 2 },
  { n: 'Studio', mBook: 1, mCap: 2, eBook: 0, eCap: 2 },
];

export const AGEING_MATRIX = [
  { pri: 'P1 — Critical', cols: [1, 0, 0, 0, 0], color: PP_PALETTE.crim },
  { pri: 'P2 — High', cols: [2, 5, 6, 4, 3], color: PP_PALETTE.amb },
  { pri: 'P3 — Medium', cols: [3, 4, 5, 6, 8], color: PP_PALETTE.sky },
  { pri: 'P4 — Low', cols: [2, 3, 2, 1, 0], color: PP_PALETTE.sto },
];

export const PARKING_SLOTS = [
  { slot: 'PS-T4', tower: 'T4', flat: '101', vehicle: 'MH 47 G 6787', vType: '4 Wheeler', pType: 'Hatchback', sticker: 'T4-PS4' },
  { slot: 'PS-T3-1', tower: 'T3', flat: '201', vehicle: 'MH 12 AB 1234', vType: '4 Wheeler', pType: 'SUV', sticker: 'T3-PS1' },
  { slot: 'PS-T3-2', tower: 'T3', flat: '305', vehicle: 'MH 12 CD 5678', vType: '2 Wheeler', pType: 'Bike', sticker: 'T3-PS2' },
  { slot: 'PS-FM-1', tower: 'FM', flat: 'Office', vehicle: 'MH 01 XY 9999', vType: '4 Wheeler', pType: 'SUV', sticker: 'FM-PS1' },
  { slot: 'P1', tower: 'FM', flat: 'Office', vehicle: '—', vType: '2 Wheeler', pType: 'SUV', sticker: '—', mismatch: true },
  { slot: 'PS-FM-2', tower: 'FM', flat: '101', vehicle: 'MH 14 ZZ 4321', vType: '4 Wheeler', pType: 'Hatchback', sticker: 'FM-PS2' },
];
