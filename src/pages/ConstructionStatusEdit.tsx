import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";
import { TextField } from "@mui/material";
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
          `${baseURL}/construction_statuses/${id}.json`
        );

        setFormData({
          construction_status: response.data.construction_status || "",
          active: response.data.active ?? true,
        });
      } catch {
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
        }
      );

      toast.success("Construction status updated successfully!");
      navigate("/settings/construction-status-list");
    } catch {
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
          <span>Construction Status</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT CONSTRUCTION STATUS</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Building2 size={16} color="#C72030" />
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
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: { ...fieldStyles, width: '350px' } }}
                required
              />
            </div>
          </div>
        </div>

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

export default ConstructionStatusEdit;
