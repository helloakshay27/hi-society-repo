import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft } from "lucide-react";

const ProjectBuildingType = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [buildingType, setBuildingType] = useState("");
  const [loading, setLoading] = useState(false);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState([]);

  const [formData, setFormData] = useState({
    Property_Type: "",
    Property_Type_ID: null,
    building_type: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const response = await axios.get(`${baseURL}/property_types.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        const fetchedPropertyTypes = response.data || [];

        const options = fetchedPropertyTypes.map((item) => ({
          value: item.property_type,
          label: item.property_type,
          id: item.id,
        }));

        setPropertyTypeOptions(options);
      } catch (error) {
        console.error("Error fetching property types:", error);
        toast.error("Failed to load property types");
      }
    };

    fetchPropertyTypes();
  }, [baseURL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!buildingType.trim()) {
      toast.error("Building type name is required");
      return;
    }

    if (!formData.Property_Type_ID) {
      toast.error("Please select a Property Type");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${baseURL}/building_types.json`,
        {
          building_type: {
            building_type: buildingType,
            property_type_id: formData.Property_Type_ID,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Building type added successfully");
      navigate("/setup-member/project-building-type-list");
    } catch (error) {
      console.error("Error adding building type:", error);
      toast.error("Failed to add building type");
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
              className="flex items-center text-gray-600 hover:text-[#C72030] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Setup Member</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Project Building Type</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Create</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            CREATE PROJECT BUILDING TYPE
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-[#F6F4EE] px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Building Type Details
            </h3>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Property Type (UPDATED ONLY HERE) */}
                <div>
                  <fieldset className="border border-gray-300 rounded-md px-3 py-2 focus-within:border-[#788af1]">
                    <legend className="px-1 text-sm text-gray-600">
                      Property Type <span className="text-red-500">*</span>
                    </legend>
                    <select
                      className="w-[300px] px-1 py-1 text-base border-none outline-none bg-transparent text-gray-900"
                      value={formData.Property_Type}
                      onChange={(e) => {
                        const selected = propertyTypeOptions.find(
                          (opt) => opt.value === e.target.value
                        );
                        setFormData((prev) => ({
                          ...prev,
                          Property_Type: e.target.value,
                          Property_Type_ID: selected?.id || null,
                        }));
                      }}
                      disabled={loading}
                    >
                      <option value="">Select Property Type</option>
                      {propertyTypeOptions.map((option) => (
                        <option key={option.id} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>

                {/* Building Type Name  */}
                <div>
                  <fieldset className="border border-gray-300 rounded-md px-3 py-2 focus-within:border-[#c72030]">
                    <legend className="px-4 text-sm text-gray-600">
                      Building Type Name <span className="text-red-500">*</span>
                    </legend>
                    <input
                      type="text"
                      value={buildingType}
                      onChange={(e) => setBuildingType(e.target.value)}
                      disabled={loading}
                      className="w-[300px] px-1 py-1 text-base border-none outline-none bg-transparent text-gray-900"
                      placeholder="Enter building type name"
                    />
                  </fieldset>
                </div>

              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg transition-colors font-medium ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/setup-member/project-building-type-list")
                  }
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

export default ProjectBuildingType;
