import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { ArrowLeft, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from "@mui/material";


const FaqEdit = () => {
  const baseURL = API_CONFIG.BASE_URL;

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
  const [hasFetched, setHasFetched] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const faqId = id;

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await axios.get(`${baseURL}/faq_categories.json`, {
           headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json',
                  },
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
  }, [baseURL]);

  useEffect(() => {
    if (formData.faq_category_id) {
      const fetchSubCategories = async () => {
        try {
          setSubCategoriesLoading(true);
          const res = await axios.get(`${baseURL}/faq_sub_categories.json`, {
             headers: {
                      'Authorization': getAuthHeader(),
                      'Content-Type': 'application/json',
                    },
          });

          const subCategoriesData =
            res.data?.faq_sub_categories || res.data || [];

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
    }
  }, [formData.faq_category_id, baseURL]);

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setSitesLoading(true);
        const res = await axios.get(`${baseURL}/sites.json`, {
           headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json',
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
  }, [baseURL]);

  // Fetch existing FAQ data
  // useEffect(() => {
  //   if (faqId && !hasFetched) {
  //     const fetchFaqData = async () => {
  //       try {
  //         setLoading(true);
  //         const res = await axios.get(`${baseURL}faqs/${faqId}.json`, {
  //           headers: getAuthHeaders(),
  //         });

  //         const faqData = res.data?.faq || res.data;

  //         if (faqData) {
  //           setFormData({
  //             faq_category_id: faqData.faq_category_id || "",
  //             faq_sub_category_id: faqData.faq_sub_category_id || "",
  //             faqs: [
  //               {
  //                 id: faqData.id,
  //                 faq_category_id: faqData.faq_category_id || "",
  //                 faq_sub_category_id: faqData.faq_sub_category_id || "",
  //                 question: faqData.question || "",
  //                 answer: faqData.answer || "",
  //                 site_id: faqData.site_id || "",
  //                 active: faqData.active !== undefined ? faqData.active : true,
  //                 faq_tag: faqData.faq_tag || "",
  //                 isExisting: true,
  //               },
  //             ],
  //           });

  //           setHasFetched(true);
  //         }
  //       } catch (err) {
  //         console.error("Failed to fetch FAQ:", err);
  //         toast.error("Failed to load FAQ data");
  //       } finally {
  //         setLoading(false);
  //       }
  //     };
  //     fetchFaqData();
  //   }
  // }, [faqId, hasFetched]);

  useEffect(() => {
  if (faqId && !hasFetched) {
    const fetchFaqData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseURL}/faqs/${faqId}.json`, {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });

        const faqData = res.data?.faq || res.data;

        if (faqData) {
          setFormData({
            faq_category_id: faqData.faq_category_id || "",
            faq_sub_category_id: faqData.faq_sub_category_id || "",
            faqs: [
              {
                id: faqData.id,
                faq_category_id: faqData.faq_category_id || "",
                faq_sub_category_id: faqData.faq_sub_category_id || "",
                question: faqData.question || "",
                answer: faqData.answer || "",
                site_id: faqData.site_id || "",
                active: faqData.active !== undefined ? faqData.active : true,
                faq_tag: faqData.faq_tag || "",
                isExisting: true,
              },
            ],
          });

          // Set question and answer input fields
          setQuestion(faqData.question || "");
          setAnswer(faqData.answer || "");

          setHasFetched(true);
        }
      } catch (err) {
        console.error("Failed to fetch FAQ:", err);
        toast.error("Failed to load FAQ data");
      } finally {
        setLoading(false);
      }
    };
    fetchFaqData();
  }
}, [faqId, hasFetched, baseURL]);

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

    const newFaq = {
      question: question.trim(),
      answer: answer.trim(),
      site_id: parseInt(selectedSiteId),
      active: true,
      faq_tag: faqTag.trim(),
      isExisting: false, // Flag for new FAQ
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

  const handleEditFaq = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!formData.faq_category_id) {
  //     toast.error("FAQ Category is required");
  //     return;
  //   }

  //   if (formData.faqs.length === 0) {
  //     toast.error("At least one FAQ is required");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     // Update existing FAQ - only PUT method used
  //     const existingFaq = formData.faqs.find((faq) => faq.isExisting);
  //     if (existingFaq) {
  //       const payload = {
  //         faq: {
  //           faq_category_id: parseInt(formData.faq_category_id),
  //           faq_sub_category_id: parseInt(formData.faq_sub_category_id),
  //           question: existingFaq.question,
  //           answer: existingFaq.answer,
  //           site_id: parseInt(existingFaq.site_id),
  //           active: existingFaq.active,
  //           faq_tag: existingFaq.faq_tag,
  //         },
  //       };

  //       await axios.put(`${baseURL}faqs/${faqId}.json`, payload, {
  //         headers: getAuthHeaders(),
  //       });
  //     }

  //     toast.success("FAQ updated successfully!");
  //     navigate("/faq-list");
  //   } catch (error) {
  //     console.error("Error:", error);
  //     const errorMessage =
  //       error.response?.data?.message || "Failed to update FAQ";
  //     toast.error(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Sync question and answer state to formData.faqs[0]
  setFormData((prev) => ({
    ...prev,
    faqs: prev.faqs.map((faq, i) =>
      i === 0
        ? { ...faq, question: question.trim(), answer: answer.trim() }
        : faq
    ),
  }));

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

  if (question.trim() === "" || answer.trim() === "") {
    toast.error("Question and Answer are required");
    return;
  }

  if (formData.faqs.length === 0) {
    toast.error("At least one FAQ is required");
    return;
  }

  setLoading(true);

  try {
    const existingFaq = {
      ...formData.faqs[0],
      question: question.trim(),
      answer: answer.trim(),
    };
    const payload = {
      faq: {
        faq_category_id: parseInt(formData.faq_category_id),
        faq_sub_category_id: parseInt(formData.faq_sub_category_id),
        question: existingFaq.question,
        answer: existingFaq.answer,
        site_id: parseInt(existingFaq.site_id),
        active: existingFaq.active,
        faq_tag: existingFaq.faq_tag,
      },
    };

    await axios.put(`${baseURL}/faqs/${faqId}.json`, payload, {
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    toast.success("FAQ updated successfully!");
    navigate("/maintenance/faq-list");
  } catch (error) {
    console.error("Error:", error);
    const errorMessage =
      error.response?.data?.message || "Failed to update FAQ";
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
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
            <span>FAQ List</span>
            <span>{">"}</span>
            <span className="text-gray-900 font-medium">Edit FAQ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EDIT FAQ</h1>
        </div>

        {/* Main Form Card */}
        <form id="faqEditForm" onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: "#F6F4EE" }}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                  <FileText size={16} color="#C72030" />
                </span>
                FAQ Information
              </h2>
            </div>
            
            <div className="p-6 space-y-6" style={{ backgroundColor: "#AAB9C50D" }}>
              {/* Category and Subcategory Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FAQ Category */}
                <FormControl
                  fullWidth
                  variant="outlined"
                  required={baseURL === "https://dev-panchshil-super-app.lockated.com/" || 
                    baseURL === "https://rustomjee-live.lockated.com/"}
                  sx={{ '& .MuiInputBase-root': fieldStyles }}
                >
                  <InputLabel shrink>FAQ Category</InputLabel>
                  <MuiSelect
                    value={formData.faq_category_id}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    label="FAQ Category"
                    notched
                    displayEmpty
                    disabled={loading || categoriesLoading}
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

                {/* FAQ Sub Category */}
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ '& .MuiInputBase-root': fieldStyles }}
                >
                  <InputLabel shrink>FAQ Sub Category</InputLabel>
                  <MuiSelect
                    value={formData.faq_sub_category_id}
                    onChange={(e) => handleSubCategoryChange(e.target.value)}
                    label="FAQ Sub Category"
                    notched
                    displayEmpty
                    disabled={loading || subCategoriesLoading || !formData.faq_category_id}
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
                  label="Question"
                  placeholder="Enter FAQ Question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  name="question"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />

                {/* Answer */}
                <TextField
                  label="Answer"
                  placeholder="Enter FAQ Answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  name="answer"
                  fullWidth
                  variant="outlined"
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  InputProps={{
                    sx: fieldStyles,
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <button
              type="submit"
              disabled={loading || formData.faqs.length === 0}
              className="bg-[#C4B89D59] text-[#C72030] hover:bg-[#C4B89D59]/90 h-9 px-4 text-sm font-medium rounded-md min-w-[120px]"
            >
              {loading ? 'Update' : 'Update'}
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

export default FaqEdit;
