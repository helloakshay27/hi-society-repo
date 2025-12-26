import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import SelectBox from "@/components/ui/select-box";
import { TextField } from "@mui/material";

const ProjectBuildingTypeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;

  const [buildingType, setBuildingType] = useState("");
  const [loading, setLoading] = useState(false);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    Property_Type: "",
    Property_Type_ID: null,
    building_type: "",
  });

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${baseURL}property_types.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const options = Array.isArray(response.data)
          ? response.data.map((item) => ({
              value: item.property_type,
              label: item.property_type,
              id: item.id,
            }))
          : [];

        setPropertyTypeOptions(options);
        return options;
      } catch {
        toast.error("Failed to fetch property types");
        return [];
      }
    };

    const fetchBuildingType = async (options) => {
      try {
        const response = await axios.get(
          `${baseURL}building_types/${id}.json`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
          }
        );

        const data = response.data;
        setBuildingType(data.building_type);

        const matched = options.find(
          (item) => item.id === data.property_type_id
        );

        setFormData({
          Property_Type: matched?.value || "",
          Property_Type_ID: data.property_type_id,
          building_type: data.building_type,
        });
      } catch {
        toast.error("Failed to fetch building type");
      } finally {
        setIsLoading(false);
      }
    };

    const init = async () => {
      setIsLoading(true);
      const options = await fetchPropertyTypes();
      if (options.length) {
        await fetchBuildingType(options);
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [id, baseURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!buildingType.trim()) {
      toast.error("Building type name is required");
      return;
    }

    if (!formData.Property_Type_ID) {
      toast.error("Property type is required");
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${baseURL}building_types/${id}.json`,
        {
          building_type: {
            building_type: buildingType,
            property_type_id: formData.Property_Type_ID,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      toast.success("Building type updated successfully");
      navigate("/setup-member/project-building-type-list");
    } catch {
      toast.error("Failed to update building type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="website-content overflow-auto">
        <div className="module-data-section container-fluid">

          {/* SECTION CARD */}
          <div className="bg-white rounded-lg border mx-4 mt-6">
            <div className="flex items-center gap-3 px-6 py-4 border-b">
              <div className="w-9 h-9 rounded-full bg-[#F2EEE9] text-[#BF213E] flex items-center justify-center font-semibold">
                PB
              </div>
              <h3 className="text-lg font-semibold">
                Edit Project Building Type
              </h3>
            </div>

            <div className="px-6 py-6">
              {isLoading ? (
                <div className="text-center">Loading...</div>
              ) : (
                <form id="projectBuildingTypeForm" onSubmit={handleSubmit}>

                  {/* 🔒 HARD FLEX ROW — WILL NOT STACK */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "40px",
                    }}
                  >
                    {/* Name */}
                    <div>
                      <TextField
                        label="Name"
                        placeholder="Enter Name "
                        value={buildingType}
                        onChange={(e) => setBuildingType(e.target.value)}
                        size="small"
                        sx={{ width: 300 }}
                      />
                    </div>

                    {/* Property Type */}
                    <div>
                      <label className="block mb-1">
                        Property Types <span className="otp-asterisk">*</span>
                      </label>
                      <div style={{ width: 300 }}>
                        <SelectBox
                          options={propertyTypeOptions}
                          value={formData.Property_Type}
                          onChange={(value) => {
                            const selected = propertyTypeOptions.find(
                              (opt) => opt.value === value
                            );
                            setFormData((prev) => ({
                              ...prev,
                              Property_Type: value,
                              Property_Type_ID: selected?.id || null,
                            }));
                          }}
                          placeholder="Select Property Type"
                          isSearchable
                        />
                      </div>
                    </div>
                  </div>

                </form>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS OUTSIDE */}
          <div className="flex justify-center gap-20 mt-8 mb-8">
            <button
              type="submit"
              form="projectBuildingTypeForm"
              disabled={loading}
              className="px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg"
            >
              Submit
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/setup-member/project-building-type-list")
              }
              disabled={loading}
              className="px-8 py-2.5 bg-white border border-[#8B2E3D] text-[#8B2E3D] rounded-md"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectBuildingTypeEdit;
