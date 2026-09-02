import type { InfoTooltipContent } from '../types';

export const INFO_TOOLTIPS: Record<string, InfoTooltipContent> = {
  // ── ALL TOWERS (Leaderboard) ──
  tbl_tlb_ranked_scorecard:{what:`All 4 towers ranked by composite score, with the 6 metrics behind each score shown side by side.`,note:`Rows are sorted by Composite, not by any single column — a tower can lead on one metric and still rank lower overall.`},
  towerCompositeChart:{what:`One number per tower summarizing SLA, patrol, club activation, fitout speed, staffing, and possession CSAT together.`,formula:`Average of 6 metrics, each normalized to a 0–100 scale`,note:`A tower can have one very weak metric and still score reasonably if the other five are strong — check the full breakdown before assuming a tower is fine.`},
  towerRejectionChart:{what:`Share of each tower's decided fitout requests that ended in rejection.`,formula:`Rejected Requests ÷ (Approved + Rejected Requests) × 100`,note:`Pending requests are not counted — only requests that have actually been decided.`},

  // ── OVERVIEW ──
  tbl_tov_possession_experience_resident_feedback:{what:`Resident satisfaction with the handover experience, split into 5 stages so a problem can be traced to a cause.`,formula:`Overall = average of 5 dimension scores, each on a 1–5 scale`,note:`The 5 dimensions come from different parts of the process — a low score in one does not mean the others are also failing.`},
  tbl_tov_important_events:{what:`A live feed of the highest-priority events across every module today, so nothing critical gets missed by staying in one tab.`,note:`Shows high-priority items only — this is not a complete activity log.`},

  // ── HELPDESK ──
  kpi_top_total_tickets:{what:`All Helpdesk tickets raised this period, across every status.`},
  kpi_top_open_tickets:{what:`Tickets not yet closed or completed — includes both untouched and in-progress work.`,formula:`Pending + Work in Progress + On Hold`},
  kpi_top_response_breached:{what:`Tickets where the team did not send a first acknowledgement within the target response time.`,formula:`Count of tickets where Response Escalation = Breached`,note:`This measures how fast a ticket was first picked up — not whether it was ever resolved.`},
  kpi_top_resolution_breached:{what:`Tickets that were acknowledged in time but not actually resolved within the target window.`,formula:`Count of tickets where Resolution Escalation = Breached`,note:`A ticket can pass Response and still breach Resolution — the two are tracked separately.`},
  kpi_top_proactive_tickets:{what:`Tickets the maintenance team raised themselves, before a resident had to complain.`,formula:`Proactive Tickets ÷ Total Tickets × 100`,note:`Higher is better — it means issues are caught before residents notice them.`},
  kpi_top_golden_tickets:{what:`Tickets flagged for priority handling — typically P1-Critical issues involving senior residents.`,note:`This is a manual flag for extra care, not an automatic priority-level calculation.`},
  ticketStatusChart:{what:`How the total tickets are currently split across every possible status.`,note:`"Hold" means work is paused pending a resident or vendor action, not stalled by the team.`},
  proactiveChart:{what:`Whether tickets were raised by the team (Proactive) or by a resident complaint (Reactive).`,formula:`Same underlying split as the Proactive Tickets KPI above`},
  escalationChart:{what:`Compares how often tickets breach their first-response target versus their resolution target.`,formula:`Each bar = Breached Count ÷ Total Tickets, shown separately for Response and Resolution`},
  categoryChart:{what:`Which ticket category breaches the response-time target most often — not just which has the most tickets.`,formula:`Category Breaches ÷ Category Ticket Count × 100`,note:`This is a rate, not a volume — a small category can still show a high percentage.`},
  tbl_top_tickets_ageing_matrix:{what:`How long open tickets have been sitting, broken down by priority level.`,note:`Each cell is a count of tickets — read across a row to see if a priority level is ageing badly.`},
  modeChart:{what:`The channel a resident used to raise the ticket — Mobile, App, or logged in person.`},
  tbl_top_tower_wise_ticket_volume:{what:`Raw ticket count per tower, to spot if one tower is generating disproportionate complaints.`,note:`This is not adjusted for tower size — a bigger tower will naturally show more tickets.`},

  // ── SECURITY ──
  kpi_tsc_visitors_today:{what:`Every visitor logged at any gate today, across all approval statuses.`},
  kpi_tsc_pre_approved:{what:`Visitors the host approved in the app before they arrived at the gate.`,note:`This is the fastest path through security — no gate-side decision needed.`},
  kpi_tsc_post_approved:{what:`Visitors who were cleared at the gate after arriving, not approved in advance.`,note:`Slower than Pre-Approved because it needs a real-time decision from the host or guard.`},
  kpi_tsc_pending_post_approval:{what:`Visitors currently waiting at the gate for approval — the live queue right now.`},
  kpi_tsc_rejected:{what:`Visitors denied entry today, for any reason — invalid host, wrong purpose, or similar.`},
  kpi_tsc_patrol_compliance:{what:`Share of scheduled security patrol checkpoints actually completed today.`,formula:`Checkpoints Completed ÷ Checkpoints Scheduled × 100`},
  kpi_tsc_vehicles_today:{what:`Vehicle entries logged today — tracked separately from visitor foot-traffic.`,note:`A visitor can arrive on foot or by vehicle — this counts vehicles specifically, not people.`},
  kpi_tsc_member_vehicles:{what:`Vehicles belonging to residents, as opposed to guests or contractors.`},
  kpi_tsc_guest_vehicles:{what:`Vehicles belonging to visitors, delivery, or contractors — not residents.`},
  kpi_tsc_peak_hour_guest_share:{what:`What fraction of vehicle traffic during the 5–7 PM peak is Guest rather than Member vehicles.`,formula:`Guest Vehicles (5–7 PM) ÷ Total Vehicles (5–7 PM) × 100`,note:`Compare this to the Guest share for the rest of the day — the gap is the actual finding.`},
  guestTypeChart:{what:`Who is coming through the gate today, by category — Guest, Staff, Delivery, or Contractor.`},
  visitTypeChart:{what:`Same Pre-Approved vs Post-Approved split as the KPIs above, shown as a share of today's total visitors.`,formula:`Each slice = category count ÷ total visitors × 100`},
  hourlyTrafficChart:{what:`Visitor arrivals by hour, to see when the gate is busiest.`},
  purposeChart:{what:`The stated reason for each visit — Guest, Meeting, Delivery, Contractor, and so on.`,note:`This is why they are visiting, a different question from who they are (see Guest Type).`},
  tbl_tsc_gate_wise_visitor_volume_today:{what:`How many visitors passed through each named gate today.`},
  tbl_tsc_denied_amp_flagged_today:{what:`Specific individual cases today that were denied entry or flagged as unusual — the detail behind the KPI numbers above.`},
  tbl_tsc_missed_patrol_resulting_incidents:{what:`Every missed patrol checkpoint this week, matched to whatever incident or ticket happened afterward.`,note:`This link is found by checking Patrolling Response data against Incidents and Helpdesk tickets from the same time window — it is not automatic in the source system.`},
  vehicleHourChart:{what:`Same hour-by-hour view as the visitor Hourly Traffic chart, but for vehicles instead of foot-traffic.`,note:`Uses the same time buckets as Hourly Traffic Pattern on purpose, so the two can be compared directly.`},

  // ── STAFF ──
  kpi_tst_scheduled_today:{what:`Total staff rostered to work today, across all categories and shifts.`},
  kpi_tst_present:{what:`Staff who actually showed up today, including those who arrived late.`,formula:`On-time + Late arrivals`},
  kpi_tst_absent:{what:`Scheduled staff who did not show up today at all.`,formula:`Scheduled − Present`},
  kpi_tst_evening_shift_gap:{what:`How many fewer staff are present than scheduled, specifically for the evening shift.`,formula:`Evening Present − Evening Scheduled`,note:`Shown as a negative number on purpose — it is a shortfall, not a headcount.`},
  staffCategoryChart:{what:`Scheduled versus present headcount for each staff type — Housekeeping, Security, Maintenance, Gardening.`,formula:`Each bar pair = Scheduled Count vs Present Count for that category`},
  shiftCoverageChart:{what:`Scheduled versus present headcount for each shift window across the day.`,formula:`Each bar pair = Scheduled Count vs Present Count for that shift`},

  // ── CLUB & FACILITIES ──
  kpi_tcl_total_members:{what:`Everyone ever registered as a club member, regardless of current status.`},
  kpi_tcl_pending_activation:{what:`Members who signed up but have not been switched on by an admin yet — they cannot book anything until this happens.`},
  kpi_tcl_bookings_today:{what:`Facility reservations made today, across every facility.`},
  kpi_tcl_pending_payments:{what:`Facility or membership payments that have not cleared yet — not confirmed as successful.`},
  kpi_tcl_failed_payments:{what:`Payments that were attempted but did not go through.`,note:`Different from Pending — a failed payment needs the resident to retry, a pending one may still clear on its own.`},
  kpi_tcl_expiring_soon:{what:`Memberships whose plan period ends within the next 30 days and have not been renewed yet.`},
  memberStatusChart:{what:`Every member's current state — Active, Pending, Inactive, or Expired — as a share of the total.`,formula:`Each slice = status count ÷ total members × 100`},
  planDistChart:{what:`Which membership plan residents are actually signed up for, across all statuses.`},
  facilityChart:{what:`Which facilities get booked most, to see where demand concentrates and where it is weak.`},
  facilityTypeChart:{what:`Confirmed versus pending bookings, split by whether the facility auto-confirms or needs admin approval.`,note:`Bookable facilities cannot have a pending state by design — only Request-based facilities can.`},
  tbl_tcl_facility_slots_morning_vs_evening:{what:`How full each facility is in the morning versus the evening, and how many slots remain free today.`,formula:`Vacant = Capacity − Booked, shown separately for Morning and Evening`},
  tbl_tcl_memberships_expiring_next_30_days:{what:`The specific members behind the Expiring Soon KPI, so outreach can be targeted by name.`},

  // ── FITOUT ──
  kpi_tft_total_requests:{what:`Every fitout or move-in request raised this month, regardless of outcome.`},
  kpi_tft_pending:{what:`Requests still awaiting a decision — not yet approved, rejected, or sent back for changes.`},
  kpi_tft_resident_raised:{what:`Requests submitted directly by the resident, rather than filed on their behalf by an admin.`,note:`Compare against the Approval Speed chart below — this split is the reason that chart exists.`},
  kpi_tft_open_deviations:{what:`Cases where fitout work was done outside the originally approved scope, and have not been resolved yet.`},
  kpi_tft_move_in_requests:{what:`Requests from new residents wanting to occupy their flat — a simpler, different workflow from renovation.`},
  kpi_tft_rejection_rate_all_time:{what:`Of every request ever decided, what share ended in rejection.`,formula:`Rejected ÷ (Approved + Rejected) × 100, all-time`,note:`This is separate from this month's Pending count — rejection rate only applies to requests that have actually been decided.`},
  kpi_tft_deposit_currently_held:{what:`Total security deposit money the society is currently holding against active, in-progress fitout work.`,formula:`Sum of deposit amounts across all active fitouts`},
  kpi_tft_refund_due_30_days:{what:`How much deposit money is scheduled to be refunded in the next 30 days, as those fitouts finish.`,note:`This is scheduled, expected refund activity — it does not include the separate backlog of unrefunded deposits from already-rejected requests.`},
  kpi_tft_avg_compliance_completion:{what:`On average, how many of the 6 required compliance documents active fitouts have completed.`,formula:`Average of (Documents Approved ÷ 6) across all active fitouts`},
  fitoutTypeChart:{what:`What share of all requests are renovation work versus new-resident move-ins.`},
  deviationChart:{what:`What kind of unapproved work each open deviation involves — Structural, Electrical, Plumbing, or Aesthetic.`,note:`Structural deviations need external engineer sign-off, so they typically take longer to close than the other types.`},
  createdByChart:{what:`Average days to a decision, compared between requests an admin filed versus ones a resident filed themselves.`,formula:`Average of (Decision Date − Request Date), grouped by who created the request`},
  rejectByCreatorChart:{what:`Same Admin-raised vs Resident-raised split as the speed chart above, but for rejection outcome instead of speed.`,formula:`Rejected ÷ Decided Requests × 100, grouped by who created the request`},
  rejectByTypeChart:{what:`Whether Fitout (renovation) or Move In requests get rejected more often.`,formula:`Rejected ÷ Decided Requests × 100, grouped by request type`},
  tbl_tft_pending_requests_latest_8:{what:`The actual requests behind the Pending KPI, with contractor, resident, and deadline detail for each.`},
  tbl_tft_compliance_checklist_active_fitouts_in_p:{what:`Which of the 6 required documents each active fitout still needs, so follow-up can target the right person.`,note:`A low completion count here often means the unit is waiting on an external party, not on the resident.`},

  // ── PARKING ──
  kpi_tpk_total_vehicles:{what:`Every vehicle currently registered to a parking slot, across all towers.`},
  kpi_tpk_4w_2w_split:{what:`How many registered vehicles are 4-wheelers versus 2-wheelers.`},
  kpi_tpk_towers_covered:{what:`How many of the 4 towers have at least one registered parking slot.`,note:`A tower missing from this count does not necessarily mean no one there has a vehicle — registration may simply be incomplete.`},
  kpi_tpk_data_mismatch:{what:`Slots where the recorded Vehicle Type and Parking Type contradict each other — a data entry problem, not a security one.`},
  tbl_tpk_vehicle_type_by_tower:{what:`How many 4-wheelers versus 2-wheelers are registered in each tower.`},
  parkingTypeChart:{what:`The physical slot type assigned to each vehicle — SUV, Hatchback, or Bike.`,note:`There is currently no distinct "2-Wheeler" slot type, which is part of why the Data Mismatch above happened.`},
  tbl_tpk_all_registered_slots:{what:`Every parking slot on record, with the full detail behind every KPI and chart on this tab.`},

  // ── COMMUNITY ──
  kpi_tco_active_notices:{what:`Notices currently published and visible to residents right now.`,note:`Important and Regular are two notice types the module supports — both are shown even at zero.`},
  kpi_tco_events_this_month:{what:`Community events scheduled or held this month, across both Important and Regular event types.`},
  kpi_tco_polls_created:{what:`Every poll raised this period, whether or not residents actually voted.`},
  kpi_tco_notifications_30d:{what:`System-triggered alerts sent in the last 30 days — payment reminders, ticket updates, and similar — not manually written notices.`,formula:`Delivered ÷ Sent, over the last 30 days`,note:`This tracks whether the message reached the device, not whether the resident read it.`},
  kpi_tco_quarantine_active:{what:`Residents currently either In Quarantine or Under Observation, right now.`,formula:`In Quarantine + Under Observation`},
  kpi_tco_directory_vendors:{what:`Vendors currently listed in the Business Directory that are actually Active, out of the total ever added.`},
  kpi_tco_overall_adoption_rate:{what:`What share of all residents across the whole society are registered on the resident app.`,formula:`Registered Residents ÷ Total Residents × 100`},
  kpi_tco_highest_tower_t2:{what:`The tower with the best app adoption rate, shown for direct comparison against the lowest.`},
  kpi_tco_lowest_tower_t3:{what:`The tower with the weakest app adoption rate — often the root cause behind other weak engagement metrics for that tower.`},
  kpi_tco_explains_poll_gap:{what:`A quick flag for whether low app adoption is the likely reason a tower's poll participation looks poor.`,note:`"Yes" means low adoption is a plausible explanation, not a confirmed cause — check the tower's actual poll data before concluding.`},
  adoptionChart:{what:`App registration rate for each tower individually, rather than the single blended figure in the KPI above.`,formula:`Registered Residents ÷ Total Residents × 100, per tower`},
  pollChart:{what:`Total votes received on each individual poll that has been created.`},
  notifChannelChart:{what:`Delivery success rate for system notifications, split by Push, Email, and SMS.`,formula:`Delivered ÷ Sent, per channel`},
  tbl_tco_quarantine_active_amp_recent_cases:{what:`The specific residents behind the Quarantine KPI, with tower, flat, and dates for each case.`},
  quarantineTowerChart:{what:`Where quarantine and observation cases are concentrated, by tower.`},
  tbl_tco_business_directory_registered_vendors:{what:`The full vendor list behind the Directory Vendors KPI, including which listings need cleanup.`}
};
