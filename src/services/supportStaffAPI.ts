import { API_CONFIG, getFullUrl, getAuthHeader } from '@/config/apiConfig';

// ---- Interfaces ----

export interface SupportStaffCategoryRaw {
  id: number;
  society_id: number | null;
  name: string;
  estimated_time: string;
  created_by: string;
  active: number;
  created_at: string;
  updated_at: string;
  resource_id: number;
  resource_type: string;
  support_staff_estimated_time_hash: {
    mt: number | null;
    dd: number | null;
    hh: number | null;
    mm: number | null;
  };
  estimated_value: number;
  created_by_id: number;
  icon_url: string | null;
}

export interface DeliveryServiceProviderRaw {
  id: number;
  name: string;
  active: boolean;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  provider_type: string | null;
  created_by: string;
  icon_url: string | null;
}

export interface IconItem {
  id: number;
  icon_type: string;
  active: boolean;
  image_url: string | null;
}

export interface SupportStaffSetupResponse {
  support_staff_category: SupportStaffCategoryRaw[];
  delivery_service_provider: DeliveryServiceProviderRaw[];
  staff_category_icons: IconItem[];
  delivery_service_provider_icons: IconItem[];
}

export interface SupportStaffCategory {
  id: number;
  name: string;
  estimatedTime: string;
  createdOn: string;
  createdBy: string;
  active: boolean;
  iconUrl: string | null;
  // Legacy snake_case fields for SupportStaffPage.tsx compatibility
  estimated_time: string;
  created_on: string;
  created_by: string;
  icon_id?: number;
  icon_image_url?: string | null;
}

export interface DeliveryServiceProvider {
  id: number;
  name: string;
  providerType: string | null;
  active: boolean;
  createdOn: string;
  createdBy: string;
  iconUrl: string | null;
}

// ---- Helpers ----

const authHeaders = (): Record<string, string> => ({
  Authorization: getAuthHeader(),
  'Content-Type': 'application/json',
});

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

// ---- Fetch all setup data (list + icons) ----

export const fetchSupportStaffSetup = async (): Promise<SupportStaffSetupResponse> => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.SUPPORT_STAFF_CATEGORIES);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch support staff setup: ${response.status}`);
  const data = await response.json();
  return {
    support_staff_category: data.support_staff_category || [],
    delivery_service_provider: data.delivery_service_provider || [],
    staff_category_icons: data.staff_category_icons || [],
    delivery_service_provider_icons: data.delivery_service_provider_icons || [],
  };
};

// ---- Transform helpers ----

export const mapStaffCategory = (item: SupportStaffCategoryRaw): SupportStaffCategory => ({
  id: item.id,
  name: item.name,
  estimatedTime: item.estimated_time || '',
  createdOn: formatDate(item.created_at),
  createdBy: item.created_by || '-',
  active: item.active === 1,
  iconUrl: item.icon_url,
  // Legacy fields
  estimated_time: item.estimated_time || '',
  created_on: formatDate(item.created_at),
  created_by: item.created_by || '-',
  icon_id: undefined,
  icon_image_url: item.icon_url,
});

export const mapDeliveryProvider = (item: DeliveryServiceProviderRaw): DeliveryServiceProvider => ({
  id: item.id,
  name: item.name,
  providerType: item.provider_type,
  active: item.active,
  createdOn: formatDate(item.created_at),
  createdBy: item.created_by || '-',
  iconUrl: item.icon_url,
});

// ---- Support Staff Category CRUD ----

export const createSupportStaffCategory = async (data: {
  name: string;
  estimatedTime: number;
  active: boolean;
  iconId?: number;
}) => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.SUPPORT_STAFF_CATEGORIES);
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      support_staff_category: {
        name: data.name,
        estimated_time: data.estimatedTime,
        active: data.active ? 1 : 0,
      },
      ...(data.iconId && { icon_id: data.iconId }),
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create staff category: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const updateSupportStaffCategory = async (
  id: number,
  data: {
    name: string;
    estimatedTime: number;
    active: boolean;
    iconId?: number;
  }
) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.SUPPORT_STAFF_CATEGORY_DETAILS}/${id}.json`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      support_staff_category: {
        name: data.name,
        estimated_time: data.estimatedTime,
        active: data.active ? 1 : 0,
      },
      ...(data.iconId && { icon_id: data.iconId }),
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update staff category: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const fetchSupportStaffCategoryById = async (id: number) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.SUPPORT_STAFF_CATEGORY_DETAILS}/${id}.json`);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch staff category: ${response.status}`);
  return response.json();
};

// ---- Delivery Service Provider CRUD ----

export const fetchDeliveryServiceProviders = async (): Promise<DeliveryServiceProviderRaw[]> => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.DELIVERY_SERVICE_PROVIDERS);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch delivery providers: ${response.status}`);
  const data = await response.json();
  return data.delivery_service_providers || [];
};

export const createDeliveryServiceProvider = async (data: {
  name: string;
  providerType: string;
  active: boolean;
  iconId?: number;
}) => {
  const url = getFullUrl(API_CONFIG.ENDPOINTS.DELIVERY_SERVICE_PROVIDERS);
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      delivery_service_provider: {
        name: data.name,
        provider_type: data.providerType,
        active: data.active,
      },
      ...(data.iconId && { icon_id: data.iconId }),
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create delivery provider: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const updateDeliveryServiceProvider = async (
  id: number,
  data: {
    name: string;
    providerType: string;
    active: boolean;
    iconId?: number;
  }
) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.DELIVERY_SERVICE_PROVIDER_DETAILS}/${id}.json`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      delivery_service_provider: {
        name: data.name,
        provider_type: data.providerType,
        active: data.active,
      },
      ...(data.iconId && { icon_id: data.iconId }),
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update delivery provider: ${response.status} - ${errorText}`);
  }
  return response.json();
};

export const fetchDeliveryServiceProviderById = async (id: number) => {
  const url = getFullUrl(`${API_CONFIG.ENDPOINTS.DELIVERY_SERVICE_PROVIDER_DETAILS}/${id}.json`);
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to fetch delivery provider: ${response.status}`);
  return response.json();
};

// ---- Legacy-compatible fetch for SupportStaffPage.tsx ----

export const fetchSupportStaffCategories = async (): Promise<SupportStaffCategory[]> => {
  const setupData = await fetchSupportStaffSetup();
  return setupData.support_staff_category.map(mapStaffCategory);
};

// ---- Helper for estimated time ----

export const calculateEstimatedTimeMinutes = (days: number, hours: number, minutes: number): number => {
  return (days * 24 * 60) + (hours * 60) + minutes;
};

export const parseEstimatedTime = (estimatedTimeString: string): { days: number; hours: number; minutes: number } => {
  let days = 0;
  let hours = 0;
  let minutes = 0;

  const timeMatches = estimatedTimeString.match(/(\d+)\s*(days?|hours?|hrs?|minutes?|mins?)/gi);
  if (timeMatches) {
    timeMatches.forEach((match) => {
      const value = parseInt(match.match(/\d+/)?.[0] || '0');
      const unit = match.match(/(days?|hours?|hrs?|minutes?|mins?)/i)?.[0].toLowerCase();
      if (unit?.includes('day')) days = value;
      else if (unit?.includes('hour') || unit?.includes('hr')) hours = value;
      else if (unit?.includes('minute') || unit?.includes('min')) minutes = value;
    });
  }

  return { days, hours, minutes };
};
