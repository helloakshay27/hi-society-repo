import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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


const PropertyTypeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  // Fetch Property Type Data
  useEffect(() => {
    const fetchPropertyType = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/property_types/${id}.json`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );
        setName(response.data.property_type || "");
      } catch (error) {
        console.error("Error fetching property type:", error);
        toast.error("Failed to load property type.");
      }
    };

    fetchPropertyType();
  }, [id, baseURL]);

  // Handle Form Submission (Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Property Type Name is required!");
      return;
    }

    setLoading(true);

    try {
      await axios.put(
        `${baseURL}/property_types/${id}.json`,
        { property_type: { property_type: name } },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Property Type updated successfully!");
      navigate("/settings/property-type-list");
    } catch (error) {
      console.error("Error updating property type:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update Property Type.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button 
            onClick={handleGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Setup Member</span>
          <span>{">"}</span>
          <span>Property Types</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit Property Type</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT PROPERTY TYPE</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b bg-[#F6F4EE]">
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
            {loading ? "Updating..." : "Update"}
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
  );
};

export default PropertyTypeEdit;
