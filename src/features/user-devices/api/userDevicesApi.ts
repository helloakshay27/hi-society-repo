import { apiClient } from "@/utils/apiClient";

export interface UserDevice {
  id: number;
  user_id: number;
  device_id: number;
  device_type: string | null;
  gcm_key: string | null;
  device_name: string | null;
  device_os_version: string | null;
  apns_dev_cert: string | null;
  apns_prod_cert: string | null;
  sandbox_mode: boolean | null;
  mpns_cert: string | null;
  active: boolean | null;
  app_version: number | string | null;
  app_id: number | null;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface UserDevicesPagination {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_count: number;
}

export interface UserDevicesResponse {
  code: number;
  pagination: UserDevicesPagination;
  user_devices: UserDevice[];
}

// Base URL and bearer token are injected by the apiClient interceptor.
export const getUserDevices = async (
  page: number = 1,
  perPage: number = 20,
  userId?: number | string
): Promise<UserDevicesResponse> => {
  const params: Record<string, string | number> = { page, per_page: perPage };
  if (userId !== undefined && userId !== null && userId !== "") {
    params["q[user_id_eq]"] = userId;
  }
  const response = await apiClient.get<UserDevicesResponse>(
    "/user_devices.json",
    { params }
  );
  return response.data;
};
