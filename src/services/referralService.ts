import axios from "axios";

const getBaseUrl = () => {
  const savedUrl = localStorage.getItem("baseUrl");
  if (!savedUrl) return "";
  return savedUrl.startsWith("http") ? savedUrl : `https://${savedUrl}`;
};

const getToken = () => localStorage.getItem("token") || "";

export interface ReferralSetup {
  id: number;
  project_name: string;
  banner: string | null;
  banner_url?: string | null;
  attachments: string | null;
  society_id: number;
  society_name?: string | null;
  project_reference_id: string | null;
  title: string | null;
  description: string | null;
  geo_link: string | null;
  details: string | null;
  mobile_no: string | null;
  active: number;
  is_referral: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralSetupsResponse {
  code: number;
  referral_setups: ReferralSetup[];
}

export interface ReferralDocument {
  id: number;
  document?: string | null;
  document_url?: string | null;
  url?: string | null;
  document_file_name?: string | null;
}

export interface ReferralSetupDetailResponse {
  id: number;
  project_name: string;
  banner: string | null;
  banner_url?: string | null;
  attachments: string | null;
  documents?: ReferralDocument[];
  society_id: number;
  project_reference_id: string | null;
  title: string | null;
  description: string | null;
  geo_link: string | null;
  details: string | null;
  mobile_no: string | null;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateReferralSetupPayload {
  society_banner: {
    project_name: string;
    project_reference_id: number;
    active: string;
    is_referral: string;
    title?: string;
    description?: string;
    geo_link?: string;
    details?: string;
    mobile_no?: string;
    banner?: File | null;
  };
  attachments?: File[];
}

export interface UpdateReferralSetupPayload {
  society_banner: {
    project_name: string;
    project_reference_id: number;
    active: string;
    is_referral: string;
    title?: string;
    description?: string;
    geo_link?: string;
    details?: string;
    mobile_no?: string;
    banner?: File | null;
  };
  attachments?: File[];
}

/**
 * Fetch all referral setups
 */
export const getReferralSetups = async (): Promise<ReferralSetupsResponse> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/referral_setups.json`,
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
 * Fetch referral setup by ID
 */
export const getReferralSetupById = async (
  id: number
): Promise<ReferralSetupDetailResponse> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const response = await axios.get(
    `${baseUrl}/crm/admin/referral_setups/${id}.json`,
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
 * Create a new referral setup with optional file upload
 */
export const createReferralSetup = async (
  payload: CreateReferralSetupPayload
): Promise<ReferralSetup> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const formData = new FormData();
  formData.append("society_banner[project_name]", payload.society_banner.project_name);
  formData.append("society_banner[project_reference_id]", payload.society_banner.project_reference_id.toString());
  formData.append("society_banner[active]", payload.society_banner.active);
  formData.append("society_banner[is_referral]", payload.society_banner.is_referral);
  
  if (payload.society_banner.title) {
    formData.append("society_banner[title]", payload.society_banner.title);
  }
  if (payload.society_banner.description) {
    formData.append("society_banner[description]", payload.society_banner.description);
  }
  if (payload.society_banner.geo_link) {
    formData.append("society_banner[geo_link]", payload.society_banner.geo_link);
  }
  if (payload.society_banner.details) {
    formData.append("society_banner[details]", payload.society_banner.details);
  }
  if (payload.society_banner.mobile_no) {
    formData.append("society_banner[mobile_no]", payload.society_banner.mobile_no);
  }
  if (payload.society_banner.banner) {
    formData.append("society_banner[banner]", payload.society_banner.banner);
  }
  if (payload.attachments) {
    payload.attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });
  }

  const response = await axios.post(
    `${baseUrl}/crm/admin/referral_setups.json`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * Update a referral setup with optional file upload
 */
export const updateReferralSetup = async (
  id: number,
  payload: UpdateReferralSetupPayload
): Promise<ReferralSetup> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  const formData = new FormData();
  formData.append("society_banner[project_name]", payload.society_banner.project_name);
  formData.append("society_banner[project_reference_id]", payload.society_banner.project_reference_id.toString());
  formData.append("society_banner[active]", payload.society_banner.active);
  formData.append("society_banner[is_referral]", payload.society_banner.is_referral);
  
  if (payload.society_banner.title) {
    formData.append("society_banner[title]", payload.society_banner.title);
  }
  if (payload.society_banner.description) {
    formData.append("society_banner[description]", payload.society_banner.description);
  }
  if (payload.society_banner.geo_link) {
    formData.append("society_banner[geo_link]", payload.society_banner.geo_link);
  }
  if (payload.society_banner.details) {
    formData.append("society_banner[details]", payload.society_banner.details);
  }
  if (payload.society_banner.mobile_no) {
    formData.append("society_banner[mobile_no]", payload.society_banner.mobile_no);
  }
  if (payload.society_banner.banner) {
    formData.append("society_banner[banner]", payload.society_banner.banner);
  }
  if (payload.attachments) {
    payload.attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });
  }

  const response = await axios.put(
    `${baseUrl}/crm/admin/referral_setups/${id}.json`,
    formData,
    {
      params: { token },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Delete a referral setup
 */
export const deleteReferralSetup = async (id: number): Promise<void> => {
  const baseUrl = getBaseUrl();
  const token = getToken();

  await axios.delete(
    `${baseUrl}/crm/admin/referral_setups/${id}.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
