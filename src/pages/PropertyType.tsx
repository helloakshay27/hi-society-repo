import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Home } from "lucide-react";
import { TextField } from '@mui/material';

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
      borderColor: '#D97757',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D97757',
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: '#D97757',
    },
  },
};

const PropertyType = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Property Type Name is required!");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("property_type[property_type]", name); // ✅ Correct format
      payload.append("property_type[active]", "true"); // ✅ Set status as active by default

      await axios.post(
        `${baseURL}/property_types.json`,
        payload,
        {
           headers: {
                   Authorization: getAuthHeader(),
                 },
        }
      );

      toast.success("Property Type added successfully!");
      navigate("/settings/property-type-list"); // ✅ Navigate after success
    } catch (error) {
      console.error("Error submitting property type:", error);

      // Extract backend error message if available
      const errorMessage =
        error.response?.data?.message || "Failed to add Property Type.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#FDFDFB]">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header with Back Button and Breadcrumbs */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span>Setup Member</span>
            <ChevronRight className="w-4 h-4" />
            <span>Property Types</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Create</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Property Type</h1>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
            <div className="px-6 pt-[22px]">
              <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
                <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                  <Home size={14} color="#1A1A18" />
                </span>
                Property Type Details
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Property Type Name */}
                <TextField
                  label="Property Type Name"
                  placeholder="Enter property type name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true, sx: { '& .MuiFormLabel-asterisk': { color: '#da7756' } } } }}
                  InputProps={{ sx: fieldStyles }}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate("/settings/property-type-list")}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyType;
