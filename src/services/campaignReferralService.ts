import axios from "axios";

const getBaseUrl = () => {
  const savedUrl = localStorage.getItem("baseUrl");
  if (!savedUrl) return "";
  return savedUrl.startsWith("http") ? savedUrl : `https://${savedUrl}`;
};

const getToken = () => localStorage.getItem("token") || "";

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface CampaignReferral {
  id: number;
  user_id: number;
  ref_phone: string;
  ref_name: string;
  created_at: string;
  updated_at: string;
  project_name: string | null;
  society_id: number;
  status: string | null;
  staff_id: number | null;
  earning: string | null;
  second_earning: string | null;
  flat_type_id: number | null;
  alternate_mob: string | null;
  client_email: string | null;
  lead_stage_id: number | null;
  activity_id: number | null;
  lead_source_id: number | null;
  lead_sub_source_id: number | null;
  project_id: number | null;
  lead_id: number | null;
  project_reference_id: string | null;
  service_name: string | null;
  referral_mode: string | null;
  referred_on: string | null;
  created_time: string | null;
  referral_code: string | null;
}

export interface LeadStage {
  id: number;
  lead_stage: string;
}

export interface Activity {
  id: number;
  activity_name: string;
}

export interface LeadStatus {
  id: number;
  name: string;
}

export interface LeadSource {
  id: number;
  source_name: string;
}

export interface LeadSubSource {
  id: number;
  subsource_name: string;
}

export interface Project {
  id: number;
  name: string;
  project_name?: string;
}

export interface FlatType {
  id: number;
  society_flat_type: string;
  appartment_type?: string;
  project_id?: number;
}

export interface CreateReferralPayload {
  referral: {
    user_id?: number;
    ref_phone: string;
    ref_name: string;
    project_name: string;
    status?: string;
    second_earning?: string | null;
    alternate_mob?: string | null;
    client_email?: string | null;
    lead_stage_id?: number | null;
    activity_id?: number | null;
    lead_source_id?: number | null;
    lead_sub_source_id?: number | null;
    project_id?: number | null;
  };
}

export interface UpdateReferralPayload {
  referral: {
    status?: string;
    lead_stage_id?: number | null;
  };
}

export interface OsrLogPayload {
  osr_log: {
    about: string;
    about_id: number;
    comment: string;
    osr_status_id?: number | null;
    osr_staff_id?: number | null;
    priority?: string;
    rating?: number | null;
    current_status?: string;
    user_society_id?: number | null;
  };
  referral: {
    lead_stage_id?: number | null;
  };
}

// ─── API Functions ───────────────────────────────────────────────────────

/**
 * Fetch all campaign referrals
 */
export const getCampaignReferrals = async (): Promise<CampaignReferral[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(`${baseUrl}/crm/admin/referrals.json`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

/**
 * Fetch campaign referral by ID
 */
export const getCampaignReferralById = async (
  id: number
): Promise<CampaignReferral> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/referrals/${id}.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Create a new campaign referral
 */
export const createCampaignReferral = async (
  payload: CreateReferralPayload
): Promise<CampaignReferral> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.post(
    `${baseUrl}/crm/admin/referrals.json`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Update a campaign referral by ID
 */
export const updateCampaignReferral = async (
  id: number,
  payload: UpdateReferralPayload
): Promise<CampaignReferral> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.put(
    `${baseUrl}/crm/admin/referrals/${id}.json`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Create OSR log (used for edit modal notes/status)
 */
export const createOsrLog = async (
  payload: OsrLogPayload
): Promise<unknown> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.post(
    `${baseUrl}/crm/create_osr_log.json`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch lead stages
 */
export const getLeadStages = async (): Promise<LeadStage[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/lead_stages.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch activities
 */
export const getActivities = async (): Promise<Activity[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/activities.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch lead statuses
 */
export const getLeadStatuses = async (): Promise<LeadStatus[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/lead_status.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch lead sources
 */
export const getLeadSources = async (): Promise<LeadSource[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/lead_sources.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch lead sub-sources by lead source ID
 */
export const getLeadSubSources = async (
  sourceId: number
): Promise<LeadSubSource[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/sub_sources/${sourceId}.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch all builder projects
 */
export const getProjects = async (): Promise<Project[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/builder_projects/dropdown_projects.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const raw = response.data;
  if (Array.isArray(raw?.builder_projects)) return raw.builder_projects as Project[];
  if (Array.isArray(raw)) return raw as Project[];
  if (Array.isArray(raw?.projects)) return raw.projects as Project[];
  return [];
};

/**
 * Fetch lead sources for a specific project
 */
export const getProjectLeadSources = async (
  projectId: number
): Promise<LeadSource[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/builder_projects/${projectId}/lead_sources.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const raw = response.data;
  return Array.isArray(raw) ? raw : [];
};

/**
 * Fetch flat types for a specific project
 */
export const getProjectFlatTypes = async (
  projectId: number
): Promise<FlatType[]> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/builder_projects/${projectId}/flat_types.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const raw = response.data;
  return Array.isArray(raw) ? raw : [];
};
