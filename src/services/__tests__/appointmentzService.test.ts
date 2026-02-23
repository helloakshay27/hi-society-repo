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
      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      const result = await updateBlockDay(blockDayId, mockPayload);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `https://test.api.com/crm/admin/block_days/${blockDayId}.json`,
        mockPayload,
        expect.objectContaining({
          params: { token: 'test-token' }
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
