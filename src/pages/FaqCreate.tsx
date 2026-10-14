import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";
import SelectBox from "@/components/ui/select-box";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";

const FaqCreate = () => {

  // Field styles for Material-UI components
  const fieldStyles = {
    height: '44px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    '& .MuiOutlinedInput-root': {
      height: '44px',
      borderRadius: '12px',
      '& fieldset': {
        borderColor: 'rgba(26, 26, 24, 0.08)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(26, 26, 24, 0.28)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1A1A18',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#1A1A18',
      },
    },
  };

  const [formData, setFormData] = useState({
    faq_category_id: "",
    faq_sub_category_id: "",
    question: "",
    answer: "",
      faqs: [],   // ✅ ADD THIS

  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);

  const navigate = useNavigate();

  // Get auth headers
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await axios.get(getFullUrl('/faq_categories.json'), {
         headers: { Authorization: getAuthHeader() },
        });

        const categoriesData = res.data?.faq_categories || res.data || [];
        const formattedCategories = categoriesData.map((category) => ({
          id: category?.id || "",
          name: category?.name || "Unnamed Category",
        }));

        setCategories(formattedCategories);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formData.faq_category_id) {
      const fetchSubCategories = async () => {
        try {
          setSubCategoriesLoading(true);
          const res = await axios.get(getFullUrl('/faq_sub_categories.json'), {
            headers: { Authorization: getAuthHeader() },
          });

          const subCategoriesData =
            res.data?.faq_sub_categories || res.data || [];
          // Filter subcategories by selected category
          const filteredSubCategories = subCategoriesData.filter(
            (subCat) => subCat.faq_category_id == formData.faq_category_id
          );

          const formattedSubCategories = filteredSubCategories.map(
            (subCategory) => ({
              id: subCategory?.id || "",
              name: subCategory?.name || "Unnamed Sub Category",
            })
          );

          setSubCategories(formattedSubCategories);
        } catch (err) {
          console.error("Failed to fetch subcategories:", err);
          toast.error("Failed to load subcategories");
        } finally {
          setSubCategoriesLoading(false);
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
      setFormData((prev) => ({ ...prev, faq_sub_category_id: "" }));
    }
  }, [formData.faq_category_id]);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setSitesLoading(true);
        const res = await axios.get(getFullUrl('/sites.json'), {
          headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "multipart/form-data",
                  },
        });

        const sitesData = res.data?.sites || res.data || [];
        const formattedSites = sitesData.map((site) => ({
          id: site?.id || "",
          name: site?.name || "Unnamed Site",
        }));

        setSites(formattedSites);
      } catch (err) {
        console.error("Failed to fetch sites:", err);
        // toast.error("Failed to load sites");
      } finally {
        setSitesLoading(false);
      }
    };
    fetchSites();
  }, []);

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      faq_category_id: value,
      faq_sub_category_id: "",
    }));
  };

  const handleSubCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      faq_sub_category_id: value,
    }));
  };

  const handleAddFaq = () => {
    if (!formData.question.trim()) {
  toast.error("Question is required");
  return;
}

if (!formData.answer.trim()) {
  toast.error("Answer is required");
  return;
}

     if (
    (getFullUrl('') === "https://dev-panchshil-super-app.lockated.com" ||
      getFullUrl('') === "https://kalpataru.lockated.com" ||
      getFullUrl('') === "https://rustomjee-live.lockated.com")
  ) {
    if (!formData.faq_category_id) {
      toast.error("FAQ Category is required");
      return;
    }

    if (!formData.faq_sub_category_id) {
      toast.error("FAQ Sub Category is required");
      return;
    }

    if (!formData.question.trim()) {
      toast.error("Question is required");
      return;
    }

    const newFaq = {
      question: question.trim(),
      answer: answer.trim(),
      site_id: parseInt(selectedSiteId),
      active: true,
      faq_tag: faqTag.trim(),
    };

    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, newFaq],
    }));

    // Clear input fields
    setQuestion("");
    setAnswer("");
    setFaqTag("");
    setSelectedSiteId("");

    toast.success("FAQ added to list");
  }}

  const handleDeleteFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
    toast.success("FAQ removed from list");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // if (!formData.faq_category_id) {
    //   toast.error("FAQ Category is required");
    //   return;
    // }
    if (
  // (getFullUrl('') === "https://dev-panchshil-super-app.lockated.com" || getFullUrl('') === "https://rustomjee-live.lockated.com") &&
  !formData.faq_category_id
) {
  toast.error("FAQ Category is required");
  return;
}

    // if (!formData.faq_sub_category_id) {
    //   toast.error("FAQ Sub Category is required");
    //   return;
    // }

    // if (formData.faqs.length === 0) {
    //   toast.error("At least one FAQ is required");
    //   return;
    // }

    setLoading(true);

    try {
      const payload = {
        faq_category_id: parseInt(formData.faq_category_id),
        faq_sub_category_id: parseInt(formData.faq_sub_category_id),
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        active: true,
      };

      await axios.post(getFullUrl('/faqs.json'), payload, {
         headers: {
                           Authorization: getAuthHeader(),
                         },
      });

      toast.success("FAQ created successfully!");
      navigate("/maintenance/faq-list");
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create FAQ";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full faq-create-page">
      <style>{`
        /* ---- Reference design: canvas, card, fields ---- */
        html body #root .faq-create-page {
          background-color: #FDFDFB !important;
        }
        html body #root .faq-create-page .ref-card {
          border: 1px solid rgba(26, 26, 24, 0.09) !important;
          border-radius: 16px !important;
          box-shadow: none !important;
        }
        html body #root .faq-create-page .ref-card > div:first-child {
          padding: 22px 24px 0 !important;
          background: transparent !important;
          border: none !important;
        }
        html body #root .faq-create-page .ref-card > div:first-child h2 {
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: #1A1A18 !important;
        }
        /* section icon chip — same as Settings module (32px, #F5F4F0, ink icon) */
        html body #root .faq-create-page .ref-card > div:first-child h2 > span:first-child {
          width: 32px !important;
          height: 32px !important;
          margin-right: 12px !important;
          flex: none;
          background-color: #F5F4F0 !important;
        }
        html body #root .faq-create-page .ref-card > div:first-child h2 > span:first-child svg {
          width: 14px !important;
          height: 14px !important;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .faq-create-page .ref-card > div:nth-child(2) {
          background-color: #FFFFFF !important;
          padding: 16px 24px 22px !important;
        }
        html body #root .faq-create-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .faq-create-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .faq-create-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .faq-create-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .faq-create-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .faq-create-page .MuiOutlinedInput-input::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1 !important;
        }
        html body #root .faq-create-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
      `}</style>
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header */}
        <div className="mb-[22px]">
          <div className="flex items-center gap-2 text-[13px] font-medium mb-3" style={{ color: "rgba(26, 26, 24, 0.48)" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="cursor-pointer hover:text-[#1A1A18]" onClick={() => navigate("/maintenance/faq-list")}>FAQ List</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ color: "#1A1A18" }}>Create New FAQ</span>
          </div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>New FAQ</h1>
        </div>

        {/* Main Form Card */}
        <form id="faqCreateForm" onSubmit={handleSubmit}>
          <div className="ref-card bg-white overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center">
                <span className="w-7 h-7 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: "#F6F4EE" }}>
                  <FileText size={14} color="#2C2C2C" />
                </span>
                FAQ Information
              </h2>
            </div>
            
            <div className="p-6 bg-white">
              {/* Category and Subcategory Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <FormControl fullWidth variant="outlined" required={(getFullUrl('') === "https://dev-panchshil-super-app.lockated.com" || getFullUrl('') === "https://kalpataru.lockated.com" || getFullUrl('') === "https://rustomjee-live.lockated.com")}>
                  <InputLabel shrink htmlFor="faq-category">
                    FAQ Category <span style={{ color: '#C72030' }}>*</span>
                  </InputLabel>
                  <MuiSelect
                    value={formData.faq_category_id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={loading || categoriesLoading}
                    label="FAQ Category *"
                    notched
                    displayEmpty
                    inputProps={{ id: "faq-category" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      {categoriesLoading ? "Loading categories..." : "Select Category"}
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                <FormControl fullWidth variant="outlined" required={(getFullUrl('') === "https://dev-panchshil-super-app.lockated.com" || getFullUrl('') === "https://kalpataru.lockated.com" || getFullUrl('') === "https://rustomjee-live.lockated.com")}>
                  <InputLabel shrink htmlFor="faq-sub-category">
                    FAQ Sub Category <span style={{ color: '#C72030' }}>*</span>
                  </InputLabel>
                  <MuiSelect
                    value={formData.faq_sub_category_id}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    disabled={loading || subCategoriesLoading || !formData.faq_category_id}
                    label="FAQ Sub Category *"
                    notched
                    displayEmpty
                    inputProps={{ id: "faq-sub-category" }}
                    sx={fieldStyles}
                  >
                    <MenuItem value="">
                      {subCategoriesLoading ? "Loading subcategories..." : "Select Sub Category"}
                    </MenuItem>
                    {subCategories.map((subCategory) => (
                      <MenuItem key={subCategory.id} value={subCategory.id}>
                        {subCategory.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              </div>

              {/* Question and Answer Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Question */}
                <TextField
                  label={
                    <span>
                      Question <span style={{ color: '#C72030' }}>*</span>
                    </span>
                  }
                  variant="outlined"
                  fullWidth
                  placeholder="Enter Question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />

                {/* Answer */}
                <TextField
                  label={
                    <span>
                      Answer <span style={{ color: '#C72030' }}>*</span>
                    </span>
                  }
                  variant="outlined"
                  fullWidth
                  placeholder="Enter Answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  disabled={loading}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: fieldStyles }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => navigate("/maintenance/faq-list")}
              disabled={loading}
              className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-9 px-4 text-sm font-medium"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FaqCreate;
