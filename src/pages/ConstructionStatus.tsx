import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { TextField } from "@mui/material";

const ConstructionStatus = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

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
      navigate("/setup-member/construction-status-list"); // Redirect after success
    } catch (error) {
      console.error("Error adding construction status:", error);
      toast.error("Failed to add construction status");
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
            <span className="text-gray-400">Construction Status</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Create</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            CREATE CONSTRUCTION STATUS
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-[#F6F4EE] px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Construction Status Details
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Name Input */}
                <TextField
                  label="Construction Name"
                  placeholder="Enter Construction Status name"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  InputProps={{
                    sx: {
                      backgroundColor: "#fff",
                      borderRadius: "6px",
                    },
                  }}
                />

              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg  transition-colors font-medium ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
                <button
  type="button"
  onClick={() => navigate("/setup-member/construction-status-list")}
  disabled={loading}
  className="px-8 py-2.5 bg-white text-[#BF213E] border border-[#BF213E] rounded-lg transition-colors font-medium hover:bg-[#BF213E]/5 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Cancel
</button>

              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionStatus;
