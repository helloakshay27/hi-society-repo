/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import axios from 'axios';
import { 
  getSiteScheduleRequests, 
  getRMUsers, 
  createBlockDay, 
  updateBlockDay 
} from '../appointmentzService';

vi.mock('axios');
const mockedAxios = axios as Mocked<typeof axios>;

describe('appointmentzService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('baseUrl', 'test.api.com');
    localStorage.setItem('token', 'test-token');
  });

  describe('getSiteScheduleRequests', () => {
    it('should fetch site schedule requests with correct params', async () => {
      const mockData = {
        data: {
          site_schedule_requests: [],
          pagination: { total_pages: 1, total_count: 0 }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await getSiteScheduleRequests(1);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/crm/admin/site_schedule_requests.json',
        expect.objectContaining({
          params: { token: 'test-token', page: 1 }
        })
      );
      expect(result).toEqual(mockData.data);
    });
  });

  describe('getRMUsers', () => {
    it('should fetch RM users', async () => {
      const mockData = {
        data: {
          success: true,
          data: [],
          pagination: { current_page: 1, total_pages: 1, total_count: 0 }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockData);

      const result = await getRMUsers(1);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/crm/admin/rm_users.json',
        expect.objectContaining({
          params: { token: 'test-token', page: 1 }
        })
      );
      expect(result).toEqual(mockData.data);
    });
  });

  describe('createBlockDay', () => {
    it('should send correct payload for creating block day', async () => {
      const mockPayload = {
        blocked_dates: '2023-10-10',
        block_day: {
          resource_id: 1,
          resource_type: 'RmUser',
          active: true
        }
      };
      const mockResponse = { data: { success: true, message: 'Created' } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await createBlockDay(mockPayload);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.api.com/crm/admin/block_days.json',
        mockPayload,
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateBlockDay', () => {
    it('should send correct payload for updating block day status', async () => {
      const blockDayId = 123;
      const mockPayload = {
        block_day: {
          active: false
        }
      };
      const mockResponse = { data: { success: true, message: 'Updated' } };
      mockedAxios.patch.mockResolvedValueOnce(mockResponse);

      const result = await updateBlockDay(blockDayId, mockPayload);

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        `https://test.api.com/crm/admin/block_days/${blockDayId}.json`,
        mockPayload,
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getSiteScheduleDashboard', () => {
    it('should fetch dashboard statistics with baseUrl and token', async () => {
      const mockData = {
        data: {
          code: 200,
          total: 10,
          pending: 2,
          scheduled: 3,
          site_visited: 2,
          revisit_requested: 1,
          closed: 1,
          cancelled: 1
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockData);

      const { getSiteScheduleDashboard } = await import('../appointmentzService');
      const result = await getSiteScheduleDashboard();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/crm/admin/site_schedule_requests/dashboard',
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockData.data);
    });
  });

  describe('Public Site Schedule Booking APIs', () => {
    it('getPublicSiteSchedulePage should call schedule endpoint with encryptedId and params', async () => {
      const mockResponse = {
        data: {
          code: 200,
          state: 'bookable',
          created_by: { id: 78190, firstname: 'Asha' },
          site_schedule_request: { id: 4521, status: 'pending', scheduled_at: null },
          society_flat: { id: 8891, flat_new_str: 'A-1204' },
          booking_window: { start_days: 8, max_days: 28 }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const { getPublicSiteSchedulePage } = await import('../appointmentzService');
      const result = await getPublicSiteSchedulePage('C0C941D6', 'C68BC75D', 'reschedule');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/C0C941D6/schedule',
        expect.objectContaining({
          params: expect.objectContaining({
            created_by: 'C68BC75D',
            type: 'reschedule'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('getPublicSiteSchedulesForDate should fetch slots for given numeric id and date string', async () => {
      const mockResponse = {
        data: {
          slots: [
            { id: 17, ampm_timing: '10:00 AM to 11:00 AM', slot_color_code: 'green', slot_disabled: false },
            { id: 18, ampm_timing: '11:00 AM to 12:00 PM', slot_color_code: 'red', slot_disabled: true }
          ]
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const { getPublicSiteSchedulesForDate } = await import('../appointmentzService');
      const result = await getPublicSiteSchedulesForDate(4521, '25/08/2026');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/4521/get_site_schedules',
        expect.objectContaining({
          params: expect.objectContaining({
            date: '25/08/2026'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('bookPublicSiteScheduleSlot should put scheduled_at and site_schedule_id to book endpoint', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'Site visit successfully scheduled.'
        }
      };
      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const { bookPublicSiteScheduleSlot } = await import('../appointmentzService');
      const result = await bookPublicSiteScheduleSlot(4521, '25/08/2026', 17);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/4521/book',
        {
          site_schedule_request: {
            scheduled_at: '25/08/2026',
            site_schedule_id: 17
          }
        },
        expect.anything()
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Behalf of User Schedule Visit APIs', () => {
    it('getBehalfOfUserScheduleData should call behalf_of_user_schedule endpoint', async () => {
      const mockResponse = {
        data: {
          code: 200,
          created_by: { id: 78190, firstname: 'Asha' },
          rm_user: { id: 78190, name: 'Asha' },
          society_blocks: [{ id: 12, name: 'Tower A' }],
          booking_window: { start_days: 8, max_days: 28 }
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const { getBehalfOfUserScheduleData } = await import('../appointmentzService');
      const result = await getBehalfOfUserScheduleData();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/behalf_of_user_schedule',
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('getSocietyFlatsByBlockId should fetch flats with block id filter', async () => {
      const mockResponse = {
        data: {
          society_flats: [{ id: 8891, flat_no: 'A-1204' }]
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const { getSocietyFlatsByBlockId } = await import('../appointmentzService');
      const result = await getSocietyFlatsByBlockId(12);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/society_flats.json',
        expect.objectContaining({
          params: expect.objectContaining({
            'q[society_block_id_eq]': 12
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('getSocietyFlatDetailsById should fetch owner and RM details for flat id', async () => {
      const mockResponse = {
        data: {
          id: 8891,
          customer_name: 'John Doe',
          rm_user_name: 'Asha Sharma'
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const { getSocietyFlatDetailsById } = await import('../appointmentzService');
      const result = await getSocietyFlatDetailsById(8891);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/society_flat_details',
        expect.objectContaining({
          params: expect.objectContaining({
            society_flat_id: 8891
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('getRMAvailableSlots should fetch available slots for given date', async () => {
      const mockResponse = {
        data: {
          slots: [
            { id: 17, ampm_timing: '10:00 AM to 11:00 AM', slot_color_code: 'green' }
          ]
        }
      };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const { getRMAvailableSlots } = await import('../appointmentzService');
      const result = await getRMAvailableSlots('25/08/2026');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/site_schedule_requests/rm_available_slots',
        expect.objectContaining({
          params: expect.objectContaining({
            date: '25/08/2026'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('createSiteScheduleVisit should POST payload to create_site_schedules', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'Site visit successfully scheduled.'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const { createSiteScheduleVisit } = await import('../appointmentzService');
      const payload = {
        society_flat_id: 8891,
        site_schedule_request: {
          scheduled_at: '25/08/2026',
          site_schedule_id: 17
        }
      };
      const result = await createSiteScheduleVisit(payload);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.api.com/create_site_schedules',
        payload,
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('sendFlatInviteEmail should POST to send_invite endpoint and return response', async () => {
      const mockResponse = {
        data: {
          code: 200,
          message: 'Invite sent successfully.'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const { sendFlatInviteEmail } = await import('../appointmentzService');
      const result = await sendFlatInviteEmail(8891);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test.api.com/crm/admin/society_flats/8891/send_invite.json',
        {},
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
