import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ArrowLeft, FileText, Settings, Upload } from "lucide-react";

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

const ProjectConfigEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;

  const [loading, setLoading] = useState(false);
  const [iconPreview, setIconPreview] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    active: "1",
    icon: null,
  });

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/configuration_setups/${id}.json`,
          {
            headers: {
                             Authorization: getAuthHeader(),
                           },
          }
        );

        setFormData({
          name: response.data.name || "",
          active: response.data.active ? "1" : "0",
          icon: null,
        });

        if (response.data.attachfile?.document_url) {
          setIconPreview(response.data.attachfile.document_url);
        }
      } catch {
        toast.error("Failed to load configuration data");
      }
    };

    fetchConfiguration();
  }, [id, baseURL]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, icon: file }));
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("configuration_setup[name]", formData.name);
    formDataToSend.append("configuration_setup[active]", formData.active);
    if (formData.icon) {
      formDataToSend.append("configuration_setup[icon]", formData.icon);
    }

    try {
      await axios.put(
        `${baseURL}/configuration_setups/${id}.json`,
        formDataToSend,
        {
          headers: {
                           Authorization: getAuthHeader(),
                         },
        }
      );

      toast.success("Project configuration updated successfully!");
      navigate("/settings/project-configuration-list");
    } catch {
      toast.error("Failed to update configuration");
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
          <span>Project Configuration</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Project Configuration</h1>
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
                name="name"
                placeholder="Enter configuration name"
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
              Upload Icon
            </h2>
          </div>
          <div className="p-6">
  {/* Outer box */}
  <div>
    {/* Label */}
    <span className="block text-sm font-medium text-gray-700 mb-3">
      Icon Image
    </span>

    {/* Hidden input (UNCHANGED) */}
    <input
      type="file"
      className="hidden"
      id="icon-upload"
      accept=".png,.jpg,.jpeg,.svg"
      onChange={handleIconChange}
    />

    {/* Upload button */}
    <button
      type="button"
      onClick={() => document.getElementById("icon-upload")?.click()}
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
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectConfigEdit;
