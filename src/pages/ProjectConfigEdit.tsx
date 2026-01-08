import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ArrowLeft, Settings } from "lucide-react";
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
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data",
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
          <span>Project Configuration</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT PROJECT CONFIGURATION</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Settings size={16} color="#C72030" />
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
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: { ...fieldStyles, width: '350px' } }}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5.41421C14 5.149 13.8946 4.89464 13.7071 4.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H3Z" fill="#C72030"/>
                  <path d="M10 2V5C10 5.55228 10.4477 6 11 6H14" fill="#E5E0D3"/>
                </svg>
              </span>
              Upload Icon
            </h2>
          </div>
          <div className="p-6">
  {/* Outer box */}
  <div className="border border-gray-300 rounded-md p-4">
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
      className="inline-flex items-center gap-2 px-4 py-2 border border-[#e0d9c859] rounded-md bg-[#e0d9c859] text-gray-800 hover:bg-gray-200 transition"
    >
      <span className="font-medium">Upload Files</span>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C72030"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
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

export default ProjectConfigEdit;
