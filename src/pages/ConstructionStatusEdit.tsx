import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";
import { TextField } from "@mui/material";

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

const ConstructionStatusEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    construction_status: "",
    active: true,
  });

 useEffect(() => {
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseURL}/construction_statuses/${id}.json`,
        {
          headers: {
            Authorization: getAuthHeader(),
          },
        }
      );

      setFormData({
        construction_status: response.data.construction_status || "",
        active: response.data.active ?? true,
      });
    } catch (error) {
      toast.error("Failed to load construction status.");
    } finally {
      setLoading(false);
    }
  };

  fetchStatus();
}, [id, baseURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    await axios.put(
      `${baseURL}/construction_statuses/${id}.json`,
      {
        construction_status: formData,
      },
      {
        headers: {
          Authorization: getAuthHeader(),
        },
      }
    );

    toast.success("Construction status updated successfully!");
    navigate("/settings/construction-status-list");
  } catch (error) {
    toast.error("Failed to update status.");
  } finally {
    setLoading(false);
  }
};

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030]"></div>
      </div>
    );
  }

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
          <span>Construction Status</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Construction Status</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          <div className="px-6 pt-[22px]">
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <Building2 size={14} color="#1A1A18" />
              </span>
              Construction Status Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <TextField
                label="Construction Status Name"
                name="construction_status"
                placeholder="Enter construction status name"
                value={formData.construction_status}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true, sx: { '& .MuiFormLabel-asterisk': { color: '#da7756' } } } }}
                InputProps={{ sx: { ...fieldStyles, width: '350px' } }}
                required
              />
            </div>
          </div>
        </div>

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
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConstructionStatusEdit;
