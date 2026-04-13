import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { HI_SOCIETY_CONFIG } from '@/config/apiConfig';

// ---- Interfaces ----

export interface VisitPurposeItem {
  id: number;
  purpose: string;
  active: number;
}

export interface MimoPurposeItem {
  id: number;
  society_id: number | null;
  purpose: string;
  active: number;
  is_delete: number | null;
  url?: string;
}

export interface StaffTypeItem {
  id: number;
  society_id: number | null;
  staff_type: string;
  related_to?: string;
  active: number;
  is_delete?: number | null;
  url?: string;
}

export interface VisitorSetupResponse {
  society_id: string;
  visit_purposes: VisitPurposeItem[];
  mimo_purposes: MimoPurposeItem[];
  staff_types: StaffTypeItem[];
}

export interface SocietyOption {
  id: number;
  id_society: string;
  society: {
    id: number;
    building_name: string;
  };
}

export interface WorkTypeOption {
  label: string;
  value: string;
}

// ---- Helpers ----

const authHeaders = (): Record<string, string> => ({
  Authorization: getAuthHeader(),
  'Content-Type': 'application/json',
});

// ---- Society dropdown ----

export const fetchApprovedSocieties = async (): Promise<SocietyOption[]> => {
  const token = HI_SOCIETY_CONFIG.TOKEN;
  const url = `${HI_SOCIETY_CONFIG.BASE_URL}${HI_SOCIETY_CONFIG.ENDPOINTS.USER_APPROVED_SOCIETIES}?token=${token}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch societies: ${response.status}`);
  const data = await response.json();
  return data.user_societies || [];
};

// ---- Visitor Setup (list all) ----

export const fetchVisitorSetupData = async (): Promise<VisitorSetupResponse> => {
  const url = getFullUrl('/crm/admin/visitor_setup.json');
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch visitor setup: ${response.status}`);
  const json = await response.json();
  const data = json.data || json;
  return {
    society_id: data.society_id || '',
    visit_purposes: data.visit_purposes || [],
    mimo_purposes: data.mimo_purposes || [],
    staff_types: data.staff_types || [],
  };
};

// ---- Visit Purpose CRUD ----

export const createVisitPurpose = async (
  societyId: string,
  purpose: string,
  active: boolean
) => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.CREATE_VISIT_PURPOSE);
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      soc_visit_purpose: {
        society_id: Number(societyId),
        purpose,
        active,
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create visit purpose: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const editVisitPurpose = async (
  id: number,
  societyId: string,
  purpose: string,
  active: boolean
) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.EDIT_VISIT_PURPOSE}/${id}.json`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      soc_visit_purpose: {
        society_id: Number(societyId),
        purpose,
        active,
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to edit visit purpose: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const getVisitPurposeById = async (id: number) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.EDIT_VISIT_PURPOSE}/${id}.json`);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to get visit purpose: ${response.status}`);
  return response.json();
};

// ---- MIMO Purpose CRUD ----

export const fetchMimoPurposes = async (): Promise<MimoPurposeItem[]> => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.CREATE_MOVE_IN_OUT_PURPOSE);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch MIMO purposes: ${response.status}`);
  const data = await response.json();
  return data.purposes || data || [];
};

export const createMimoPurpose = async (
  societyId: string,
  purpose: string,
  active: boolean
) => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.CREATE_MOVE_IN_OUT_PURPOSE);
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      society_mimo_purpose: {
        society_id: Number(societyId),
        purpose,
        active,
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create MIMO purpose: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const editMimoPurpose = async (
  id: number,
  societyId: string,
  purpose: string,
  active: boolean
) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.EDIT_MOVE_IN_OUT_PURPOSE}/${id}.json`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      society_mimo_purpose: {
        society_id: Number(societyId),
        purpose,
        active,
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to edit MIMO purpose: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// ---- Staff Type CRUD ----

export const fetchStaffTypes = async (): Promise<StaffTypeItem[]> => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.CREATE_WORK_TYPE);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch staff types: ${response.status}`);
  const data = await response.json();
  return data.staff_type || data.staff_types || data || [];
};

export const createStaffType = async (
  societyId: string,
  staffType: string,
  relatedTo: string,
  active: boolean
) => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.CREATE_WORK_TYPE);
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      society_staff_type: {
        society_id: Number(societyId),
        related_to: relatedTo,
        staff_type: staffType,
        active,
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create staff type: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const editStaffType = async (
  id: number,
  societyId: string,
  staffType: string,
  relatedTo: string,
  active: boolean
) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.EDIT_WORK_TYPE}/${id}.json`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      society_staff_type: {
        society_id: Number(societyId),
        related_to: relatedTo,
        staff_type: staffType,
        active,
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to edit staff type: ${response.status} - ${errorText}`);
  }
  return response.json();
};

// ---- Staff Filters (work type options) ----

export const fetchStaffFilters = async (): Promise<WorkTypeOption[]> => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.STAFF_FILTERS);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch staff filters: ${response.status}`);
  const data = await response.json();
  return data.staff_types || [];
};
