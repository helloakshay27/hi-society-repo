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


const FaqSubCategory = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [formData, setFormData] = useState({
    name: "",
    active: true,
    faq_category_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [faqCategories, setFaqCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    faq_category_id?: string;
  }>({});

  const navigate = useNavigate();
  const { faqSubId } = useParams();
  const isEditMode = !!faqSubId;

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

  useEffect(() => {
    const fetchFaqCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await axios.get(`${baseURL}/faq_categories.json`, {
          headers: {
            Authorization: getAuthHeader(),
          }
        });
        
        let categoriesData = [];
        if (Array.isArray(res.data)) {
          categoriesData = res.data;
        } else if (res.data.faq_categories) {
          categoriesData = res.data.faq_categories;
        } else if (Array.isArray(res.data.data)) {
          categoriesData = res.data.data;
        }
        
        const formattedCategories = categoriesData.map(category => ({
          id: category?.id || '',
          name: category?.name || 'Unnamed Category'
        }));
        
        setFaqCategories(formattedCategories);
      } catch (err) {
        console.error("Failed to fetch FAQ categories:", err);
        toast.error("Failed to load FAQ categories");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchFaqCategories();
  }, [baseURL]);

  useEffect(() => {
    if (isEditMode && !hasFetched) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${baseURL}/faq_sub_categories/${faqSubId}.json`, {
            headers: {
              Authorization: getAuthHeader(),
            }
          });
          
          const subCategoryData = res.data?.faq_sub_category || res.data;
          
          if (subCategoryData) {
            setFormData({
              name: subCategoryData.name || "",
              active: subCategoryData.active !== undefined ? subCategoryData.active : true,
              faq_category_id: subCategoryData.faq_category_id || ""
            });
            setHasFetched(true);
          }
        } catch (err) {
          console.error("Failed to fetch FAQ sub category:", err);
          toast.error("Failed to load FAQ sub category");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [faqSubId, isEditMode, hasFetched, baseURL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      faq_category_id?: string;
    } = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.faq_category_id) newErrors.faq_category_id = "FAQ Category is required";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = { faq_sub_category: formData };
      
      if (isEditMode) {
        await axios.put(
          `${baseURL}/faq_sub_categories/${faqSubId}.json`,
          payload,
          { headers: {
              Authorization: getAuthHeader(),
            }
          }
        );
        toast.success("FAQ Sub Category updated successfully!");
      } else {
        await axios.post(
          `${baseURL}/faq_sub_categories.json`,
          payload,
          { headers: {
              Authorization: getAuthHeader(),
            }
          }
        );
        toast.success("FAQ Sub Category created successfully!");
      }

      navigate("/settings/faq-subcategory-list");
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit form";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#FDFDFB] min-h-screen">
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
          <span>FAQ Sub Category List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">{isEditMode ? "Edit FAQ Sub Category" : "Create New FAQ Sub Category"}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit FAQ Sub Category" : "Create FAQ Sub Category"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
          <div className="px-6 pt-[22px]">
            <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
              <span className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5F4F0' }}>
                <FileText size={14} color="#1A1A18" />
              </span>
              FAQ Sub Category Details
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name */}
                <TextField
                  label="Name"
                  placeholder="Enter FAQ sub category name"
                  value={formData.name}
                  onChange={handleChange}
                  name="name"
                  required
                  fullWidth
                  variant="outlined"
                  disabled={loading}
                  error={!!errors.name}
                  helperText={errors.name}
                  InputLabelProps={{ shrink: true, sx: { '& .MuiFormLabel-asterisk': { color: '#da7756' } } }}
                  InputProps={{ sx: fieldStyles }}
                />

                {/* FAQ Category */}
                <FormControl fullWidth variant="outlined" required error={!!errors.faq_category_id}>
                  <InputLabel shrink htmlFor="category-select" sx={{ '& .MuiFormLabel-asterisk': { color: '#da7756' } }}>
                    FAQ Category
                  </InputLabel>
                  <MuiSelect
                    value={formData.faq_category_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, faq_category_id: e.target.value }))}
                    disabled={loading || categoriesLoading}
                    label="FAQ Category"
                    notched
                    displayEmpty
                    inputProps={{ id: "category-select" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      {categoriesLoading ? "Loading categories..." : "Select category"}
                    </MenuItem>
                    {faqCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  {errors.faq_category_id && (
                    <span className="text-red-500 text-xs mt-1">{errors.faq_category_id}</span>
                  )}
                </FormControl>
              </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate("/settings/faq-subcategory-list")}
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Submit')}
          </button>
        </div>
      </form>
    </div>
  );
};



export default FaqSubCategory;