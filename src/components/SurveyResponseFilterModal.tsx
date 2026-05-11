import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextField, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { DateField } from '@mui/x-date-pickers/DateField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { X } from 'lucide-react';
import { API_CONFIG, getFullUrl, getAuthenticatedFetchOptions } from '@/config/apiConfig';
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
    towerId: '',
    flatId: '',
    userId: '',
    queryString: '',
  });

  // Survey titles for dropdown
  const [surveyTitles, setSurveyTitles] = useState<string[]>([]);

  // Location options
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

  // Fetch towers and survey titles on component mount
  useEffect(() => {
    fetchTowers();
    fetchSurveyTitles();
  }, []);

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

  // Fetch towers (blocks)
  const fetchTowers = async () => {
    try {
      setIsLoading(true);
      const idSociety = localStorage.getItem("selectedSocietyId") || "";
      if (!idSociety) return;
      const response = await apiClient.get(`/get_society_blocks.json?society_id=${idSociety}`);
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
      const idSociety = localStorage.getItem("selectedSocietyId") || "";
      if (!towerId) return;
      const response = await apiClient.get(`/get_society_flats.json?society_block_id=${towerId}&society_id=${idSociety}`);
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
      const response = await apiClient.get("/survey_mappings/mappings_list.json?page=1&per_page=1000");
      
      if (API_CONFIG.TOKEN) {
        // Add token to request if needed
        const urlWithToken = new URL(response.config.url || "");
        urlWithToken.searchParams.append("access_token", API_CONFIG.TOKEN);
      }

      const data = response.data;
      const surveyTitles = Array.isArray(data?.survey_mappings) 
        ? data.survey_mappings.map((mapping: { survey_name?: string }) => mapping.survey_name || "")
        : [];
      
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
      // Build query params based on selected tower/flat/user
      const params: string[] = [];
      
      // Add survey title filter if present
      if (filters.surveyTitle) {
        params.push(`q[survey_title_cont]=${encodeURIComponent(filters.surveyTitle)}`);
      }
      
      // Add location hierarchy filters
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
              Filter survey responses by survey title and location hierarchy (tower, flat, user)
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
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
              <div className="grid grid-cols-3 gap-6">
                {/* Tower Selection */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Tower</InputLabel>
                  <Select
                    value={filters.towerId}
                    onChange={(e) => handleInputChange('towerId', e.target.value)}
                    label="Tower"
                    displayEmpty
                    MenuProps={selectMenuProps}
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
                  <InputLabel shrink>User</InputLabel>
                  <Select
                    value={filters.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    label="User"
                    displayEmpty
                    MenuProps={selectMenuProps}
                    disabled={!filters.flatId}
                  >
                    <MenuItem value="">
                      <em>Select User</em>
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
