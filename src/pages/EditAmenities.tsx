import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { TextField, Switch } from "@mui/material";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { ArrowLeft, FileText, Home, Upload } from "lucide-react";

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

const EditAmenities = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const baseURL = API_CONFIG.BASE_URL;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [darkModeIcon, setDarkModeIcon] = useState<File | null>(null);
  const [previewDarkModeImage, setPreviewDarkModeImage] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amenityType, setAmenityType] = useState("");
  const [nightMode, setNightMode] = useState(false);

  const [showTooltip, setShowTooltip] = useState(false);
  const [showDarkModeTooltip, setShowDarkModeTooltip] = useState(false);

 useEffect(() => {
  const fetchAmenity = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/amenity_setups/${id}.json`,
        {
          headers: {
            Authorization: getAuthHeader(),
          },
        }
      );

      setName(response.data.name);
      setAmenityType(response.data.amenity_type || "");
      setNightMode(response.data.night_mode || false);

      if (response.data.attachfile?.document_url) {
        setPreviewImage(response.data.attachfile.document_url);
      }

      if (response.data.dark_mode_icon?.document_url) {
        setPreviewDarkModeImage(
          response.data.dark_mode_icon.document_url
        );
      }
    } catch (error) {
      toast.error("Failed to load amenity details.");
    }
  };

  if (id) fetchAmenity();
}, [id, baseURL]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIcon(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDarkModeFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    setDarkModeIcon(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviewDarkModeImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("amenity_setup[name]", name);
    formData.append("amenity_setup[amenity_type]", amenityType);
    formData.append("amenity_setup[night_mode]", String(nightMode));

    if (icon) formData.append("icon", icon);
    if (darkModeIcon) formData.append("dark_mode_icon", darkModeIcon);

    try {
      await axios.put(
        `${baseURL}/amenity_setups/${id}.json`,
        formData,
        { 
         headers: {
            Authorization: getAuthHeader(),
          },
        }
      );

      toast.success("Amenity updated successfully!");
      navigate("/settings/amenities-list");
    } catch (error: any) {
      toast.error(
        `Failed to update amenity: ${
          error.response?.data?.error || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(-1);

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
          <span>Amenities</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Amenity</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          <div className="px-6 pt-[22px]">
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <Home size={14} color="#1A1A18" />
              </span>
              Amenity Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <TextField
                label="Name"
                placeholder="Enter amenity name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                variant="outlined"
                slotProps={{ inputLabel: { shrink: true, sx: { '& .MuiFormLabel-asterisk': { color: '#da7756' } } } }}
                InputProps={{ sx: fieldStyles }}
                required
              />

              {/* <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Night Mode
                </label>
                <Switch
                  checked={nightMode}
                  onChange={(e) => setNightMode(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#D97757',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#D97757',
                    },
                  }}
                />
              </div> */}
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
            {/* Icon Upload */}
            <div className="mb-6">
              <span className="block text-sm font-medium text-gray-700 mb-3">
                Upload Icon 
                {/* <span className="text-red-500">*</span> */}
              </span>

              <input
                type="file"
                id="icon-upload"
                className="hidden"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileChange}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => document.getElementById("icon-upload")?.click()}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
      >
        <Upload className="h-4 w-4" />
        Upload Files
              </button>

              {previewImage && (
                <img
                  src={previewImage}
                  alt="Icon Preview"
                  className="mt-4 rounded-md border"
                  style={{ width: "100px", height: "100px", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Dark Mode Icon Upload */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-3">
                Dark Mode Icon 
                {/* <span className="text-red-500">*</span> */}
              </span>

              <input
                type="file"
                id="dark-mode-icon-upload"
                className="hidden"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleDarkModeFileChange}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => document.getElementById("dark-mode-icon-upload")?.click()}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
      >
        <Upload className="h-4 w-4" />
        Upload Files
              </button>

              {previewDarkModeImage && (
                <img
                  src={previewDarkModeImage}
                  alt="Dark Mode Preview"
                  className="mt-4 rounded-md border"
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

export default EditAmenities;
