import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { ArrowLeft, FileText, Settings, Upload } from "lucide-react";
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

const ProjectConfiguration = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [iconPreview, setIconPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    active: "1",
    icon: null,
  });

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // keeping existing icon logic untouched
    setFormData((prev) => ({
      ...prev,
      icon: files[0],
    }));
    setIconPreview(URL.createObjectURL(files[0]));
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.icon) {
      toast.error("Icon is required");
      return;
    }

    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("configuration_setup[name]", formData.name);
    formDataToSend.append("configuration_setup[active]", formData.active);
    formDataToSend.append("configuration_setup[icon]", formData.icon);

    try {
      await axios.post(`${baseURL}/configuration_setups.json`, formDataToSend, {
       headers: {
                         Authorization: getAuthHeader(),
                       },
      });

      toast.success("Project configuration created successfully!");
      navigate("/settings/project-configuration-list");
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Submission Failed!");
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
          <span>Project Configuration</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Create</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create Project Configuration</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          <div className="px-6 pt-[22px]">
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <Settings size={14} color="#1A1A18" />
              </span>
              Configuration Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <TextField
                label="Name"
                placeholder="Enter configuration name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true, sx: { '& .MuiFormLabel-asterisk': { color: '#da7756' } } } }}
                InputProps={{ sx: { ...fieldStyles, width: '350px' } }}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          <div className="px-6 pt-[22px]">
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <FileText size={14} color="#1A1A18" />
              </span>
              Add Attachments
            </h2>
          </div>
          <div className="p-6">
  {/* Label box */}
  <div>
    {/* <span className="block text-sm font-medium text-gray-700 mb-3">
      Project QR Code Images
    </span> */}

    {/* Hidden input (UNCHANGED) */}
    <input
      type="file"
      onChange={handleFileUpload}
      className="hidden"
      id="file-upload"
    />

    {/* Upload button */}
    <button
      type="button"
      onClick={() => document.getElementById("file-upload")?.click()}
      className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
    >
      <Upload className="h-4 w-4" />
      Upload Files
    </button>

    {/* Preview (UNCHANGED) */}
    {iconPreview && (
      <img
        src={iconPreview}
        alt="Preview"
        className="mt-4 rounded-md border "
        style={{ width: "100px", height: "100px", objectFit: "cover" }}
      />
    )}
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
            {loading ? "Creating..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectConfiguration;
