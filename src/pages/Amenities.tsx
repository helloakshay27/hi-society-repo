import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { TextField } from "@mui/material";

const Amenities = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [darkModeIcon, setDarkModeIcon] = useState(null);
  const [previewDarkModeImage, setPreviewDarkModeImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDarkModeTooltip, setShowDarkModeTooltip] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setIcon(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const handleDarkModeFileChange = (e) => {
    const file = e.target.files[0];
    setDarkModeIcon(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewDarkModeImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewDarkModeImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("amenity_setup[name]", name);
    formData.append("amenity_setup[night_mode]", nightMode);
    if (icon) {
      formData.append("icon", icon);
    }
    if (darkModeIcon) {
      formData.append("dark_mode_icon", darkModeIcon);
    }

    try {
      await axios.post(`${baseURL}/amenity_setups.json`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      toast.success("Amenity added successfully");
      navigate("/setup-member/amenities-list");
    } catch (err) {
      if (err.response?.status === 422) {
        toast.error("Amenity with this name already exists.");
      } else {
        toast.error(`Error adding amenity: ${err.message}`);
      }
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
            <span className="text-gray-400">Amenities</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Create</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CREATE AMENITY</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
          <div className="absolute -top-3 left-6 px-2 bg-white">
            <h3 className="text-sm font-medium text-gray-500">Amenity Details</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Name */}
                <TextField
                   label="Name"
                       fullWidth
                       variant="outlined"
                        slotProps={{
                         inputLabel: {
                           shrink: true,
                    },
                          }}
                  InputProps={{
                    sx: {
                      backgroundColor: "#fff",
                      borderRadius: "6px",
                    },
                  }}   />

                {/* Night Mode Toggle */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Night Mode
                  </label>
                  <button
                    type="button"
                    onClick={() => setNightMode(!nightMode)}
                    className="text-gray-600 hover:opacity-80 transition-opacity"
                  >
                    {nightMode ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="24"
                        fill="#28a745"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="24"
                        fill="#6c757d"
                        viewBox="0 0 16 16"
                      >
                        <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zM5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
                      </svg>
                    )}
                  </button>
                </div>
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

  {/* Icon Upload */}
<div className="space-y-2">
  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
    <span>Upload Icon</span>
    <span
      className="relative cursor-pointer text-blue-600"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showTooltip && (
        <span className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          Max Upload Size 10 MB
        </span>
      )}
    </span>
    <span className="text-red-500">*</span>
  </label>

  {/* Hidden File Input */}
  <input
    type="file"
    id="icon-upload"
    className="hidden"
    accept=".png,.jpg,.jpeg,.svg"
    onChange={handleFileChange}
    disabled={loading}
  />

  {/* Red Dashed Upload Button (MATCHES IMAGE) */}
  <button
    type="button"
    onClick={() => document.getElementById("icon-upload")?.click()}
    className="flex items-center justify-center gap-2 px-6 py-2
               border-2 border-dashed border-[#C72030]
               text-[#C72030] rounded-md bg-white
               hover:bg-[#C72030]/5 transition-colors"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
    <span className="text-sm font-medium">Upload Files</span>
  </button>

  {/* Preview (UNCHANGED) */}
  {previewImage && (
    <div className="mt-2 relative inline-block">
      <img
        src={previewImage}
        alt="Icon Preview"
        className="rounded-lg border border-gray-200"
        style={{ width: "100px", height: "100px", objectFit: "cover" }}
      />
      <button
        type="button"
        onClick={() => {
          setIcon(null);
          setPreviewImage(null);
        }}
        className="absolute -top-2 -right-2 w-6 h-6
                   bg-red-600 text-white rounded-full
                   flex items-center justify-center
                   hover:bg-red-700 transition-colors"
      >
        ×
      </button>
    </div>
  )}
</div>

 {/* Dark Mode Icon Upload */}
<div className="space-y-2">
  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
    <span>Dark Mode Icon</span>
    <span
      className="relative cursor-pointer text-blue-600"
      onMouseEnter={() => setShowDarkModeTooltip(true)}
      onMouseLeave={() => setShowDarkModeTooltip(false)}
    >
      {showDarkModeTooltip && (
        <span className="absolute left-6 top-0 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
          Max Upload Size 10 MB
        </span>
      )}
    </span>
    <span className="text-red-500">*</span>
  </label>

  {/* Hidden File Input */}
  <input
    type="file"
    id="dark-mode-icon-upload"
    className="hidden"
    accept=".png,.jpg,.jpeg,.svg"
    onChange={handleDarkModeFileChange}
    disabled={loading}
  />

  {/* Red Dashed Upload Button (SAME AS ICON UPLOAD) */}
  <button
    type="button"
    onClick={() =>
      document.getElementById("dark-mode-icon-upload")?.click()
    }
    className="flex items-center justify-center gap-2 px-6 py-2
               border-2 border-dashed border-[#C72030]
               text-[#C72030] rounded-md bg-white
               hover:bg-[#C72030]/5 transition-colors"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
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
    <span className="text-sm font-medium">Upload Files</span>
  </button>

  {/* Preview (UNCHANGED) */}
  {previewDarkModeImage && (
    <div className="mt-2 relative inline-block">
      <img
        src={previewDarkModeImage}
        alt="Dark Mode Preview"
        className="rounded-lg border border-gray-200"
        style={{ width: "100px", height: "100px", objectFit: "cover" }}
      />
      <button
        type="button"
        onClick={() => {
          setDarkModeIcon(null);
          setPreviewDarkModeImage(null);
        }}
        className="absolute -top-2 -right-2 w-6 h-6
                   bg-red-600 text-white rounded-full
                   flex items-center justify-center
                   hover:bg-red-700 transition-colors"
      >
        ×
      </button>
    </div>
  )}
</div>

  {/* IMPORTANT */}
  <div className="p-6">
    {/* put upload buttons / content here */}
  </div>
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
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="px-8 py-2.5 bg-[#FFFFFF] text-[#BF213E] border border-[#BF213E] rounded-lg transition-colors font-medium"
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

export default Amenities;