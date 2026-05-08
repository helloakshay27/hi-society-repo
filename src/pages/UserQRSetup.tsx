import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  FormControl,
  InputLabel,
  Box,
  OutlinedInput,
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ListChecks, MapPin, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

// Interfaces
interface Survey {
  id: number;
  name: string;
  snag_audit_category: string | null;
  snag_audit_sub_category: string | null;
  questions_count: number;
  active: number;
  check_type: string;
  snag_questions?: SnagQuestion[];
}

interface SnagQuestion {
  id: number;
  descr: string;
  qtype: string;
  quest_mandatory: boolean;
  snag_quest_options?: QuestionOption[];
}

interface QuestionOption {
  qname: string;
}

interface LocationItem {
  id: number;
  name: string;
}

interface UserItem {
  id: number;
  name: string;
}

interface LocationConfig {
  id: string;
  building_id: string;
  flat_id: string;
  user_id: string;
  locationData: {
    towers: LocationItem[];
    flats: LocationItem[];
    users: UserItem[];
  };
}

interface Question {
  id: string;
  task: string;
  inputType: string;
  mandatory: boolean;
  options: string[];
  optionsText: string;
}

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

export const UserQRSetup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "User QR Setup";
  }, []);

  // Form state
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [selectedSurveyQuestions, setSelectedSurveyQuestions] = useState<Question[]>([]);

  // Location configuration state
  const [towers, setTowers] = useState<LocationItem[]>([]);
  const [loadingTowers, setLoadingTowers] = useState(false);

  const initialConfigId = `uqr-${Date.now()}`;
  const [locationConfigs, setLocationConfigs] = useState<LocationConfig[]>([
    {
      id: initialConfigId,
      building_id: "",
      flat_id: "",
      user_id: "",
      locationData: {
        towers: [],
        flats: [],
        users: [],
      },
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch towers and surveys on component mount
  useEffect(() => {
    fetchTowers();
    fetchSurveys();
  }, []);

  // Update survey questions when survey changes
  useEffect(() => {
    updateSurveyQuestions(selectedSurveyId || undefined);
  }, [selectedSurveyId, surveys]);

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
      const towersArray = response.data?.society_blocks || [];
      setTowers(towersArray);
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast.error("Failed to fetch towers", { duration: 5000 });
    } finally {
      setLoadingTowers(false);
    }
  };

  // Fetch surveys
  const fetchSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const siteId = localStorage.getItem("site_id") || "2189";
      const url = `/pms/admin/snag_checklists.json?site_id=${siteId}&q[name_cont]=&q[check_type_eq]=Survey&q[snag_audit_sub_category_id_eq]=&q[snag_audit_category_id_eq]=`;

      const response = await fetch(getFullUrl(url), {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch surveys");
      const surveyData = await response.json();

      // Filter only active surveys
      const activeSurveys = (surveyData || []).filter(
        (survey: Survey) => survey.active === 1
      );
      setSurveys(activeSurveys);
    } catch (error) {
      console.error("Error fetching surveys:", error);
      toast.error("Failed to fetch surveys", { duration: 5000 });
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  };

  // Fetch flats for a tower
  const fetchFlatsForConfig = async (configIndex: number, towerId: string) => {
    try {
      if (!towerId) return;
      const idSociety = localStorage.getItem("selectedSocietyId") || "";

      const response = await apiClient.get(`/get_society_flats.json?society_block_id=${towerId}&society_id=${idSociety}`);
      const flatsArray = response.data?.society_flats || [];

      setLocationConfigs((prev) =>
        prev.map((config, i) => {
          if (i !== configIndex) return config;
          return {
            ...config,
            locationData: {
              ...config.locationData,
              flats: flatsArray,
              users: [], // Clear users when flats change
            },
            user_id: "", // Clear selected user
          };
        })
      );
    } catch (error) {
      console.error("Error fetching flats:", error);
      toast.error("Failed to fetch flats", { duration: 3000 });
    }
  };

  // Fetch users for a flat
  const fetchUsers = async (configIndex: number, flatId: string) => {
    try {
      if (!flatId) return;

      const response = await apiClient.get(`/crm/admin/flat_users.json?q[user_flat_society_flat_id_eq]=${flatId}&q[approve_eq]=true`);
      // Response is an array of [name, id] tuples
      const usersArray = Array.isArray(response.data) 
        ? response.data.map(([name, id]: [string, number]) => ({
            id,
            name,
          }))
        : [];

      setLocationConfigs((prev) =>
        prev.map((config, i) => {
          if (i !== configIndex) return config;
          return {
            ...config,
            locationData: {
              ...config.locationData,
              users: usersArray,
            },
          };
        })
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users", { duration: 3000 });
    }
  };



  // Handle tower change
  const handleTowerChange = async (configIndex: number, towerId: string) => {
    setLocationConfigs((prev) =>
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
  const handleFlatChange = async (configIndex: number, flatId: string) => {
    setLocationConfigs((prev) =>
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
  const handleUserChange = (configIndex: number, userId: string) => {
    setLocationConfigs((prev) =>
      prev.map((config, i) => {
        if (i !== configIndex) return config;
        return {
          ...config,
          user_id: userId,
        };
      })
    );
  };

  // Add new location configuration
  const addLocationConfig = () => {
    const newConfigId = `uqr-${Date.now()}`;
    setLocationConfigs((prev) => [
      ...prev,
      {
        id: newConfigId,
        building_id: "",
        flat_id: "",
        user_id: "",
        locationData: {
          towers: [],
          flats: [],
          users: [],
        },
      },
    ]);
  };

  // Remove location configuration
  const removeLocationConfig = (idx: number) => {
    setLocationConfigs((prev) => prev.filter((_, i) => i !== idx));
  };

  // Function to update survey questions based on selected survey
  const updateSurveyQuestions = (surveyId?: number) => {
    const targetSurveyId = surveyId || selectedSurveyId;
    if (!targetSurveyId) {
      setSelectedSurveyQuestions([]);
      return;
    }

    const selectedSurvey = surveys.find(
      (survey) => survey.id === targetSurveyId
    );
    if (selectedSurvey && selectedSurvey.snag_questions) {
      const mappedQuestions = selectedSurvey.snag_questions.map(
        (q: SnagQuestion) => {
          // Map API question types to UI input types
          let inputType = "";
          switch (q.qtype) {
            case "multiple":
              inputType = "multiple_choice";
              break;
            case "yesno":
              inputType = "yes_no";
              break;
            case "rating":
              inputType = "rating";
              break;
            case "input":
              inputType = "text_input";
              break;
            case "input_box":
              inputType = "input_box";
              break;
            case "description":
              inputType = "description";
              break;
            case "emoji":
              inputType = "emoji";
              break;
            default:
              inputType = "";
          }

          return {
            id: q.id.toString(),
            task: q.descr,
            inputType,
            mandatory: !!q.quest_mandatory,
            options: q.snag_quest_options
              ? q.snag_quest_options.map((opt: QuestionOption) => opt.qname)
              : [],
            optionsText: q.snag_quest_options
              ? q.snag_quest_options
                  .map((opt: QuestionOption) => opt.qname)
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

  // Field styles for Material-UI components
  const fieldStyles = {
    height: '45px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
      height: '45px',
      '& fieldset': {
        borderColor: '#ddd',
      },
      '&:hover fieldset': {
        borderColor: '#C72030',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#C72030',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#C72030',
      },
    },
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validation
    if (!selectedSurveyId) {
      toast.error("Please select a survey", { duration: 3000 });
      return;
    }

    // Check that all location configs are valid
    const invalidConfigs = locationConfigs.filter(
      (config) => !config.building_id || !config.flat_id || !config.user_id
    );

    if (invalidConfigs.length > 0) {
      toast.error("Please fill in all location fields for each configuration", { duration: 3000 });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for submission using the same format as AddSurveyMapping
      const requestData = {
        survey_mappings: locationConfigs.map((config) => ({
          survey_id: selectedSurveyId,
          tower_id: parseInt(config.building_id),
          flat_id: parseInt(config.flat_id),
          user_society_id: parseInt(config.user_id),
        })),
      };

      const response = await fetch(
        getFullUrl("/survey_mappings/create_survey_mappings.json"),
        {
          method: "POST",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create survey mappings");
      }

      const result = await response.json();

      const totalConfigs = locationConfigs.length;
      const successMessage =
        totalConfigs === 1
          ? "Survey mapping created successfully!"
          : `${totalConfigs} survey mapping(s) created successfully!`;

      toast.success(successMessage, { duration: 3000 });

      setTimeout(() => {
        navigate("/maintenance/survey/mapping");
      }, 1000);
    } catch (error: unknown) {
      console.error("Error creating survey mappings:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create survey mappings: ${errorMessage}`, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-wide uppercase">
            User QR Setup
          </h1>
        </div>
      </header>

      {/* Survey Selection Section */}
      <Section title="Survey Selection" icon={<ListChecks className="w-3.5 h-3.5" />}>
        <div className="space-y-6">
          <div className="rounded-md border border-dashed bg-muted/30 p-4">
            <div className="space-y-4">
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
                    onChange={(e: SelectChangeEvent<number>) => {
                      setSelectedSurveyId(e.target.value as number);
                    }}
                    label="Select Survey"
                    notched
                    displayEmpty
                    disabled={loadingSurveys}
                  >
                    {selectedSurveyId === null && (
                      <MenuItem disabled value="">
                        <em style={{ color: "#999", fontStyle: "italic" }}>
                          Select a survey
                        </em>
                      </MenuItem>
                    )}
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

      {/* Location Configuration Section */}
      <Section title="User Configuration" icon={<MapPin className="w-3.5 h-3.5" />}>
        <div className="space-y-6">
          {locationConfigs.map((config, configIdx) => (
            <div
              key={config.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                {/* <h3 className="font-semibold text-gray-800">
                  Configuration {configIdx + 1}
                </h3> */}
                {locationConfigs.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLocationConfig(configIdx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tower Selection */}
                <FormControl fullWidth variant="outlined" sx={{ "& .MuiInputBase-root": fieldStyles }}>
                  <InputLabel shrink>
                    Tower <span className="text-red-500">*</span>
                  </InputLabel>
                  <Select
                    value={config.building_id}
                    onChange={(e: SelectChangeEvent<string>) =>
                      handleTowerChange(configIdx, e.target.value)
                    }
                    input={<OutlinedInput label="Tower" />}
                    disabled={loadingTowers || towers.length === 0}
                    displayEmpty
                    notched
                  >
                    <MenuItem value="">
                      <em>
                        {loadingTowers ? "Loading..." : "Select tower"}
                      </em>
                    </MenuItem>
                    {towers.map((tower) => (
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
                      handleFlatChange(configIdx, e.target.value)
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
                      handleUserChange(configIdx, e.target.value)
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

          {/* <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={addLocationConfig}
              className="text-[#C72030] border-[#C72030] hover:bg-red-50"
            >
              + Add Another Configuration
            </Button>
          </div> */}
        </div>
      </Section>

      {/* Survey Questions Section */}
      {selectedSurveyQuestions.length > 0 && (
        <Section
          title="Survey Questions"
          icon={<ListChecks className="w-3.5 h-3.5" />}
        >
          <div className="space-y-4">
            <div className="mb-4 text-sm text-gray-600">
              Displaying questions from the selected survey. These questions
              will be applied to all user configurations.
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        renderValue={() => q.task}
                      >
                        <MenuItem value={q.task}>{q.task}</MenuItem>
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
                      >
                        <MenuItem value="yes_no">Yes/No</MenuItem>
                        <MenuItem value="multiple_choice">
                          Multiple Choice
                        </MenuItem>
                        <MenuItem value="rating">Rating</MenuItem>
                        <MenuItem value="text_input">Text Input</MenuItem>
                        <MenuItem value="input_box">Input Box</MenuItem>
                        <MenuItem value="description">Description</MenuItem>
                        <MenuItem value="emoji">Emoji</MenuItem>
                        <MenuItem value="numeric">Numeric</MenuItem>
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
                  </div>
                )}

                {/* Options for emoji */}
                {q.inputType === "emoji" && (
                  <div className="mt-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Emoji Options</InputLabel>
                      <Select
                        value={q.optionsText || ""}
                        label="Emoji Options"
                        notched
                        disabled
                        renderValue={() => q.optionsText || "No emoji options"}
                      >
                        <MenuItem value={q.optionsText || ""}>
                          {q.optionsText || "No emoji options"}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                )}

                {/* Options for rating */}
                {(q.inputType === "rating" || q.inputType === "numeric") && (
                  <div className="mt-4">
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ "& .MuiInputBase-root": fieldStyles }}
                    >
                      <InputLabel shrink>Rating Scale</InputLabel>
                      <Select
                        value={q.optionsText || ""}
                        label="Rating Scale"
                        notched
                        disabled
                        renderValue={() => q.optionsText || "No rating scale"}
                      >
                        <MenuItem value={q.optionsText || ""}>
                          {q.optionsText || "No rating scale"}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 justify-center pt-2">
        <Button
          variant="destructive"
          className="px-8"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
        <Button
          variant="outline"
          className="px-8"
          onClick={() => navigate("/maintenance/survey/mapping")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
