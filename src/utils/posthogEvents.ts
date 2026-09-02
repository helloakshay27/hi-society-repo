import { capturePostHogEvent } from './posthogHelpers';

/**
 * Helper to convert any string into Title Case with spaces
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Standard Application Modules for PostHog Analytics
 */
export const PH_MODULES = {
  HOME: 'Home',
  HELPDESK: 'Helpdesk & Tickets',
  ASSETS: 'Asset Management',
  SCHEDULES: 'Preventive Maintenance',
  INCIDENTS: 'Incident & Safety',
  PERMIT_TO_WORK: 'Permit To Work',
  PROCUREMENT: 'Procurement & PR/PO',
  INVENTORY: 'Inventory & Materials',
  FINANCE: 'Finance & Invoices',
  SMARTSECURE: 'SmartSecure & Gate',
  CRM: 'CRM & Residents',
  COMMUNITY: 'Community & Events',
  BOOKINGS: 'Facility Bookings',
  SURVEYS: 'Surveys & Feedback',
  ACCOUNTING: 'Society Accounting',
  ATTENDANCE: 'Staff & Attendance',
  LOYALTY: 'Loyalty & Rewards',
  FITOUT: 'Fitout Management',
  FNB: 'F & B Management',
  APPOINTMENTZ: 'Appointmentz',
  OSR: 'OSR Management',
  SETTINGS: 'Settings & Setup',
} as const;

export type PHModuleName = (typeof PH_MODULES)[keyof typeof PH_MODULES] | string;

/**
 * Standard PostHog Event Catalogue across All Modules
 * NOTE: Event names in PostHog MUST follow Title Case with spaces.
 */
export const PH_EVENTS = {
  // Global User Interactions & Navigation
  BUTTON_CLICKED: 'Button Clicked',
  PAGE_VIEWED: 'Page Viewed',
  TAB_SWITCHED: 'Tab Switched',
  MODULE_SWITCHED: 'Module Switched',
  SIDEBAR_ITEM_CLICKED: 'Sidebar Item Clicked',
  NAV_ITEM_CLICKED: 'Nav Item Clicked',
  FILTER_APPLIED: 'Filter Applied',
  SEARCH_PERFORMED: 'Search Performed',
  EXPORT_DOWNLOADED: 'Export Downloaded',
  MODAL_OPENED: 'Modal Opened',
  MODAL_CLOSED: 'Modal Closed',

  // Helpdesk & Tickets
  TICKET_CREATED: 'Ticket Created',
  TICKET_UPDATED: 'Ticket Updated',
  TICKET_STATUS_CHANGED: 'Ticket Status Changed',
  TICKET_ASSIGNED: 'Ticket Assigned',
  TICKET_DELETED: 'Ticket Deleted',
  TICKET_DETAILS_VIEWED: 'Ticket Details Viewed',
  TICKET_COMMENT_ADDED: 'Ticket Comment Added',
  TICKET_RESOLVED: 'Ticket Resolved',
  TICKET_CLOSED: 'Ticket Closed',
  TICKET_FORM_OPENED: 'Ticket Create Form Opened',
  HELPDESK_VIEWED: 'Helpdesk Viewed',

  // Asset Management
  ASSET_CREATED: 'Asset Created',
  ASSET_UPDATED: 'Asset Updated',
  ASSET_DELETED: 'Asset Deleted',
  ASSET_DETAILS_VIEWED: 'Asset Details Viewed',
  ASSET_AUDIT_CONDUCTED: 'Asset Audit Conducted',
  ASSET_MOVED: 'Asset Moved',
  ASSET_DISPOSED: 'Asset Disposed',

  // Preventive Maintenance & Schedules
  SCHEDULE_CREATED: 'Schedule Created',
  SCHEDULE_UPDATED: 'Schedule Updated',
  SCHEDULE_DELETED: 'Schedule Deleted',
  SCHEDULE_CLONED: 'Schedule Cloned',
  SCHEDULE_EXECUTED: 'Schedule Executed',
  SCHEDULE_DETAILS_VIEWED: 'Schedule Details Viewed',
  CHECKLIST_SUBMITTED: 'Checklist Submitted',

  // Incidents & Safety
  INCIDENT_CREATED: 'Incident Created',
  INCIDENT_UPDATED: 'Incident Updated',
  INCIDENT_RESOLVED: 'Incident Resolved',
  INCIDENT_INVESTIGATED: 'Incident Investigated',
  INCIDENT_DETAILS_VIEWED: 'Incident Details Viewed',

  // Permit To Work (PTW)
  PERMIT_CREATED: 'Permit Created',
  PERMIT_UPDATED: 'Permit Updated',
  PERMIT_APPROVED: 'Permit Approved',
  PERMIT_REJECTED: 'Permit Rejected',
  PERMIT_DETAILS_VIEWED: 'Permit Details Viewed',
  SAFETY_CHECK_SUBMITTED: 'Safety Check Submitted',

  // Procurement (PR / PO / GRN / Bills)
  PR_CREATED: 'PR Created',
  PR_UPDATED: 'PR Updated',
  PR_DELETED: 'PR Deleted',
  PR_SUBMITTED: 'PR Submitted',
  PR_DETAILS_VIEWED: 'PR Details Viewed',
  PO_CREATED: 'PO Created',
  PO_UPDATED: 'PO Updated',
  PO_APPROVED: 'PO Approved',
  PO_REJECTED: 'PO Rejected',
  PO_DETAILS_VIEWED: 'PO Details Viewed',
  GRN_CREATED: 'GRN Created',
  GRN_DETAILS_VIEWED: 'GRN Details Viewed',
  BILL_CREATED: 'Bill Created',
  BILL_UPDATED: 'Bill Updated',
  BILL_APPROVED: 'Bill Approved',

  // SmartSecure / Gate Operations
  VISITOR_CHECK_IN: 'Visitor Checked In',
  VISITOR_CHECK_OUT: 'Visitor Checked Out',
  STAFF_CHECK_IN: 'Staff Checked In',
  STAFF_CHECK_OUT: 'Staff Checked Out',
  VEHICLE_CHECK_IN: 'Vehicle Checked In',
  VEHICLE_CHECK_OUT: 'Vehicle Checked Out',
  GATEPASS_CREATED: 'Gatepass Created',
  PATROLLING_CONDUCTED: 'Patrolling Conducted',

  // CRM & Residents / Community
  LEAD_CREATED: 'Lead Created',
  CRM_CUSTOMER_CREATED: 'CRM Customer Created',
  CRM_CUSTOMER_UPDATED: 'CRM Customer Updated',
  BROADCAST_CREATED: 'Broadcast Created',
  NOTICE_CREATED: 'Notice Created',
  POLL_CREATED: 'Poll Created',
  EVENT_CREATED: 'Event Created',
  EVENT_RSVP_SUBMITTED: 'Event RSVP Submitted',

  // Facility Bookings & Amenities
  FACILITY_BOOKING_CREATED: 'Facility Booking Created',
  FACILITY_BOOKING_CANCELLED: 'Facility Booking Cancelled',
  AMENITY_SETUP_SAVED: 'Amenity Setup Saved',
  SLOT_CONFIGURED: 'Slot Configured',

  // Surveys & Feedback
  SURVEY_CREATED: 'Survey Created',
  SURVEY_UPDATED: 'Survey Updated',
  SURVEY_SUBMITTED: 'Survey Submitted',
  SURVEY_RESPONSE_VIEWED: 'Survey Response Viewed',

  // Finance & Accounting
  INVOICE_CREATED: 'Invoice Created',
  INVOICE_UPDATED: 'Invoice Updated',
  PAYMENT_RECORDED: 'Payment Recorded',
  RECEIPT_GENERATED: 'Receipt Generated',
} as const;

export type PHEventName = (typeof PH_EVENTS)[keyof typeof PH_EVENTS] | string;

/**
 * Track an explicit button click across any module.
 */
export function trackButtonClick(
  buttonLabel: string,
  moduleName: PHModuleName,
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.BUTTON_CLICKED, {
    button_name: buttonLabel,
    module: moduleName,
    interaction_type: 'click',
    ...extraProps,
  });
}

/**
 * Track a page/screen or detail view in a module.
 */
export function trackPageView(
  moduleName: PHModuleName,
  screenName: string,
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.PAGE_VIEWED, {
    module: moduleName,
    screen_name: screenName,
    ...extraProps,
  });
}

/**
 * Track an entity creation (e.g. Ticket, Asset, Schedule, PR, PO, Incident, Permit, Booking).
 */
export function trackCreate(
  entityType: string,
  entityId?: string | number,
  extraProps: Record<string, unknown> = {}
): void {
  const eventName = `${toTitleCase(entityType)} Created`;
  capturePostHogEvent(eventName, {
    entity_type: entityType,
    entity_id: entityId,
    action: 'create',
    ...extraProps,
  });
}

/**
 * Track an entity update/edit (e.g. Ticket, Asset, Schedule, PR, PO, Incident, Permit).
 */
export function trackUpdate(
  entityType: string,
  entityId?: string | number,
  extraProps: Record<string, unknown> = {}
): void {
  const eventName = `${toTitleCase(entityType)} Updated`;
  capturePostHogEvent(eventName, {
    entity_type: entityType,
    entity_id: entityId,
    action: 'update',
    ...extraProps,
  });
}

/**
 * Track an entity deletion.
 */
export function trackDelete(
  entityType: string,
  entityId?: string | number,
  extraProps: Record<string, unknown> = {}
): void {
  const eventName = `${toTitleCase(entityType)} Deleted`;
  capturePostHogEvent(eventName, {
    entity_type: entityType,
    entity_id: entityId,
    action: 'delete',
    ...extraProps,
  });
}

/**
 * Track a status change (e.g., Ticket resolved, PO approved, Permit rejected, Bill approved).
 */
export function trackStatusChange(
  entityType: string,
  newStatus: string,
  previousStatus?: string,
  entityId?: string | number,
  extraProps: Record<string, unknown> = {}
): void {
  const eventName = `${toTitleCase(entityType)} Status Changed`;
  capturePostHogEvent(eventName, {
    entity_type: entityType,
    entity_id: entityId,
    new_status: newStatus,
    previous_status: previousStatus,
    action: 'status_change',
    ...extraProps,
  });
}

/**
 * Track an export / download action (CSV, Excel, PDF).
 */
export function trackExport(
  entityType: string,
  format: 'csv' | 'excel' | 'pdf' | string = 'csv',
  rowCount?: number,
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.EXPORT_DOWNLOADED, {
    entity_type: entityType,
    export_format: format,
    record_count: rowCount,
    action: 'export',
    ...extraProps,
  });
}

/**
 * Track filter applied on a list or dashboard.
 */
export function trackFilter(
  moduleName: PHModuleName,
  filtersApplied: Record<string, unknown> = {},
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.FILTER_APPLIED, {
    module: moduleName,
    filters: filtersApplied,
    action: 'filter',
    ...extraProps,
  });
}

/**
 * Track search performed within a module.
 */
export function trackSearch(
  moduleName: PHModuleName,
  query: string,
  resultCount?: number,
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.SEARCH_PERFORMED, {
    module: moduleName,
    search_query: query,
    result_count: resultCount,
    action: 'search',
    ...extraProps,
  });
}

/**
 * Track top-level module header switch (e.g. Home, Maintenance, BMS, Loyalty, CMS, etc.)
 */
export function trackModuleSwitch(
  moduleLabel: string,
  targetPath: string,
  previousModule?: string,
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.MODULE_SWITCHED, {
    module_label: moduleLabel,
    target_path: targetPath,
    previous_module: previousModule,
    interaction_type: 'top_navigation_click',
    ...extraProps,
  });
}

/**
 * Track sidebar navigation item or sub-item click.
 */
export function trackSidebarClick(
  itemLabel: string,
  sectionTitle: string,
  path: string,
  isSubItem: boolean = false,
  parentLabel?: string,
  extraProps: Record<string, unknown> = {}
): void {
  capturePostHogEvent(PH_EVENTS.SIDEBAR_ITEM_CLICKED, {
    item_label: itemLabel,
    section_title: sectionTitle,
    path: path,
    is_sub_item: isSubItem,
    parent_label: parentLabel,
    interaction_type: 'sidebar_click',
    ...extraProps,
  });
}

/**
 * React Hook for capturing PostHog events easily inside any UI component.
 */
export function usePostHogAnalytics() {
  return {
    trackButtonClick,
    trackPageView,
    trackCreate,
    trackUpdate,
    trackDelete,
    trackStatusChange,
    trackExport,
    trackFilter,
    trackSearch,
    trackModuleSwitch,
    trackSidebarClick,
    captureEvent: capturePostHogEvent,
    modules: PH_MODULES,
    events: PH_EVENTS,
  };
}

/**
 * Initializes global declarative auto-capture for buttons and interactive elements
 * that define `data-ph-btn`, `data-ph-event`, `data-ph-module`, or `data-ph-action`.
 */
export function initPostHogAutoCapture(): void {
  if (typeof window === 'undefined' || (window as any).__ph_autocapture_initialized) return;
  (window as any).__ph_autocapture_initialized = true;

  document.addEventListener(
    'click',
    (event) => {
      const target = (event.target as HTMLElement)?.closest?.('[data-ph-btn], [data-ph-event], [data-ph-action]') as HTMLElement | null;
      if (!target) return;

      const btnName = target.getAttribute('data-ph-btn') || target.innerText?.trim().slice(0, 50) || 'unnamed_button';
      const moduleName = target.getAttribute('data-ph-module') || 'General';
      const customEvent = target.getAttribute('data-ph-event');
      const action = target.getAttribute('data-ph-action');
      const entity = target.getAttribute('data-ph-entity');
      const entityId = target.getAttribute('data-ph-id');

      if (customEvent) {
        capturePostHogEvent(toTitleCase(customEvent), {
          button_name: btnName,
          module: moduleName,
          entity_type: entity || undefined,
          entity_id: entityId || undefined,
          action: action || 'click',
        });
      } else if (action === 'create' && entity) {
        trackCreate(entity, entityId || undefined, { module: moduleName, button_name: btnName });
      } else if (action === 'update' && entity) {
        trackUpdate(entity, entityId || undefined, { module: moduleName, button_name: btnName });
      } else if (action === 'delete' && entity) {
        trackDelete(entity, entityId || undefined, { module: moduleName, button_name: btnName });
      } else if (action === 'export') {
        trackExport(entity || moduleName, target.getAttribute('data-ph-format') || 'csv');
      } else {
        trackButtonClick(btnName, moduleName, {
          entity_type: entity || undefined,
          entity_id: entityId || undefined,
        });
      }
    },
    true
  );
}
