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

export interface SiteScheduleDashboardData {
  code?: number;
  total?: number;
  pending?: number;
  scheduled?: number;
  site_visited?: number;
  revisit_requested?: number;
  closed?: number;
  cancelled?: number;
  [key: string]: any;
}

/**
 * Fetch dashboard stats for site schedule requests
 */
export const getSiteScheduleDashboard = async (): Promise<SiteScheduleDashboardData> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/site_schedule_requests/dashboard`,
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
 * Fetch site schedule requests with pagination and optional filters
 */
export const getSiteScheduleRequests = async (
  page: number = 1,
  filters?: {
    tower?: string;
    flat?: string;
    rm_user_id?: string | number;
    status?: string;
    scheduled_on?: string;
    created_on?: string;
    [key: string]: any;
  }
): Promise<SiteScheduleRequestsResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/site_schedule_requests.json`,
    {
      params: {
        token,
        page,
        ...filters,
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
  const token = localStorage.getItem("token");

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
  const token = localStorage.getItem("token");

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

export interface VirtualRequestItem {
  id: number;
  status: string;
  status_label?: string;
  request_type?: string;
  created_at: string;
  scheduled_on?: string;
  selected_slot?: string;
  meeting_link?: string;
  meetings?: string;
  can_edit?: boolean;
  society_flat?: {
    id: number;
    flat_no: string;
    tower?: {
      id: number;
      name: string;
    };
  };
  scheduled_by?: {
    id: number;
    name: string;
  };
  rm_assigned?: {
    id: number;
    name: string;
  };
}

export interface VirtualRequestTower {
  id: number;
  name: string;
}

export interface VirtualRequestsResponse {
  pagination?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
  virtual_requests?: VirtualRequestItem[];
  site_schedule_requests?: VirtualRequestItem[];
  towers?: VirtualRequestTower[];
}

export interface SocietyFlatOption {
  id: number;
  flat_no: string;
  [key: string]: unknown;
}

export interface SocietyBlockOption {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/**
 * Fetch society blocks/towers
 */
export const getSocietyBlocks = async (): Promise<SocietyBlockOption[]> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();
  const societyId = localStorage.getItem("selectedSocietyId");

  try {
    const response = await axios.get(
      `https://${baseUrl}/crm/admin/society_blocks.json`,
      {
        params: {
          token,
          ...(societyId ? { society_id: societyId } : {}),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.society_blocks || response.data?.blocks || [];
  } catch (error) {
    console.warn("Could not fetch society blocks:", error);
    return [];
  }
};

/**
 * Fetch flats for a given tower (society block) — used by the Virtual Requests
 * "Select Flat" dropdown, populated after a Tower is picked.
 */
export const getSocietyFlatsByTower = async (
  towerId: number | string
): Promise<SocietyFlatOption[]> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();

  const response = await axios.get(
    `https://${baseUrl}/rm_users/society_flats.json`,
    {
      params: {
        token,
        "q[society_block_id_eq]": towerId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data?.society_flats || [];
};

export interface CreateVirtualRequestPayload {
  tower_id?: number | string;
  tower_name?: string;
  flat_id?: number | string;
  flat_no?: string;
  request_type?: string;
  reason?: string;
  scheduled_on?: string;
  selected_slot?: string;
  [key: string]: any;
}

/**
 * Fetch virtual requests list
 */
export const getVirtualRequests = async (
  page: number = 1,
  filters?: Record<string, any>
): Promise<VirtualRequestsResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(
      `https://${baseUrl}/crm/admin/virtual_requests.json`,
      {
        params: {
          token,
          page,
          ...filters,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    // Fallback if virtual_requests endpoint is on site_schedule_requests?type=virtual
    const response = await axios.get(
      `https://${baseUrl}/crm/admin/site_schedule_requests.json`,
      {
        params: {
          token,
          page,
          request_type: "virtual",
          ...filters,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }
};

/**
 * Create virtual request
 */
export const createVirtualRequest = async (
  payload: CreateVirtualRequestPayload
): Promise<{ success: boolean; message: string; data?: any }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `https://${baseUrl}/crm/admin/virtual_requests.json`,
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
  active: boolean | null;
  created_at: string;
  updated_at: string;
  admin: boolean;
  full_name: string;
  // Individual user endpoint returns these; list endpoint returns only full_name
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  mobile: string;
  user_type: string | null;
  role_id?: number;
  section?: string;
  society_building_name?: string;
}

export interface CRMRole {
  id: number;
  name: string;
  display_name?: string;
}

export interface CRMRolesResponse {
  success: boolean;
  data: CRMRole[];
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
  user: {
    firstname: string;
    lastname: string;
    email: string;
    mobile: string;
    password?: string;
    password_confirmation?: string;
    user_type: string;
    role_id?: number;
    role?: string;
  };
}

export interface UpdateRMUserPayload {
  user: {
    firstname?: string;
    lastname?: string;
    mobile?: string;
    user_type?: string;
    role_id?: number;
    role?: string;
    section?: string;
    active?: boolean;
  };
}

/**
 * Fetch CRM roles for user assignment
 */
export const getCRMRoles = async (): Promise<CRMRolesResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/roles.json`,
    {
      params: { token },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Fetch RM users list
 */
export const getRMUsers = async (page: number = 1): Promise<RMUsersResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());

  const token = localStorage.getItem("token");

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/rm_users.json`,
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
 * Fetch every RM user page for dropdowns that need the full RM Config list.
 */
export const getAllRMUsers = async (): Promise<RMUserData[]> => {
  const firstPage = await getRMUsers(1);
  const totalPages = firstPage.pagination?.total_pages || 1;

  if (totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      getRMUsers(index + 2)
    )
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((response) => response.data),
  ];
};

/**
 * Fetch single RM user by ID
 */
export const getRMUserById = async (userId: number): Promise<{ success: boolean; data: RMUserData }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/rm_users/${userId}.json`,
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
  rm_user_id: number;
}

/**
 * Create new RM user
 */
export const createRMUser = async (
  payload: CreateRMUserPayload
): Promise<CreateRMUserResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");
  const selectedSocietyId = localStorage.getItem("selectedSocietyId");
  const user = payload.user;

  // Build JSON payload matching exact API spec
  const requestPayload: any = {
    user: {
      firstname: user.firstname || "",
      first_name: user.firstname || "",
      lastname: user.lastname || "",
      last_name: user.lastname || "",
      email: user.email?.trim(),
      mobile: user.mobile?.trim(),
      password: user.password,
      password_confirmation: user.password_confirmation || user.password,
      user_type: user.user_type,
      ...(user.role_id ? { role_id: user.role_id } : {}),
      role: user.role || user.user_type,
      society_id: selectedSocietyId ? Number(selectedSocietyId) : undefined,
    },
  };

  console.warn("Creating RM User with payload:", JSON.stringify(requestPayload, null, 2));

  try {
    const response = await axios.post(
      `https://${baseUrl}/crm/admin/rm_users.json`,
      requestPayload,
      {
        params: {
          token,
          ...(selectedSocietyId ? { society_id: selectedSocietyId } : {}),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.warn("Create RM User response:", response.data);
    return response.data;
  } catch (error: any) {
    const errData = error?.response?.data;
    let detailedMsg = "Failed to create user";
    if (errData) {
      if (typeof errData === "string") {
        detailedMsg = errData;
      } else if (Array.isArray(errData.errors)) {
        detailedMsg = errData.errors.join(", ");
      } else if (errData.errors && typeof errData.errors === "object") {
        detailedMsg = Object.entries(errData.errors)
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      } else if (errData.error) {
        detailedMsg = typeof errData.error === "string" ? errData.error : JSON.stringify(errData.error);
      } else if (errData.message) {
        detailedMsg = errData.message;
      }
    }
    if (error) error.customMessage = detailedMsg;
    console.error("Create RM User error:", {
      status: error?.response?.status,
      data: error?.response?.data,
      message: detailedMsg,
    });
    throw error;
  }
};

export const updateRMUser = async (
  userId: number,
  payload: UpdateRMUserPayload
): Promise<{ success: boolean; message: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const updatedPayload = {
    user: {
      firstname: payload.user.firstname,
      lastname: payload.user.lastname,
      mobile: payload.user.mobile,
      user_type: payload.user.user_type,
      role_id: payload.user.role_id,
      role: payload.user.role,
    }
  };

  const response = await axios.patch(
    `https://${baseUrl}/crm/admin/rm_users/${userId}.json`,
    updatedPayload,
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

export interface UpdateRMUserActiveStatusResponse {
  success: boolean;
  message: string;
  rm_user_id: number;
  active: boolean | null;
}

export const updateRMUserActiveStatus = async (
  userId: number
): Promise<UpdateRMUserActiveStatusResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.put(
    `https://${baseUrl}/crm/admin/rm_users/${userId}/update_active`,
    null,
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
  rm_user_id: number;
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
    rm_user_id?: number;
    rm_user_ids: number[];
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

export interface UpdateSiteSchedulePayload {
  site_schedule: {
    rm_user_id: number;
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
  const token = localStorage.getItem("token");

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
  const token = localStorage.getItem("token");

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
  const token =  localStorage.getItem("token");
  const requestPayload = {
    ...payload,
    rm_user_ids: payload.site_schedule.rm_user_ids,
  };

  const response = await axios.post(
    `https://${baseUrl}/crm/admin/site_schedules.json`,
    requestPayload,
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
  payload: UpdateSiteSchedulePayload
): Promise<{ success: boolean; message: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token =  localStorage.getItem("token");

  const response = await axios.patch(
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
  blocked_dates: string;
  block_day: {
    resource_id: number;
    resource_type: string;
    active: boolean;
  };
}

export interface UpdateBlockDayPayload {
  blocked_dates?: string;
  blocked_date?: string;
  block_day: {
    resource_id?: number;
    resource_type?: string;
    active?: boolean;
  };
}

/**
 * Fetch block days list
 */
export const getBlockDays = async (page: number = 1): Promise<BlockDaysResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/block_days.json`,
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
 * Create new block day
 */
export const createBlockDay = async (
  payload: CreateBlockDayPayload
): Promise<CreateBlockDayResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

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
  const token = localStorage.getItem("token");

  const response = await axios.patch(
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

// Manage Flats Interfaces and Services
export interface AppointmentzFlat {
  id: number;
  tower: string;
  flat: string;
  flat_type: string;
  payment_status: string;
  master_status: string;
  current_level: string;
  current_status: string;
  rm_assigned: string;
  email_sent_by: string;
  email_sent_at: string;
  site_visits: number;
  invite_sent?: boolean;
  snags_count: number;
  customer_name?: string;
  customer_code?: string;
  customer_status?: string;
  carpet_area?: string | number;
  built_up_area?: string | number;
  floor?: string;
  wing?: string;
  possession?: boolean;
  sold?: boolean;
  status?: boolean;
}

export interface ManageFlatsFilters {
  tower?: string;
  flat?: string;
  payment_status?: string;
  rm_assigned?: string;
  search?: string;
}

export interface ManageFlatsResponse {
  society_flats?: any[];
  flats?: AppointmentzFlat[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
  };
}

/**
 * Fetch manage flats list with filters and pagination
 */
export const getAppointmentzManageFlats = async (
  page: number = 1,
  filters?: ManageFlatsFilters
): Promise<ManageFlatsResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");
  const selectedSocietyId = localStorage.getItem("selectedSocietyId");

  try {
    const params: Record<string, any> = {
      token,
      page,
      society_id: selectedSocietyId,
    };

    if (filters?.tower) {
      params["q[society_block_id_eq]"] = filters.tower;
    }
    if (filters?.flat) {
      params["q[flat_no_eq]"] = filters.flat;
    }
    if (filters?.rm_assigned) {
      params["q[rm_user_id_eq]"] = filters.rm_assigned;
    }
    if (filters?.payment_status) {
      params["q[payment_status_eq]"] = filters.payment_status;
    }
    if (filters?.search) {
      params["q[search_all_fields_cont]"] = filters.search;
    }

    const response = await axios.get(
      `https://${baseUrl}/crm/admin/society_flats.json`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.warn("Could not fetch flats from API:", error);
    throw error;
  }
};

/**
 * Fetch single flat details by ID
 */
export const getAppointmentzFlatDetails = async (flatId: string | number): Promise<any> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `https://${baseUrl}/crm/admin/society_flats/${flatId}.json`,
    {
      params: { token },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export interface SendFlatInvitePayload {
  scheduled_on?: string;
  selected_slot?: string;
  [key: string]: any;
}

/**
 * Send invite to flat
 */
export const sendFlatInviteEmail = async (
  flatId: string | number,
  payload?: SendFlatInvitePayload
): Promise<any> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const body = payload || {};

  try {
    const response = await axios.post(
      `https://${baseUrl}/crm/admin/society_flats/${flatId}/send_invite.json`,
      body,
      {
        params: { token },
        headers,
      }
    );
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      try {
        const altResponse = await axios.post(
          `https://${baseUrl}/crm/admin/society_flats/${flatId}/send_invite`,
          body,
          {
            params: { token },
            headers,
          }
        );
        return altResponse.data;
      } catch {
        const siteReqResponse = await axios.post(
          `https://${baseUrl}/site_schedule_requests/send_invite`,
          { society_flat_id: flatId, ...body },
          {
            params: { token },
            headers,
          }
        );
        return siteReqResponse.data;
      }
    }
    throw err;
  }
};

export interface ScheduleSetupSettings {
  d1_start_days: number;
  d1_end_days: number;
  d2_start_days: number;
  d2_end_days: number;
  site_schedule_start_days: number;
  email_template?: string;
}

export interface ScheduleSetupAssets {
  logo_url: string | null;
  backdrop_url: string | null;
}

export interface ScheduleSetupResponse {
  code: number;
  settings: ScheduleSetupSettings;
  assets: ScheduleSetupAssets;
  site_schedules: SiteSchedule[];
}

/**
 * Fetch Schedule Setup screen data (D1/D2 days, RM slot-days limit, email template, logo & backdrop URLs)
 */
export const getScheduleSetup = async (): Promise<ScheduleSetupResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();

  const response = await axios.get(
    `https://${baseUrl}/rm_users/site_schedules`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  return response.data;
};

export interface UpdateScheduleSetupDaysPayload {
  start_days?: number | string;
  end_days?: number | string;
  start_days2?: number | string;
  end_days2?: number | string;
  email_template?: string;
}

/**
 * Save the "Schedule Setup" panel (D1 + D2 start/end days or email template)
 */
export const updateScheduleSetupDays = async (
  payload: UpdateScheduleSetupDaysPayload
): Promise<{ success: boolean; message?: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();

  const response = await axios.put(
    `https://${baseUrl}/rm_users/site_schedules/update_system_constant`,
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
 * Save the Email Template string in system constants
 */
export const updateEmailTemplate = async (
  emailTemplate: string
): Promise<{ success: boolean; message?: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();

  const response = await axios.put(
    `https://${baseUrl}/rm_users/site_schedules/update_system_constant`,
    {
      email_template: emailTemplate,
    },
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
 * Save the "RM Slot Days limit" panel
 */
export const updateRMSlotDaysLimit = async (
  siteScheduleStartDays: number | string
): Promise<{ success: boolean; message?: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();
  const societyId = localStorage.getItem("selectedSocietyId");

  const response = await axios.patch(
    `https://${baseUrl}/update_site_schedule_start_days`,
    {
      id: societyId ? Number(societyId) : undefined,
      society: { site_schedule_start_days: siteScheduleStartDays },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export type SiteSchedulerAssetRelation = "SiteSchedulerLogo" | "SiteSchedulerBackdrop";

/**
 * Upload the Site Scheduler (Email) Logo or Backdrop image
 */
export const uploadSiteSchedulerAsset = async (
  file: File,
  relation: SiteSchedulerAssetRelation
): Promise<{ success: boolean; message?: string }> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = getToken();
  const societyId = localStorage.getItem("selectedSocietyId");

  const formData = new FormData();
  formData.append("attachfile[relation]", relation);
  if (societyId) {
    formData.append("attachfile[relation_id]", societyId);
  }
  formData.append("attachfile[document]", file);

  const response = await axios.post(
    `https://${baseUrl}/update_site_scheduler_logo`,
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

// Public Customer Booking Interfaces & API Services
export interface PublicSiteSchedulePageResponse {
  code: number;
  state: "cancelled" | "already_placed" | "bookable" | "reschedule" | string;
  created_by?: {
    id: number;
    firstname: string;
    [key: string]: any;
  };
  site_schedule_request?: {
    id: number;
    status: string;
    scheduled_at: string | null;
    [key: string]: any;
  };
  society_flat?: {
    id: number;
    flat_new_str: string;
    [key: string]: any;
  };
  created_by_rm?: boolean;
  booking_window?: {
    start_date?: string;
    end_date?: string;
    start_days?: number;
    max_days?: number;
    [key: string]: any;
  };
  backdrop_url?: string | null;
  message?: string;
  [key: string]: any;
}

export interface PublicSiteSlot {
  id: number;
  ampm_timing: string;
  slot_color_code: string;
  slot_disabled: boolean;
  [key: string]: any;
}

export interface PublicSiteSchedulesResponse {
  slots?: PublicSiteSlot[];
  [key: string]: any;
}

export interface BookPublicSiteSchedulePayload {
  site_schedule_request: {
    scheduled_at: string; // DD/MM/YYYY
    site_schedule_id: number;
  };
}

export interface BookPublicSiteScheduleResponse {
  code: number;
  message?: string;
  site_schedule_request?: any;
  errors?: string[];
  [key: string]: any;
}

/**
 * Step 2: Load public booking page by encryptedId and createdBy
 */
export const getPublicSiteSchedulePage = async (
  encryptedId: string,
  createdBy?: string,
  type?: string
): Promise<PublicSiteSchedulePageResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const params: Record<string, any> = {};
  if (createdBy) params.created_by = createdBy;
  if (type) params.type = type;
  if (token) params.token = token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(
    `https://${baseUrl}/site_schedule_requests/${encryptedId}/schedule`,
    {
      params,
      headers,
    }
  );

  return response.data;
};

/**
 * Step 3: Fetch available site schedule slots for a given date in DD/MM/YYYY format
 */
export const getPublicSiteSchedulesForDate = async (
  id: number | string,
  dateStr: string // DD/MM/YYYY
): Promise<PublicSiteSchedulesResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const params: Record<string, any> = {
    date: dateStr,
  };
  if (token) params.token = token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(
    `https://${baseUrl}/site_schedule_requests/${id}/get_site_schedules`,
    {
      params,
      headers,
    }
  );

  return response.data;
};

/**
 * Step 4: Book site visit slot
 */
export const bookPublicSiteScheduleSlot = async (
  id: number | string,
  scheduledAt: string, // DD/MM/YYYY
  siteScheduleId: number
): Promise<BookPublicSiteScheduleResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const params: Record<string, any> = {};
  if (token) params.token = token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const payload: BookPublicSiteSchedulePayload = {
    site_schedule_request: {
      scheduled_at: scheduledAt,
      site_schedule_id: siteScheduleId,
    },
  };

  const response = await axios.put(
    `https://${baseUrl}/site_schedule_requests/${id}/book`,
    payload,
    {
      params,
      headers,
    }
  );

  return response.data;
};

// Behalf of User Schedule Interfaces & APIs (Schedule Visit Modal)
export interface BehalfOfUserScheduleResponse {
  code?: number;
  created_by?: {
    id: number;
    firstname?: string;
    name?: string;
    [key: string]: any;
  };
  rm_user?: {
    id: number;
    name?: string;
    [key: string]: any;
  };
  society_blocks?: Array<{
    id: number | string;
    name: string;
    [key: string]: any;
  }>;
  towers?: Array<{
    id: number | string;
    name: string;
    [key: string]: any;
  }>;
  booking_window?: {
    start_date?: string;
    end_date?: string;
    start_days?: number;
    max_days?: number;
    [key: string]: any;
  };
  backdrop_url?: string | null;
  [key: string]: any;
}

export interface SocietyFlatOptionItem {
  id: number | string;
  flat_no?: string;
  name?: string;
  flat_new_str?: string;
  [key: string]: any;
}

export interface SocietyFlatsByBlockResponse {
  society_flats?: SocietyFlatOptionItem[];
  flats?: SocietyFlatOptionItem[];
  [key: string]: any;
}

export interface SocietyFlatDetailsResponse {
  id?: number | string;
  flat_no?: string;
  flat_new_str?: string;
  customer_name?: string;
  owner_name?: string;
  bill_to_party?: string;
  rm_user_name?: string;
  rm_assigned?: {
    id?: number;
    name?: string;
    firstname?: string;
    [key: string]: any;
  } | string;
  rm_user?: {
    id?: number;
    name?: string;
    [key: string]: any;
  };
  society_flat?: any;
  [key: string]: any;
}

export interface RMAvailableSlotItem {
  id: number;
  ampm_timing: string;
  slot_color_code?: string;
  slot_disabled?: boolean;
  [key: string]: any;
}

export interface RMAvailableSlotsResponse {
  slots?: RMAvailableSlotItem[];
  [key: string]: any;
}

export interface CreateSiteSchedulePayload {
  society_flat_id: number | string;
  site_schedule_request: {
    scheduled_at: string; // DD/MM/YYYY
    site_schedule_id: number | string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CreateSiteScheduleResponse {
  code?: number;
  message?: string;
  site_schedule_request?: any;
  errors?: string[];
  [key: string]: any;
}

/**
 * Step 1: Page/Modal load (RM info, towers, booking window, backdrop)
 * GET /site_schedule_requests/behalf_of_user_schedule
 */
export const getBehalfOfUserScheduleData = async (): Promise<BehalfOfUserScheduleResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const response = await axios.get(
    `https://${baseUrl}/site_schedule_requests/behalf_of_user_schedule`,
    {
      params: { token },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Step 2: Select Tower -> Select Flat
 * GET /site_schedule_requests/society_flats.json?q[society_block_id_eq]={tower_id}&token={token}&rm_user_id={rm_user_id}
 */
export const getSocietyFlatsByBlockId = async (
  towerId?: string | number,
  rmUserId?: string | number
): Promise<SocietyFlatsByBlockResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  let effectiveRmUserId = rmUserId;
  if (!effectiveRmUserId) {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed?.id) effectiveRmUserId = parsed.id;
      }
    } catch {}
  }

  const params: Record<string, any> = {
    token,
  };
  if (towerId && towerId !== "all" && towerId !== "none") {
    params["q[society_block_id_eq]"] = towerId;
  }
  if (effectiveRmUserId) {
    params.rm_user_id = effectiveRmUserId;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await axios.get(
      `https://${baseUrl}/site_schedule_requests/society_flats.json`,
      {
        params,
        headers,
      }
    );

    if (Array.isArray(response.data)) {
      return { society_flats: response.data };
    }
    return response.data;
  } catch {
    const fallbackResponse = await axios.get(
      `https://${baseUrl}/site_schedule_requests/society_flats`,
      {
        params,
        headers,
      }
    );

    if (Array.isArray(fallbackResponse.data)) {
      return { society_flats: fallbackResponse.data };
    }
    return fallbackResponse.data;
  }
};

/**
 * Step 3: Flat selected -> Owner name + Assigned RM
 * GET /site_schedule_requests/society_flat_details?society_flat_id={id}
 */
export const getSocietyFlatDetailsById = async (
  flatId: string | number
): Promise<SocietyFlatDetailsResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const response = await axios.get(
    `https://${baseUrl}/site_schedule_requests/society_flat_details`,
    {
      params: {
        token,
        society_flat_id: flatId,
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
 * Step 4: Date picked -> Available slots
 * GET /site_schedule_requests/rm_available_slots?date=DD/MM/YYYY
 */
export const getRMAvailableSlots = async (
  dateStr: string // DD/MM/YYYY
): Promise<RMAvailableSlotsResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const response = await axios.get(
    `https://${baseUrl}/site_schedule_requests/rm_available_slots`,
    {
      params: {
        token,
        date: dateStr,
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
 * Step 5: Submit Schedule Visit
 * POST /create_site_schedules
 */
export const createSiteScheduleVisit = async (
  payload: CreateSiteSchedulePayload
): Promise<CreateSiteScheduleResponse> => {
  const baseUrl = normalizeBaseUrl(getBaseUrl());
  const token = localStorage.getItem("token") || "";

  const response = await axios.post(
    `https://${baseUrl}/create_site_schedules`,
    payload,
    {
      params: { token },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

