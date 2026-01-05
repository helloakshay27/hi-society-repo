import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import SelectBox from "../components/ui/select-box";
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";

const SiteVisitSlotConfig = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

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

  const [errors, setErrors] = useState<{
    startHour?: string;
    startMinute?: string;
    endHour?: string;
    endMinute?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      startHour?: string;
      startMinute?: string;
      endHour?: string;
      endMinute?: string;
    } = {};

    if (startHour === "" || startHour === null)
      newErrors.startHour = "Start hour is required";
    if (startMinute === "" || startMinute === null)
      newErrors.startMinute = "Start minute is required";
    if (endHour === "" || endHour === null) newErrors.endHour = "End hour is required";
    if (endMinute === "" || endMinute === null)
      newErrors.endMinute = "End minute is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all the required fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    toast.dismiss();

    const formData = new FormData();
    formData.append("site_schedule[start_hour]", startHour);
    formData.append("site_schedule[start_minute]", startMinute);
    formData.append("site_schedule[end_hour]", endHour);
    formData.append("site_schedule[end_minute]", endMinute);

    try {
      const response = await axios.post(
        `${baseURL}/site_schedules`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Slot created successfully!");
      navigate("/setup-member/site-visit-slot-config-list");
    } catch (error) {
      console.error("Error submitting data:", error.response?.data || error.message);
      toast.error("Failed to create slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Visit Slot List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create New Visit Slot</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE VISIT SLOT</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b bg-[#F6F4EE]">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Visit Slot Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Start Hours */}
                <FormControl fullWidth variant="outlined" required error={!!errors.startHour}>
                  <InputLabel shrink htmlFor="start-hour">
                    Start Hours
                  </InputLabel>
                  <MuiSelect
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    disabled={loading}
                    label="Start Hours"
                    notched
                    displayEmpty
                    inputProps={{ id: "start-hour" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">Select Hour</MenuItem>
                    {hours.map((hour) => (
                      <MenuItem key={hour} value={hour}>
                        {hour.toString().padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.startHour && (
                    <span className="text-red-500 text-xs mt-1">{errors.startHour}</span>
                  )}
                </FormControl>

                {/* Start Minutes */}
                <FormControl fullWidth variant="outlined" required error={!!errors.startMinute}>
                  <InputLabel shrink htmlFor="start-minute">
                    Start Minutes
                  </InputLabel>
                  <MuiSelect
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    disabled={loading}
                    label="Start Minutes"
                    notched
                    displayEmpty
                    inputProps={{ id: "start-minute" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">Select Minute</MenuItem>
                    {minutes.map((minute) => (
                      <MenuItem key={minute} value={minute}>
                        {minute.toString().padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.startMinute && (
                    <span className="text-red-500 text-xs mt-1">{errors.startMinute}</span>
                  )}
                </FormControl>

                {/* End Hours */}
                <FormControl fullWidth variant="outlined" required error={!!errors.endHour}>
                  <InputLabel shrink htmlFor="end-hour">
                    End Hours
                  </InputLabel>
                  <MuiSelect
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    disabled={loading}
                    label="End Hours"
                    notched
                    displayEmpty
                    inputProps={{ id: "end-hour" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">Select Hour</MenuItem>
                    {hours.map((hour) => (
                      <MenuItem key={hour} value={hour}>
                        {hour.toString().padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.endHour && (
                    <span className="text-red-500 text-xs mt-1">{errors.endHour}</span>
                  )}
                </FormControl>

                {/* End Minutes */}
                <FormControl fullWidth variant="outlined" required error={!!errors.endMinute}>
                  <InputLabel shrink htmlFor="end-minute">
                    End Minutes
                  </InputLabel>
                  <MuiSelect
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                    disabled={loading}
                    label="End Minutes"
                    notched
                    displayEmpty
                    inputProps={{ id: "end-minute" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">Select Minute</MenuItem>
                    {minutes.map((minute) => (
                      <MenuItem key={minute} value={minute}>
                        {minute.toString().padStart(2, "0")}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.endMinute && (
                    <span className="text-red-500 text-xs mt-1">{errors.endMinute}</span>
                  )}
                </FormControl>
              </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C4B89D59] text-red-700 px-8 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => navigate("/setup-member/site-visit-slot-config-list")}
            disabled={loading}
            className="border bg-[#C4B89D59] text-red-700 px-8 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteVisitSlotConfig;
