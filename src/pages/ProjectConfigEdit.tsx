import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";

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
          `${baseURL}configuration_setups/${id}.json`,
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
        `${baseURL}configuration_setups/${id}.json`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Project configuration updated successfully!");
      navigate("/setup-member/project-configuration-list");
    } catch {
      toast.error("Failed to update configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="website-content overflow-auto">
        <div className="module-data-section container-fluid">
          <form onSubmit={handleSubmit}>

            {/* SECTION STYLE CARD */}
            <div className="bg-white rounded-lg shadow-sm border mx-4 mt-8">

              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b">
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2EEE9] text-[#BF213E] font-semibold">
                  PC
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Edit Project Configuration
                </h3>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <div className="row">
                  <div className="col-md-3">
                    <TextField
                      label="Name"
                      name="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      sx={{ width: "300px" }}
                      slotProps={{ inputLabel: { shrink: true } }}
                      InputProps={{
                        sx: {
                          backgroundColor: "#fff",
                          borderRadius: "6px",
                        },
                      }}
                    />
                  </div>
                </div>

                {/* Attachments Section  */}
                <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                      <span
                        className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: "#E5E0D3" }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
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
                      Upload Icon
                    </h2>
                  </div>

                  <div className="p-6">
                    {showTooltip && (
                      <div className="text-xs bg-gray-800 text-white rounded px-2 py-1 mb-2 inline-block">
                        Max Upload Size 10 MB
                      </div>
                    )}

                    <input
                      type="file"
                      className="hidden"
                      id="icon-upload"
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={handleIconChange}
                      disabled={loading}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("icon-upload")?.click()
                      }
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="mt-3 px-6 py-2 border-2 border-dashed border-[#C72030] text-[#C72030] rounded-md"
                    >
                      Upload Files
                    </button>

                    {iconPreview && (
                      <img
                        src={iconPreview}
                        alt="Preview"
                        className="mt-3"
                        style={{ width: 100, height: 100 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons  */}
            <div className="flex justify-center gap-4 mt-6 mb-8">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg"
              >
                {loading ? "Updating..." : "Update"}
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/setup-member/project-configuration-list")
                }
                disabled={loading}
                className="px-8 py-2.5 bg-white border border-[#8B2E3D] text-[#8B2E3D] rounded-md"
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

export default ProjectConfigEdit;
