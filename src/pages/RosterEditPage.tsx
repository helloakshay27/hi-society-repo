import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Clock,
  Loader2,
  Save,
  X,
  Edit,
} from "lucide-react";
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  TextField,
  Chip,
  Box,
  OutlinedInput,
  ListItemText,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import { RootState } from "@/store/store";

// Section component for consistent layout
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

// Types
interface FMUser {
  id: number;
  name: string;
  email?: string;
  department?: string;
}

interface Shift {
  id: number;
  start_hour: number;
  start_min: number;
  end_hour: number;
  end_min: number;
  timings: string;
}

interface RosterFormData {
  templateName: string;
  selectedDays: string[];
  dayType: "Weekdays" | "Weekends" | "Recurring";
  weekSelection: string[];
  location: string;
  shift: number | null;
  selectedEmployees: number[];
  rosterType: "Permanent";
  active: boolean;
}

export const RosterEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const rosterBasePath = location.pathname.startsWith("/smartsecure/roster")
    ? "/smartsecure/roster"
    : "/settings/account/roster";
  const isSmartSecureRoster = rosterBasePath === "/smartsecure/roster";

  // Redux state for site information
  const { selectedSite } = useSelector((state: RootState) => state.site);

  // Set document title
  useEffect(() => {
    document.title = "Edit Roster Template";
  }, []);

  // Form state
  const [formData, setFormData] = useState<RosterFormData>({
    templateName: "",
    selectedDays: [],
    dayType: "Weekdays",
    weekSelection: [],
    location: "",
    shift: null,
    selectedEmployees: [],
    rosterType: "Permanent",
    active: true,
  });

  // Period selection state - Updated to use Date objects
  const [period, setPeriod] = useState({
    startDate: new Date(2025, 7, 19), // Month is 0-indexed, so 7 = August
    endDate: new Date(2025, 8, 18), // 8 = September
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFMUsers, setLoadingFMUsers] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Data states
  const [fmUsers, setFMUsers] = useState<FMUser[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>("");

  // Error states
  const [errors, setErrors] = useState({
    templateName: false,
    selectedDays: false,
    dayType: false,
    location: false,
    shift: false,
    selectedEmployees: false,
  });

  // MUI select styles
  const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    "& .MuiInputBase-input, & .MuiSelect-select": {
      padding: { xs: "8px", sm: "10px", md: "12px" },
    },
    backgroundColor: "#fafbfc",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#e1e5e9",
      borderWidth: "1px",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#9ca3af",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#C72030",
      borderWidth: "2px",
    },
  };

  // Fetch data on component mount
  useEffect(() => {
    if (id) {
      fetchRosterTemplate();
      fetchFMUsers();
      fetchShifts();
      fetchCurrentLocation();
    }
  }, [id]);

  // Fetch existing roster template
  const fetchRosterTemplate = async () => {
    setIsLoading(true);
    try {
      const apiUrl = getFullUrl(
        isSmartSecureRoster
          ? `/spree/manage/user_roasters/${id}.json`
          : `/pms/admin/user_roasters/${id}.json`
      );
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });
      if (!response.ok) throw new Error("Failed to fetch roster template");
      const data = await response.json();
      const r = data; // Direct response structure

      console.log("📝 Roster Template API Response:", r);

      // Parse no_of_days based on roster type
      const selectedDays: string[] = [];
      let weekSelection: string[] = [];

      if (
        r.roaster_type === "Recurring" &&
        r.no_of_days &&
        Array.isArray(r.no_of_days) &&
        r.no_of_days.length > 0
      ) {
        // For recurring: no_of_days: [{ "1": ["2", "1"], "2": ["2"], "3": ["3"] }]
        const recurringData = r.no_of_days[0];
        Object.keys(recurringData).forEach((weekNum) => {
          const dayNumbers = recurringData[weekNum];
          dayNumbers.forEach((dayNum: string) => {
            // Map day numbers back to day names (1=Mon, 2=Tue, ..., 7=Sun)
            const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const dayName = dayNames[parseInt(dayNum) - 1];
            if (dayName) {
              selectedDays.push(`Week${weekNum}-${dayName}`);
            }
          });
        });
      } else if (
        r.roaster_type === "Weekdays" &&
        r.no_of_days &&
        Array.isArray(r.no_of_days)
      ) {
        // For weekdays: extract week numbers
        weekSelection = r.no_of_days.map(
          (weekNum: string) =>
            `${weekNum}${weekNum === "1" ? "st" : weekNum === "2" ? "nd" : weekNum === "3" ? "rd" : "th"} Week`
        );
      } else if (
        r.roaster_type === "Weekends" &&
        r.no_of_days &&
        Array.isArray(r.no_of_days)
      ) {
        // For weekends: extract weekend numbers
        weekSelection = r.no_of_days.map(
          (weekendNum: string) =>
            `${weekendNum}${weekendNum === "1" ? "st" : weekendNum === "2" ? "nd" : weekendNum === "3" ? "rd" : "th"} Weekend`
        );
      }

      // Parse dates
      const periodDates = {
        startDate: new Date(2025, 7, 21), // Default: Aug 21, 2025
        endDate: new Date(2025, 8, 19), // Default: Sep 19, 2025
      };

      if (r.start_date) {
        periodDates.startDate = new Date(r.start_date);
      }

      if (r.end_date) {
        periodDates.endDate = new Date(r.end_date);
      }

      // Map employees from the new response structure
      const selectedEmployees =
        r.employees && Array.isArray(r.employees)
          ? r.employees.map((emp: any) => emp.id)
          : r.resource_id
            ? [Number(r.resource_id)]
            : [];

      console.log("👥 Mapped Employees:", selectedEmployees);
      console.log("📊 Original employees data:", r.employees);

      setFormData({
        templateName: r.name || "",
        selectedDays,
        dayType: r.roaster_type || "Weekdays",
        weekSelection,
        location: r.location || "",
        shift: r.user_shift_id ? Number(r.user_shift_id) : null,
        selectedEmployees,
        rosterType: r.allocation_type || "Permanent",
        active: r.active !== undefined ? r.active : true,
      });

      setPeriod(periodDates);
    } catch (error) {
      console.error("Error fetching roster template:", error);
      toast.error("Failed to load roster template");
      // navigate('/roster');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch FM Users
  const fetchFMUsers = async () => {
    setLoadingFMUsers(true);
    try {
      const societyId =
        localStorage.getItem("selectedSocietyId") ||
        localStorage.getItem("society_id") ||
        "";
      const apiUrl = getFullUrl(
        `/spree/manage/user_roasters/security_users?society_id=${societyId}`
      );
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const users = Array.isArray(data) ? data : data.users || [];
      setFMUsers(
        users.map((user: { id: number; name: string; email?: string }) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        }))
      );
    } catch (error) {
      console.error("Error fetching FM Users:", error);
      toast.error("Failed to load FM users");
      setFMUsers([]);
    } finally {
      setLoadingFMUsers(false);
    }
  };

  // Fetch Shifts from the API
  const fetchShifts = async () => {
    setLoadingShifts(true);
    try {
      const societyId =
        localStorage.getItem("selectedSocietyId") ||
        localStorage.getItem("society_id") ||
        "";
      const apiUrl = getFullUrl(
        `/spree/manage/user_shifts.json?society_id=${societyId}`
      );
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Shifts API Response:", data);

      // Adapt the response to our expected format
      const shiftsData = data.user_shifts || data.shifts || data || [];
      setShifts(
        shiftsData.map((shift: any) => ({
          id: shift.id,
          start_hour: shift.start_hour,
          start_min: shift.start_min,
          end_hour: shift.end_hour,
          end_min: shift.end_min,
          timings: shift.timings,
        }))
      );
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast.error("Failed to load shifts");
      setShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  // Fetch Current Location
  const fetchCurrentLocation = async () => {
    try {
      // First try to get from Redux state
      if (selectedSite?.name) {
        setCurrentLocation(selectedSite.name);
        setFormData((prev) => ({ ...prev, location: selectedSite.name }));
        return;
      }

      // Fallback to localStorage
      const siteId = localStorage.getItem("selectedSiteId");
      const siteName = localStorage.getItem("selectedSiteName");
      const companyName = localStorage.getItem("selectedCompanyName");

      let locationName = "Current Site";

      if (siteName && siteName !== "null" && siteName !== "") {
        locationName = siteName;
      } else if (companyName && companyName !== "null" && companyName !== "") {
        locationName = companyName;
      }

      // Try to get from DOM if localStorage doesn't have it
      if (locationName === "Current Site") {
        const headerSiteElement = document.querySelector("[data-site-name]");
        if (headerSiteElement) {
          locationName =
            headerSiteElement.textContent?.trim() || "Current Site";
        }
      }

      setCurrentLocation(locationName);
      setFormData((prev) => ({ ...prev, location: locationName }));
    } catch (error) {
      console.error("Error fetching current location:", error);
      setCurrentLocation("Current Site");
      setFormData((prev) => ({ ...prev, location: "Current Site" }));
    }
  };


  // Handle day type selection
  const handleDayTypeChange = (type: "Weekdays" | "Weekends" | "Recurring") => {
    setFormData((prev) => ({
      ...prev,
      dayType: type,
      selectedDays: [],
      weekSelection: [],
    }));

    // Auto-select days based on type
    if (type === "Weekdays") {
      setFormData((prev) => ({
        ...prev,
        selectedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      }));
    } else if (type === "Weekends") {
      setFormData((prev) => ({
        ...prev,
        selectedDays: ["Saturday", "Sunday"],
      }));
    }

    if (errors.selectedDays) {
      setErrors((prev) => ({ ...prev, selectedDays: false }));
    }
  };

  // Handle week selection for recurring
  const handleWeekToggle = (week: string) => {
    setFormData((prev) => {
      const newWeekSelection = prev.weekSelection.includes(week)
        ? prev.weekSelection.filter((w) => w !== week)
        : [...prev.weekSelection, week];

      // If "All" is selected, select all other options
      if (week === "All" && !prev.weekSelection.includes("All")) {
        if (prev.dayType === "Weekdays") {
          return {
            ...prev,
            weekSelection: [
              "1st Week",
              "2nd Week",
              "3rd Week",
              "4th Week",
              "5th Week",
              "All",
            ],
          };
        } else if (prev.dayType === "Weekends") {
          return {
            ...prev,
            weekSelection: [
              "1st Weekend",
              "2nd Weekend",
              "3rd Weekend",
              "4th Weekend",
              "5th Weekend",
              "All",
            ],
          };
        }
      }

      // If "All" is deselected, deselect all other options
      if (week === "All" && prev.weekSelection.includes("All")) {
        return {
          ...prev,
          weekSelection: [],
        };
      }

      // If any other option is selected and "All" was already selected, remove "All"
      if (week !== "All" && prev.weekSelection.includes("All")) {
        return {
          ...prev,
          weekSelection: newWeekSelection.filter((w) => w !== "All"),
        };
      }

      // Check if all individual options are selected (except "All"), then auto-select "All"
      const allOptions =
        prev.dayType === "Weekdays"
          ? ["1st Week", "2nd Week", "3rd Week", "4th Week", "5th Week"]
          : [
              "1st Weekend",
              "2nd Weekend",
              "3rd Weekend",
              "4th Weekend",
              "5th Weekend",
            ];

      const hasAllIndividualOptions = allOptions.every((option) =>
        newWeekSelection.includes(option)
      );

      if (hasAllIndividualOptions && !newWeekSelection.includes("All")) {
        return {
          ...prev,
          weekSelection: [...newWeekSelection, "All"],
        };
      }

      return {
        ...prev,
        weekSelection: newWeekSelection,
      };
    });
  };

  // Handle day toggle for recurring weekly schedule
  const handleRecurringDayToggle = (day: string, week: string) => {
    const dayKey = `${week}-${day}`;
    setFormData((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayKey)
        ? prev.selectedDays.filter((d) => d !== dayKey)
        : [...prev.selectedDays, dayKey],
    }));

    if (errors.selectedDays) {
      setErrors((prev) => ({ ...prev, selectedDays: false }));
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof RosterFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing/selecting
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Effect to update location when selectedSite changes
  useEffect(() => {
    if (selectedSite?.name) {
      setCurrentLocation(selectedSite.name);
      setFormData((prev) => ({ ...prev, location: selectedSite.name }));
    }
  }, [selectedSite]);

  // Validation
  const validateForm = (): boolean => {
    let hasSelectedDays = false;

    if (formData.dayType === "Recurring") {
      hasSelectedDays = formData.selectedDays.length > 0;
    } else if (
      formData.dayType === "Weekdays" ||
      formData.dayType === "Weekends"
    ) {
      hasSelectedDays = formData.weekSelection.length > 0;
    }

    const newErrors = {
      templateName: !formData.templateName.trim(),
      selectedDays: !hasSelectedDays,
      dayType: false,
      location: false, // Location is auto-populated, not required validation
      shift: formData.shift === null,
      selectedEmployees: formData.selectedEmployees.length === 0,
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error);

    if (hasErrors) {
      const errorFields = [];
      if (newErrors.templateName) errorFields.push("Template Name");
      if (newErrors.selectedDays) errorFields.push("Working Days");
      if (newErrors.shift) errorFields.push("Shift");
      if (newErrors.selectedEmployees) errorFields.push("Selected Employees");

      toast.error(
        `Please fill in the following required fields: ${errorFields.join(", ")}`,
        {
          duration: 5000,
        }
      );
    }

    return !hasErrors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload for API (matching RosterCreatePage format)
      let payload;
      const baseUserRoaster = {
        name: formData.templateName,
        resource_id:
          selectedSite?.id || localStorage.getItem("selectedSiteId") || "",
        user_shift_id: formData.shift || "",
        allocation_type: formData.rosterType,
        roaster_type: formData.dayType,
        active: formData.active,
      };

      // Common date format (Rails style for all types - matching RosterCreatePage)
      const commonDateFields = {
        "start_date(3i)": period.startDate.getDate().toString(),
        "start_date(2i)": (period.startDate.getMonth() + 1).toString(),
        "start_date(1i)": period.startDate.getFullYear().toString(),
        "end_date(3i)": period.endDate.getDate().toString(),
        "end_date(2i)": (period.endDate.getMonth() + 1).toString(),
        "end_date(1i)": period.endDate.getFullYear().toString(),
      };

      // Base payload structure (common for all day types)
      const basePayload = {
        user_roaster: {
          ...baseUserRoaster,
          ...commonDateFields,
        },
        no_of_days: "",
        weekdays: [],
        weekends: [],
        user_ids: formData.selectedEmployees,
      };

      if (formData.dayType === "Weekdays") {
        const weekdays = formData.weekSelection
          .filter((w) => w.match(/^\d/))
          .map((w) => w.charAt(0));

        payload = {
          ...basePayload,
          weekdays: weekdays,
        };
      } else if (formData.dayType === "Weekends") {
        const weekends = formData.weekSelection
          .filter((w) => w.match(/^\d/))
          .map((w) => w.charAt(0));

        payload = {
          ...basePayload,
          weekends: weekends,
        };
      } else if (formData.dayType === "Recurring") {
        const recurringData = {};
        for (let weekNum = 1; weekNum <= 5; weekNum++) {
          const daysForWeek = formData.selectedDays
            .filter((d) => d.startsWith(`Week${weekNum}-`))
            .map((d) => {
              const dayShort = d.split("-")[1];
              return (
                ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
                  dayShort
                ) + 1
              ).toString();
            });
          if (daysForWeek.length > 0) {
            recurringData[weekNum.toString()] = daysForWeek;
          }
        }

        payload = {
          ...basePayload,
          recurring: [recurringData],
        };
      } else {
        payload = basePayload;
      }

      // Log payload to console
      console.log("🎯 PATCH API Payload:", JSON.stringify(payload, null, 2));

      // PATCH API call
      const updateApiUrl = getFullUrl(
        isSmartSecureRoster
          ? `/spree/manage/user_roasters/${id}.json`
          : `/pms/admin/user_roasters/${id}.json`
      );
      const response = await fetch(updateApiUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API error");

      toast.success("Roster template updated successfully!");
      navigate(`${rosterBasePath}/detail/${id}`);
    } catch (error) {
      console.error("Error updating roster template:", error);
      toast.error("Failed to update roster template. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`${rosterBasePath}/detail/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Roster Details"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C72030]/10 text-[#C72030] flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide uppercase">
                Edit Roster Template
              </h1>
              {(selectedSite?.name || currentLocation !== "Current Site") && (
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {selectedSite?.name || currentLocation}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <div className="space-y-6">
        {/* Basic Information Section */}
        <Section
          title="Basic Information"
          icon={<Calendar className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <TextField
                label={
                  <>
                    Template Name<span className="text-red-500">*</span>
                  </>
                }
                placeholder="Enter template name"
                value={formData.templateName}
                onChange={(e) =>
                  handleInputChange("templateName", e.target.value)
                }
                fullWidth
                variant="outlined"
                error={errors.templateName}
                helperText={
                  errors.templateName ? "Template name is required" : ""
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: fieldStyles,
                }}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <TextField
                label="Roster Type"
                value="Permanent"
                disabled
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: { ...fieldStyles, backgroundColor: "#f5f5f5" },
                }}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-4 block mt-6">
              Working Days <span className="text-red-500">*</span>
            </Label>

            {/* Day Type Selection - Compact inline */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-6">
                {/* Weekdays Option */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dayType"
                    checked={formData.dayType === "Weekdays"}
                    onChange={() => handleDayTypeChange("Weekdays")}
                    className="text-[#C72030] focus:ring-[#C72030] w-4 h-4"
                    disabled={isSubmitting}
                  />
                  <span className="font-medium text-gray-800">Weekdays</span>
                  <span className="text-sm text-gray-500">(Mon-Fri)</span>
                </label>

                {/* Weekends Option */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dayType"
                    checked={formData.dayType === "Weekends"}
                    onChange={() => handleDayTypeChange("Weekends")}
                    className="text-[#C72030] focus:ring-[#C72030] w-4 h-4"
                    disabled={isSubmitting}
                  />
                  <span className="font-medium text-gray-800">Weekends</span>
                  <span className="text-sm text-gray-500">(Sat-Sun)</span>
                </label>

                {/* Recurring Option */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dayType"
                    checked={formData.dayType === "Recurring"}
                    onChange={() => handleDayTypeChange("Recurring")}
                    className="text-[#C72030] focus:ring-[#C72030] w-4 h-4"
                    disabled={isSubmitting}
                  />
                  <span className="font-medium text-gray-800">Recurring</span>
                  <span className="text-sm text-gray-500">(Custom)</span>
                </label>
              </div>
            </div>

            {/* Weekdays Selection - Compact */}
            {formData.dayType === "Weekdays" && (
              <div className="space-y-3 p-4 bg-[#f6f4ee] border border-[#D5DbDB] rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-medium text-[#C72030]">
                    Frequency:
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "1st Week",
                    "2nd Week",
                    "3rd Week",
                    "4th Week",
                    "5th Week",
                    "All",
                  ].map((week) => (
                    <label
                      key={week}
                      className={`
                        flex items-center gap-2 px-3 py-1 rounded-md border-2 cursor-pointer transition-all duration-200
                        ${
                          formData.weekSelection.includes(week)
                            ? "border-[#C72030] bg-[#C72030] text-white"
                            : "border-[#D5DbDB] bg-white text-[#1a1a1a] hover:border-[#C72030]"
                        }
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={formData.weekSelection.includes(week)}
                        onChange={() => handleWeekToggle(week)}
                        disabled={isSubmitting}
                        className="sr-only"
                      />
                      <span className="text-xs font-medium">
                        {week === "All" ? "All Weeks" : week}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-[#1a1a1a] opacity-70 mt-2">
                  Days: Mon, Tue, Wed, Thu, Fri
                </div>
              </div>
            )}

            {/* Weekends Selection - Compact */}
            {formData.dayType === "Weekends" && (
              <div className="space-y-3 p-4 bg-[#f6f4ee] border border-[#D5DbDB] rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-medium text-[#C72030]">
                    Frequency:
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "1st Weekend",
                    "2nd Weekend",
                    "3rd Weekend",
                    "4th Weekend",
                    "5th Weekend",
                    "All",
                  ].map((weekend) => (
                    <label
                      key={weekend}
                      className={`
                        flex items-center gap-2 px-3 py-1 rounded-md border-2 cursor-pointer transition-all duration-200
                        ${
                          formData.weekSelection.includes(weekend)
                            ? "border-[#C72030] bg-[#C72030] text-white"
                            : "border-[#D5DbDB] bg-white text-[#1a1a1a] hover:border-[#C72030]"
                        }
                        ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={formData.weekSelection.includes(weekend)}
                        onChange={() => handleWeekToggle(weekend)}
                        disabled={isSubmitting}
                        className="sr-only"
                      />
                      <span className="text-xs font-medium">
                        {weekend === "All" ? "All Weekends" : weekend}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-[#1a1a1a] opacity-70 mt-2">
                  Days: Sat, Sun
                </div>
              </div>
            )}

            {/* Recurring Selection - Compact */}
            {formData.dayType === "Recurring" && (
              <div className="space-y-4 p-4 bg-[#f6f4ee] border border-[#D5DbDB] rounded-lg">
                <div className="text-sm font-medium text-[#C72030] mb-3">
                  Custom Weekly Pattern
                </div>

                {[1, 2, 3, 4, 5].map((weekNum) => (
                  <div
                    key={weekNum}
                    className="bg-white border border-[#D5DbDB] rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Week {weekNum}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const allDaysForWeek = [
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                          ].map((day) => `Week${weekNum}-${day}`);
                          const hasAllDays = allDaysForWeek.every((dayKey) =>
                            formData.selectedDays.includes(dayKey)
                          );

                          setFormData((prev) => ({
                            ...prev,
                            selectedDays: hasAllDays
                              ? prev.selectedDays.filter(
                                  (d) => !allDaysForWeek.includes(d)
                                )
                              : [
                                  ...prev.selectedDays,
                                  ...allDaysForWeek.filter(
                                    (d) => !prev.selectedDays.includes(d)
                                  ),
                                ],
                          }));
                        }}
                        disabled={isSubmitting}
                        className={`
                          px-2 py-1 text-xs rounded transition-all duration-200
                          ${
                            [
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ].every((day) =>
                              formData.selectedDays.includes(
                                `Week${weekNum}-${day}`
                              )
                            )
                              ? "bg-[#C72030] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-[#C72030] hover:text-white"
                          }
                        `}
                      >
                        All
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {[
                        { short: "Mon", full: "Monday" },
                        { short: "Tue", full: "Tuesday" },
                        { short: "Wed", full: "Wednesday" },
                        { short: "Thu", full: "Thursday" },
                        { short: "Fri", full: "Friday" },
                        { short: "Sat", full: "Saturday" },
                        { short: "Sun", full: "Sunday" },
                      ].map((day) => {
                        const isSelected = formData.selectedDays.includes(
                          `Week${weekNum}-${day.short}`
                        );
                        return (
                          <button
                            key={day.short}
                            type="button"
                            onClick={() =>
                              handleRecurringDayToggle(
                                day.short,
                                `Week${weekNum}`
                              )
                            }
                            disabled={isSubmitting}
                            className={`
                              w-full h-8 rounded text-xs font-medium transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-[#C72030] text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-[#C72030] hover:text-white"
                              }
                            `}
                            title={`${day.full} - Week ${weekNum}`}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="text-xs text-[#1a1a1a] opacity-70">
                  {formData.selectedDays.length > 0
                    ? `${formData.selectedDays.length} days selected across all weeks`
                    : "No days selected yet"}
                </div>
              </div>
            )}

            {errors.selectedDays && (
              <p className="text-red-500 text-sm mt-1">
                {formData.dayType === "Recurring"
                  ? "Please select at least one working day"
                  : "Please select at least one frequency option"}
              </p>
            )}
          </div>
        </Section>

        {/* Location Section */}
        <Section
          title="Location"
          icon={<MapPin className="w-4 h-4" />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <TextField
                label="Location"
                value={formData.location}
                disabled
                placeholder="Current site location"
                fullWidth
                variant="outlined"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                InputProps={{
                  sx: { ...fieldStyles, backgroundColor: "#f5f5f5" },
                  startAdornment: (
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                  ),
                }}
              />
            </div>
          </div>
        </Section>

        {/* Shift & Employees Section */}
        <Section title="Shift & Employees" icon={<Clock className="w-4 h-4" />}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative">
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>
                  Shift <span className="text-red-500">*</span>
                </InputLabel>
                <MuiSelect
                  value={formData.shift || ""}
                  onChange={(e) =>
                    handleInputChange("shift", Number(e.target.value))
                  }
                  label="Shift *"
                  notched
                  displayEmpty
                  disabled={loadingShifts || isSubmitting}
                  error={errors.shift}
                >
                  <MenuItem value="">Select Shift</MenuItem>
                  {shifts.map((shift) => (
                    <MenuItem key={shift.id} value={shift.id}>
                      {shift.timings}
                    </MenuItem>
                  ))}
                </MuiSelect>
                {loadingShifts && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <CircularProgress size={16} />
                  </div>
                )}
              </FormControl>
              {errors.shift && (
                <p className="text-red-500 text-sm mt-1">
                  Please select a shift
                </p>
              )}
            </div>

            <div className="relative">
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ "& .MuiInputBase-root": fieldStyles }}
              >
                <InputLabel shrink>
                  List Of Selected Employees{" "}
                  <span className="text-red-500">*</span>
                </InputLabel>
                <MuiSelect
                  multiple
                  value={formData.selectedEmployees}
                  onChange={(e) =>
                    handleInputChange(
                      "selectedEmployees",
                      e.target.value as number[]
                    )
                  }
                  input={
                    <OutlinedInput
                      notched
                      label="List Of Selected Employees *"
                    />
                  }
                  renderValue={(selected) => {
                    const selectedArray = selected as number[];
                    if (selectedArray.length === 0) return "";
                    if (selectedArray.length === 1) {
                      const user = fmUsers.find((u) => u.id === selectedArray[0]);
                      return user?.name || `User ${selectedArray[0]}`;
                    }
                    if (selectedArray.length <= 3) {
                      return selectedArray
                        .map((value) => {
                          const user = fmUsers.find((u) => u.id === value);
                          return user?.name || `User ${value}`;
                        })
                        .join(", ");
                    }
                    return `${selectedArray.length} employees selected`;
                  }}
                  displayEmpty
                  disabled={loadingFMUsers || isSubmitting}
                  error={errors.selectedEmployees}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        overflow: "auto",
                      },
                    },
                  }}
                >
                  {fmUsers.length > 0 ? (
                    fmUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        <Checkbox
                          checked={formData.selectedEmployees.indexOf(user.id) > -1}
                          sx={{
                            color: "#D5DbDB",
                            "&.Mui-checked": {
                              color: "#C72030",
                            },
                          }}
                        />
                        <ListItemText
                          primary={user.name || "No name available"}
                          secondary={user.email}
                        />
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <ListItemText
                        primary="No employees found"
                        sx={{ fontStyle: "italic", color: "#9ca3af" }}
                      />
                    </MenuItem>
                  )}
                </MuiSelect>
                {loadingFMUsers && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                    <CircularProgress size={16} />
                  </div>
                )}
              </FormControl>
              {errors.selectedEmployees && (
                <p className="text-red-500 text-sm mt-1">
                  Please select at least one employee
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section title="Select Period" icon={<Calendar className="w-4 h-4" />}>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-4 block">
                Roster Period <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Start Date
                  </Label>
                  <input
                    type="date"
                    value={period.startDate.toISOString().split("T")[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setPeriod((prev) => ({ ...prev, startDate: newDate }));
                    }}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-[#e1e5e9] rounded-md bg-[#fafbfc] 
                             focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-gray-900 text-sm"
                    style={{ height: "45px" }}
                  />
                </div>

                {/* End Date */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    End Date
                  </Label>
                  <input
                    type="date"
                    value={period.endDate.toISOString().split("T")[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      setPeriod((prev) => ({ ...prev, endDate: newDate }));
                    }}
                    disabled={isSubmitting}
                    min={period.startDate.toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-[#e1e5e9] rounded-md bg-[#fafbfc] 
                             focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-[#C72030]
                             disabled:opacity-50 disabled:cursor-not-allowed
                             text-gray-900 text-sm"
                    style={{ height: "45px" }}
                  />
                </div>
              </div>

              {/* Date Range Display */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Selected Period:</span>
                  <span>
                    {period.startDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </span>
                  <span className="mx-1">→</span>
                  <span>
                    {period.endDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </span>
                  <span className="ml-2 text-blue-600">
                    (
                    {Math.ceil(
                      (period.endDate.getTime() - period.startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Status Section */}
      </div>

      {/* Footer Actions */}
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
              Updating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Template
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className="px-8"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
