import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, Building2 } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';
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

const ProjectBuildingTypeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;

  const [buildingType, setBuildingType] = useState("");
  const [loading, setLoading] = useState(false);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    Property_Type: "",
    Property_Type_ID: null,
    building_type: "",
  });

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${baseURL}/property_types.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const options = Array.isArray(response.data)
          ? response.data.map((item) => ({
              value: item.property_type,
              label: item.property_type,
              id: item.id,
            }))
          : [];

        setPropertyTypeOptions(options);
        return options;
      } catch {
        toast.error("Failed to fetch property types");
        return [];
      }
    };

    const fetchBuildingType = async (options) => {
      try {
        const response = await axios.get(
          `${baseURL}/building_types/${id}.json`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        const data = response.data;
        setBuildingType(data.building_type);

        const matched = options.find(
          (item) => item.id === data.property_type_id
        );

        setFormData({
          Property_Type: matched?.value || "",
          Property_Type_ID: data.property_type_id,
          building_type: data.building_type,
        });
      } catch {
        toast.error("Failed to fetch building type");
      } finally {
        setIsLoading(false);
      }
    };

    const init = async () => {
      setIsLoading(true);
      const options = await fetchPropertyTypes();
      if (options.length) {
        await fetchBuildingType(options);
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [id, baseURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!buildingType.trim()) {
      toast.error("Building type name is required");
      return;
    }

    if (!formData.Property_Type_ID) {
      toast.error("Property type is required");
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${baseURL}/building_types/${id}.json`,
        {
          building_type: {
            building_type: buildingType,
            property_type_id: formData.Property_Type_ID,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      toast.success("Building type updated successfully");
      navigate("/settings/project-building-type-list");
    } catch {
      toast.error("Failed to update building type");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030]"></div>
      </div>
    );
  }

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
          <span>{">"}  </span>
          <span>Project Building Type</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT PROJECT BUILDING TYPE</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Building2 size={16} color="#C72030" />
              </span>
              Building Type Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:gap-4 gap-3">
        <div
  style={{
    display: "flex",
    gap: "24px", // ✅ SPACE BETWEEN PROPERTY TYPE & BUILDING TYPE
    alignItems: "flex-start",
  }}
>
  {/* Property Type */}
  <FormControl variant="outlined" required>
    <InputLabel shrink>Property Type</InputLabel>
    <MuiSelect
      value={formData.Property_Type}
      onChange={(e) => {
        const selected = propertyTypeOptions.find(
          (opt) => opt.value === e.target.value
        );
        setFormData((prev) => ({
          ...prev,
          Property_Type: e.target.value,
          Property_Type_ID: selected?.id || null,
        }));
      }}
      label="Property Type"
      notched
      displayEmpty
      disabled={loading}
      sx={{
        width: "350px",
        ...fieldStyles,
      }}
    >
      <MenuItem value="">Select Property Type</MenuItem>
      {propertyTypeOptions.map((option) => (
        <MenuItem key={option.id} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </MuiSelect>
  </FormControl>

  {/* Building Type Name */}
  <TextField
    label="Building Type Name"
    placeholder="Enter building type name"
    value={buildingType}
    onChange={(e) => setBuildingType(e.target.value)}
    variant="outlined"
    slotProps={{ inputLabel: { shrink: true } }}
    InputProps={{ sx: { ...fieldStyles, width: "350px" } }}
    required
    disabled={loading}
  />
</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="submit"
            className="bg-[#C72030] hover:bg-[#C72030] text-white px-8 py-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Submit"}
          </Button>
          <Button
            type="button"
            
            onClick={handleGoBack}
            className="border-[#C4B89D59] text-gray-700 hover:bg-gray-50 px-8 py-2"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectBuildingTypeEdit;
