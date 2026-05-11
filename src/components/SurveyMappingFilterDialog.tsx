import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";
import { X } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { API_CONFIG } from "@/config/apiConfig";

interface SurveyMappingFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: SurveyMappingFilters) => void;
}

export interface SurveyMappingFilters {
  siteIds?: string[];
  buildingIds?: string[];
  wingIds?: string[];
  floorIds?: string[];
  areaIds?: string[];
  roomIds?: string[];
  surveyTitle?: string;
  // Query string for /survey_mappings/mappings_list.json (optional)
  mappingListQuery?: string;
  // Convenience fields mapped to backend query params
  buildingIdEq?: string;
  wingIdEq?: string;
  userSocietyIdEq?: string;
}

interface LocationOption {
  id: number;
  name: string;
}

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

export const SurveyMappingFilterDialog: React.FC<SurveyMappingFilterDialogProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyTitles, setSurveyTitles] = useState<{id: number, name: string}[]>([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedWing, setSelectedWing] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  // Location options
  const [sites, setSites] = useState<LocationOption[]>([]);
  const [buildings, setBuildings] = useState<LocationOption[]>([]);
  const [wings, setWings] = useState<LocationOption[]>([]);
  const [floors, setFloors] = useState<LocationOption[]>([]);
  const [areas, setAreas] = useState<LocationOption[]>([]);
  const [rooms, setRooms] = useState<LocationOption[]>([]);

  // Tower / Flat / User options (from UserQRSetup pattern)
  const [towers, setTowers] = useState<LocationOption[]>([]);
  const [flats, setFlats] = useState<LocationOption[]>([]);
  const [users, setUsers] = useState<LocationOption[]>([]);

  const [selectedTower, setSelectedTower] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Fetch sites and survey titles on component mount
  useEffect(() => {
    fetchSites();
    fetchSurveyTitles();
    fetchTowers();
  }, []);

  // Fetch buildings when site changes
  useEffect(() => {
    if (selectedSite) {
      fetchBuildings(selectedSite);
    } else {
      setBuildings([]);
      setSelectedBuilding("");
      setWings([]);
      setSelectedWing("");
      setFloors([]);
      setSelectedFloor("");
      setAreas([]);
      setSelectedArea("");
      setRooms([]);
      setSelectedRoom("");
    }
  }, [selectedSite]);

  // Fetch wings when building changes
  useEffect(() => {
    if (selectedBuilding) {
      fetchWings(selectedBuilding);
    } else {
      setWings([]);
      setSelectedWing("");
      setFloors([]);
      setSelectedFloor("");
      setAreas([]);
      setSelectedArea("");
      setRooms([]);
      setSelectedRoom("");
    }
  }, [selectedBuilding]);

  // Fetch floors when wing changes
  useEffect(() => {
    if (selectedWing) {
      fetchFloors(selectedWing);
    } else {
      setFloors([]);
      setSelectedFloor("");
      setAreas([]);
      setSelectedArea("");
      setRooms([]);
      setSelectedRoom("");
    }
  }, [selectedWing]);

  // Fetch areas when floor changes
  useEffect(() => {
    if (selectedFloor) {
      fetchAreas(selectedFloor);
    } else {
      setAreas([]);
      setSelectedArea("");
      setRooms([]);
      setSelectedRoom("");
    }
  }, [selectedFloor]);

  // Fetch rooms when area changes
  useEffect(() => {
    if (selectedArea) {
      fetchRooms(selectedArea);
    } else {
      setRooms([]);
      setSelectedRoom("");
    }
  }, [selectedArea]);

  // Fetch flats when tower changes
  useEffect(() => {
    if (selectedSite /* placeholder to keep existing logic */) {
      // no-op to avoid lint warning
    }
  }, []);

  // Fetch flats when tower changes (tower is stored in selectedBuilding variable for reuse)
  useEffect(() => {
    if (selectedBuilding) {
      // keep existing behavior if building was used elsewhere
    }
  }, [selectedBuilding]);

  // Fetch flats/users when tower/flat selections change for the new UI
  useEffect(() => {
    if (selectedTower) {
      // reset dependent selections then fetch flats
      setSelectedFlat("");
      setSelectedUser("");
      setUsers([]);
      fetchFlats(selectedTower);
    } else {
      setFlats([]);
      setUsers([]);
      setSelectedFlat("");
      setSelectedUser("");
    }
  }, [selectedTower]);

  useEffect(() => {
    if (selectedFlat) {
      // reset selected user then fetch users for the flat
      setSelectedUser("");
      fetchUsers(selectedFlat);
    } else {
      setUsers([]);
      setSelectedUser("");
    }
  }, [selectedFlat]);

  // New: fetch flats when tower (selectedSiteTower) changes - we'll use selectedSite variable for tower id mapping in this component

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/pms/sites.json");
      // Handle both array and object with sites property
      const sitesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.sites || []);
      setSites(sitesData);
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast.error("Failed to fetch sites");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch survey titles for dropdown
  const fetchSurveyTitles = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/survey_mappings/response_list.json?page=1&per_page=1000");
      
      if (API_CONFIG.TOKEN) {
        // Add token to request if needed
        const urlWithToken = new URL(response.config.url || "");
        urlWithToken.searchParams.append("access_token", API_CONFIG.TOKEN);
      }

      const data = response.data;
      const surveyData = Array.isArray(data?.responses) 
        ? (data.responses as any[]).map((response: { survey_id?: number; survey_name?: string }) => ({
            id: response.survey_id || 0,
            name: response.survey_name || ""
          }))
        : [];
      
      // Filter out entries with no ID or name and remove duplicates by ID
      const validSurveys = surveyData.filter((survey: {id: number, name: string}) => survey.id && survey.name.trim());
      const uniqueSurveys = Array.from(new Map(validSurveys.map((survey: {id: number, name: string}) => [survey.id, survey])).values());
      setSurveyTitles(uniqueSurveys as {id: number, name: string}[]);
    } catch (error) {
      console.error("Error fetching survey titles:", error);
      toast.error("Failed to fetch survey titles");
    } finally {
      setIsLoading(false);
    }
  };

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

  const fetchBuildings = async (siteId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/pms/sites/${siteId}/buildings.json`);
      // Handle both array and object with buildings property
      const buildingsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.buildings || []);
      setBuildings(buildingsData);
    } catch (error) {
      console.error("Error fetching buildings:", error);
      toast.error("Failed to fetch buildings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWings = async (buildingId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/pms/wings.json?building_id=${buildingId}`);
      // Handle both array and object with wings property
      const wingsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.wings || []);
      setWings(wingsData);
    } catch (error) {
      console.error("Error fetching wings:", error);
      toast.error("Failed to fetch wings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFloors = async (wingId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/pms/floors.json?wing_id=${wingId}`);
      // Handle both array and object with floors property
      const floorsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.floors || []);
      setFloors(floorsData);
    } catch (error) {
      console.error("Error fetching floors:", error);
      toast.error("Failed to fetch floors");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAreas = async (floorId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/pms/areas.json?floor_id=${floorId}`);
      // Handle both array and object with areas property
      const areasData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.areas || []);
      setAreas(areasData);
    } catch (error) {
      console.error("Error fetching areas:", error);
      toast.error("Failed to fetch areas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async (areaId: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/pms/rooms.json?area_id=${areaId}`);
      // Handle both array and object with rooms property
      const roomsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.rooms || []);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to fetch rooms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      // Build mapping-list query params based on selected tower/flat/user
      const params: string[] = [];
      // per_page and page are default sample values, caller can adjust as needed
      params.push("per_page=10");
      params.push("page=1");
      if (surveyTitle) params.push(`q[survey_id_eq]=${surveyTitle}`);
      if (selectedTower) params.push(`q[building_id_eq]=${selectedTower}`);
      if (selectedFlat) params.push(`q[wing_id_eq]=${selectedFlat}`);
      if (selectedUser) params.push(`q[user_society_id_eq]=${selectedUser}`);

      const mappingListQuery = `/survey_mappings/mappings_list.json?${params.join("&")}`;

      const filters: SurveyMappingFilters = {
        surveyTitle: surveyTitle.trim() || undefined,
        // keep existing hierarchical fields if used elsewhere
        siteIds: selectedSite ? [selectedSite] : undefined,
        buildingIds: selectedBuilding ? [selectedBuilding] : undefined,
        wingIds: selectedWing ? [selectedWing] : undefined,
        floorIds: selectedFloor ? [selectedFloor] : undefined,
        areaIds: selectedArea ? [selectedArea] : undefined,
        roomIds: selectedRoom ? [selectedRoom] : undefined,
        // mapping convenience fields
        mappingListQuery,
        buildingIdEq: selectedTower || undefined,
        wingIdEq: selectedFlat || undefined,
        userSocietyIdEq: selectedUser || undefined,
      };

      console.log("Applying survey mapping filters:", filters, "mappingQuery:", mappingListQuery);
      onApply(filters);
      onClose();
      toast.success("Filters applied successfully");
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Failed to apply filters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSurveyTitle("");
    setSelectedSite("");
    setSelectedBuilding("");
    setSelectedWing("");
    setSelectedFloor("");
    setSelectedArea("");
    setSelectedRoom("");
    setBuildings([]);
    setWings([]);
    setFloors([]);
    setAreas([]);
    setRooms([]);
    // Clear tower/flat/user selections
    setSelectedTower("");
    setSelectedFlat("");
    setSelectedUser("");
    setTowers([]);
    setFlats([]);
    setUsers([]);
    
    onApply({});
    toast.success("Filters cleared successfully");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white z-50"
        aria-describedby="survey-mapping-filter-dialog-description"
      >
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            FILTER SURVEY MAPPINGS
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          <div id="survey-mapping-filter-dialog-description" className="sr-only">
            Filter survey mappings by survey title and location hierarchy (site, building, wing, floor, area, room)
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
                <MuiSelect
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  label="Survey Title"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                >
                  <MenuItem value="">
                    <em>Select Survey</em>
                  </MenuItem>
                  {surveyTitles.map((survey) => (
                    <MenuItem key={survey.id} value={survey.id}>
                      {survey.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>
            </div>
          </div>

          {/* Location Hierarchy Section */}
          <div>
            <h3 className="text-sm font-medium text-[#C72030] mb-4">
              Location Hierarchy
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {/* Tower Selection (mapped to building_id_eq) */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Tower</InputLabel>
                <MuiSelect
                  value={selectedTower}
                  onChange={(e) => setSelectedTower(e.target.value)}
                  label="Tower"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                >
                  <MenuItem value="">
                    <em>Select Tower</em>
                  </MenuItem>
                  {towers.map((t) => (
                    <MenuItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* Flat Selection (mapped to wing_id_eq) */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>Flat</InputLabel>
                <MuiSelect
                  value={selectedFlat}
                  onChange={(e) => setSelectedFlat(e.target.value)}
                  label="Flat"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                  disabled={!selectedTower}
                >
                  <MenuItem value="">
                    <em>Select Flat</em>
                  </MenuItem>
                  {flats.map((f) => (
                    <MenuItem key={f.id} value={f.id.toString()}>
                      {f.flat_no || f.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              {/* User Selection (mapped to user_society_id_eq) */}
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink>User</InputLabel>
                <MuiSelect
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="User"
                  displayEmpty
                  MenuProps={selectMenuProps}
                  sx={fieldStyles}
                  disabled={!selectedFlat}
                >
                  <MenuItem value="">
                    <em>Select User</em>
                  </MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id.toString()}>
                      {u.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
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
            onClick={handleClear}
            className="flex-1 h-11"
          >
            Clear All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
