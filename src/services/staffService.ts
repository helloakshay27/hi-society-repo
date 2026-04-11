import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import { toast } from 'sonner';

export interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile: string;
  unit: string;
  department: string;
  workType: string;
  staffId: string;
  vendorName: string;
  validFrom: string;
  validTill: string;
  status: string;
  resourceId?: string;
  resourceType?: string;
  departmentId?: string;
  typeId?: string;
  expiryType?: string;
  expiryValue?: string;
  userId?: number;
}

export interface ScheduleData {
  [key: string]: {
    checked: boolean;
    startTime: string;
    startMinute: string;
    endTime: string;
    endMinute: string;
  };
}

export interface StaffAttachments {
  profilePicture?: File;
  documents?: File[];
  capturedPhoto?: string;
}

export interface Unit {
  id: number;
  unit_name: string;
  active: boolean;
  building_id: number;
  building: {
    id: number;
    name: string;
    site_id: string;
    company_id: string;
    active: boolean;
  };
}

export interface Department {
  id: number;
  department_name: string;
  site_id: number;
  company_id: number;
  active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  site_name: string;
}

export interface DepartmentsResponse {
  departments: Department[];
}

export interface WorkType {
  id: number;
  staff_type: string;
  active: number;
  related_to: string | null;
  resource_id: number | null;
  resource_type: string;
}

export interface WorkTypesResponse {
  success: boolean;
  data: WorkType[];
}

export interface HelpdeskOperation {
  day: string;
  dayofweek: string;
  id: number | null;
  op_of: string | null;
  op_of_id: number | null;
  start_hour: string | null;
  start_min: string | null;
  end_hour: string | null;
  end_min: string | null;
  is_open: boolean | null;
  active: boolean | null;
  show_times: string | null;
}

export interface StaffWorking {
  // Add fields as needed based on staff_workings structure
  [key: string]: unknown;
}

export interface StaffDocument {
  // Add fields as needed based on documents structure
  [key: string]: unknown;
}

export interface SocietyStaffDetails {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  soc_staff_id: string | null;
  vendor_name: string | null;
  active: boolean | null;
  staff_type: string | null;
  status: string;
  resource_id: number;
  resource_type: string;
  department_id: number;
  type_id: number;
  pms_unit_id: number | null;
  created_by: number;
  expiry_type: string;
  expiry_value: number;
  number_verified: boolean;
  otp: string | null;
  notes: string | null;
  valid_from: string;
  expiry: string | null;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  user_id: number;
  unit_name: string | null;
  department_name: string;
  work_type_name: string;
  status_text: string;
  staff_image_url: string;
  qr_code_present: boolean;
  qr_code_url: string | null;
  helpdesk_operations: HelpdeskOperation[];
  staff_workings: StaffWorking[];
  documents: StaffDocument[];
}

export interface SocietyStaffDetailsResponse {
  society_staff?: SocietyStaffDetails;
}

// New API response format for single staff (old format)
export interface NewStaffDetailsResponse {
  society_staff: {
    document: string;
    first_name: string;
    last_name: string;
    email: string | null;
    mobile: string;
    password: string;
    staff_type: string;
    type_id: number | string;
    soc_staff_id: string;
    associate_function_id: string;
    valid_from: string;
    expiry: string;
    status: string | number;
    notes: string;
    helpdesk_operations_attributes: Array<{
      dayofweek: string;
      of_phase: string;
      is_open: string | number;
      start_hour: string;
      start_min: string;
      end_hour: string;
      end_min: string;
    }>;
  };
}

// New CRM API response format for single staff
export interface StaffDetailsApiResponse {
  data: {
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
  };
  message: string;
}

export const staffService = {
  // Fetch units for dropdown
  getUnits: async (): Promise<Unit[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UNITS}`, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch units');
      }

      const units: Unit[] = await response.json();
      return units.filter(unit => unit.active); // Only return active units
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to load units');
      return [];
    }
  },

  // Fetch departments for dropdown
  getDepartments: async (): Promise<Department[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEPARTMENTS}`, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data: DepartmentsResponse = await response.json();
      return data.departments.filter(dept => dept.active); // Only return active departments
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
      return [];
    }
  },

  // Fetch work types for dropdown
  getWorkTypes: async (): Promise<WorkType[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SOCIETY_STAFF_TYPES}`, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch work types');
      }

      const responseData: WorkTypesResponse = await response.json();
      
      if (responseData.success && responseData.data) {
        return responseData.data.filter(type => type.active === 1); // Only return active work types
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching work types:', error);
      toast.error('Failed to load work types');
      return [];
    }
  },

  createSocietyStaff: async (
    staffData: StaffFormData, 
    schedule: ScheduleData, 
    attachments: StaffAttachments = {}
  ) => {
    try {
      console.log('Creating society staff with data:', staffData);
      
      // Convert date format from YYYY-MM-DD to DD/MM/YYYY
      const convertDateFormat = (dateStr: string): string => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      // Convert schedule data to helpdesk_operations_attributes format
      const helpdeskOperations: any[] = [];
      Object.entries(schedule).forEach(([day, dayData]) => {
        if (dayData.checked) {
          helpdeskOperations.push({
            dayofweek: day.toLowerCase(),
            of_phase: 'post_possession',
            is_open: '1',
            start_hour: dayData.startTime.padStart(2, '0'),
            start_min: dayData.startMinute.padStart(2, '0'),
            end_hour: dayData.endTime.padStart(2, '0'),
            end_min: dayData.endMinute.padStart(2, '0'),
          });
        }
      });

      // Convert image to base64
      let documentBase64 = '';
      if (attachments.capturedPhoto) {
        documentBase64 = attachments.capturedPhoto;
      } else if (attachments.profilePicture) {
        // If profilePicture is provided as File, convert to base64
        documentBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(attachments.profilePicture);
        });
      }

      // Build the payload matching the API structure
      const payload = {
        society_staff: {
          document: documentBase64,
          first_name: staffData.firstName,
          last_name: staffData.lastName,
          email: staffData.email,
          mobile: staffData.mobile,
          password: staffData.password,
          staff_type: staffData.workType || 'Personal',
          type_id: staffData.typeId || staffData.workType,
          soc_staff_id: staffData.staffId,
          associate_function_id: '1',
          valid_from: convertDateFormat(staffData.validFrom),
          expiry: convertDateFormat(staffData.validTill),
          status: staffData.status || '1',
          notes: staffData.vendorName || '',
          helpdesk_operations_attributes: helpdeskOperations,
        }
      };

      console.log('Sending payload:', JSON.stringify(payload));

      const response = await fetch(`${API_CONFIG.BASE_URL}/crm/admin/society_staffs.json`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create society staff');
      }

      const result = await response.json();
      toast.success('Society staff created successfully!');
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create society staff';
      console.error('Error creating society staff:', error);
      toast.error(errorMessage);
      throw error;
    }
  },

  // Fetch staff details by ID
  getStaffDetails: async (staffId: string): Promise<SocietyStaffDetails> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/crm/admin/society_staffs/${staffId}.json`, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff details');
      }

      const apiResponse: StaffDetailsApiResponse = await response.json();
      const staff = apiResponse.data;

      // Split name into first and last name
      const nameParts = staff.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Convert new CRM API format to SocietyStaffDetails for compatibility
      const convertedStaff: SocietyStaffDetails = {
        id: staff.id,
        first_name: firstName,
        last_name: lastName,
        full_name: staff.name,
        mobile: staff.mobile,
        email: staff.email || '',
        soc_staff_id: staff.staff_id,
        vendor_name: staff.company_name,
        active: null,
        staff_type: staff.staff_type,
        status: staff.status.value.toString(),
        resource_id: 0,
        resource_type: '',
        department_id: 0,
        type_id: 0,
        pms_unit_id: null,
        created_by: 0,
        expiry_type: 'days',
        expiry_value: 90,
        number_verified: false,
        otp: null,
        notes: '',
        valid_from: '',
        expiry: null,
        created_at: staff.created_at,
        updated_at: staff.created_at,
        user_id: 0,
        unit_name: null,
        department_name: '',
        work_type_name: staff.work_type,
        status_text: staff.status.label,
        staff_image_url: staff.image_url,
        qr_code_present: !!staff.qr_code_url,
        qr_code_url: staff.qr_code_url,
        helpdesk_operations: [],
        staff_workings: [],
        documents: []
      };

      return convertedStaff;
    } catch (error) {
      console.error('Error fetching staff details:', error);
      toast.error('Failed to load staff details');
      throw error;
    }
  },

  // Print QR codes for selected staff (1 or more)
  printQRCodes: async (staffIds: number[]): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/crm/admin/society_staffs/print_qr_code`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          society_staff_ids: staffIds.map(id => id.toString())
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to print QR codes (${response.status}): ${errorText}`);
      }

      // Check if the response is a file (PDF, ZIP, etc.)
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');

      if (contentType && (
        contentType.includes('application/pdf') || 
        contentType.includes('application/zip') || 
        contentType.includes('application/octet-stream') ||
        contentDisposition?.includes('attachment')
      )) {
        // Handle file download
        const blob = await response.blob();
        
        // Extract filename from content-disposition header or use default
        let filename = 'qr-codes.pdf';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(`QR codes downloaded successfully for ${staffIds.length} staff member(s)`);
      } else {
        // Handle JSON response
        const result = await response.json();
        toast.success(`QR codes printed successfully for ${staffIds.length} staff member(s)`);
      }
    } catch (error) {
      console.error('Error printing QR codes:', error);
      toast.error('Failed to print QR codes');
      throw error;
    }
  },

  // Print all QR codes for a resource (society)
  printAllQRCodes: async (resourceId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/crm/admin/society_staffs/print_qr_codes`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          all_society_staffs: 'true',
          resource_id: resourceId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to print all QR codes (${response.status}): ${errorText}`);
      }

      // Check if the response is a file (PDF, ZIP, etc.)
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');

      if (contentType && (
        contentType.includes('application/pdf') || 
        contentType.includes('application/zip') || 
        contentType.includes('application/octet-stream') ||
        contentDisposition?.includes('attachment')
      )) {
        // Handle file download
        const blob = await response.blob();
        
        // Extract filename from content-disposition header or use default
        let filename = 'all-qr-codes.pdf';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('All QR codes downloaded successfully');
      } else {
        // Handle JSON response
        const result = await response.json();
        toast.success('All QR codes printed successfully');
      }
    } catch (error) {
      console.error('Error printing all QR codes:', error);
      toast.error('Failed to print all QR codes');
      throw error;
    }
  },

  // Update staff by ID
  updateStaff: async (
    staffId: string, 
    formData: FormData | StaffFormData,
    schedule?: ScheduleData,
    attachments?: StaffAttachments
  ): Promise<SocietyStaffDetails | Record<string, unknown>> => {
    try {
      // Convert date format from YYYY-MM-DD to DD/MM/YYYY
      const convertDateFormat = (dateStr: string): string => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      };

      // If formData is FormData instance, convert it
      let staffFormData: StaffFormData;
      if (formData instanceof FormData) {
        // Extract data from FormData - this is called from EditStaffPage
        staffFormData = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          mobile: '',
          unit: '',
          department: '',
          workType: '',
          staffId: '',
          vendorName: '',
          validFrom: '',
          validTill: '',
          status: ''
        };
      } else {
        staffFormData = formData;
      }

      // Convert schedule data to helpdesk_operations_attributes format
      const helpdeskOperations: any[] = [];
      if (schedule) {
        Object.entries(schedule).forEach(([day, dayData]) => {
          if (dayData.checked) {
            helpdeskOperations.push({
              dayofweek: day.toLowerCase(),
              of_phase: 'post_possession',
              is_open: '1',
              start_hour: dayData.startTime.padStart(2, '0'),
              start_min: dayData.startMinute.padStart(2, '0'),
              end_hour: dayData.endTime.padStart(2, '0'),
              end_min: dayData.endMinute.padStart(2, '0'),
            });
          }
        });
      }

      // Convert image to base64 if provided
      let documentBase64 = '';
      if (attachments?.capturedPhoto) {
        documentBase64 = attachments.capturedPhoto;
      } else if (attachments?.profilePicture) {
        documentBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(attachments.profilePicture);
        });
      }

      // Build the payload matching the API structure
      const payload = {
        society_staff: {
          document: documentBase64,
          first_name: staffFormData.firstName,
          last_name: staffFormData.lastName,
          email: staffFormData.email,
          mobile: staffFormData.mobile,
          password: staffFormData.password,
          staff_type: staffFormData.workType || 'Personal',
          type_id: staffFormData.typeId || staffFormData.workType,
          soc_staff_id: staffFormData.staffId,
          associate_function_id: '1',
          valid_from: convertDateFormat(staffFormData.validFrom),
          expiry: convertDateFormat(staffFormData.validTill),
          status: staffFormData.status || '1',
          notes: staffFormData.vendorName || '',
          helpdesk_operations_attributes: helpdeskOperations,
        }
      };

      const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_SOCIETY_STAFF}/${staffId}.json`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update society staff';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success('Society staff updated successfully!');
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update society staff';
      console.error('Error updating society staff:', error);
      toast.error(errorMessage);
      throw error;
    }
  },

  // Send OTP for staff number verification
  sendStaffOTP: async (staffId: number): Promise<void> => {
    try {
      console.log('Sending OTP for staff ID:', staffId);

      const requestBody = {
        id: staffId
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEND_STAFF_OTP}`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Send OTP response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }

      const result = await response.json();
      console.log('Send OTP response:', result);
      toast.success('OTP sent successfully to staff member\'s mobile number!');
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      console.error('Error sending OTP:', error);
      toast.error(errorMessage);
      throw error;
    }
  },

  // Verify staff number with OTP
  verifyStaffNumber: async (staffId: number, otp: string): Promise<void> => {
    try {
      console.log('Verifying staff number for ID:', staffId, 'with OTP:', otp);

      const requestBody = {
        id: staffId,
        otp: otp
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_STAFF_NUMBER}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Verify number response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify staff number');
      }

      const result = await response.json();
      console.log('Verify number response:', result);
      toast.success('Staff number verified successfully!');
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify staff number';
      console.error('Error verifying staff number:', error);
      toast.error(errorMessage);
      throw error;
    }
  },
};
