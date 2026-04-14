import { API_CONFIG } from '@/config/apiConfig';
import { getAuthHeader } from '@/config/apiConfig';

// New API response structure
export interface NewSocietyStaff {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  staff_id: string;
  work_type: string;
  company_name: string;
  created_at: string;
  created_at_formatted: string;
  staff_type: string;
  image_url: string;
  qr_code_url: string;
  qr_code_page_url: string;
  documents: unknown[];
  staff_documents: unknown[];
  gallery_documents: unknown[];
  status: {
    value: number;
    label: string;
  };
  associated_flats: unknown[];
  actions: {
    view_url: string;
    edit_url: string;
  };
}

// Old API response structure for backward compatibility
export interface SocietyStaff {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  soc_staff_id: string | null;
  vendor_name: string | null;
  active: number | null;
  full_name: string;
  email: string | null;
  unit_name: string | null;
  department_name: string | null;
  work_type_name: string | null;
  status_text: string;
  user_id: number | null;
  number_verified: boolean;
  staff_image_url: string | null;
  qr_code_url: string | null;
  staff_workings: unknown[];
  helpdesk_operations: unknown[];
  created_at: string;
  updated_at: string;
  valid_from: string | null;
  expiry: string | null;
}

export interface StaffFilters {
  search?: string;
  work_type_id?: number;
  staff_type?: string;
  function_id?: number;
  tower_id?: number;
  flat_id?: number;
  status?: string | number;
  company_name?: string;
}

export interface PaginationInfo {
  current_page?: number;
  page?: number;
  total_count: number;
  total_pages: number;
  per_page?: number;
}

export interface SocietyStaffsResponse {
  data?: NewSocietyStaff[];
  society_staffs?: SocietyStaff[];
  pagination: PaginationInfo;
  message?: string;
}

export const fetchSocietyStaffs = async (page: number = 1, searchQuery?: string, filters?: StaffFilters): Promise<SocietyStaffsResponse> => {
  try {
    const params = new URLSearchParams();

    if (page > 1) {
      params.append('page', page.toString());
    }

    const search = filters?.search || searchQuery;
    if (search?.trim()) {
      params.append('q[full_name_or_first_name_or_last_name_or_mobile_or_soc_staff_id_cont]', search.trim());
    }

    if (filters?.work_type_id) {
      params.append('q[type_id_in][]', String(filters.work_type_id));
    }
    if (filters?.staff_type) {
      params.append('q[staff_type_in][]', filters.staff_type);
    }
    if (filters?.function_id) {
      params.append('q[associate_function_id_in][]', String(filters.function_id));
    }
    if (filters?.tower_id) {
      params.append('q[staff_workings_society_flat_society_block_id_eq]', String(filters.tower_id));
    }
    if (filters?.flat_id) {
      params.append('q[staff_workings_society_flat_id_in][]', String(filters.flat_id));
    }
    if (filters?.status !== undefined && filters.status !== '') {
      params.append('q[active_eq]', String(filters.status));
    }
    if (filters?.company_name) {
      params.append('q[vendor_name_cont]', filters.company_name);
    }

    const queryString = params.toString();
    const url = `${API_CONFIG.BASE_URL}/crm/admin/society_staffs.json${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SocietyStaffsResponse = await response.json();
    
    // Normalize pagination object
    if (data.pagination) {
      data.pagination.current_page = data.pagination.page || data.pagination.current_page || 1;
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching society staffs:', error);
    throw error;
  }
};

// Enhanced search function for society staffs
export const searchSocietyStaffs = async (searchQuery: string, page: number = 1, filters?: StaffFilters): Promise<SocietyStaffsResponse> => {
  return fetchSocietyStaffs(page, searchQuery, filters);
};
