import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { TextField } from "@mui/material";

const ConstructionStatusEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseURL = API_CONFIG.BASE_URL;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    construction_status: "",
    active: true,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${baseURL}construction_statuses/${id}.json`
        );

        setFormData({
          construction_status: response.data.construction_status || "",
          active: response.data.active ?? true,
        });
      } catch {
        toast.error("Failed to load construction status.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [id, baseURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(
        `${baseURL}construction_statuses/${id}.json`,
        {
          construction_status: formData,
        }
      );

      toast.success("Construction status updated successfully!");
      navigate("/setup-member/construction-status-list");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="website-content overflow-auto">
        <div className="module-data-section container-fluid">

          {/* SECTION-STYLE CARD */}
          <div className="bg-white rounded-lg shadow-sm border mx-4 mt-8">
            
            {/* Section Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2EEE9] text-[#BF213E] font-semibold">
                CS
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Edit Construction Status
              </h3>
            </div>

            {/* Section Body */}
            <div className="px-6 py-6">
              {loading ? (
                <p>Loading...</p>
              ) : (
                <form id="constructionStatusForm" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-3">
                      <TextField
                        label="Name"
                        name="construction_status"
                        value={formData.construction_status}
                        onChange={handleChange}
                        placeholder="Name"
                        variant="outlined"
                        size="small"
                        sx={{ width: "300px" }}
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
                        }}
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Buttons (UNCHANGED, OUTSIDE CARD) */}
          <div className="flex justify-center gap-4 mt-6 mb-8">
            <button
              type="submit"
              form="constructionStatusForm"
              disabled={loading}
              className="px-8 py-2.5 bg-[#F2EEE9] text-[#BF213E] rounded-lg font-medium hover:bg-[#E8E0D8] disabled:opacity-50"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => navigate("/setup-member/construction-status-list")}
              disabled={loading}
              className="px-8 py-2.5 bg-white text-[#8B2E3D] border border-[#8B2E3D] rounded-md font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConstructionStatusEdit;
