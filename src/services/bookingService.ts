import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';
import axios from 'axios';
export interface PaginationInfo {
  current_page: number;
  total_count: number;
  total_pages: number;
}

export interface FacilityBookingResponse {
  id: number;
  created_by_name: string;
  booked_by_name?: string;
  tower?: string;
  flat?: string;
  facility_name: string;
  fac_type: string;
  startdate: string;
  show_schedule: string;
  current_status: string;
  created_at: string;
  company_name: string;
  source: string;
  amount_full: string;
  refunded_amount: string;
  gst: string;
  amount_paid: string;
  pg_state: string;
  member_count: string;
  non_member_count: string;
  guest_count: string;
  tenant_count: string;
  sub_facility_name: string;
}

export interface BookingData {
  id: number;
  bookedBy: string;
  tower: string;
  flat: string;
  bookedFor: string;
  companyName: string;
  facility: string;
  facilityType: string;
  scheduledDate: string;
  scheduledTime: string;
  bookingStatus: 'Confirmed' | 'Pending' | 'Cancelled';
  createdOn: string;
  source: string;
  subFacilityName: string;
  totalAmount: string;
  refundableAmount: string;
  gst: string;
  amountPaid: string;
  paymentStatus: string;
  member: string;
  nonMember: string;
  guest: string;
  tenant: string;
}

export interface FacilityBookingsResponse {
  bookings: BookingData[];
  pagination: PaginationInfo;
}


// Helper function to format date from ISO string to "9 June 2025" format
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return '-';
  }
};

// Helper function to safely get value or return "-"
const safeValue = (value: any): string => {
  if (value === 0) return "0";
  return value?.toString().trim() ? value.toString() : "-";
};

// Transform API response to BookingData format
const transformBookingData = (apiData: FacilityBookingResponse): BookingData => {
  return {
    id: apiData.id,
    bookedBy: safeValue(apiData.booked_by_name),
    tower: safeValue(apiData.tower),
    flat: safeValue(apiData.flat),
    bookedFor: safeValue(apiData.booked_by_name),
    facility: safeValue(apiData.facility_name),
    subFacilityName: safeValue(apiData.sub_facility_name),
    facilityType: safeValue(apiData.fac_type),
    scheduledDate: formatDate(apiData.startdate),
    scheduledTime: safeValue(apiData.show_schedule),
    createdOn: formatDate(apiData.created_at),
    totalAmount: safeValue(apiData.amount_full),
    refundableAmount: safeValue(apiData.refunded_amount),
    gst: safeValue(apiData.gst),
    amountPaid: safeValue(apiData.amount_paid),
    paymentStatus: safeValue(apiData.pg_state),
    bookingStatus: (apiData.current_status as 'Confirmed' | 'Pending' | 'Cancelled') || 'Pending',
    member: safeValue(apiData.member_count),
    nonMember: safeValue(apiData.non_member_count),
    guest: safeValue(apiData.guest_count),
    tenant: safeValue(apiData.tenant_count),
  };
};

export const fetchFacilityBookings = async ({ baseUrl, token, pageSize, currentPage, userId }): Promise<FacilityBookingsResponse[]> => {
  try {
    const params = new URLSearchParams({
      per_page: String(pageSize),
      page: String(currentPage),
    });

    if (userId) {
      params.append("q[user_id_eq]", userId);
    }

    const response = await axios.get(
      `https://${baseUrl}/crm/admin/facility_bookings.json?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(response)

    const data = response.data;

    const bookingsRaw = data.data || [];
    const pagination = data.meta || {
      current_page: 1,
      total_count: bookingsRaw.length,
      total_pages: 1,
    };

    if (!Array.isArray(bookingsRaw)) {
      console.error('Expected array of bookings, got:', typeof bookingsRaw);
      return { bookings: [], pagination };
    }

    const bookings = bookingsRaw.map(transformBookingData);

    return { bookings, pagination };
  } catch (error) {
    console.error('Error fetching facility bookings:', error);
    throw error;
  }
};