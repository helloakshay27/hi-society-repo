import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Home } from "lucide-react";
import { TextField } from '@mui/material';
import { Button } from "@/components/ui/button";

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
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data", // ✅ Required for FormData
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
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header with Back Button and Breadcrumbs */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-[#C72030] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Setup Member</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Property Types</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Create</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CREATE PROPERTY TYPE</h1>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b bg-[#F6F4EE] border-[#E5E4E1]">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                  <Home size={16} color="#C72030" />
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
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{ sx: fieldStyles }}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <Button
              type="submit"
              className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/settings/property-type-list")}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyType;
