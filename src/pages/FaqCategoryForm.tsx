import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import SelectBox from "../components/ui/select-box";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";


const FaqCategoryForm = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [formData, setFormData] = useState({
    name: "",
    active: true,
    site_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);

  const navigate = useNavigate();
  const { faqId } = useParams();
  const isEditMode = !!faqId;

  // Field styles for Material-UI components
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

  // Get auth headers
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  });

  // Fetch sites for dropdown
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setSitesLoading(true);
        const res = await axios.get(`${baseURL}/sites.json`, {
          headers: {
                             Authorization: getAuthHeader(),
                             "Content-Type": "multipart/form-data",
                           },
        });
        
        const sitesData = res.data?.sites || res.data || [];
        const formattedSites = sitesData.map(site => ({
          id: site?.id || '',
          name: site?.name || 'Unnamed Site'
        }));
        
        setSites(formattedSites);
      } catch (err) {
        console.error("Failed to fetch sites:", err);
        toast.error("Failed to load sites");
      } finally {
        setSitesLoading(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch existing data for edit
  useEffect(() => {
    if (isEditMode && !hasFetched) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${baseURL}faq_categories/${faqId}.json`, {
            headers: getAuthHeaders()
          });
          
          const categoryData = res.data?.faq_category || res.data;
          
          if (categoryData) {
            setFormData({
              name: categoryData.name || "",
              active: categoryData.active !== undefined ? categoryData.active : true,
              site_id: categoryData.site_id || ""
            });
            setHasFetched(true);
          }
        } catch (err) {
          console.error("Failed to fetch FAQ category:", err);
          toast.error("Failed to load FAQ category");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [faqId, isEditMode, hasFetched]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.site_id) {
      toast.error("Site is required");
      return;
    }

    setLoading(true);

    try {
      const payload = { faq_category: formData };
      
      if (isEditMode) {
        await axios.put(
          `${baseURL}faq_categories/${faqId}.json`,
          payload,
          { headers: getAuthHeaders() }
        );
        toast.success("FAQ Category updated successfully!");
      } else {
        await axios.post(
          `${baseURL}faq_categories.json`,
          payload,
          { headers: getAuthHeaders() }
        );
        toast.success("FAQ Category created successfully!");
      }

      navigate("/settings/faq-category-list");
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit form";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>FAQ Category List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">{isEditMode ? "Edit FAQ Category" : "Create New FAQ Category"}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "EDIT FAQ CATEGORY" : "CREATE FAQ CATEGORY"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              FAQ Category Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name */}
                <TextField
                  label="Name"
                  placeholder="Enter FAQ category name"
                  value={formData.name}
                  onChange={handleChange}
                  name="name"
                  required
                  fullWidth
                  variant="outlined"
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />

                {/* Site */}
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel shrink htmlFor="site-select">
                    Site
                  </InputLabel>
                  <MuiSelect
                    value={formData.site_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, site_id: e.target.value }))}
                    disabled={loading || sitesLoading}
                    label="Site"
                    notched
                    displayEmpty
                    inputProps={{ id: "site-select" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      {sitesLoading ? "Loading sites..." : "Select site"}
                    </MenuItem>
                    {sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C4B89D59] text-red-700 px-8 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Submit')}
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings/faq-category-list")}
            disabled={loading}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default FaqCategoryForm;