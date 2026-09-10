import { useEffect, useState } from 'react';
import {
  manageUsersDashboardAPI,
  ManageUsersDashboard,
  EMPTY_MANAGE_USERS_DASHBOARD,
} from '@/services/manageUsersDashboardAPI';
import { TicketsDashboardDateRange } from './types';

/**
 * User / download counters for the Manage Users tab — the `dashboard` block on
 * `/crm/admin/user_societies.json`, the same call `ManageUsersPage` makes.
 */
export const useManageUsersOverview = (
  dateRange: TicketsDashboardDateRange,
  enabled = true
): ManageUsersDashboard | null => {
  const [data, setData] = useState<ManageUsersDashboard | null>(EMPTY_MANAGE_USERS_DASHBOARD);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    manageUsersDashboardAPI
      .getDashboard({ fromDate: dateRange.startDate, toDate: dateRange.endDate })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY_MANAGE_USERS_DASHBOARD);
      });

    return () => {
      cancelled = true;
    };
  }, [dateRange.startDate, dateRange.endDate, enabled]);

  return data;
};
