import axios from "axios";
import {
  CERTIFICATE_STATUSES,
  Channel,
  DEFAULT_BREEDS,
  DEFAULT_SETTINGS,
  DueStatus,
  Pet,
  PetFilters,
  PetSettings,
  PetType,
  ReminderLog,
  Template,
} from "./types";

// My Pets API — see my-pets-api.md. Base URL comes from the logged-in session;
// the society comes from the token's selected user society.

const client = () => {
  const baseUrl = localStorage.getItem("baseUrl") || "hi-society.lockated.com";
  const token = localStorage.getItem("token") || "";
  return axios.create({
    baseURL: baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
};

/** Turns an API error body into one readable line. Handles
 *  { error }, { errors: [] } and { field: ["msg"] } shapes. */
export const apiErrorMessage = (err: unknown, fallback = "Something went wrong. Please try again."): string => {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data || fallback;
  if (data.error) return String(data.error);
  if (Array.isArray(data.errors)) return data.errors.join(", ");
  if (typeof data === "object") {
    const parts = Object.entries(data)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => (k === "base" ? (v as string[]).join(", ") : `${k.replace(/_/g, " ")} ${(v as string[]).join(", ")}`));
    if (parts.length) return parts.join("; ");
  }
  return fallback;
};

/** Field errors from a 422 ({ pet_name: ["…"] }), keyed by API field name. */
export const apiFieldErrors = (err: unknown): Record<string, string> => {
  if (!axios.isAxiosError(err) || err.response?.status !== 422) return {};
  const data = err.response.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => [k, (v as string[]).join(", ")])
  );
};

// ── API pet → UI pet ────────────────────────────────────────────────────────
const toDateOnly = (v?: string | null) => (v ? String(v).slice(0, 10) : null);

/** The API sends attachment URLs URL-encoded and protocol-relative, e.g.
 *  "%2F%2Fs3.amazonaws.com%2F…%2F1as.jpeg?1795764707". Decode the path and add
 *  https: so <img src> and links resolve to S3 instead of localhost. */
export const toFileUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  let url = String(raw).trim();
  try {
    if (/%2F/i.test(url)) url = decodeURIComponent(url);
  } catch {
    /* malformed encoding — use as is */
  }
  if (url.startsWith("//")) url = `https:${url}`;
  else if (url.startsWith("/")) {
    const base = localStorage.getItem("baseUrl") || "hi-society.lockated.com";
    url = `${base.startsWith("http") ? base : `https://${base}`}${url}`;
  }
  // Path-style "s3.amazonaws.com/<bucket>/key" answers with a PermanentRedirect
  // XML error for this bucket; the bucket host "<bucket>.s3.amazonaws.com/key" serves the file.
  url = url.replace(/^(https?:)?\/\/s3\.amazonaws\.com\/([^/]+)\//i, "https://$2.s3.amazonaws.com/");
  return url;
};

const towerFlat = (p: any) =>
  p.tower_flat || [p.tower, p.flat].filter(Boolean).join(" - ") || "";

const toReminder = (r: any): ReminderLog => ({
  id: r.id,
  sent_on: r.sent_at,
  sent_by: r.sent_by || (r.trigger === "Auto" ? "System" : "-"),
  channel: Array.isArray(r.channels) ? r.channels.join(" + ") : r.channels || "-",
  mode: r.trigger === "Auto" ? "Auto" : "Manual",
  resident_action: r.resident_action,
  template: r.template,
  message: r.message,
  delivery: r.delivery,
  opened_at: r.opened_at,
});

export const normalizePet = (p: any): Pet => ({
  id: p.id,
  pet_code: p.pet_code,
  owner_name: p.owner_name || "",
  owner_id: p.user_id,
  user_society_id: p.user_society_id,
  resident_role: p.role || "",
  tower: p.tower || "",
  flat: p.flat || "",
  mobile: p.owner_mobile || "",
  pet_type: p.pet_type,
  pet_type_other: p.pet_type_other || undefined,
  breed: p.breed || "",
  breed_other: p.breed_other || undefined,
  name: p.pet_name || "",
  gender: p.gender || undefined,
  date_of_birth: p.date_of_birth || undefined,
  vaccination_status: p.vaccination_status,
  vaccination_date: toDateOnly(p.vaccination_date),
  next_vaccination_date: toDateOnly(p.next_vaccination_date),
  tower_flat: towerFlat(p),
  certificate_url: toFileUrl(p.certificate_url),
  certificate_name: p.certificate_name || null,
  photo_url: toFileUrl(p.photo_url),
  certificate_status: p.certificate_status || "Not checked",
  certificate_reject_reason: p.certificate_reject_reason || undefined,
  registration_status: p.registration_status,
  archive_reason: p.archive_reason || undefined,
  remarks: p.remarks || undefined,
  created_at: p.created_at,
  updated_at: p.updated_at,
  last_reminder_sent: p.last_reminder_sent_at || null,
  // server-computed (4.4)
  due_status: p.due_status,
  days_to_next_dose: typeof p.days_to_next_dose === "number" ? p.days_to_next_dose : undefined,
  can_remind: typeof p.can_remind === "boolean" ? p.can_remind : undefined,
  reminders: Array.isArray(p.reminders) ? p.reminders.map(toReminder) : undefined,
});

// ── 4.1 List ────────────────────────────────────────────────────────────────
const snake = (v: string) => v.toLowerCase().replace(/\s+/g, "_");

export interface PetListResult {
  pets: Pet[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const listPetParams = (filters: PetFilters, search: string) => {
  const params: Record<string, string> = {};
  if (search.trim()) params.search = search.trim();
  if (filters.tower) params.tower = filters.tower;
  if (filters.pet_type) params.pet_type = filters.pet_type;
  if (filters.breed) params.breed = filters.breed;
  if (filters.vaccination) params.vaccination_status = filters.vaccination;
  if (filters.due_status) params.due_status = snake(filters.due_status);
  if (filters.certificate) params.certificate = snake(filters.certificate);
  if (filters.status) {
    params.registration_status = filters.status;
    // archived / declined pets are only returned with include_archived
    if (filters.status === "Archived" || filters.status === "Declined") params.include_archived = "true";
  }
  return params;
};

export const fetchPets = async (
  { page = 1, perPage = 20, filters, search = "" }: { page?: number; perPage?: number; filters: PetFilters; search?: string }
): Promise<PetListResult> => {
  const { data } = await client().get("/my_pets.json", {
    params: { page, per_page: perPage, ...listPetParams(filters, search) },
  });
  const list = Array.isArray(data?.my_pets) ? data.my_pets : [];
  return {
    pets: list.map(normalizePet),
    totalCount: data?.total_count ?? list.length,
    totalPages: data?.total_pages ?? 1,
    currentPage: data?.current_page ?? page,
  };
};

/** Every pet matching the filters (for exports) — walks all pages. */
export const fetchAllPets = async (filters: PetFilters, search = ""): Promise<Pet[]> => {
  const first = await fetchPets({ page: 1, perPage: 200, filters, search });
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      fetchPets({ page: i + 2, perPage: 200, filters, search })
    )
  );
  return [first, ...rest].flatMap((r) => r.pets);
};

// ── 4.4 Detail ──────────────────────────────────────────────────────────────
export const fetchPet = async (id: number): Promise<Pet> => {
  const { data } = await client().get(`/my_pets/${id}.json`);
  return normalizePet(data?.my_pet ?? data);
};

// ── 5.1 Dashboard ───────────────────────────────────────────────────────────
export interface PetDashboard {
  total_pets: number;
  flats_with_pets: number;
  dogs: number;
  cats: number;
  birds: number;
  other: number;
  vaccinated_completely: number;
  partially_vaccinated: number;
  not_vaccinated: number;
  due_soon: number;
  overdue: number;
  pending_approval: number;
}

export const EMPTY_DASHBOARD: PetDashboard = {
  total_pets: 0, flats_with_pets: 0, dogs: 0, cats: 0, birds: 0, other: 0, vaccinated_completely: 0,
  partially_vaccinated: 0, not_vaccinated: 0, due_soon: 0, overdue: 0, pending_approval: 0,
};

export const fetchDashboard = async (): Promise<PetDashboard> => {
  const { data } = await client().get("/my_pets/dashboard.json");
  return { ...EMPTY_DASHBOARD, ...data };
};

// ── 3.1 Add ─────────────────────────────────────────────────────────────────
export interface NewPetInput {
  pet_type: PetType;
  pet_type_other?: string;
  breed: string;
  breed_other?: string;
  pet_name: string;
  gender?: string;
  date_of_birth?: string;
  vaccination_status: string;
  vaccination_date?: string;
  next_vaccination_date?: string;
  remarks?: string;
  certificate?: File | null;
  photo?: File | null;
}

export const createPet = async (input: NewPetInput): Promise<Pet> => {
  const body = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    body.append(`my_pet[${key}]`, value instanceof File ? value : String(value));
  });
  const { data } = await client().post("/my_pets.json", body);
  return normalizePet(data?.my_pet ?? data);
};

// ── 3.4 Update / add next dose ──────────────────────────────────────────────
// Same fields as 3.1, only what changes; status fields can't be changed here.
// Files go only when a new one was picked.
export const updatePet = async (id: number, input: Partial<NewPetInput>): Promise<Pet> => {
  const body = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    body.append(`my_pet[${key}]`, value instanceof File ? value : String(value));
  });
  const { data } = await client().patch(`/my_pets/${id}.json`, body);
  return normalizePet(data?.my_pet ?? data);
};

// ── 6. Admin actions — each returns the pet object ─────────────────────────
const action = async (id: number, path: string, body?: object) => {
  const { data } = await client().patch(`/my_pets/${id}/${path}.json`, body ?? {});
  return normalizePet(data?.my_pet ?? data);
};

export const approvePet = (id: number) => action(id, "approve");
export const declinePet = (id: number, reason: string) => action(id, "decline", { reason });
export const verifyCertificate = (id: number) => action(id, "verify_certificate", { certificate_status: "Verified" });
export const rejectCertificate = (id: number, reason: string) =>
  action(id, "verify_certificate", { certificate_status: "Rejected", reason });
export const archivePet = (id: number, archive_reason: string) => action(id, "archive", { archive_reason });

// ── 8. Delete ───────────────────────────────────────────────────────────────
export const deletePet = async (id: number) => {
  await client().delete(`/my_pets/${id}.json`);
};

// ── 7. Reminders ────────────────────────────────────────────────────────────
export const fetchMessagePreview = async (id: number, template?: Template) => {
  const { data } = await client().get("/my_pets/message_preview.json", { params: { id, template } });
  return data as { template: Template; message: string; channels: Channel[] };
};

export const remindOwner = async (id: number, payload: { template: Template; message?: string; channels: Channel[] }) => {
  const { data } = await client().post(`/my_pets/${id}/remind.json`, payload);
  return toReminder(data?.reminder ?? data);
};

export const bulkRemind = async (payload: { ids: number[]; template: Template; channels: Channel[] }) => {
  const { data } = await client().post("/my_pets/bulk_remind.json", payload);
  return { sent: (data?.sent ?? []) as number[], skipped: (data?.skipped ?? []) as number[] };
};

// ── 1. Settings ─────────────────────────────────────────────────────────────
type BreedType = Exclude<PetType, "Other">;
const BREED_TYPES: BreedType[] = ["Dog", "Cat", "Bird"];

export const fetchPetSettings = async (): Promise<PetSettings> => {
  const { data } = await client().get("/my_pets/settings.json");
  // breed_list already applies extra / hidden breeds → visible list per type
  const breeds = { ...DEFAULT_SETTINGS.breeds };
  BREED_TYPES.forEach((t) => {
    if (Array.isArray(data?.breed_list?.[t])) breeds[t] = data.breed_list[t];
  });
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    due_soon_window: data?.due_soon_days ?? DEFAULT_SETTINGS.due_soon_window,
    breeds,
  };
};

export const savePetSettings = async (settings: PetSettings): Promise<PetSettings> => {
  // visible breed list → extra_breeds (not in the standard list) + hidden_breeds (standard, unticked)
  const extra_breeds: Record<string, string[]> = {};
  const hidden_breeds: Record<string, string[]> = {};
  BREED_TYPES.forEach((t) => {
    extra_breeds[t] = settings.breeds[t].filter((b) => !DEFAULT_BREEDS[t].includes(b));
    hidden_breeds[t] = DEFAULT_BREEDS[t].filter(
      (b) => !settings.breeds[t].includes(b) && b !== "Indie / Mixed" && b !== "Other"
    );
  });
  const { due_soon_window, breeds: _breeds, ...rest } = settings;
  void _breeds;
  await client().patch("/my_pets/settings.json", {
    my_pet_setting: { ...pickSettingKeys(rest), due_soon_days: due_soon_window, extra_breeds, hidden_breeds },
  });
  return fetchPetSettings();
};

const SETTING_KEYS = [
  "module_status", "allowed_pet_types", "max_pets_per_flat", "approval_required", "certificate_mandatory",
  "allow_not_taken", "not_taken_warning", "verify_certificates", "certificate_file_types", "certificate_max_mb",
  "photo_mandatory", "share_photo_with_security", "reminders_enabled", "auto_reminders", "remind_days_before",
  "overdue_repeat", "stop_after", "remind_not_taken", "channels",
] as const;
const pickSettingKeys = (s: Record<string, unknown>) =>
  Object.fromEntries(SETTING_KEYS.filter((k) => k in s).map((k) => [k, s[k]]));

// ── Due status (PT-19) — the API sends it; this is the same rule as a fallback ─
const DAY = 24 * 60 * 60 * 1000;

export const daysToNextDose = (pet: Pet, today = new Date()): number | null => {
  if (typeof pet.days_to_next_dose === "number") return pet.days_to_next_dose;
  if (!pet.next_vaccination_date) return null;
  const next = new Date(`${pet.next_vaccination_date}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((next.getTime() - start.getTime()) / DAY);
};

export const getDueStatus = (pet: Pet, dueSoonWindow: number): DueStatus => {
  if (pet.due_status) return pet.due_status;
  if (pet.vaccination_status === "Not taken") return "Not vaccinated";
  const days = daysToNextDose(pet);
  if (days === null) return "Not vaccinated";
  if (days < 0) return "Overdue";
  if (days <= dueSoonWindow) return "Due soon";
  return "Up to date";
};

export const certificateState = (p: Pet) =>
  p.vaccination_status !== "Not taken" && !p.certificate_url
    ? "Missing"
    : (CERTIFICATE_STATUSES as readonly string[]).includes(p.certificate_status)
      ? p.certificate_status
      : "Not checked";

export const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const templateForStatus = (status: DueStatus): Template =>
  status === "Overdue" ? "Overdue" : status === "Not vaccinated" ? "Not vaccinated" : "Due soon";
