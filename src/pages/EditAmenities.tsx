import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/mor.css";
import { TextField } from "@mui/material";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";

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
          `${baseURL}amenity_setups/${id}.json`
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
        `${baseURL}amenity_setups/${id}.json`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Amenity updated successfully!");
      navigate("/setup-member/amenities-list");
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

  return (
    <div className="main-content">
      <div className="website-content overflow-auto">
        <div className="module-data-section container-fluid">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col min-h-[calc(100vh-200px)]"
          >

            {/* SECTION STYLE CARD */}
            <div className="bg-white rounded-lg shadow-sm border mx-4 mt-6">

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b">
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2EEE9] text-[#BF213E] font-semibold">
                  AM
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Edit Amenity
                </h3>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <div className="row">
                  <div className="col-md-2">
                    <TextField
                      label="Name"
                      placeholder="Enter Name"
                      variant="outlined"
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ width: "300px" }}
                      InputProps={{
                        sx: {
                          backgroundColor: "#fff",
                          borderRadius: "6px",
                        },
                      }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-8">
                  <div className="px-6 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <span
                        className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: "#E5E0D3" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {/* Icon Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Upload Icon <span className="text-red-500">*</span>
                      </label>

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
                        onClick={() =>
                          document.getElementById("icon-upload")?.click()
                        }
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="flex items-center justify-center px-6 py-2 border-2 border-dashed border-[#C72030] text-[#C72030] rounded-md bg-white w-[220px]"
                      >
                        Upload Files
                      </button>

                      {showTooltip && (
                        <div className="text-xs bg-gray-800 text-white rounded px-2 py-1">
                          Max Upload Size 10 MB
                        </div>
                      )}

                      {previewImage && (
                        <img
                          src={previewImage}
                          alt="Icon Preview"
                          style={{ width: 100, height: 100 }}
                        />
                      )}
                    </div>

                    {/* Dark Mode Icon */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Dark Mode Icon <span className="text-red-500">*</span>
                      </label>

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
                        onClick={() =>
                          document
                            .getElementById("dark-mode-icon-upload")
                            ?.click()
                        }
                        onMouseEnter={() => setShowDarkModeTooltip(true)}
                        onMouseLeave={() => setShowDarkModeTooltip(false)}
                        className="flex items-center justify-center px-6 py-2 border-2 border-dashed border-[#C72030] text-[#C72030] rounded-md bg-white w-[220px]"
                      >
                        Upload Files
                      </button>

                      {showDarkModeTooltip && (
                        <div className="text-xs bg-gray-800 text-white rounded px-2 py-1">
                          Max Upload Size 10 MB
                        </div>
                      )}

                      {previewDarkModeImage && (
                        <img
                          src={previewDarkModeImage}
                          alt="Dark Mode Preview"
                          style={{ width: 100, height: 100 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons*/}
            <div className="mx-4 mb-6 mt-6 flex justify-center gap-20">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg font-medium"
              >
                Submit
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-8 py-2.5 bg-white text-[#8B2E3D] border border-[#8B2E3D] rounded-md font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAmenities;
