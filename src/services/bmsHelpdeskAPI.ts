// BMS Helpdesk API Service
import { getFullUrl, getAuthenticatedFetchOptions } from '@/config/apiConfig';

export interface BMSTicketResponse {
  id: number;
  ticket_number: string;
  complaint_type: string;
  issue_type?: string;
  category?: string;
  sub_category?: string;
  heading: string;
  description?: string;
  priority?: string;
  severity?: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  assigned_to?: string;
  of_phase?: string;
}

export interface BMSTicketSummary {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
}

export interface BMSTicketFilters {
  status?: string;
  priority?: string;
  complaint_type?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface BMSCreateTicketData {
  of_phase: string;
  complaint_type: string;
  category_type_id: number;
  issue_type_id: number;
  heading: string;
  complaint_mode_id: number;
  priority?: string;
  severity?: string;
  sub_category_id?: number;
  active: number;
  action: boolean;
  IsDelete: boolean;
}

class BMSHelpdeskAPI {
  /**
   * Get paginated list of BMS helpdesk tickets
   */
  async getTickets(filters?: BMSTicketFilters): Promise<{ tickets: BMSTicketResponse[]; total: number; page: number; per_page: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.status) queryParams.append('q[status_eq]', filters.status);
      if (filters?.priority) queryParams.append('q[priority_eq]', filters.priority);
      if (filters?.complaint_type) queryParams.append('q[complaint_type_eq]', filters.complaint_type);
      if (filters?.search) queryParams.append('q[heading_or_ticket_number_cont]', filters.search);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString());

      // Filter by of_phase = 'bms'
      queryParams.append('q[of_phase_eq]', 'bms');

      const url = getFullUrl(`/crm/admin/complaints.json?${queryParams.toString()}`);
      const options = getAuthenticatedFetchOptions('GET');
      
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        tickets: data.complaints || data.tickets || [],
        total: data.total || 0,
        page: data.page || 1,
        per_page: data.per_page || 25
      };
    } catch (error) {
      console.error('Error fetching BMS tickets:', error);
      throw error;
    }
  }

  /**
   * Get ticket summary counts
   */
  async getTicketSummary(): Promise<BMSTicketSummary> {
    try {
      const url = getFullUrl('/crm/admin/complaints/summary.json?of_phase=bms');
      const options = getAuthenticatedFetchOptions('GET');
      
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch ticket summary: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        total: data.total || 0,
        open: data.open || 0,
        in_progress: data.in_progress || 0,
        closed: data.closed || 0
      };
    } catch (error) {
      console.error('Error fetching ticket summary:', error);
      // Return default values on error
      return {
        total: 0,
        open: 0,
        in_progress: 0,
        closed: 0
      };
    }
  }

  /**
   * Get single ticket details by ID
   */
  async getTicketById(ticketId: string | number): Promise<BMSTicketResponse> {
    try {
      const url = getFullUrl(`/crm/admin/complaints/${ticketId}.json`);
      const options = getAuthenticatedFetchOptions('GET');
      
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch ticket details: ${response.statusText}`);
      }

      const data = await response.json();
      return data.complaint || data.ticket || data;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  }

  /**
   * Create new BMS helpdesk ticket
   */
  async createTicket(ticketData: Partial<BMSCreateTicketData> & { of_phase: string }, files?: File[]): Promise<BMSTicketResponse> {
    try {
      const formData = new FormData();

      // Add ticket data fields with complaint[] prefix
      formData.append('complaint[of_phase]', ticketData.of_phase);
      formData.append('complaint[complaint_type]', ticketData.complaint_type);
      formData.append('complaint[category_type_id]', ticketData.category_type_id.toString());
      formData.append('complaint[issue_type_id]', ticketData.issue_type_id.toString());
      formData.append('complaint[heading]', ticketData.heading);
      formData.append('complaint[complaint_mode_id]', ticketData.complaint_mode_id.toString());
      formData.append('complaint[active]', ticketData.active.toString());
      formData.append('complaint[action]', ticketData.action.toString());
      formData.append('complaint[IsDelete]', ticketData.IsDelete.toString());

      if (ticketData.priority) {
        formData.append('complaint[priority]', ticketData.priority);
      }
      
      if (ticketData.severity) {
        formData.append('complaint[severity]', ticketData.severity);
      }

      if (ticketData.sub_category_id) {
        formData.append('complaint[sub_category_id]', ticketData.sub_category_id.toString());
      }

      // Add files if any
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`complaint[attachments][]`, file);
        });
      }

      const url = getFullUrl('/crm/admin/complaints.json');
      const options = getAuthenticatedFetchOptions('POST');
      
      // Remove Content-Type header to let browser set it with boundary for FormData
      if (options.headers) {
        delete options.headers['Content-Type'];
      }
      
      options.body = formData;

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.statusText}`);
      }

      const data = await response.json();
      return data.complaint || data.ticket || data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }

  /**
   * Update existing ticket
   */
  async updateTicket(ticketId: string | number, updateData: Partial<BMSCreateTicketData>): Promise<BMSTicketResponse> {
    try {
      const formData = new FormData();

      // Add only the fields that are being updated
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(`complaint[${key}]`, value.toString());
        }
      });

      const url = getFullUrl(`/crm/admin/complaints/${ticketId}.json`);
      const options = getAuthenticatedFetchOptions('PUT');
      
      if (options.headers) {
        delete options.headers['Content-Type'];
      }
      
      options.body = formData;

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to update ticket: ${response.statusText}`);
      }

      const data = await response.json();
      return data.complaint || data.ticket || data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  }

  /**
   * Delete ticket
   */
  async deleteTicket(ticketId: string | number): Promise<void> {
    try {
      const url = getFullUrl(`/crm/admin/complaints/${ticketId}.json`);
      const options = getAuthenticatedFetchOptions('DELETE');

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to delete ticket: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }

  /**
   * Export tickets to CSV/Excel
   */
  async exportTickets(filters?: BMSTicketFilters): Promise<Blob> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.status) queryParams.append('q[status_eq]', filters.status);
      if (filters?.priority) queryParams.append('q[priority_eq]', filters.priority);
      if (filters?.complaint_type) queryParams.append('q[complaint_type_eq]', filters.complaint_type);
      
      // Filter by of_phase = 'bms'
      queryParams.append('q[of_phase_eq]', 'bms');
      queryParams.append('format', 'csv');

      const url = getFullUrl(`/crm/admin/complaints/export.json?${queryParams.toString()}`);
      const options = getAuthenticatedFetchOptions('GET');

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to export tickets: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting tickets:', error);
      throw error;
    }
  }
}

export const bmsHelpdeskAPI = new BMSHelpdeskAPI();
