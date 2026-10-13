import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ArrowLeft, Zap } from "lucide-react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
  TextField,
  SelectChangeEvent,
} from "@mui/material";

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

const ConnectivityTypeCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      active: e.target.value === "true",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a type name");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_CONFIG.BASE_URL}/connectivity_types.json`,
        {
          connectivity_type: {
            name: formData.name,
            active: formData.active,
          },
        },
        {
                  headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json',
                  },
        }
      );

      toast.success("Connectivity type created successfully");
      setTimeout(() => {
        navigate("/settings/connectivity-type-list");
      }, 1000);
    } catch (error) {
      console.error("Error creating connectivity type:", error);
      toast.error("Failed to create connectivity type");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/settings/connectivity-type-list");
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
          <span>{">"}</span>
          <span>Connectivity Type</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Connectivity Type</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          <div className="px-6 pt-[22px]">
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <Zap size={14} color="#1A1A18" />
              </span>
              Connectivity Type Details
            </h2>
          </div>
         
          <div className="p-6 space-y-6">
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
              {/* Type Name */}
              <div>
                <TextField
                  fullWidth
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  label="Type"
                  placeholder="Enter Type Name"
                  variant="outlined"
                  required
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    width: "350px",
                    ...fieldStyles,
                    "& .MuiFormLabel-asterisk": { color: "#da7756" },
                  }}
                />
              </div>

              {/* Status */}
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
                  <InputLabel shrink>Status</InputLabel>
                  <MuiSelect
                    value={formData.active.toString()}
                    onChange={handleStatusChange}
                    label="Status"
                    notched
                    displayEmpty
                    disabled={loading}
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </MuiSelect>
                </FormControl>
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

export default ConnectivityTypeCreate;
