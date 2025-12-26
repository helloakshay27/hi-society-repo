import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { ChevronRight, ArrowLeft, Upload } from "lucide-react";
import { TextField, Button } from "@mui/material";

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
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Project configuration created successfully!");
      navigate("/setup-member/project-configuration-list");
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Submission Failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-[#C72030]"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Setup Member</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Project Configuration</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Create</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            CREATE PROJECT CONFIGURATION
          </h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-[#F6F4EE] px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Configuration Details
            </h3>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Name Field */}
                <TextField
                  label="Name"
                  placeholder="Enter Configuration Name"
                  fullWidth
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{
                    sx: {
                      backgroundColor: "#fff",
                      borderRadius: "6px",
                    },
                  }}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              {/* Section 4: Add Attachments */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                      style={{ backgroundColor: "#E5E0D3" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5.41421C14 5.149 13.8946 4.89464 13.7071 4.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H3Z"
                          fill="#C72030"
                        />
                        <path
                          d="M10 2V5C10 5.55228 10.4477 6 11 6H14"
                          fill="#E5E0D3"
                        />
                      </svg>
                    </span>
                    Add Attachments
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <input
  type="file"
  multiple
  onChange={handleFileUpload}
  className="hidden"
  id="file-upload"
/>

<button
  type="button"
  onClick={() => document.getElementById("file-upload")?.click()}
  className="flex items-center justify-center gap-2 px-2 py-0.5 border-2 border-dashed border-[#BF213E] text-[#BF213E] rounded-md bg-white hover:bg-[#C72030]/5 transition-colors"
>
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
  <span className="font-medium">Upload Files</span>
</button>


                  {iconPreview && (
                    <img
                      src={iconPreview}
                      alt="Preview"
                      className="rounded-lg border border-gray-200"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg font-medium"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="px-8 py-2.5 bg-white text-[#BF213E] border border-[#BF213E] rounded-lg font-medium"
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

export default ProjectConfiguration;
