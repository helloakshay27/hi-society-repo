import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { TextField, Switch } from "@mui/material";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { ArrowLeft, Home } from "lucide-react";
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
          `${baseURL}/amenity_setups/${id}.json`
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
      } catch {
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
        { headers: { "Content-Type": "multipart/form-data" } }
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
          <span>Amenities</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT AMENITY</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <Home size={16} color="#C72030" />
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
                slotProps={{ inputLabel: { shrink: true } }}
                InputProps={{ sx: fieldStyles }}
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Night Mode
                </label>
                <Switch
                  checked={nightMode}
                  onChange={(e) => setNightMode(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#C72030',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#C72030',
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5.41421C14 5.149 13.8946 4.89464 13.7071 4.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H3Z" fill="#C72030"/>
                  <path d="M10 2V5C10 5.55228 10.4477 6 11 6H14" fill="#E5E0D3"/>
                </svg>
              </span>
              Add Attachments
            </h2>
          </div>
          <div className="p-6">
            {/* Icon Upload */}
            <div className="border border-gray-300 rounded-md p-4 mb-4">
              <span className="block text-sm font-medium text-gray-700 mb-3">
                Upload Icon <span className="text-red-500">*</span>
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
                className="inline-flex items-center gap-2 px-2 py-1 border rounded-md border-[#e0d9c859] bg-[#e0d9c859] text-gray-800 transition"
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
            <div className="border border-gray-300 rounded-md p-4">
              <span className="block text-sm font-medium text-gray-700 mb-3">
                Dark Mode Icon <span className="text-red-500">*</span>
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
                className="inline-flex items-center gap-2 px-2 py-1 border rounded-md border-[#e0d9c859] bg-[#e0d9c859] text-gray-800 transition"
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

        <div className="flex gap-4 justify-center pt-6">
          <Button
            type="submit"
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoBack}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditAmenities;
