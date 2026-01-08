import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

const ConstructionStatus = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!name.trim()) {
    //   toast.error("Name is required");
    //   return;
    // }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("construction_status[construction_status]", formData.name);

    try {
      await axios.post(`${baseURL}/construction_statuses.json`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      toast.success("Construction status added successfully!");
      navigate("/settings/construction-status-list"); // Redirect after success
    } catch (error) {
      console.error("Error adding construction status:", error);
      toast.error("Failed to add construction status");
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
          <span>{">"}  </span>
          <span>Construction Status</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">CREATE CONSTRUCTION STATUS</h1>
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
                placeholder="Enter construction status name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
            {loading ? "Creating..." : "Submit"}
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

export default ConstructionStatus;
