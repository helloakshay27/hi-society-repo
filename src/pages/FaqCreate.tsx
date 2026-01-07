import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
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
  const baseURL = API_CONFIG.BASE_URL;

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

  const [formData, setFormData] = useState({
    faq_category_id: "",
    faq_sub_category_id: "",
    faqs: [],
  });

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [sites, setSites] = useState([]);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [faqTag, setFaqTag] = useState("");

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [sitesLoading, setSitesLoading] = useState(false);

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
        const res = await axios.get(`${baseURL}/faq_categories.json`, {
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
          const res = await axios.get(`${baseURL}/faq_sub_categories.json`, {
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
        const res = await axios.get(`${baseURL}/sites.json`, {
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
        toast.error("Failed to load sites");
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
    if (!question.trim()) {
      toast.error("Question is required");
      return;
    }

    if (!answer.trim()) {
      toast.error("Answer is required");
      return;
    }

     if (
    (baseURL === "https://dev-panchshil-super-app.lockated.com/" ||
      baseURL === "https://kalpataru.lockated.com/" ||
      baseURL === "https://rustomjee-live.lockated.com/")
  ) {
    if (!formData.faq_category_id) {
      toast.error("FAQ Category is required");
      return;
    }

    if (!formData.faq_sub_category_id) {
      toast.error("FAQ Sub Category is required");
      return;
    }
  }

    // if (!selectedSiteId) {
    //   toast.error("Site is required");
    //   return;
    // }

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
  };

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
  (baseURL === "https://dev-panchshil-super-app.lockated.com/" || baseURL === "https://rustomjee-live.lockated.com/") &&
  !formData.faq_category_id
) {
  toast.error("FAQ Category is required");
  return;
}

    // if (!formData.faq_sub_category_id) {
    //   toast.error("FAQ Sub Category is required");
    //   return;
    // }

    if (formData.faqs.length === 0) {
      toast.error("At least one FAQ is required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        faq_category_id: parseInt(formData.faq_category_id),
        faq_sub_category_id: parseInt(formData.faq_sub_category_id),
        faqs: formData.faqs,
      };

      await axios.post(`${baseURL}/faqs.json`, payload, {
        headers: { Authorization: getAuthHeader() },
      });

      toast.success("FAQs created successfully!");
      navigate("/maintenance/faq-list"); // Adjust navigation path as needed
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create FAQs";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="hover:text-[#C72030] cursor-pointer" onClick={() => navigate("/maintenance/faq-list")}>FAQ List</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Create New FAQ</span>
          </div>
        </div>

        {/* Main Form Card */}
        <form id="faqCreateForm" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                  <FileText size={16} color="#C72030" />
                </span>
                FAQ Information
              </h2>
            </div>
            
            <div className="p-6" style={{ backgroundColor: "#AAB9C50D" }}>
              {/* Category and Subcategory Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <FormControl fullWidth variant="outlined" required={(baseURL === "https://dev-panchshil-super-app.lockated.com/" || baseURL === "https://kalpataru.lockated.com/" || baseURL === "https://rustomjee-live.lockated.com/")}>
                  <InputLabel shrink htmlFor="faq-category">
                    FAQ Category
                  </InputLabel>
                  <MuiSelect
                    value={formData.faq_category_id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={loading || categoriesLoading}
                    label="FAQ Category"
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

                <FormControl fullWidth variant="outlined" required={(baseURL === "https://dev-panchshil-super-app.lockated.com/" || baseURL === "https://kalpataru.lockated.com/" || baseURL === "https://rustomjee-live.lockated.com/")}>
                  <InputLabel shrink htmlFor="faq-sub-category">
                    FAQ Sub Category
                  </InputLabel>
                  <MuiSelect
                    value={formData.faq_sub_category_id}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    disabled={loading || subCategoriesLoading || !formData.faq_category_id}
                    label="FAQ Sub Category"
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

              {/* FAQ Entry Section */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">Add FAQ</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Question */}
                  <TextField
                    label="Question"
                    variant="outlined"
                    fullWidth
                    required
                    placeholder="Enter FAQ Question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />

                  {/* Answer */}
                  <TextField
                    label="Answer"
                    variant="outlined"
                    fullWidth
                    required
                    placeholder="Enter FAQ Answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={loading}
                    // multiline
                    // rows={1}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: fieldStyles }}
                  />

                  {/* Add Button */}
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="w-full bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-[45px] px-4 text-sm font-medium rounded-md flex items-center justify-center gap-2"
                      onClick={handleAddFaq}
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"></path>
                      </svg>
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FAQ List Table */}
              {formData.faqs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">FAQ List</h4>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: "#E5E0D3" }}>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">
                            Sr No
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">
                            Question
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4">
                            Answer
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 py-3 px-4 text-center">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.faqs.map((faq, index) => (
                          <TableRow
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="py-3 px-4 font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="max-w-md" style={{ wordWrap: "break-word" }}>
                                {faq.question}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="max-w-lg" style={{ wordWrap: "break-word" }}>
                                {faq.answer}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold"
                                onClick={() => handleDeleteFaq(index)}
                                disabled={loading}
                                title="Delete FAQ"
                              >
                                ×
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <button
              type="submit"
              disabled={loading || formData.faqs.length === 0}
              className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
            >
              {loading ? 'Submit' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => navigate("/maintenance/faq-list")}
              disabled={loading}
              className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqCreate;
