import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  List,
  MapPin,
  Loader2,
  ListChecks,
  Plus,
  X,
} from "lucide-react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { apiClient } from "@/utils/apiClient";
import { useLocationData } from "@/hooks/useLocationData";

interface SurveyMapping {
  id: number;
  survey_id: number;
  created_by_id: number;
  site_id: number;
  building_id: number;
  wing_id: number | null;
  floor_id: number | null;
  area_id: number | null;
  room_id: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  survey_title: string;
  site_name: string;
  building_name: string;
  wing_name: string | null;
  floor_name: string | null;
  area_name: string | null;
  room_name: string | null;
  qr_code_url: string;
  qr_code?: {
    id: number;
    document_file_name: string;
    document_content_type: string;
    document_file_size: number;
    document_updated_at: string;
    relation: string;
    relation_id: number;
    active: boolean | null;
    created_at: string;
    updated_at: string;
    changed_by: string | null;
    added_from: string | null;
    comments: string | null;
  };
  society_name: string | null;
  tower_name: string | null;
  flat_no: string | null;
  user_name: string | null;
  user_society_id: number | null;
  location: string;
}

interface SnagQuestion {
  id: number;
  qtype: string;
  descr: string;
  checklist_id: number;
  img_mandatory: boolean;
  quest_mandatory: boolean;
  generic_tags: unknown[];
  snag_quest_options: SnagQuestOption[];
  no_of_associations: number;
  ticket_configs: unknown;
}

interface SnagQuestOption {
  id: number;
  qname: string;
  option_type: string;
}

interface SurveyMappingItem {
  id: number;
  survey_id: number;
  created_by_id: number;
  site_id: number;
  building_id: number;
  wing_id: number | null;
  floor_id: number | null;
  area_id: number | null;
  room_id: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  site_name: string;
  building_name: string;
  wing_name: string | null;
  floor_name: string | null;
  area_name: string | null;
  room_name: string | null;
  qr_code_url: string;
  society_name: string | null;
  tower_name: string | null;
  flat_no: string | null;
  user_name: string | null;
  user_society_id: number | null;
  location: string;
}

interface Question {
  id: string;
  task: string;
  inputType: string;
  mandatory: boolean;
  options: string[];
  optionsText: string;
}

interface Survey {
  id: number;
  name: string;
  snag_audit_category: string | null;
  snag_audit_sub_category: string | null;
  questions_count: number;
  active: number;
  check_type: string;
  snag_questions?: SnagQuestion[];
  survey_mappings?: SurveyMappingItem[];
}

interface LocationItem {
  id: number;
  name: string;
}

interface SurveyMappingResponse {
  id: number;
  survey_id: number;
  created_by_id: number;
  site_id: number;
  building_id: number;
  wing_id: number | null;
  floor_id: number | null;
  area_id: number | null;
  room_id: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  survey_title: string;
  site_name: string;
  building_name: string;
  wing_name: string | null;
  floor_name: string | null;
  area_name: string | null;
  room_name: string | null;
  qr_code_url: string;
  qr_code?: {
    id: number;
    document_file_name: string;
    document_content_type: string;
    document_file_size: number;
    document_updated_at: string;
    relation: string;
    relation_id: number;
    active: boolean | null;
    created_at: string;
    updated_at: string;
    changed_by: string | null;
    added_from: string | null;
    comments: string | null;
  };
  society_name: string | null;
  tower_name: string | null;
  flat_no: string | null;
  user_name: string | null;
  user_society_id: number | null;
  location: string;
}

interface SurveyMappingPayload {
  id?: number;
  survey_id: number;
  society_id?: number;
  tower_id?: number;
  flat_id?: number;
  user_society_id?: number;
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

interface SurveyMappingForm {
  id: string;
  selectedLocation: {
    site: string;
    society: string;
    building: string;
    wing: string;
    area: string;
    floor: string;
    room: string;
  };
  // Keep the old array format for backward compatibility with submission
  siteIds: number[];
  buildingIds: number[];
  wingIds: number[];
  floorIds: number[];
  areaIds: number[];
  roomIds: number[];
  // Add flag to track if mapping should be deleted
  markedForDeletion?: boolean;
  // Store fetched location data per configuration
  locationData: {
    buildings: LocationItem[];
    wings: LocationItem[];
    areas: LocationItem[];
    floors: LocationItem[];
    rooms: LocationItem[];
  };
}

interface Flat {
  id: number;
  flat_no: string;
  name?: string;
}

interface Tower {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface UserConfig {
  id: string;
  society_id: string;
  building_id: string;
  flat_id: string;
  user_id: string;
  locationData: {
    societies: SocietyItem[];
    towers: Tower[];
    flats: Flat[];
    users: User[];
  };
}

const mapQuestionTypeToInputType = (qtype?: string) => {
  switch ((qtype || "").trim().toLowerCase().replace(/[\s-]+/g, "_")) {
    case "multiple":
    case "multiple_choice":
      return "multiple_choice";
    case "yesno":
    case "yes_no":
    case "boolean":
      return "yes_no";
    case "rating":
      return "rating";
    case "input":
    case "text":
    case "text_input":
      return "text_input";
    case "input_box":
    case "inputbox":
      return "input_box";
    case "description":
    case "textarea":
      return "description";
    case "numeric":
    case "number":
    case "integer":
      return "numeric";
    case "emoji":
      return "emoji";
    case "smiley":
      return "smiley";
    default:
      return "";
  }
};

const inputTypeLabels: Record<string, string> = {
  yes_no: "Yes/No",
  multiple_choice: "Multiple Choice",
  rating: "Rating",
  text_input: "Text Input",
  input_box: "Input Box",
  description: "Description",
  numeric: "Numeric",
  emoji: "Emoji",
  smiley: "Smiley",
};

const getInputTypeLabel = (inputType: string) =>
  inputTypeLabels[inputType] || "Input Type";

// Section component matching PatrollingCreatePage
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <section className="bg-card rounded-lg border border-border shadow-sm">
    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </section>
);

export const EditSurveyMapping = () => {
  // The 'id' parameter from URL should be the survey_id (snag_checklist_id), not the mapping_id
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Edit Survey Mapping";
  }, []);

  // Location data hook
  const {
    sites,
    buildings,
    wings,
    areas,
    floors,
    rooms,
    loading,
    fetchBuildings,
    fetchWings,
    fetchAreas,
    fetchFloors,
    fetchRooms,
  } = useLocationData();

  // Loading states
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Original mapping data
  const [originalMapping, setOriginalMapping] = useState<SurveyMapping | null>(
    null
  );

  // User configuration data
  const [hasUserConfigData, setHasUserConfigData] = useState(false);
  const [userConfigMappings, setUserConfigMappings] = useState<SurveyMappingItem[]>([]);

  // User configuration dropdown data
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loadingTowers, setLoadingTowers] = useState(false);
  const [userConfigs, setUserConfigs] = useState<UserConfig[]>([]);

  // Form state - updated to match AddSurveyMapping pattern
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [userChangedSurvey, setUserChangedSurvey] = useState(false);
  const [surveyMappings, setSurveyMappings] = useState<SurveyMappingForm[]>([
    {
      id: `sm-${Date.now()}`,
      selectedLocation: {
        site: "",
        society: "",
        building: "",
        wing: "",
        area: "",
        floor: "",
        room: "",
      },
      siteIds: [],
      buildingIds: [],
      wingIds: [],
      floorIds: [],
      areaIds: [],
      roomIds: [],
      locationData: {
        buildings: [],
        wings: [],
        areas: [],
        floors: [],
        rooms: [],
      },
    },
  ]);

  // Survey data
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  // Selected survey questions
  const [selectedSurveyQuestions, setSelectedSurveyQuestions] = useState<
    Question[]
  >([]);

  // Fetch original mapping data and surveys on component mount
  useEffect(() => {
    const initializeData = async () => {
      // Step 1: Fetch societies from current user's company (following UserQRSetup pattern)
      const societiesArray = await fetchSocieties();
      
      // Step 2: Fetch surveys and tower data
      await fetchSurveys();
      await fetchTowers();
      
      // Step 3: Fetch survey mapping data with societies already loaded
      // This is done after societies are fetched so user configs have the data
      await fetchSurveyMappingData(societiesArray);
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch societies
  const fetchSocieties = async (): Promise<SocietyItem[]> => {
    try {
      setLoadingSocieties(true);
      
      // Get company ID from accounts API
      const response = await fetch(getFullUrl("/api/users/account.json"), {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user account");
      }
      
      const accountData = await response.json();
      const companyId = accountData?.society?.company_id;
      
      if (!companyId) {
        console.error("No company_id found in account data");
        toast.error("Company information not found in account", { duration: 3000 });
        return [];
      }
      
      // Use only company_id parameter for fetching societies
      const societiesResponse = await apiClient.get(`/api/societies/search.json?q[company_id_eq]=${companyId}`);
      const societiesArray = societiesResponse.data?.societies || [];
      setSocieties(societiesArray);
      
      // Update all location configs with societies data
      setUserConfigs((prev) =>
        prev.map((config) => ({
          ...config,
          locationData: {
            ...config.locationData,
            societies: societiesArray,
          },
        }))
      );
      
      // Return the societies array for use in initialization
      return societiesArray;
    } catch (error) {
      console.error("Error fetching societies:", error);
      toast.error("Failed to fetch societies", { duration: 5000 });
      return [];
    } finally {
      setLoadingSocieties(false);
    }
  };

  // Modified to accept and use societies array for initialization
  const fetchSurveyMappingData = async (societiesArray: SocietyItem[] = []) => {
    if (!id) return [];

    try {
      setPageLoading(true);
      // Use the new mappings_list endpoint with survey_id
      const response = await fetch(
        getFullUrl(`/survey_mappings/mappings_list.json?q[id_eq]=${id}`),
        {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch survey mapping data");
      }

      const responseData = await response.json();
      console.error("Survey mappings list response:", responseData);

      if (
        responseData?.survey_mappings &&
        responseData.survey_mappings.length > 0
      ) {
        const surveyData = responseData.survey_mappings[0]; // Get the first (and should be only) survey

        // Set the survey ID from the first mapping's survey_id
        if (surveyData.mappings && surveyData.mappings.length > 0) {
          const surveyId = surveyData.mappings[0].survey_id;
          console.error("Setting selectedSurveyId to:", surveyId);
          setSelectedSurveyId(surveyId);
        }

        // Convert all mappings to form structure
        const formMappings = surveyData.mappings.map(
          (mapping: SurveyMappingResponse) => ({
            id: `sm-${mapping.id}`, // Keep the original mapping ID for updates
            selectedLocation: {
              site: mapping.site_id ? mapping.site_id.toString() : "",
              building: mapping.building_id
                ? mapping.building_id.toString()
                : "",
              wing: mapping.wing_id ? mapping.wing_id.toString() : "",
              area: mapping.area_id ? mapping.area_id.toString() : "",
              floor: mapping.floor_id ? mapping.floor_id.toString() : "",
              room: mapping.room_id ? mapping.room_id.toString() : "",
            },
            siteIds: mapping.site_id ? [mapping.site_id] : [],
            buildingIds: mapping.building_id ? [mapping.building_id] : [],
            wingIds: mapping.wing_id ? [mapping.wing_id] : [],
            floorIds: mapping.floor_id ? [mapping.floor_id] : [],
            areaIds: mapping.area_id ? [mapping.area_id] : [],
            roomIds: mapping.room_id ? [mapping.room_id] : [],
            locationData: {
              buildings: [],
              wings: [],
              areas: [],
              floors: [],
              rooms: [],
            },
          })
        );

        console.error("Form mappings created:", formMappings);
        setSurveyMappings(formMappings);

        // Fetch location data for each configuration independently
        formMappings.forEach(async (mapping, index) => {
          if (mapping.selectedLocation.site) {
            await fetchLocationDataForConfig(index, "buildings", {
              siteId: parseInt(mapping.selectedLocation.site),
            });
          }
          if (mapping.selectedLocation.building) {
            await fetchLocationDataForConfig(index, "wings", {
              buildingId: parseInt(mapping.selectedLocation.building),
            });
            await fetchLocationDataForConfig(index, "areas", {
              buildingId: parseInt(mapping.selectedLocation.building),
            });
            await fetchLocationDataForConfig(index, "floors", {
              buildingId: parseInt(mapping.selectedLocation.building),
            });
            await fetchLocationDataForConfig(index, "rooms", {
              buildingId: parseInt(mapping.selectedLocation.building),
            });
          }
        });

        // Set original mapping data using the first mapping for backward compatibility
        if (surveyData.mappings.length > 0) {
          const firstMapping = surveyData.mappings[0];
          setOriginalMapping({
            id: firstMapping.id,
            survey_id: firstMapping.survey_id,
            created_by_id: firstMapping.created_by_id,
            site_id: firstMapping.site_id,
            building_id: firstMapping.building_id,
            wing_id: firstMapping.wing_id,
            floor_id: firstMapping.floor_id,
            area_id: firstMapping.area_id,
            room_id: firstMapping.room_id,
            active: firstMapping.active,
            created_at: firstMapping.created_at,
            updated_at: firstMapping.updated_at,
            created_by: firstMapping.created_by,
            survey_title: firstMapping.survey_title,
            site_name: firstMapping.site_name,
            building_name: firstMapping.building_name,
            wing_name: firstMapping.wing_name,
            floor_name: firstMapping.floor_name,
            area_name: firstMapping.area_name,
            room_name: firstMapping.room_name,
            qr_code_url: firstMapping.qr_code_url,
            qr_code: firstMapping.qr_code,
            society_name: firstMapping.society_name || null,
            tower_name: firstMapping.tower_name || null,
            flat_no: firstMapping.flat_no || null,
            user_name: firstMapping.user_name || null,
            user_society_id: firstMapping.user_society_id || null,
            location: firstMapping.location || "",
          });

          // Check if any mapping has user configuration data (tower, flat, or user)
          const hasUserData = surveyData.mappings.some(
            (m: SurveyMappingItem) =>
              m.tower_name || m.flat_no || m.user_name || m.user_society_id
          );
          setHasUserConfigData(hasUserData);
          setUserConfigMappings(surveyData.mappings);

          // Initialize user configs with existing data and fetched societies
          const initialUserConfigs = surveyData.mappings
            .filter((m: SurveyMappingItem) => m.tower_name || m.flat_no || m.user_name)
            .map((m: SurveyMappingItem) => ({
              id: `uc-${m.id}`,
              society_id: m.site_id?.toString() || "", // Map site_id to society_id
              building_id: m.building_id?.toString() || "",
              flat_id: m.wing_id?.toString() || "", // Map wing_id to flat_id
              user_id: m.user_society_id?.toString() || "", // Map user_society_id to user_id
              locationData: {
                societies: societiesArray.length > 0 ? societiesArray : [], // Use passed societies array
                towers: [],
                flats: [],
                users: [],
              },
            }));

          console.error("Initial user configs:", initialUserConfigs);
          setUserConfigs(initialUserConfigs);

          // Fetch towers, flats and users for existing configs
          // Use a local copy to avoid async state issues
          const workingConfigs = [...initialUserConfigs];
          
          for (let i = 0; i < workingConfigs.length; i++) {
            const config = workingConfigs[i];
            console.error(`Fetching data for config ${i}:`, config);
            
            // First fetch towers if society_id is set
            if (config.society_id) {
              try {
                const towersResponse = await apiClient.get(`/get_society_blocks.json?society_id=${config.society_id}`);
                const towersArray = (towersResponse.data?.society_blocks || []) as Tower[];
                
                workingConfigs[i] = {
                  ...workingConfigs[i],
                  locationData: {
                    ...workingConfigs[i].locationData,
                    towers: towersArray,
                  },
                };
              } catch (error) {
                console.error(`Error fetching towers for config ${i}:`, error);
              }
            }
            
            if (config.building_id) {
              try {
                // Fetch flats
                const flatsResponse = await apiClient.get(`/get_society_flats.json?society_block_id=${config.building_id}&society_id=${config.society_id}`);
                const flatsArray = (flatsResponse.data?.society_flats || []) as Flat[];
                
                workingConfigs[i] = {
                  ...workingConfigs[i],
                  locationData: {
                    ...workingConfigs[i].locationData,
                    flats: flatsArray,
                    users: [],
                  },
                };
              } catch (error) {
                console.error(`Error fetching flats for config ${i}:`, error);
              }
            }
            
            if (config.flat_id) {
              try {
                // Fetch users
                const usersResponse = await apiClient.get(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${config.flat_id}&q[approve_eq]=true`);
                const usersArray: User[] = Array.isArray(usersResponse.data) 
                  ? usersResponse.data.map(([name, id]: [string, number]) => ({
                      id,
                      name,
                    }))
                  : [];
                console.error("Fetched users:", usersArray);
                
                workingConfigs[i] = {
                  ...workingConfigs[i],
                  locationData: {
                    ...workingConfigs[i].locationData,
                    users: usersArray,
                  },
                };
              } catch (error) {
                console.error(`Error fetching users for config ${i}:`, error);
              }
            }
          }
          
          // Update state with fetched data
          setUserConfigs(workingConfigs);
        }
        // Return mappings for use in initialization
        return surveyData.mappings;
      } else {
        toast.error("Survey mapping not found");
        navigate("/maintenance/survey/mapping");
        return [];
      }
    } catch (error: unknown) {
      console.error("Error fetching survey mapping:", error);
      toast.error("Failed to load survey mapping data");
      navigate("/maintenance/survey/mapping");
      return [];
    } finally {
      setPageLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const siteId = localStorage.getItem("site_id") || "2189";
      const url = `/pms/admin/snag_checklists.json?site_id=${siteId}&q[name_cont]=&q[check_type_eq]=survey&q[snag_audit_sub_category_id_eq]=&q[snag_audit_category_id_eq]=`;

      const response = await fetch(getFullUrl(url), {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch surveys");
      }

      const surveyData = await response.json();
      console.error("Surveys data response:", surveyData);

      // Filter only active surveys
      const activeSurveys = (surveyData || []).filter(
        (survey: Survey) => survey.active === 1
      );
      console.error("Filtered active surveys:", activeSurveys);
      setSurveys(activeSurveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast.error("Failed to fetch surveys");
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  // Field styles for Material-UI components
  const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    "& .MuiInputBase-input, & .MuiSelect-select": {
      padding: { xs: "8px", sm: "10px", md: "12px" },
    },
  };

  // Fetch location data for a specific configuration
  const fetchLocationDataForConfig = async (
    configIndex: number,
    field: "buildings" | "wings" | "areas" | "floors" | "rooms",
    params: {
      siteId?: number;
      buildingId?: number;
      wingId?: number;
      areaId?: number;
      floorId?: number;
    }
  ) => {
    try {
      let url = "";
      switch (field) {
        case "buildings":
          url = `${API_CONFIG.BASE_URL}/pms/sites/${params.siteId}/buildings.json`;
          break;
        case "wings":
          url = `${API_CONFIG.BASE_URL}/pms/wings.json?q[building_id_eq]=${params.buildingId}`;
          break;
        case "areas": {
          const areaParams = new URLSearchParams();
          if (params.wingId)
            areaParams.append("q[wing_id_eq]", params.wingId.toString());
          if (params.buildingId)
            areaParams.append(
              "q[building_id_eq]",
              params.buildingId.toString()
            );
          url = `${API_CONFIG.BASE_URL}/pms/areas.json?${areaParams.toString()}`;
          break;
        }
        case "floors": {
          const floorParams = new URLSearchParams();
          if (params.areaId)
            floorParams.append("q[area_id_eq]", params.areaId.toString());
          if (params.buildingId)
            floorParams.append(
              "q[building_id_eq]",
              params.buildingId.toString()
            );
          if (params.wingId)
            floorParams.append("q[wing_id_eq]", params.wingId.toString());
          url = `${API_CONFIG.BASE_URL}/pms/floors.json?${floorParams.toString()}`;
          break;
        }
        case "rooms": {
          const roomParams = new URLSearchParams();
          if (params.floorId)
            roomParams.append("q[floor_id_eq]", params.floorId.toString());
          if (params.buildingId)
            roomParams.append(
              "q[building_id_eq]",
              params.buildingId.toString()
            );
          if (params.wingId)
            roomParams.append("q[wing_id_eq]", params.wingId.toString());
          if (params.areaId)
            roomParams.append("q[area_id_eq]", params.areaId.toString());
          url = `${API_CONFIG.BASE_URL}/pms/rooms.json?${roomParams.toString()}`;
          break;
        }
      }

      const response = await fetch(url, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch ${field}`);

      const data = await response.json();
      // Handle both array format and object with field property
      const items = Array.isArray(data) ? data : data[field] || [];

      setSurveyMappings((prev) =>
        prev.map((mapping, i) => {
          if (i !== configIndex) return mapping;
          return {
            ...mapping,
            locationData: {
              ...mapping.locationData,
              [field]: items,
            },
          };
        })
      );
    } catch (error) {
      console.error(`Error fetching ${field}:`, error);
    }
  };

  // Handle location changes with cascading behavior
    const handleLocationChange = async (
    mappingIndex: number,
    field: "site" | "society" | "building" | "wing" | "area" | "floor" | "room",
    value: string
  ) => {
    console.error(
      `Location change: ${field} = ${value} for mapping ${mappingIndex}`
    );

    // First update state and clear dependent fields
    setSurveyMappings((prev) =>
      prev.map((mapping, i) => {
        if (i !== mappingIndex) return mapping;

        const newSelectedLocation = { ...mapping.selectedLocation };
        const newLocationData = { ...mapping.locationData };

        // Reset dependent fields and clear their data when parent changes
        switch (field) {
          case "site":
            newSelectedLocation.site = value;
            newSelectedLocation.society = "";
            newSelectedLocation.building = "";
            newSelectedLocation.wing = "";
            newSelectedLocation.area = "";
            newSelectedLocation.floor = "";
            newSelectedLocation.room = "";
            newLocationData.wings = [];
            newLocationData.areas = [];
            newLocationData.floors = [];
            newLocationData.rooms = [];
            break;
          case "society":
            newSelectedLocation.society = value;
            newSelectedLocation.building = "";
            newSelectedLocation.wing = "";
            newSelectedLocation.area = "";
            newSelectedLocation.floor = "";
            newSelectedLocation.room = "";
            newLocationData.wings = [];
            newLocationData.areas = [];
            newLocationData.floors = [];
            newLocationData.rooms = [];
            break;
          case "building":
            newSelectedLocation.building = value;
            newSelectedLocation.wing = "";
            newSelectedLocation.area = "";
            newSelectedLocation.floor = "";
            newSelectedLocation.room = "";
            newLocationData.wings = [];
            newLocationData.areas = [];
            newLocationData.floors = [];
            newLocationData.rooms = [];
            break;
          case "wing":
            newSelectedLocation.wing = value;
            newSelectedLocation.area = "";
            newSelectedLocation.floor = "";
            newSelectedLocation.room = "";
            newLocationData.areas = [];
            newLocationData.floors = [];
            newLocationData.rooms = [];
            break;
          case "area":
            newSelectedLocation.area = value;
            newSelectedLocation.floor = "";
            newSelectedLocation.room = "";
            newLocationData.floors = [];
            newLocationData.rooms = [];
            break;
          case "floor":
            newSelectedLocation.floor = value;
            newSelectedLocation.room = "";
            newLocationData.rooms = [];
            break;
          case "room":
            newSelectedLocation.room = value;
            break;
        }

        return {
          ...mapping,
          selectedLocation: newSelectedLocation,
          locationData: newLocationData,
        };
      })
    );

    // Then fetch new data for this specific configuration
    const mapping = surveyMappings[mappingIndex];

    switch (field) {
      case "site":
        if (value) {
          const siteId = parseInt(value);
          if (siteId) {
            await fetchLocationDataForConfig(mappingIndex, "buildings", {
              siteId,
            });
          }
        }
        break;

      case "building":
        if (value) {
          const buildingId = parseInt(value);
          await fetchLocationDataForConfig(mappingIndex, "wings", {
            buildingId,
          });
          await fetchLocationDataForConfig(mappingIndex, "areas", {
            buildingId,
          });
          await fetchLocationDataForConfig(mappingIndex, "floors", {
            buildingId,
          });
          await fetchLocationDataForConfig(mappingIndex, "rooms", {
            buildingId,
          });
        }
        break;

      case "wing":
        if (value && mapping.selectedLocation.building) {
          const wingId = parseInt(value);
          const buildingId = parseInt(mapping.selectedLocation.building);
          await fetchLocationDataForConfig(mappingIndex, "areas", {
            buildingId,
            wingId,
          });
          await fetchLocationDataForConfig(mappingIndex, "floors", {
            buildingId,
            wingId,
          });
          await fetchLocationDataForConfig(mappingIndex, "rooms", {
            buildingId,
            wingId,
          });
        }
        break;

      case "area":
        if (value && mapping.selectedLocation.building) {
          const areaId = parseInt(value);
          const buildingId = parseInt(mapping.selectedLocation.building);
          const wingId = mapping.selectedLocation.wing
            ? parseInt(mapping.selectedLocation.wing)
            : undefined;
          await fetchLocationDataForConfig(mappingIndex, "floors", {
            buildingId,
            wingId,
            areaId,
          });
          await fetchLocationDataForConfig(mappingIndex, "rooms", {
            buildingId,
            wingId,
            areaId,
          });
        }
        break;

      case "floor":
        if (value && mapping.selectedLocation.building) {
          const floorId = parseInt(value);
          const buildingId = parseInt(mapping.selectedLocation.building);
          const wingId = mapping.selectedLocation.wing
            ? parseInt(mapping.selectedLocation.wing)
            : undefined;
          const areaId = mapping.selectedLocation.area
            ? parseInt(mapping.selectedLocation.area)
            : undefined;
          await fetchLocationDataForConfig(mappingIndex, "rooms", {
            buildingId,
            wingId,
            areaId,
            floorId,
          });
        }
        break;
    }
  };

  // Add/Remove survey mapping functions
  const addSurveyMapping = () => {
    setSurveyMappings((prev) => [
      ...prev,
      {
        id: `sm-new-${Date.now()}`, // Use "new-" prefix + timestamp for new mappings
        selectedLocation: {
          site: "",
          society: "",
          building: "",
          wing: "",
          area: "",
          floor: "",
          room: "",
        },
        siteIds: [],
        buildingIds: [],
        wingIds: [],
        floorIds: [],
        areaIds: [],
        roomIds: [],
        locationData: {
          buildings: [],
          wings: [],
          areas: [],
          floors: [],
          rooms: [],
        },
      },
    ] as SurveyMappingForm[]);
  };

  const removeSurveyMapping = (idx: number) => {
    setSurveyMappings((prev) =>
      prev.map((mapping, i) => {
        if (i === idx) {
          // Instead of removing the mapping, mark it for deletion
          // This preserves the original mapping ID for proper API handling
          return {
            ...mapping,
            markedForDeletion: true,
          };
        }
        return mapping;
      })
    );
  };

  const handleSurveyChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value as number;
    setSelectedSurveyId(value);
    setUserChangedSurvey(true); // Mark that user has manually changed the survey
    // Update survey questions based on selected survey
    updateSurveyQuestions(value);
  };

  // Function to update survey questions based on selected survey
  const updateSurveyQuestions = useCallback(
    (surveyId?: number) => {
      const targetSurveyId = surveyId || selectedSurveyId;
      console.error(
        "updateSurveyQuestions called with surveyId:",
        surveyId,
        "targetSurveyId:",
        targetSurveyId
      );

      if (!targetSurveyId) {
        console.error("No target survey ID, clearing questions");
        setSelectedSurveyQuestions([]);
        return;
      }

      const selectedSurvey = surveys.find(
        (survey) => survey.id === targetSurveyId
      );
      console.error(
        "Found survey:",
        selectedSurvey?.name,
        "with questions:",
        selectedSurvey?.snag_questions?.length
      );
      if (selectedSurvey && selectedSurvey.snag_questions) {
        const mappedQuestions = selectedSurvey.snag_questions.map(
          (q: SnagQuestion) => {
            return {
              id: q.id.toString(),
              task: q.descr,
              inputType: mapQuestionTypeToInputType(q.qtype),
              mandatory: !!q.quest_mandatory,
              options: q.snag_quest_options
                ? q.snag_quest_options.map((opt: SnagQuestOption) => opt.qname)
                : [],
              optionsText: q.snag_quest_options
                ? q.snag_quest_options
                    .map((opt: SnagQuestOption) => opt.qname)
                    .join(", ")
                : "",
            };
          }
        );
        setSelectedSurveyQuestions(mappedQuestions);
      } else {
        setSelectedSurveyQuestions([]);
      }
    },
    [selectedSurveyId, surveys]
  );

  // Fetch towers for a specific config and society
  const fetchTowersForConfig = async (configIndex: number, societyId: string) => {
    try {
      if (!societyId) return;

      const response = await apiClient.get(`/get_society_blocks.json?society_id=${societyId}`);
      const towersArray = (response.data?.society_blocks || []) as Tower[];

      setUserConfigs((prev) =>
        prev.map((config, i) => {
          if (i !== configIndex) return config;
          return {
            ...config,
            locationData: {
              ...config.locationData,
              towers: towersArray,
              flats: [], // Clear flats when towers change
              users: [], // Clear users when towers change
            },
          };
        })
      );
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast.error("Failed to fetch towers", { duration: 3000 });
    }
  };

  // Fetch towers
  const fetchTowers = async () => {
    try {
      setLoadingTowers(true);
      const idSociety = localStorage.getItem("selectedSocietyId") || "";
      
      if (!idSociety) {
        console.error("No selectedSocietyId found in localStorage");
        toast.error("Society information not found. Please select a society.", { duration: 3000 });
        return;
      }
      
      const response = await apiClient.get(`/get_society_blocks.json?society_id=${idSociety}`);
      const towersArray = (response.data?.society_blocks || []) as Tower[];
      setTowers(towersArray);
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast.error("Failed to fetch towers", { duration: 5000 });
    } finally {
      setLoadingTowers(false);
    }
  };

  // Fetch flats for a tower
  const fetchFlatsForConfig = async (configIndex: number, towerId: string, preserveSelection = false) => {
    try {
      if (!towerId) return;
      const config = userConfigs[configIndex];
      const societyId = config?.society_id || localStorage.getItem("selectedSocietyId") || "";

      const response = await apiClient.get(`/get_society_flats.json?society_block_id=${towerId}&society_id=${societyId}`);
      const flatsArray = (response.data?.society_flats || []) as Flat[];

      setUserConfigs((prev) =>
        prev.map((config, i) => {
          if (i !== configIndex) return config;
          return {
            ...config,
            locationData: {
              ...config.locationData,
              flats: flatsArray,
              users: [], // Clear users when flats change
            },
            flat_id: preserveSelection ? config.flat_id : "", // Preserve selection if flag is set
            user_id: preserveSelection ? config.user_id : "", // Preserve selection if flag is set
          };
        })
      );
    } catch (error) {
      console.error("Error fetching flats:", error);
      toast.error("Failed to fetch flats", { duration: 3000 });
    }
  };

  // Fetch users for a flat
  const fetchUsers = async (configIndex: number, flatId: string, preserveSelection = false) => {
    try {
      if (!flatId) return;

      const response = await apiClient.get(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}&q[approve_eq]=true`);
      // Response is an array of [name, id] tuples
      const usersArray: User[] = Array.isArray(response.data) 
        ? response.data.map(([name, id]: [string, number]) => ({
            id,
            name,
          }))
        : [];

      setUserConfigs((prev) =>
        prev.map((config, i) => {
          if (i !== configIndex) return config;
          return {
            ...config,
            locationData: {
              ...config.locationData,
              users: usersArray,
            },
            user_id: preserveSelection ? config.user_id : "", // Preserve selection if flag is set
          };
        })
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users", { duration: 3000 });
    }
  };

  // Handle society change
  const handleUserConfigSocietyChange = async (configIndex: number, societyId: string) => {
    setUserConfigs((prev) =>
      prev.map((config, i) => {
        if (i !== configIndex) return config;
        return {
          ...config,
          society_id: societyId,
          building_id: "",
          flat_id: "",
          user_id: "",
          locationData: {
            ...config.locationData,
            towers: [],
            flats: [],
            users: [],
          },
        };
      })
    );

    if (societyId) {
      await fetchTowersForConfig(configIndex, societyId);
    }
  };

  // Handle tower change
  const handleUserConfigTowerChange = async (configIndex: number, towerId: string) => {
    setUserConfigs((prev) =>
      prev.map((config, i) => {
        if (i !== configIndex) return config;
        return {
          ...config,
          building_id: towerId,
          flat_id: "",
          user_id: "",
          locationData: {
            ...config.locationData,
            flats: [],
            users: [],
          },
        };
      })
    );

    if (towerId) {
      await fetchFlatsForConfig(configIndex, towerId);
    }
  };

  // Handle flat change
  const handleUserConfigFlatChange = async (configIndex: number, flatId: string) => {
    setUserConfigs((prev) =>
      prev.map((config, i) => {
        if (i !== configIndex) return config;
        return {
          ...config,
          flat_id: flatId,
          user_id: "",
          locationData: {
            ...config.locationData,
            users: [],
          },
        };
      })
    );

    if (flatId) {
      await fetchUsers(configIndex, flatId);
    }
  };

  // Handle user change
  const handleUserConfigUserChange = (configIndex: number, userId: string) => {
    setUserConfigs((prev) =>
      prev.map((config, i) => {
        if (i !== configIndex) return config;
        return {
          ...config,
          user_id: userId,
        };
      })
    );
  };

  const handleSurveySelect = (mappingIndex: number, surveyId: number) => {
    setSurveyMappings((prev) =>
      prev.map((mapping, index) => {
        if (index === mappingIndex) {
          // For edit page, only allow single survey selection
          return { ...mapping, surveyId, surveyIds: [surveyId] };
        }
        return mapping;
      })
    );

    // Find the selected survey and map its questions
    const selectedSurvey = surveys.find((survey) => survey.id === surveyId);
    if (selectedSurvey && selectedSurvey.snag_questions) {
      const mappedQuestions = selectedSurvey.snag_questions.map(
        (q: SnagQuestion) => {
          return {
            id: q.id.toString(),
            task: q.descr,
            inputType: mapQuestionTypeToInputType(q.qtype),
            mandatory: !!q.quest_mandatory,
            options: q.snag_quest_options
              ? q.snag_quest_options.map((opt: SnagQuestOption) => opt.qname)
              : [],
            optionsText: q.snag_quest_options
              ? q.snag_quest_options
                  .map((opt: SnagQuestOption) => opt.qname)
                  .join(", ")
              : "",
          };
        }
      );
      setSelectedSurveyQuestions(mappedQuestions);
    } else {
      setSelectedSurveyQuestions([]);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Validation - check survey selection and each mapping individually
    const invalidMappings = [];
    const validMappings = [];
    const mappingsToDelete = [];

    if (!selectedSurveyId) {
      toast.error("Please select a survey first", {
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }
    try {
      // Get society_id from localStorage (same pattern as other pages)
      const societyId = parseInt(
        localStorage.getItem("selectedSocietyId") ||
        localStorage.getItem("society_id") ||
        localStorage.getItem("org_id") ||
        "0"
      );

      // Build payload from userConfigs with society_id, tower_id, flat_id, and user_society_id
      const surveyMappingsPayload: SurveyMappingPayload[] = userConfigs.map((config, index) => {
        const originalMapping = userConfigMappings[index];
        
        const mappingData: SurveyMappingPayload = {
          survey_id: selectedSurveyId,
        };

        // Include the original mapping ID
        if (originalMapping) {
          mappingData.id = originalMapping.id;
        }

        // Include society_id if selected
        if (config.society_id) {
          mappingData.society_id = parseInt(config.society_id);
        }

        // Include tower_id if selected
        if (config.building_id) {
          mappingData.tower_id = parseInt(config.building_id);
        }

        // Include flat_id if selected
        if (config.flat_id) {
          mappingData.flat_id = parseInt(config.flat_id);
        }

        // Include user_society_id if selected
        if (config.user_id) {
          mappingData.user_society_id = parseInt(config.user_id);
        }

        return mappingData;
      });

      const payload = {
        survey_mappings: surveyMappingsPayload,
      };

      console.error("Updating survey mappings with payload:", payload);

      const response = await fetch(
        getFullUrl("/survey_mappings/update_survey_mappings.json"),
        {
          method: "PUT",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        console.error("Survey mappings updated successfully:", responseData);
        toast.success("Survey mapping updated successfully!");
        navigate("/maintenance/survey/mapping");
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("Request failed:", response, errorData);
        throw new Error(
          errorData?.message || "Failed to update survey mapping"
        );
      }
    } catch (error: unknown) {
      console.error("Error updating survey mapping:", error);
      toast.error(
        `Failed to update survey mapping: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Effect to show questions for the selected survey when data is loaded
  useEffect(() => {
    console.error(
      "Effect triggered - originalMapping:",
      originalMapping?.survey_id,
      "surveys.length:",
      surveys.length,
      "userChangedSurvey:",
      userChangedSurvey
    );
    if (
      originalMapping &&
      surveys.length > 0 &&
      originalMapping.survey_id &&
      !userChangedSurvey
    ) {
      // Only set the survey ID from original mapping if user hasn't manually changed it
      console.error(
        "Setting survey ID from original mapping:",
        originalMapping.survey_id
      );
      setSelectedSurveyId(originalMapping.survey_id);
      // Update questions using the survey ID from the mapping
      updateSurveyQuestions(originalMapping.survey_id);
    }
  }, [originalMapping, surveys, updateSurveyQuestions, userChangedSurvey]);

  // Effect to update questions when selectedSurveyId changes and surveys are loaded
  useEffect(() => {
    console.error(
      "Survey questions effect triggered - selectedSurveyId:",
      selectedSurveyId,
      "surveys.length:",
      surveys.length
    );
    if (selectedSurveyId && surveys.length > 0) {
      console.error("Updating survey questions for survey ID:", selectedSurveyId);
      updateSurveyQuestions(selectedSurveyId);
    }
  }, [selectedSurveyId, surveys, updateSurveyQuestions]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
        <span className="ml-2">Loading survey mapping...</span>
      </div>
    );
  }

  if (!originalMapping) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">
            Survey Mapping not found
          </h2>
          <p className="text-gray-600 mt-2">
            The requested survey mapping could not be found.
          </p>
          <Button
            onClick={() => navigate("/maintenance/survey/mapping")}
            className="mt-4"
          >
            Back to Survey Mapping List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 relative min-h-screen overflow-y-auto">
      {isSubmitting && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/maintenance/survey/mapping")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Edit Survey Mapping</h1>
        </div>
      </header>

      <Section title="Survey Selection" icon={<List className="w-3.5 h-3.5" />}>
        <div className="space-y-6">
          <div className="rounded-md border border-dashed bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Select Survey for All Location Configurations
            </p>

            <div className="space-y-4">
              {/* Single Survey Selection */}
              <div className="grid grid-cols-1 gap-6">
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ "& .MuiInputBase-root": fieldStyles }}
                >
                  <InputLabel shrink>
                    Select Survey <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    value={selectedSurveyId || ""}
                    onChange={handleSurveyChange}
                    label="Select Survey"
                    notched
                    displayEmpty
                    disabled={loadingSurveys}
                  >
                    <MenuItem disabled value="">
                      <em style={{ color: "#999", fontStyle: "italic" }}>
                        Select a survey...
                      </em>
                    </MenuItem>
                    {loadingSurveys ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading surveys...
                      </MenuItem>
                    ) : (
                      surveys.map((survey) => (
                        <MenuItem key={survey.id} value={survey.id}>
                          <Box>
                            <div className="font-medium">{survey.name}</div>
                            {/* <div className="text-xs text-gray-500">
                              Questions: {survey.questions_count} | Type: {survey.check_type}
                            </div> */}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </div>

              {selectedSurveyId && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Survey selected:{" "}
                    <span className="font-medium">
                      {surveys.find((s) => s.id === selectedSurveyId)?.name}
                    </span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    This survey will be applied to all location configurations
                    below.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* User Configuration Section - Only show if data exists */}
      {hasUserConfigData && (
      <Section title="Customer Configuration" icon={<MapPin className="w-3.5 h-3.5" />}>
        <div className="space-y-6">
          <div className="mb-4 text-sm text-gray-600">
            Edit the Customer configurations associated with this survey mapping.
          </div>
          {userConfigs.map((config, configIdx) => (
            <div
              key={config.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  Configuration {configIdx + 1}
                </h3>
                <span className="text-xs text-gray-500">
                  Mapping ID: {userConfigMappings[configIdx]?.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Society Selection */}
                <FormControl fullWidth variant="outlined" sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>
                    Society <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    value={config.society_id}
                    onChange={(e: SelectChangeEvent<string>) =>
                      handleUserConfigSocietyChange(configIdx, e.target.value)
                    }
                    input={<OutlinedInput label="Society" />}
                    disabled={loadingSocieties || config.locationData.societies.length === 0}
                    displayEmpty
                    notched
                  >
                    <MenuItem value="">
                      <em>
                        {loadingSocieties ? "Loading..." : "Select society"}
                      </em>
                    </MenuItem>
                    {config.locationData.societies.map((society) => (
                      <MenuItem key={society.id} value={society.id.toString()}>
                        {society.building_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Tower Selection */}
                <FormControl fullWidth variant="outlined" sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>
                    Tower <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    value={config.building_id}
                    onChange={(e: SelectChangeEvent<string>) =>
                      handleUserConfigTowerChange(configIdx, e.target.value)
                    }
                    input={<OutlinedInput label="Tower" />}
                    disabled={
                      !config.society_id || 
                      config.locationData.towers.length === 0
                    }
                    displayEmpty
                    notched
                  >
                    <MenuItem value="">
                      <em>
                        {!config.society_id
                          ? "Select society first"
                          : "Select tower"}
                      </em>
                    </MenuItem>
                    {config.locationData.towers.map((tower) => (
                      <MenuItem key={tower.id} value={tower.id.toString()}>
                        {tower.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Flat Selection */}
                <FormControl fullWidth variant="outlined" sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>
                    Flat <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    value={config.flat_id}
                    onChange={(e: SelectChangeEvent<string>) =>
                      handleUserConfigFlatChange(configIdx, e.target.value)
                    }
                    input={<OutlinedInput label="Flat" />}
                    disabled={
                      !config.building_id || config.locationData.flats.length === 0
                    }
                    displayEmpty
                    notched
                  >
                    <MenuItem value="">
                      <em>
                        {!config.building_id
                          ? "Select tower first"
                          : "Select flat"}
                      </em>
                    </MenuItem>
                    {config.locationData.flats.map((flat) => (
                      <MenuItem key={flat.id} value={flat.id.toString()}>
                        {flat.flat_no || flat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* User Selection */}
                <FormControl fullWidth variant="outlined" sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>
                    User <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    value={config.user_id}
                    onChange={(e: SelectChangeEvent<string>) =>
                      handleUserConfigUserChange(configIdx, e.target.value)
                    }
                    input={<OutlinedInput label="User" />}
                    disabled={
                      !config.flat_id || config.locationData.users.length === 0
                    }
                    displayEmpty
                    notched
                  >
                    <MenuItem value="">
                      <em>
                        {!config.flat_id ? "Select flat first" : "Select user"}
                      </em>
                    </MenuItem>
                    {config.locationData.users.map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
          ))}
        </div>
      </Section>
      )}

      {/* Location Configuration section is temporarily hidden.
          To re-enable, change `false` to `true` below. */}
      {(false as boolean) && (
      <Section
        title="Location Configuration"
        icon={<MapPin className="w-3.5 h-3.5" />}
      >
        <div className="space-y-6">
          {surveyMappings
            .filter((mapping) => !mapping.markedForDeletion)
            .map((mapping, mappingIdx) => {
              // Get the actual index in the original array for proper handling
              const actualIndex = surveyMappings.findIndex(
                (m) => m.id === mapping.id
              );
              return (
                <div
                  key={mapping.id}
                  className="relative rounded-md border border-dashed bg-muted/30 p-4"
                >
                  {surveyMappings.filter((m) => !m.markedForDeletion).length >
                    1 && (
                    <button
                      type="button"
                      onClick={() => removeSurveyMapping(actualIndex)}
                      className="absolute -right-2 -top-2 rounded-full p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 shadow-sm"
                      aria-label="Remove location configuration"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  )}

                  <p className="mb-4 text-sm font-medium text-muted-foreground">
                    Location Configuration {mappingIdx + 1}
                    {selectedSurveyId && (
                      <span className="ml-2 text-blue-600">
                        (
                        {surveys.find((s) => s.id === selectedSurveyId)?.name ||
                          "Survey"}{" "}
                        will be applied)
                      </span>
                    )}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Site */}
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>
                        Site <span className="text-red-500">*</span>
                      </InputLabel>
                      <Select
                        value={mapping.selectedLocation.site}
                        onChange={(e) =>
                          handleLocationChange(
                            actualIndex,
                            "site",
                            e.target.value as string
                          )
                        }
                        input={<OutlinedInput label="Site" />}
                        disabled={loading.sites}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>Select Site</em>
                        </MenuItem>
                        {loading.sites ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Loading sites...
                          </MenuItem>
                        ) : (
                          sites
                            .filter((site) => site?.id && site?.name)
                            .map((site) => (
                              <MenuItem
                                key={site.id}
                                value={site.id.toString()}
                              >
                                {site.name}
                              </MenuItem>
                            ))
                        )}
                      </Select>
                    </FormControl>

                    {/* Building */}
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>
                        Building <span className="text-red-500">*</span>
                      </InputLabel>
                      <Select
                        value={mapping.selectedLocation.building}
                        onChange={(e) =>
                          handleLocationChange(
                            actualIndex,
                            "building",
                            e.target.value as string
                          )
                        }
                        input={<OutlinedInput label="Building" />}
                        disabled={!mapping.selectedLocation.site}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>
                            {!mapping.selectedLocation.site
                              ? "Select Site first"
                              : "Select Building"}
                          </em>
                        </MenuItem>
                        {mapping.locationData.buildings
                          .filter((building) => building?.id && building?.name)
                          .map((building) => (
                            <MenuItem
                              key={building.id}
                              value={building.id.toString()}
                            >
                              {building.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    {/* Wing */}
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Wing</InputLabel>
                      <Select
                        value={mapping.selectedLocation.wing}
                        onChange={(e) =>
                          handleLocationChange(
                            actualIndex,
                            "wing",
                            e.target.value as string
                          )
                        }
                        input={<OutlinedInput label="Wing" />}
                        disabled={!mapping.selectedLocation.building}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>
                            {!mapping.selectedLocation.building
                              ? "Select Building first"
                              : "Select Wing"}
                          </em>
                        </MenuItem>
                        {mapping.locationData.wings
                          .filter((wing) => wing?.id && wing?.name)
                          .map((wing) => (
                            <MenuItem key={wing.id} value={wing.id.toString()}>
                              {wing.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    {/* Area */}
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Area</InputLabel>
                      <Select
                        value={mapping.selectedLocation.area}
                        onChange={(e) =>
                          handleLocationChange(
                            actualIndex,
                            "area",
                            e.target.value as string
                          )
                        }
                        input={<OutlinedInput label="Area" />}
                        disabled={!mapping.selectedLocation.building}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>
                            {!mapping.selectedLocation.building
                              ? "Select Building first"
                              : "Select Area"}
                          </em>
                        </MenuItem>
                        {mapping.locationData.areas
                          .filter((area) => area?.id && area?.name)
                          .map((area) => (
                            <MenuItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    {/* Floor */}
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Floor</InputLabel>
                      <Select
                        value={mapping.selectedLocation.floor}
                        onChange={(e) =>
                          handleLocationChange(
                            actualIndex,
                            "floor",
                            e.target.value as string
                          )
                        }
                        input={<OutlinedInput label="Floor" />}
                        disabled={!mapping.selectedLocation.building}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>
                            {!mapping.selectedLocation.building
                              ? "Select Building first"
                              : "Select Floor"}
                          </em>
                        </MenuItem>
                        {mapping.locationData.floors
                          .filter((floor) => floor?.id && floor?.name)
                          .map((floor) => (
                            <MenuItem
                              key={floor.id}
                              value={floor.id.toString()}
                            >
                              {floor.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>

                    {/* Room */}
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Room</InputLabel>
                      <Select
                        value={mapping.selectedLocation.room}
                        onChange={(e) =>
                          handleLocationChange(
                            actualIndex,
                            "room",
                            e.target.value as string
                          )
                        }
                        input={<OutlinedInput label="Room" />}
                        disabled={!mapping.selectedLocation.building}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>
                            {!mapping.selectedLocation.building
                              ? "Select Building first"
                              : "Select Room"}
                          </em>
                        </MenuItem>
                        {mapping.locationData.rooms
                          .filter((room) => room?.id && room?.name)
                          .map((room) => (
                            <MenuItem key={room.id} value={room.id.toString()}>
                              {room.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </div>
                </div>
              );
            })}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={addSurveyMapping}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location Configuration
            </Button>
          </div>
        </div>
      </Section>
      )}

      {/* Survey Questions Section */}
      {selectedSurveyQuestions.length > 0 && (
        <Section
          title="Survey Questions"
          icon={<ListChecks className="w-3.5 h-3.5" />}
        >
          <div className="space-y-4">
            <div className="mb-4 text-sm text-gray-600">
              Displaying questions from the selected survey. These questions
              will be applied to all location configurations.
            </div>
            {selectedSurveyQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="relative rounded-md border border-dashed bg-muted/30 p-4"
              >
                {/* First Row - Mandatory Checkbox */}
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`mandatory-${idx}`}
                      checked={q.mandatory}
                      className="w-4 h-4 text-[#C72030] bg-white border-gray-300 rounded focus:ring-[#C72030] focus:ring-2 accent-[#C72030]"
                      disabled
                    />
                    <label
                      htmlFor={`mandatory-${idx}`}
                      className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                    >
                      Mandatory
                    </label>
                  </div>
                </div>

                {/* Second Row - Task and Input Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Question</InputLabel>
                      <Select
                        value={q.task}
                        label="Question"
                        notched
                        disabled
                        renderValue={() => `Q${idx + 1}. ${q.task || "Untitled question"}`}
                      >
                        <MenuItem value={q.task}>
                          {`Q${idx + 1}. ${q.task || "Untitled question"}`}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                  <div>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Input Type</InputLabel>
                      <Select
                        value={q.inputType}
                        label="Input Type"
                        notched
                        disabled
                        displayEmpty
                        renderValue={(value) =>
                          getInputTypeLabel(String(value || ""))
                        }
                      >
                        <MenuItem value="yes_no">Yes/No</MenuItem>
                        <MenuItem value="multiple_choice">
                          Multiple Choice
                        </MenuItem>
                        <MenuItem value="rating">Rating</MenuItem>
                        <MenuItem value="text_input">Text Input</MenuItem>
                        <MenuItem value="input_box">Input Box</MenuItem>
                        <MenuItem value="description">Description</MenuItem>
                        <MenuItem value="numeric">Numeric</MenuItem>
                        <MenuItem value="emoji">Emoji</MenuItem>
                        <MenuItem value="smiley">Smiley</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>

                {/* Options for multiple choice */}
                {q.inputType === "multiple_choice" && (
                  <div className="mt-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Options</InputLabel>
                      <Select
                        value={q.optionsText || ""}
                        label="Options"
                        notched
                        disabled
                        renderValue={() => q.optionsText || "No options"}
                      >
                        <MenuItem value={q.optionsText || ""}>
                          {q.optionsText || "No options"}
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Show parsed options preview */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <p className="font-medium text-gray-800 mb-1">
                          ✅ Multi-Options ({q.options.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {q.options.map((option, optIdx) => (
                            <span
                              key={optIdx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
        <Button
          variant="destructive"
          className="px-6 sm:px-8 w-full sm:w-auto"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update"
          )}
        </Button>
        <Button
          variant="outline"
          className="px-6 sm:px-8 w-full sm:w-auto"
          onClick={() => navigate("/maintenance/survey/mapping")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
