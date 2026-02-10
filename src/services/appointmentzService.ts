import axios from "axios";

const getBaseUrl = () => localStorage.getItem("baseUrl") || "";
const getToken = () => localStorage.getItem("token") || "";

// Helper to normalize baseUrl - remove https:// if present
const normalizeBaseUrl = (baseUrl: string): string => {
  if (!baseUrl) return "";
  // Remove protocol if present
  return baseUrl.replace(/^https?:\/\//, "");
};

export interface SiteScheduleRequest {
  id: number;
  status: string;
  status_label: string;
  scheduled_on: string;
  created_at: string;
  selected_slot: string;
  can_edit: boolean;
  society_flat: {
    id: number;
    flat_no: string;
    tower: {
      id: number;
      name: string;
    };
  };
  scheduled_by: {
    id: number;
    name: string;
  };
  rm_assigned: {
    id: number;
    name: string;
  };
}

export interface SiteScheduleRequestsResponse {
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
  site_schedule_requests: SiteScheduleRequest[];
}

export interface UpdateSiteScheduleRequestPayload {
  status?: string;
  reason?: string;
  [key: string]: string | undefined;
}

export interface UpdateSiteScheduleRequestResponse {
  success: boolean;
  message: string;
}

/**
 * Fetch site schedule requests with pagination
 */
export const getSiteScheduleRequests = async (
  page: number = 1
): Promise<SiteScheduleRequestsResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/site_schedule_requests.json`,
    {
      params: {
        token,
        page,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Export site requests data as CSV
 */
export const exportSiteRequestsData = async (): Promise<Blob> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  try {
    const response = await axios.get(
      `https://${baseUrl}/crm/admin/site_schedule_requests/export_site_requests_data.csv`,
      {
        params: {
          token,
        },
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
    // Ignore 500 errors as per requirement
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 500) {
        console.warn("Export API returned 500, ignoring as per requirement");
        throw new Error("Export temporarily unavailable");
      }
    }
    throw error;
  }
};

/**
 * Update site schedule request
 */
export const updateSiteScheduleRequest = async (
  requestId: number,
  payload: UpdateSiteScheduleRequestPayload
): Promise<UpdateSiteScheduleRequestResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.put(
    `https://${baseUrl}/crm/admin/site_schedule_requests/${requestId}.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// RM Users interfaces and functions
export interface RMUserData {
  id: number;
  user_id: number;
  society_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  admin: boolean;
}

export interface RMUsersResponse {
  success: boolean;
  data: RMUserData[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface CreateRMUserPayload {
  rm_user: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    password?: string;
    user_type: string;
    section: string;
  };
}

export interface UpdateRMUserPayload {
  rm_user: {
    first_name?: string;
    last_name?: string;
    mobile?: string;
    user_type?: string;
    section?: string;
    active?: boolean;
  };
}

/**
 * Fetch RM users list
 */
export const getRMUsers = async (): Promise<RMUsersResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  // Using the new token provided by the user
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/rm_users.json`,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export interface CreateRMUserResponse {
  success: boolean;
  message: string;
  rm_user_ids: number;
}

/**
 * Create new RM user
 */
export const createRMUser = async (
  payload: CreateRMUserPayload
): Promise<CreateRMUserResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.post(
    `https://${baseUrl}/crm/admin/rm_users.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Update RM user
 */
export const updateRMUser = async (
  userId: number,
  payload: UpdateRMUserPayload
): Promise<{ success: boolean; message: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.put(
    `https://${baseUrl}/spree/manage/rm_users/${userId}.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// Slot Config interfaces and functions
export interface SiteSchedule {
  id: number;
  society_id: number;
  rm_user_ids: number;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  ampm_timing: string;
}

export interface SiteSchedulesResponse {
  success: boolean;
  data: SiteSchedule[];
}

export interface CreateSiteSchedulePayload {
  site_schedule: {
    rm_user_ids: number;
    start_date?: string;
    end_date?: string;
    start_hour: string | number;
    start_minute: string | number;
    end_hour: string | number;
    end_minute: string | number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

/**
 * Fetch site schedules list
 */
export const getSiteSchedules = async (): Promise<SiteSchedulesResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/site_schedules.json`,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch single site schedule by ID
 */
export const getSiteSchedule = async (
  scheduleId: number
): Promise<{ site_schedule: SiteSchedule }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/site_schedules/${scheduleId}.json`,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Create new site schedule
 */
export const createSiteSchedule = async (
  payload: CreateSiteSchedulePayload
): Promise<{ success: boolean; message: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.post(
    `https://${baseUrl}/crm/admin/site_schedules.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Update site schedule
 */
export const updateSiteSchedule = async (
  scheduleId: number,
  payload: CreateSiteSchedulePayload
): Promise<{ success: boolean; message: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.put(
    `https://${baseUrl}/crm/admin/site_schedules/${scheduleId}.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

// Block Days interfaces and functions
export interface BlockDay {
  id: number;
  rm_user: {
    id: number;
    name: string;
  };
  blocked_date: string;
  created_on: string;
  active: boolean;
}

export interface BlockDaysResponse {
  success: boolean;
  message: string;
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  data: BlockDay[];
}

export interface CreateBlockDayResponse {
  success: boolean;
  message: string;
  created_dates: string[];
}

export interface UpdateBlockDayResponse {
  success: boolean;
  message: string;
  id: number;
}


export interface CreateBlockDayPayload {
  block_day: {
    rm_user_ids: number;
    blocked_date: string;
  };
}

export interface UpdateBlockDayPayload {
  block_day: {
    active?: boolean;
  };
}

/**
 * Fetch block days list
 */
export const getBlockDays = async (): Promise<BlockDaysResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/block_days.json`,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Create new block day
 */
export const createBlockDay = async (
  payload: CreateBlockDayPayload
): Promise<CreateBlockDayResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.post(
    `https://${baseUrl}/crm/admin/block_days.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Update block day
 */
export const updateBlockDay = async (
  blockDayId: number,
  payload: UpdateBlockDayPayload
): Promise<UpdateBlockDayResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = "O08MAh4ADTSweyKwK8zwR5CDVlzKYKLcu825jhnvEjI";

  const response = await axios.put(
    `https://${baseUrl}/crm/admin/block_days/${blockDayId}.json`,
    payload,
    {
      params: {
        token,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
