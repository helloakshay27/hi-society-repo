import type { WorkflowItem } from './types';

export const WORKFLOWS: WorkflowItem[] = [
  {
    key: 'serviceRequestCreate',
    name: 'Service Request Creation',
    bucket: 'Service & Support',
    steps: [
      'service_request_create_opened',
      'service_request_category_selected',
      'service_request_field_selected',
      'service_request_submit_tapped',
      'service_request_created_success'
    ],
    adoption: 49,
    completionRate: 75,
    dropoffRate: 25,
    avgTime: '1m 48s',
    completions: '4,920'
  },
  {
    key: 'visitorCreate',
    name: 'Visitor Creation (single-contact)',
    bucket: 'Service & Support',
    steps: [
      'visitor_create_opened',
      'visitor_create_submitted',
      'visitor_create_succeeded'
    ],
    adoption: 56,
    completionRate: 81,
    dropoffRate: 19,
    avgTime: '57s',
    completions: '7,340',
    incompleteNote: "UNLIKE SUNCITY: Lockated's CREATE VISITOR button falls through to onCreateVisitorClicked (the addVisitor endpoint), not the post-sales onCreateExpectedVisitorClicked route — so visitor_create_* events on Lockated carry variant=single_contact, never multi_contact. Filtering on variant=multi_contact returns nothing for this brand. visitor_create_blocked (often silent — 17 guard clauses across the three providers, the first four in each fully silent) and visitor_create_failed (sometimes shown to the resident as a false success, since the guest form displays \"Visitor created successfully\" on both branches of its own null check) are real, catalogued Failure/blocked branches, tracked separately from this linear success funnel."
  },
  {
    key: 'facilityBooking',
    name: 'Facility Booking',
    bucket: 'Community & Amenities',
    steps: [
      'facility_booking_opened',
      'facility_book_cta_tapped',
      'facility_booking_submit_tapped',
      'amenity_payment_mode_selected',
      'amenity_payment_gateway_opened',
      'amenity_booking_confirmed'
    ],
    adoption: 30,
    completionRate: 63,
    dropoffRate: 37,
    avgTime: '2m 55s',
    completions: '1,760'
  },
  {
    key: 'foodOrder',
    name: 'Food Order (hosted-webview handoff)',
    bucket: 'Community & Amenities',
    steps: [
      'restaurant_opened',
      'cart_item_quantity_changed',
      'checkout_payment_step_viewed',
      'order_placed',
      'restaurant_order_payment_handoff'
    ],
    adoption: 24,
    completionRate: 58,
    dropoffRate: 42,
    avgTime: '2m 10s',
    completions: '1,340',
    incompleteNote: "Lockated DOES ship the Restaurant/Food home tile (unlike Sunteck), so this funnel sees normal volume. restaurant_order_payment_handoff is still the LAST event this brand's order funnel records: restaurant_food_order_payment_provider.dart only special-cases CompanyName.artesia (straight to a thank-you screen) — Lockated, like Suncity, is pushed into a hosted pay_food_order webview that reports nothing back, so anything after this event has to be reconciled against the order list."
  },
  {
    key: 'eventRsvp',
    name: 'Event RSVP',
    bucket: 'Engagement & Community',
    steps: [
      'event_item_tapped',
      'event_details_viewed',
      'event_rsvp_confirmed'
    ],
    adoption: 19,
    completionRate: 64,
    dropoffRate: 36,
    avgTime: '42s',
    completions: '980',
    incompleteNote: "The catalogue has no separate \"RSVP tapped\" intent event on this brand — event_rsvp_confirmed and event_rsvp_failed are the server's paired answer, fired directly off the RSVP action with no attempt event ahead of them. This funnel follows the confirmed-success branch only; event_rsvp_failed is a real Failure branch, tracked separately."
  },
  {
    key: 'pollVote',
    name: 'Poll Voting',
    bucket: 'Engagement & Community',
    steps: [
      'poll_list_viewed',
      'poll_vote_submitted'
    ],
    adoption: 53,
    completionRate: 89,
    dropoffRate: 11,
    avgTime: '9s',
    completions: '7,510',
    incompleteNote: "poll_vote_submitted fires on the RESULT of the vote POST (unlike the legacy pollVoteNowButtonClicked, which counts the attempt) — the two are kept as a pair rather than unioned. poll_vote_failed is a real, separate Failure branch (the screen silently declines to refresh on a failed vote), excluded from this success-only funnel."
  }
];
