import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

export interface ComplaintMode {
  id: number;
  society_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  active: boolean | null;
  of_phase: string;
  of_atype: string;
}

export interface UpdateComplaintModeRequest {
  id: number;
  name: string;
}

// Fetch complaint mode by ID
export const fetchComplaintModeById = async (id: number): Promise<ComplaintMode | null> => {
  try {
    const response = await fetch(getFullUrl('/crm/admin/helpdesk_categories.json'), {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch complaint modes: ${response.status}`);
    }

    const data = await response.json();
    const complaintModes: ComplaintMode[] = Array.isArray(data.complaint_modes) ? data.complaint_modes : [];
    return complaintModes.find(mode => mode.id === id) || null;
  } catch (error) {
    console.error('Error fetching complaint mode by ID:', error);
    throw error;
  }
};

// Update complaint mode
export const updateComplaintMode = async (id: number, name: string): Promise<ComplaintMode> => {
  try {
    const formData = new FormData();
    formData.append('complaint_mode[name]', name);

    const response = await fetch(getFullUrl(`/crm/admin/helpdesk_categories/update_complaint_mode.json?id=${id}`), {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to update complaint mode: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating complaint mode:', error);
    throw error;
  }
};

// Fetch all complaint modes
export const fetchAllComplaintModes = async (): Promise<ComplaintMode[]> => {
  try {
    const response = await fetch(getFullUrl('/crm/admin/helpdesk_categories.json'), {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch complaint modes: ${response.status}`);
    }

    const data = await response.json();
    const complaintModes: ComplaintMode[] = Array.isArray(data.complaint_modes) ? data.complaint_modes : [];
    return complaintModes;
  } catch (error) {
    console.error('Error fetching complaint modes:', error);
    throw error;
  }
};
