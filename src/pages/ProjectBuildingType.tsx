import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ArrowLeft, Building2 } from "lucide-react";
import { TextField, FormControl, InputLabel, Select as MuiSelect, MenuItem } from '@mui/material';

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

const ProjectBuildingType = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [buildingType, setBuildingType] = useState("");
  const [loading, setLoading] = useState(false);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);

  const [formData, setFormData] = useState({
    Property_Type: "",
    Property_Type_ID: null,
    building_type: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${baseURL}/property_types.json`, {
           headers: {
                   Authorization: getAuthHeader(),
                 },
        });
        const fetchedPropertyTypes = response.data || [];

        const options = fetchedPropertyTypes.map((item) => ({
          value: item.property_type,
          label: item.property_type,
          id: item.id,
        }));

        setPropertyTypeOptions(options);
      } catch (error) {
        console.error("Error fetching property types:", error);
        toast.error("Failed to load property types");
      }
    };

    fetchPropertyTypes();
  }, [baseURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!buildingType.trim()) {
      toast.error("Building type name is required");
      return;
    }

    if (!formData.Property_Type_ID) {
      toast.error("Please select a Property Type");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${baseURL}/building_types.json`,
        {
          building_type: {
            building_type: buildingType,
            property_type_id: formData.Property_Type_ID,
          },
        },
        {
           headers: {
                           Authorization: getAuthHeader(),
                         },
        }
      );
      toast.success("Building type added successfully");
      navigate("/settings/project-building-type-list");
    } catch (error) {
      console.error("Error ading building type:", error);
      toast.error("Failed to add building type");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 bg-[#FDFDFB] min-h-screen">
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
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Project Building Type</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
           <div className="px-6 pt-[22px]">
          
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <Building2 size={14} color="#1A1A18" />
              </span>
              Building Type Details
            </h2>
            
          </div>
         
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

<div
  style={{
    display: "flex",
    gap: "24px", // ✅ adjust this value (16px / 20px / 24px)
    alignItems: "flex-start",
  }}
>


              {/* Property Type */}
<div>
  <FormControl
    variant="outlined"
    sx={{
      width: "350px",
      "& .MuiInputBase-root": fieldStyles,
      "& .MuiFormLabel-asterisk": { color: "#da7756" },
    }}
    required
  >
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
    >
      <MenuItem value="">Select Property Type</MenuItem>
      {propertyTypeOptions.map((option) => (
        <MenuItem key={option.id} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </MuiSelect>
  </FormControl>
</div>

{/* Building Type Name */}
<div>
  <TextField
    label="Building Type Name"
    placeholder="Enter building type name"
    value={buildingType}
    onChange={(e) => setBuildingType(e.target.value)}
    variant="outlined"
    required
    disabled={loading}
    InputLabelProps={{ shrink: true }}
    sx={{
      width: "350px",
      "& .MuiOutlinedInput-root": {
        height: "47px",
        padding: "0",
      },
      "& .MuiOutlinedInput-input": {
        padding: "12px 14px",
        boxSizing: "border-box",
      },
      "& .MuiFormLabel-asterisk": { color: "#da7756" },
    }}
  />
</div>
</div>

        </div>
      </div>
        </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={handleGoBack}
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
  );
};

export default ProjectBuildingType;
