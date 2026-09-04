import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { X } from 'lucide-react';
import {
  API_CONFIG,
  getFullUrl,
  getAuthenticatedFetchOptions,
  getAuthHeader,
} from '@/config/apiConfig';
import { toast } from 'sonner';
import { apiClient } from '@/utils/apiClient';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters?: () => void;
}

interface FilterState {
  surveyTitle: string;
  surveyMappingId: string;
  surveyType: string;
  startDate: Date | null;
  endDate: Date | null;
  // Location hierarchy filters
  societyId: string;
  towerId: string;
  flatId: string;
  userId: string;
  // Query string for API calls
  queryString?: string;
}

interface LocationOption {
  id: number;
  name: string;
  flat_no?: string;
}

interface SocietyItem {
  id: number;
  building_name: string;
  url: string;
  address1: string;
  address2: string;
  area: string;
  postcode: number;
  city: string;
  latitude: null;
  longitude: null;
  state: string;
  country: string;
}

export const SurveyResponseFilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onApplyFilters,
  onResetFilters
}) => {
  const [filters, setFilters] = useState<FilterState>({
    surveyTitle: '',
    surveyMappingId: '',
    surveyType: '',
    startDate: null,
    endDate: null,
    societyId: '',
    towerId: '',
    flatId: '',
    userId: '',
    queryString: '',
  });

  // Survey titles for dropdown
  const [surveyTitles, setSurveyTitles] = useState<string[]>([]);

  // Location options
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [towers, setTowers] = useState<LocationOption[]>([]);
  const [flats, setFlats] = useState<LocationOption[]>([]);
  const [users, setUsers] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Field styling from SurveyMappingFilterDialog
  const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    "& .MuiInputBase-input, & .MuiSelect-select": {
      padding: { xs: "8px", sm: "10px", md: "12px" },
    },
  };

  const selectMenuProps = {
    PaperProps: {
      style: {
        maxHeight: 224,
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        boxShadow:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        zIndex: 9999,
      },
    },
    disablePortal: false,
    disableAutoFocus: true,
    disableEnforceFocus: true,
  };

  // Fetch societies, towers and survey titles when the filter opens
  useEffect(() => {
    if (open) {
      fetchSocieties();
      fetchSurveyTitles();
    }
  }, [open]);

  // Fetch towers when society changes
  useEffect(() => {
    if (filters.societyId) {
      fetchTowers(filters.societyId);
    } else {
      setTowers([]);
      setFilters(prev => ({
        ...prev,
        towerId: '',
        flatId: '',
        userId: ''
      }));
      setFlats([]);
      setUsers([]);
    }
  }, [filters.societyId]);

  // Fetch flats when tower changes
  useEffect(() => {
    if (filters.towerId) {
      fetchFlats(filters.towerId);
    } else {
      setFlats([]);
      setFilters(prev => ({
        ...prev,
        flatId: '',
        userId: ''
      }));
      setUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.towerId]);

  // Fetch users when flat changes
  useEffect(() => {
    if (filters.flatId) {
      fetchUsers(filters.flatId);
    } else {
      setUsers([]);
      setFilters(prev => ({
        ...prev,
        userId: ''
      }));
    }
  }, [filters.flatId]);

  // Fetch societies from current user's company
  const fetchSocieties = async () => {
    try {
      setIsLoading(true);
      
      // Get company ID from accounts API using apiClient
      const accountResponse = await apiClient.get("/api/users/account.json");
      const companyId = accountResponse.data?.society?.company_id;
      
      if (!companyId) {
        console.error("No company_id found in account data", accountResponse.data);
        toast.error("Company information not found in account", { duration: 3000 });
        return;
      }
      
      console.log("Fetching societies for company_id:", companyId);
      
      // Fetch societies using company_id
      const societiesResponse = await apiClient.get(`/api/societies/search.json?q[company_id_eq]=${companyId}`);
      const societiesArray = societiesResponse.data?.societies || [];
      
      console.log("Fetched societies:", societiesArray);
      setSocieties(societiesArray);
      
      if (societiesArray.length === 0) {
        toast.warning("No societies found for your account", { duration: 3000 });
      }
    } catch (error) {
      console.error("Error fetching societies:", error);
      toast.error("Failed to fetch societies. Please try again.", { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch towers (blocks)
  const fetchTowers = async (societyId: string) => {
    try {
      setIsLoading(true);
      if (!societyId) return;
      const response = await apiClient.get(`/get_society_blocks.json?society_id=${societyId}`);
      const towersArray = response.data?.society_blocks || [];
      setTowers(towersArray);
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast.error("Failed to fetch towers");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch flats for a tower
  const fetchFlats = async (towerId: string) => {
    try {
      setIsLoading(true);
      if (!towerId) return;
      const response = await apiClient.get(`/get_society_flats.json?society_block_id=${towerId}&society_id=${filters.societyId}`);
      const flatsArray = response.data?.society_flats || [];
      setFlats(flatsArray);
    } catch (error) {
      console.error("Error fetching flats:", error);
      toast.error("Failed to fetch flats");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for a flat
  const fetchUsers = async (flatId: string) => {
    try {
      setIsLoading(true);
      if (!flatId) return;
      const response = await apiClient.get(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}&q[approve_eq]=true`);
      const usersArray = Array.isArray(response.data)
        ? response.data.map(([name, id]: [string, number]) => ({ id, name }))
        : [];
      setUsers(usersArray);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch survey titles for dropdown
  const fetchSurveyTitles = async () => {
    try {
      setIsLoading(true);
      const extractSurveyNames = (data: unknown): string[] => {
        const responseData = data as {
          responses?: unknown;
          survey_mappings?: unknown;
        };
        const rows = Array.isArray(responseData.responses)
          ? responseData.responses
          : responseData.survey_mappings;

        return Array.isArray(rows)
          ? rows.map((row: { survey_name?: string; name?: string }) =>
              row.survey_name || row.name || ""
            )
          : [];
      };

      const fetchSurveyResponsePage = async (page: number) => {
        const url = getFullUrl(
          "/survey_mappings/response_list.json?list_response=true"
        );
        const urlWithParams = new URL(url);
        urlWithParams.searchParams.set("page", page.toString());

        if (API_CONFIG.TOKEN) {
          urlWithParams.searchParams.append("access_token", API_CONFIG.TOKEN);
        }

        const response = await fetch(
          urlWithParams.toString(),
          getAuthenticatedFetchOptions()
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch survey titles: ${response.status} ${response.statusText}`
          );
        }

        return response.json();
      };

      const firstPageData = await fetchSurveyResponsePage(1);
      const totalPages = Number(firstPageData?.pagination?.total_pages) || 1;
      let surveyTitles = extractSurveyNames(firstPageData);

      if (totalPages > 1) {
        const pageResponses = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchSurveyResponsePage(index + 2)
          )
        );

        surveyTitles = [
          ...surveyTitles,
          ...pageResponses.flatMap((responseData) =>
            extractSurveyNames(responseData)
          ),
        ];
      }
      
      const uniqueTitles = Array.from(new Set(surveyTitles.filter((title: string) => Boolean(title?.trim()))));
      setSurveyTitles(uniqueTitles);
    } catch (error) {
      console.error("Error fetching survey titles:", error);
      toast.error("Failed to fetch survey titles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      surveyTitle: '',
      surveyMappingId: '',
      surveyType: '',
      startDate: null,
      endDate: null,
      societyId: '',
      towerId: '',
      flatId: '',
      userId: ''
    });
    // Clear location options
    setFlats([]);
    setUsers([]);
    if (onResetFilters) {
      onResetFilters();
    }
    toast.success('Filters reset successfully');
    // Keep modal open, don't call onClose()
  };

  const handleApply = () => {
    try {
      // Build query params based on selected society/tower/flat/user
      const params: string[] = [];
      
      // Add survey title filter if present
      if (filters.surveyTitle) {
        params.push(`q[survey_title_cont]=${encodeURIComponent(filters.surveyTitle)}`);
      }
      
      // Add society/location hierarchy filters
      if (filters.societyId) params.push(`q[survey_mappings_site_id_eq]=${filters.societyId}`);
      if (filters.towerId) params.push(`q[survey_mappings_building_id_eq]=${filters.towerId}`);
      if (filters.flatId) params.push(`q[survey_mappings_wing_id_eq]=${filters.flatId}`);
      if (filters.userId) params.push(`q[survey_mappings_user_society_id_eq]=${filters.userId}`);

      // Create updated filters object with query string
      const updatedFilters = {
        ...filters,
        queryString: params.length > 0 ? params.join("&") : ""
      };

      console.warn("Applying survey response filters:", updatedFilters);
      onApplyFilters(updatedFilters);
      toast.success('Filters applied successfully');
      onClose();
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Failed to apply filters");
    }
  };

  const handleInputChange = (field: keyof FilterState, value: string | Date | null) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Common field styling for consistent height across desktop and mobile
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      height: '45px',
      borderRadius: '6px',
      '& input': {
        height: '45px',
        padding: '10px 14px',
        boxSizing: 'border-box'
      },
      '&:hover fieldset': {
        borderColor: '#C72030'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#C72030'
      }
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#C72030'
      }
    },
    '& .MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onOpenChange={onClose} modal={false}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white"
          aria-describedby="survey-response-filter-dialog-description"
        >
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              FILTER SURVEY RESPONSES
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
            <div id="survey-response-filter-dialog-description" className="sr-only">
              Filter survey responses by survey title and location hierarchy (tower, flat, Customer)
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Society Selection Section */}
           

            {/* Survey Details Section */}
            <div>
              <h3 className="text-sm font-medium text-[#C72030] mb-4">
                Survey Details
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Survey Title</InputLabel>
                  <Select
                    value={filters.surveyTitle}
                    onChange={(e) => handleInputChange('surveyTitle', e.target.value)}
                    label="Survey Title"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      <em>Select Survey</em>
                    </MenuItem>
                    {surveyTitles.map((title) => (
                      <MenuItem key={title} value={title}>
                        {title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Location Hierarchy Section */}
            <div>
              <h3 className="text-sm font-medium text-[#C72030] mb-4">
                Location Hierarchy
              </h3>
               <div>
              {/* <h3 className="text-sm font-medium text-[#C72030] mb-4">
                Society
              </h3> */}
              <div className="grid grid-cols-1 gap-6">
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Select Society</InputLabel>
                  <Select
                    value={filters.societyId}
                    onChange={(e) => handleInputChange('societyId', e.target.value)}
                    label="Select Society"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      <em>Select Society</em>
                    </MenuItem>
                    {societies.map((society) => (
                      <MenuItem key={society.id} value={society.id.toString()}>
                        {society.building_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
              <div className="grid grid-cols-3 gap-6 mt-6">
                
                {/* Tower Selection */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Tower</InputLabel>
                  <Select
                    value={filters.towerId}
                    onChange={(e) => handleInputChange('towerId', e.target.value)}
                    label="Tower"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    disabled={!filters.societyId}
                  >
                    <MenuItem value="">
                      <em>Select Tower</em>
                    </MenuItem>
                    {towers.map((t) => (
                      <MenuItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Flat Selection */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Flat</InputLabel>
                  <Select
                    value={filters.flatId}
                    onChange={(e) => handleInputChange('flatId', e.target.value)}
                    label="Flat"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    disabled={!filters.towerId}
                  >
                    <MenuItem value="">
                      <em>Select Flat</em>
                    </MenuItem>
                    {flats.map((f) => (
                      <MenuItem key={f.id} value={f.id.toString()}>
                        {f.flat_no || f.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* User Selection */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Customer</InputLabel>
                  <Select
                    value={filters.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    label="User"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    disabled={!filters.flatId}
                  >
                    <MenuItem value="">
                      <em>Select Customer</em>
                    </MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90 flex-1 h-11"
          >
            {isLoading ? "Applying..." : "Apply Filter"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 h-11"
          >
            Clear All
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </LocalizationProvider>
  );
};
