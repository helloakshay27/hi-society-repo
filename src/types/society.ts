// Society-related type definitions

export interface EstateBuilder {
  id: number;
  name: string;
  address?: string;
  about?: string;
  active: number;
  image?: string;
}

export interface SuperSociety {
  id: number;
  name: string;
  description?: string;
  status: number;
  active: number;
  company_id?: number;
  region_id?: number;
  country_id?: number;
}

export interface Society {
  id: number;
  building_name: string;
  url?: string;
  address1?: string;
  address2?: string;
  area?: string;
  postcode?: number;
  city?: string;
  latitude?: string | null;
  longitude?: string | null;
  state?: string;
  country?: string;
  active: number;
  IsDelete: number;
  super_society_id?: number;
  created_at: string;
  updated_at: string;
  images?: {
    splash?: string;
    logo?: string;
    logo2?: string;
    scheduler_logo?: string;
  };
  super_society?: SuperSociety;
  bill_to?: string | null;
  test_project?: boolean;
  app_id?: string | null;
  registration?: string;
  residents?: string;
  established?: string;
  description?: string;
  soc_office_timing?: string | null;
  lifts?: number | null;
  floors?: number | null;
  wings?: number | null;
  flats?: number;
  parking_av?: number | null;
  guest_parking_av?: number | null;
  security_guard?: number | null;
  lift_av?: boolean | null;
  gym_av?: boolean | null;
  swimming_pool?: boolean | null;
  gas_pipeline?: boolean | null;
  garden?: boolean | null;
  kids_play_area?: boolean | null;
  club_house?: boolean | null;
  community_hall?: boolean | null;
  temple?: boolean | null;
  approve?: number;
  approved_by?: {
    id: number | null;
    name: string;
  };
  approved_on?: string | null;
  comment?: string | null;
  allow_view_toggle?: boolean;
  attached_documents?: any[];
  // Additional fields from create API
  company_id?: number;
  builder_id?: number;
  headquarter_id?: number;
  region_id?: number;
  zone_id?: number;
  no_of_devices?: number;
  device_rental_type?: string;
  device_rental_rate?: number;
  billing_term?: string;
  billing_rate?: number;
  billing_cycle?: string;
  start_date?: string;
  end_date?: string;
  project_type?: string;
}

export interface SocietyListResponse {
  societies?: Society[];
  pagination?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface SocietyDetailResponse {
  society?: Society;
}

export interface SocietyFormData {
  building_name: string;
  bill_to?: string;
  builder_id?: number;
  headquarter_id?: number;
  region_id?: number;
  zone_id?: number;
  app_id?: string;
  url?: string;
  no_of_devices?: number;
  device_rental_type?: string;
  device_rental_rate?: number;
  address1?: string;
  address2?: string;
  area?: string;
  postcode?: number;
  city?: string;
  state?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  billing_term?: string;
  billing_rate?: number;
  billing_cycle?: string;
  start_date?: string;
  end_date?: string;
  registration?: string;
  approve?: string;
  comment?: string;
  project_type?: string;
  allow_view_toggle?: boolean;
  active?: boolean;
  description?: string;
  IsDelete?: number;
  super_society_id?: number;
  company_id?: number;
}

export interface Headquarter {
  id: number;
  name: string;
  country_id?: number;
  active?: boolean;
}

export interface Region {
  id: number;
  name: string;
  headquarter_id?: number;
  active?: boolean;
}

export interface Zone {
  id: number;
  name: string;
  region_id?: number;
  active?: boolean;
}

export interface SocietyFilters {
  building_name?: string;
  builder_id?: number;
  city?: string;
  state?: string;
  project_type?: string;
  active?: boolean;
}
