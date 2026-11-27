// Pets module — admin register + rules (spec: "BPTP app · Pets", sheets 1–7).
// Field IDs (PS-xx, PT-xx, AR-xx, RM-xx) refer to the spec sheet.

// ── Dropdown values (sheet 5) ────────────────────────────────────────────────
export const PET_TYPES = ["Dog", "Cat", "Bird", "Other"] as const;
export type PetType = (typeof PET_TYPES)[number];

export const DEFAULT_BREEDS: Record<Exclude<PetType, "Other">, string[]> = {
  Dog: [
    "Indie / Mixed", "Labrador Retriever", "Golden Retriever", "German Shepherd",
    "Beagle", "Shih Tzu", "Pug", "Pomeranian", "Lhasa Apso", "Rottweiler",
    "Dobermann", "Siberian Husky", "Cocker Spaniel", "Dachshund", "Boxer",
    "Great Dane", "French Bulldog", "Maltese", "Other",
  ],
  Cat: [
    "Indie / Mixed", "Persian", "Siamese", "Maine Coon", "British Shorthair",
    "Bengal", "Ragdoll", "Himalayan", "Other",
  ],
  Bird: [
    "Budgerigar (Budgie)", "Cockatiel", "Lovebird", "Parrot (Indian ringneck)",
    "African Grey", "Macaw", "Canary", "Finch", "Other",
  ],
};

export const VACCINATION_STATUSES = ["Completely", "Partially", "Not taken"] as const;
export type VaccinationStatus = (typeof VACCINATION_STATUSES)[number];

export const DUE_STATUSES = ["Up to date", "Due soon", "Overdue", "Not vaccinated"] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export const CERTIFICATE_STATUSES = ["Not checked", "Verified", "Rejected", "Missing"] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const REGISTRATION_STATUSES = ["Active", "Pending approval", "Declined", "Archived"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const ARCHIVE_REASONS = [
  "Moved out", "Rehomed", "Passed away", "Added by mistake", "Duplicate", "Other",
] as const;

export const RESIDENT_ROLES = ["Owner", "Tenant", "Family member"] as const;
export const MODULE_STATUSES = ["Active", "Inactive", "Draft"] as const;
export const FILE_TYPES = ["PDF", "JPG", "PNG"] as const;
export const DAYS_BEFORE = [30, 15, 7, 1] as const;
export const OVERDUE_REPEATS = ["Once", "Every 3 days", "Every 7 days", "Every 15 days"] as const;
export const CHANNELS = ["Push", "SMS", "WhatsApp", "Email"] as const;
export type Channel = (typeof CHANNELS)[number];
export const TEMPLATES = ["Due soon", "Overdue", "Not vaccinated", "Certificate rejected"] as const;
export type Template = (typeof TEMPLATES)[number];

// ── Settings (sheet 1 + sheet 4 section A) — one per project ─────────────────
export interface PetSettings {
  // A. Module
  module_status: (typeof MODULE_STATUSES)[number]; // PS-02
  allowed_pet_types: PetType[]; // PS-03
  breeds: Record<Exclude<PetType, "Other">, string[]>; // PS-04 (visible breeds)
  max_pets_per_flat: number | null; // PS-05, null = no limit
  approval_required: boolean; // PS-06
  // B. Vaccination
  certificate_mandatory: boolean; // PS-07
  allow_not_taken: boolean; // PS-08
  not_taken_warning: string; // PS-09
  verify_certificates: boolean; // PS-10
  certificate_file_types: string[]; // PS-11
  certificate_max_mb: number; // PS-11
  // C. Photo
  photo_mandatory: boolean; // PS-12
  share_photo_with_security: boolean; // PS-13
  // D. Reminder
  reminders_enabled: boolean; // PS-14
  auto_reminders: boolean; // RM-01
  remind_days_before: number[]; // RM-02
  due_soon_window: number; // RM-03
  overdue_repeat: string; // RM-04
  stop_after: number | null; // RM-05
  remind_not_taken: boolean; // RM-06
  channels: Channel[]; // RM-07
}

export const DEFAULT_SETTINGS: PetSettings = {
  module_status: "Active",
  allowed_pet_types: ["Dog", "Cat", "Bird", "Other"],
  breeds: DEFAULT_BREEDS,
  max_pets_per_flat: null,
  approval_required: false,
  certificate_mandatory: true,
  allow_not_taken: true,
  not_taken_warning:
    "Society rules need pets to be vaccinated. You can add the pet now and upload the certificate once the first dose is done.",
  verify_certificates: false,
  certificate_file_types: ["PDF", "JPG", "PNG"],
  certificate_max_mb: 5,
  photo_mandatory: false,
  share_photo_with_security: true,
  reminders_enabled: false,
  auto_reminders: false,
  remind_days_before: [30, 7],
  due_soon_window: 30,
  overdue_repeat: "Every 7 days",
  stop_after: 4,
  remind_not_taken: false,
  channels: ["Push"],
};

// ── Pet record (sheet 2) ─────────────────────────────────────────────────────
export interface ReminderLog {
  id?: number;
  sent_on: string; // RM-12 (sent_at)
  sent_by: string;
  channel: string; // channels joined with " + "
  mode: "Manual" | "Auto"; // trigger
  resident_action?: string; // RM-13
  template?: string;
  message?: string;
  delivery?: Record<string, string>; // per channel: sent / queued / failed …
  opened_at?: string | null;
}

export interface Pet {
  id: number;
  pet_code: string; // PT-01
  owner_name: string; // PT-02
  owner_id?: number; // user_id
  user_society_id?: number;
  resident_role: string; // PT-03
  tower: string; // PT-04
  flat: string;
  tower_flat?: string; // API "tower_flat" — handles a missing tower (e.g. "Offices")
  mobile: string; // PT-05
  pet_type: PetType; // PT-06
  pet_type_other?: string; // PT-07
  breed: string; // PT-08
  breed_other?: string; // PT-09
  name: string; // PT-10
  gender?: string; // PT-11
  date_of_birth?: string; // PT-12
  vaccination_status: VaccinationStatus; // PT-13
  vaccination_date?: string | null; // PT-14 (ISO yyyy-mm-dd)
  next_vaccination_date?: string | null; // PT-15
  certificate_url?: string | null; // PT-16
  certificate_name?: string | null;
  photo_url?: string | null; // PT-18
  certificate_status: CertificateStatus; // PT-20
  certificate_reject_reason?: string;
  registration_status: RegistrationStatus; // PT-21
  archive_reason?: string; // PT-22
  created_at?: string; // PT-23
  updated_at?: string;
  remarks?: string;
  last_reminder_sent?: string | null; // AR-18 (last_reminder_sent_at)
  reminders?: ReminderLog[]; // detail only, newest first
  // computed by the API (4.4)
  due_status?: DueStatus; // PT-19
  days_to_next_dose?: number;
  can_remind?: boolean;
}

export interface PetFilters {
  tower: string;
  pet_type: string;
  breed: string;
  vaccination: string;
  due_status: string;
  certificate: string; // "Missing" | CertificateStatus
  status: string;
}

export const EMPTY_FILTERS: PetFilters = {
  tower: "", pet_type: "", breed: "", vaccination: "", due_status: "", certificate: "", status: "",
};
