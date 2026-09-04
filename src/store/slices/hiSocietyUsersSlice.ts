import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";

export interface HiSocietyUser {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  mobile: string | null;
  full_name: string;
}

export interface HiSocietyUserSociety {
  id: number;
  id_society: string;
  id_user: string;
  role_id: number;
  building_name: string;
  phase_names: string;
  status: string;
  role_name: string;
  created_at: string;
  updated_at: string;
}

export interface HiSocietyUserDetail {
  user: HiSocietyUser;
  user_societies: HiSocietyUserSociety[];
}

export interface HiSocietyRole {
  id: number;
  name: string;
}

export interface HiSocietySociety {
  id: number;
  building_name: string;
  url: string;
  address1: string;
  address2: string;
  area: string;
  city: string;
}

export interface HiSocietyFlat {
  id: number;
  flat_no: string;
  block_no: string | null;
}

export interface HiSocietyCompany {
  id: number;
  name: string;
}

export interface HiSocietySnagProject {
  id: number;
  name: string;
}

export interface HiSocietyPhase {
  id: number;
  name: string;
}

interface HiSocietyUsersState {
  users: HiSocietyUser[];
  pagination: {
    current_page: number;
    total_count: number;
    total_pages: number;
  } | null;
  selectedDetail: HiSocietyUserDetail | null;
  roles: HiSocietyRole[];
  societies: HiSocietySociety[];
  flats: HiSocietyFlat[];
  companies: HiSocietyCompany[];
  snagProjects: HiSocietySnagProject[];
  phases: HiSocietyPhase[];
  phasesLoading: boolean;
  loading: boolean;
  detailLoading: boolean;
  rolesLoading: boolean;
  societiesLoading: boolean;
  flatsLoading: boolean;
  companiesLoading: boolean;
  snagProjectsLoading: boolean;
  error: string | null;
}

const initialState: HiSocietyUsersState = {
  users: [],
  pagination: null,
  selectedDetail: null,
  roles: [],
  societies: [],
  flats: [],
  companies: [],
  snagProjects: [],
  phases: [],
  phasesLoading: false,
  loading: false,
  detailLoading: false,
  rolesLoading: false,
  societiesLoading: false,
  flatsLoading: false,
  companiesLoading: false,
  snagProjectsLoading: false,
  error: null,
};

export const fetchHiSocietyUsers = createAsyncThunk(
  "hiSocietyUsers/fetchList",
  async (
    { page = 1, email = "", mobile = "" }: { page?: number; email?: string; mobile?: string },
    { rejectWithValue }
  ) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const params = new URLSearchParams();
      params.append("token", token);
      params.append("page", String(page));
      if (email) params.append("q[email_cont]", email);
      if (mobile) params.append("q[mobile_cont]", mobile);
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/admin/users.json?${params.toString()}`
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch users");
      }
      return rejectWithValue("Failed to fetch users");
    }
  }
);

export const fetchHiSocietyUserDetail = createAsyncThunk(
  "hiSocietyUsers/fetchDetail",
  async (userId: number, { rejectWithValue }) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/admin/users/user_societies.json?token=${token}&id=${userId}`
      );
      return response.data as HiSocietyUserDetail;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch user detail");
      }
      return rejectWithValue("Failed to fetch user detail");
    }
  }
);

export const fetchHiSocietyRoles = createAsyncThunk(
  "hiSocietyUsers/fetchRoles",
  async (_, { rejectWithValue }) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/admin/roles/roles_for_dropdown.json?token=${token}`
      );
      return response.data as HiSocietyRole[];
    } catch (error: unknown) {
      return rejectWithValue("Failed to fetch roles");
    }
  }
);

export const fetchHiSocietySocieties = createAsyncThunk(
  "hiSocietyUsers/fetchSocieties",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/api/societies/search?q[app_id_eq]=`
      );
      return response.data.societies as HiSocietySociety[];
    } catch (error: unknown) {
      return rejectWithValue("Failed to fetch societies");
    }
  }
);

export const fetchHiSocietyFlats = createAsyncThunk(
  "hiSocietyUsers/fetchFlats",
  async (societyId: number, { rejectWithValue }) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/us_phases/society_flats.json?token=${token}&society_id=${societyId}`
      );
      return response.data.society_flats as HiSocietyFlat[];
    } catch (error: unknown) {
      return rejectWithValue("Failed to fetch flats");
    }
  }
);

export const fetchHiSocietyCompanies = createAsyncThunk(
  "hiSocietyUsers/fetchCompanies",
  async (_, { rejectWithValue }) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/us_phases/companies.json?token=${token}`
      );
      return response.data.companies as HiSocietyCompany[];
    } catch (error: unknown) {
      return rejectWithValue("Failed to fetch companies");
    }
  }
);

export const fetchHiSocietyPhases = createAsyncThunk(
  "hiSocietyUsers/fetchPhases",
  async (societyId: number, { rejectWithValue }) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/us_phases/society_phases.json?token=${token}&society_id=${societyId}`
      );
      return response.data.phases as HiSocietyPhase[];
    } catch (error: unknown) {
      return rejectWithValue("Failed to fetch phases");
    }
  }
);

export const fetchHiSocietySnagProjects = createAsyncThunk(
  "hiSocietyUsers/fetchSnagProjects",
  async (_, { rejectWithValue }) => {
    const token = HI_SOCIETY_CONFIG.TOKEN;
    if (!token) return rejectWithValue("Missing authentication token");
    try {
      const response = await axios.get(
        `${HI_SOCIETY_CONFIG.BASE_URL}/us_phases/snag_projects.json?token=${token}`
      );
      return response.data.snag_projects as HiSocietySnagProject[];
    } catch (error: unknown) {
      return rejectWithValue("Failed to fetch snag projects");
    }
  }
);

const hiSocietyUsersSlice = createSlice({
  name: "hiSocietyUsers",
  initialState,
  reducers: {
    clearDetail: (state) => {
      state.selectedDetail = null;
    },
    clearFlats: (state) => {
      state.flats = [];
    },
    clearPhases: (state) => {
      state.phases = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHiSocietyUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHiSocietyUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchHiSocietyUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHiSocietyUserDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchHiSocietyUserDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDetail = action.payload;
      })
      .addCase(fetchHiSocietyUserDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchHiSocietyRoles.pending, (state) => {
        state.rolesLoading = true;
      })
      .addCase(fetchHiSocietyRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchHiSocietyRoles.rejected, (state) => {
        state.rolesLoading = false;
      })
      .addCase(fetchHiSocietySocieties.pending, (state) => {
        state.societiesLoading = true;
      })
      .addCase(fetchHiSocietySocieties.fulfilled, (state, action) => {
        state.societiesLoading = false;
        state.societies = action.payload;
      })
      .addCase(fetchHiSocietySocieties.rejected, (state) => {
        state.societiesLoading = false;
      })
      .addCase(fetchHiSocietyFlats.pending, (state) => {
        state.flatsLoading = true;
        state.flats = [];
      })
      .addCase(fetchHiSocietyFlats.fulfilled, (state, action) => {
        state.flatsLoading = false;
        state.flats = action.payload;
      })
      .addCase(fetchHiSocietyFlats.rejected, (state) => {
        state.flatsLoading = false;
      })
      .addCase(fetchHiSocietyCompanies.pending, (state) => {
        state.companiesLoading = true;
      })
      .addCase(fetchHiSocietyCompanies.fulfilled, (state, action) => {
        state.companiesLoading = false;
        state.companies = action.payload;
      })
      .addCase(fetchHiSocietyCompanies.rejected, (state) => {
        state.companiesLoading = false;
      })
      .addCase(fetchHiSocietySnagProjects.pending, (state) => {
        state.snagProjectsLoading = true;
      })
      .addCase(fetchHiSocietySnagProjects.fulfilled, (state, action) => {
        state.snagProjectsLoading = false;
        state.snagProjects = action.payload;
      })
      .addCase(fetchHiSocietySnagProjects.rejected, (state) => {
        state.snagProjectsLoading = false;
      })
      .addCase(fetchHiSocietyPhases.pending, (state) => {
        state.phasesLoading = true;
        state.phases = [];
      })
      .addCase(fetchHiSocietyPhases.fulfilled, (state, action) => {
        state.phasesLoading = false;
        state.phases = action.payload;
      })
      .addCase(fetchHiSocietyPhases.rejected, (state) => {
        state.phasesLoading = false;
      });
  },
});

export const { clearDetail, clearFlats, clearPhases } = hiSocietyUsersSlice.actions;
export default hiSocietyUsersSlice.reducer;
