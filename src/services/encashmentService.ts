import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ─── Pagination helpers ─────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Admin list endpoints on the Hi-Society API aren't fully consistent about
 * where they nest the array / pagination meta (`{ <resource>: [...], pagination: {...} }`,
 * `{ data: [...], meta: {...} }`, or a bare array). This pulls the first
 * array found (checking `preferredKeys` first) and normalizes whatever
 * pagination meta is present, so the UI never breaks on a shape mismatch.
 */
const extractPaginated = <T,>(
  raw: unknown,
  preferredKeys: string[],
  page: number,
  perPage: number
): { items: T[]; pagination: PaginationMeta } => {
  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      pagination: {
        page,
        per_page: perPage,
        total_count: raw.length,
        total_pages: 1,
      },
    };
  }

  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  let items: T[] = [];
  for (const key of [...preferredKeys, "data", "results", "records"]) {
    const value = obj[key];
    if (Array.isArray(value)) {
      items = value as T[];
      break;
    }
  }
  if (items.length === 0) {
    const firstArray = Object.values(obj).find((v) => Array.isArray(v));
    if (Array.isArray(firstArray)) items = firstArray as T[];
  }

  const metaSource = (obj.pagination || obj.meta || obj) as Record<string, unknown>;
  const totalCount = Number(
    metaSource.total_count ?? metaSource.total ?? items.length
  );
  const perPageResolved = Number(metaSource.per_page ?? perPage) || perPage;
  const pagination: PaginationMeta = {
    page: Number(metaSource.page ?? metaSource.current_page ?? page) || page,
    per_page: perPageResolved,
    total_count: Number.isFinite(totalCount) ? totalCount : items.length,
    total_pages:
      Number(metaSource.total_pages) ||
      Math.max(1, Math.ceil((Number.isFinite(totalCount) ? totalCount : items.length) / perPageResolved)),
  };

  return { items, pagination };
};

// ─── Encashment Config ───────────────────────────────────────────────────────

export interface EncashmentConfigStep {
  step: number;
  title: string;
  description: string;
}

export interface EncashmentConfig {
  steps: EncashmentConfigStep[];
  processing_time_label: string;
  processing_fee_percent: number;
  min_points_per_request: number | null;
  max_points_per_request: number | null;
}

/** GET /api/encashment/config — current encashment configuration */
export const getEncashmentConfig = async (): Promise<EncashmentConfig> => {
  const response = await axios.get(
    getFullUrl("/api/encashment/config"),
    { headers: { Authorization: getAuthHeader() } }
  );
  return response.data;
};

export interface EncashmentSettingsPayload {
  organization_id: number | string;
  processing_fee_percent: number | string;
  processing_min_days: number | string;
  processing_max_days: number | string;
  points_to_rupee_ratio: number | string;
  min_points_per_request?: number | string;
  max_points_per_request?: number | string;
}

export interface EncashmentSettings {
  id: number;
  organization_id: number;
  processing_fee_percent: string;
  processing_min_days: number;
  processing_max_days: number;
  points_to_rupee_ratio: string;
  min_points_per_request: number | null;
  max_points_per_request: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** POST /admin/encashment_settings/create_or_update — create or update an organization's encashment settings */
export const updateEncashmentSettings = async (
  payload: EncashmentSettingsPayload
): Promise<{ success: boolean; message?: string; data: EncashmentSettings }> => {
  const body = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    body.append(key, value === undefined || value === null ? "" : String(value));
  });

  const response = await axios.post(
    getFullUrl("/admin/encashment_settings/create_or_update"),
    body,
    {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data;
};

// ─── Encashment Requests ─────────────────────────────────────────────────────

export interface EncashRequest {
  id: number;
  user_id: number;
  wallet_id: number;
  bank_account_id: number;
  person_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string | null;
  points_to_encash: number;
  processing_fee_percent: string;
  facilitation_fee: string;
  amount_payable: string;
  status: string;
  request_reference: string;
  expected_credit_date: string | null;
  wallet_transaction_id: number | null;
  refund_wallet_transaction_id: number | null;
  utr_number: string | null;
  terms_accepted: boolean;
  cancelled_reason: string | null;
  processed_by_id: number | null;
  requested_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** GET /admin/encash_requests — paginated list of encashment requests, across statuses */
export const getEncashRequests = async (
  page = 1,
  perPage = DEFAULT_PAGE_SIZE
): Promise<{ items: EncashRequest[]; pagination: PaginationMeta }> => {
  const response = await axios.get(
    getFullUrl("/admin/encash_requests"),
    {
      params: { page, per_page: perPage },
      headers: { Authorization: getAuthHeader() },
    }
  );
  return extractPaginated<EncashRequest>(
    response.data,
    ["encash_requests"],
    page,
    perPage
  );
};

/** PUT /admin/encash_requests/:id/start_processing — move a request into processing */
export const startProcessingEncashRequest = async (id: number): Promise<void> => {
  await axios.put(
    getFullUrl(`/admin/encash_requests/${id}/start_processing`),
    null,
    { headers: { Authorization: getAuthHeader() } }
  );
};

/** PUT /admin/encash_requests/:id/cancel — cancel a request with a reason */
export const cancelEncashRequest = async (id: number, reason: string): Promise<void> => {
  const body = new URLSearchParams();
  body.append("reason", reason);
  await axios.put(
    getFullUrl(`/admin/encash_requests/${id}/cancel`),
    body,
    {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};

/** PUT /admin/encash_requests/:id/mark_successful — mark a request paid out with a bank UTR number */
export const markEncashRequestSuccessful = async (id: number, utrNumber: string): Promise<void> => {
  const body = new URLSearchParams();
  body.append("utr_number", utrNumber);
  await axios.put(
    getFullUrl(`/admin/encash_requests/${id}/mark_successful`),
    body,
    {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};

// ─── KYC Verification Requests ───────────────────────────────────────────────

export interface UserKycVerification {
  id: number;
  user_id: number;
  full_name: string;
  date_of_birth: string | null;
  pan_number: string | null;
  aadhaar_number: string | null;
  address: string | null;
  status: string;
  verification_method: string | null;
  verified_by_id: number | null;
  verified_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  pan_attachment_urls: string[];
  aadhaar_attachment_urls: string[];
  id_proof_attachment_urls: string[];
  [key: string]: unknown;
}

/** GET /admin/user_kyc_verifications — paginated list of user KYC verification requests */
export const getUserKycVerifications = async (
  page = 1,
  perPage = DEFAULT_PAGE_SIZE
): Promise<{ items: UserKycVerification[]; pagination: PaginationMeta }> => {
  const response = await axios.get(
    getFullUrl("/admin/user_kyc_verifications"),
    {
      params: { page, per_page: perPage },
      headers: { Authorization: getAuthHeader() },
    }
  );
  return extractPaginated<UserKycVerification>(
    response.data,
    ["user_kyc_verifications", "kyc_verifications"],
    page,
    perPage
  );
};

/** PUT /admin/user_kyc_verifications/:id/verify — approve a KYC request */
export const verifyKycRequest = async (id: number): Promise<void> => {
  await axios.put(
    getFullUrl(`/admin/user_kyc_verifications/${id}/verify`),
    null,
    { headers: { Authorization: getAuthHeader() } }
  );
};

/** PUT /admin/user_kyc_verifications/:id/reject — reject a KYC request with a reason */
export const rejectKycRequest = async (id: number, reason: string): Promise<void> => {
  const body = new URLSearchParams();
  body.append("reason", reason);
  await axios.put(
    getFullUrl(`/admin/user_kyc_verifications/${id}/reject`),
    body,
    {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};
