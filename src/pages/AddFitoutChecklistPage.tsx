import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
} from "@mui/material";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Upload,
  X,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

// --- Interface Definitions ---
interface AnswerOption {
  text: string;
  type: "p" | "n";
}

interface Question {
  id: string;
  text: string;
  answerType: string;
  mandatory: boolean;
  imageMandatory: boolean;
  answerOptions?: AnswerOption[];
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
}

// --- Field Styles for Material-UI Components ---
const fieldStyles = {
  height: "48px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  "& .MuiOutlinedInput-root": {
    height: "48px",
    "& fieldset": {
      borderColor: "#e5e7eb",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
  "& .MuiInputLabel-root": {
    "&.Mui-focused": {
      color: "#C72030",
    },
  },
};

const textareaStyles = {
  ...fieldStyles,
  height: "auto",
  "& .MuiOutlinedInput-root": {
    height: "auto",
    minHeight: "80px",
    padding: "16.5px 14px",
    "& fieldset": {
      borderColor: "#e5e7eb",
    },
    "&:hover fieldset": {
      borderColor: "#C72030",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#C72030",
    },
  },
};

export const AddFitoutChecklistPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", text: "", answerType: "", mandatory: false, imageMandatory: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/snag_audit_categories.json?q[resource_type_eq]=FitoutCategory");
      console.log('Categories API Response:', response.data);
      
      // Handle if response is array directly or wrapped in object
      let categoriesData = [];
      if (Array.isArray(response.data)) {
        categoriesData = response.data;
      } else if (response.data?.snag_audit_categories) {
        categoriesData = response.data.snag_audit_categories;
      }
      
      console.log('Categories Data:', categoriesData);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const loadSubCategories = useCallback(async (categoryId: number) => {
    setLoadingSubCategories(true);
    try {
      const response = await apiClient.get(
        `/snag_audit_categories/${categoryId}/snagsubcategories.json`
      );
      setSubCategories(response.data || []);
    } catch (error) {
      console.error("Error loading subcategories:", error);
      toast.error("Failed to load subcategories");
    } finally {
      setLoadingSubCategories(false);
    }
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setCategory(categoryId);
    setSubCategory("");
    setSubCategories([]);
    if (categoryId) {
      loadSubCategories(parseInt(categoryId));
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: "",
      answerType: "",
      mandatory: false,
      imageMandatory: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const handleQuestionChange = (
    id: string,
    field: keyof Question,
    value: string | boolean | AnswerOption[]
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const updatedQuestion = { ...q, [field]: value };
          if (
            field === "answerType" &&
            value === "multiple" &&
            !updatedQuestion.answerOptions
          ) {
            updatedQuestion.answerOptions = [
              { text: "Yes", type: "p" },
              { text: "No", type: "n" },
            ];
          } else if (field === "answerType" && value !== "multiple") {
            delete updatedQuestion.answerOptions;
          }
          return updatedQuestion;
        }
        return q;
      })
    );
  };

  const handleAddAnswerOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answerOptions: [
                ...(q.answerOptions || []),
                { text: "", type: "p" },
              ],
            }
          : q
      )
    );
  };

  const handleRemoveAnswerOption = (
    questionId: string,
    optionIndex: number
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answerOptions: q.answerOptions?.filter(
                (_, index) => index !== optionIndex
              ),
            }
          : q
      )
    );
  };

  const handleAnswerOptionChange = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answerOptions: q.answerOptions?.map((option, index) =>
                index === optionIndex ? { ...option, text: value } : option
              ),
            }
          : q
      )
    );
  };

  const handleAnswerOptionTypeChange = (
    questionId: string,
    optionIndex: number,
    value: "p" | "n"
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answerOptions: q.answerOptions?.map((option, index) =>
                index === optionIndex ? { ...option, type: value } : option
              ),
            }
          : q
      )
    );
  };

  const handleCreateChecklist = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("Please enter a title for the checklist");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    // if (!subCategory) {
    //   toast.error("Please select a sub-category");
    //   return;
    // }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text.trim()) {
        toast.error(`Please enter text for Question ${i + 1}`);
        return;
      }
      if (!question.answerType) {
        toast.error(`Please select an answer type for Question ${i + 1}`);
        return;
      }

      if (question.answerType === "multiple") {
        if (!question.answerOptions || question.answerOptions.length === 0) {
          toast.error(`Please add at least one option for Question ${i + 1}`);
          return;
        }
        for (let j = 0; j < question.answerOptions.length; j++) {
          if (!question.answerOptions[j].text.trim()) {
            toast.error(
              `Please enter text for Option ${j + 1} in Question ${i + 1}`
            );
            return;
          }
        }
      }
    }

    try {
      setLoading(true);
      setIsSubmitting(true);

      // Build request payload
      const payload = {
        snag_checklist: {
          name: title,
          snag_audit_category_id: parseInt(category),
          snag_audit_sub_category_id: parseInt(subCategory),
          check_type: "Fitout",
          questions: questions.map((question) => {
            const questionData: any = {
              descr: question.text,
              qtype: question.answerType,
              quest_mandatory: question.mandatory,
              img_mandatory: question.imageMandatory,
            };

            if (question.answerType === "multiple" && question.answerOptions) {
              questionData.quest_options = question.answerOptions.map(
                (option) => ({
                  option_name: option.text,
                  option_type: option.type,
                })
              );
            }

            return questionData;
          }),
        },
      };

      console.log("Creating fitout checklist:", payload);

      const response = await apiClient.post(
        "/crm/admin/snag_checklists.json",
        payload
      );
      console.log("Fitout checklist created successfully:", response.data);

      toast.success("Fitout Checklist Created Successfully!", {
        description: "Your checklist has been created and is now available.",
      });

      navigate("/fitout/checklists");
    } catch (error: any) {
      console.error("Error creating fitout checklist:", error);

      if (error.response) {
        console.error("Response data:", error.response.data);
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Failed to create checklist";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to create checklist. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
      <div className="mb-6">
        <button
          onClick={() => navigate("/fitout/checklists")}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fitout Checklists
        </button>
        <Heading level="h1" variant="default">
          Add Fitout Checklist
        </Heading>
      </div>

      <form className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E5E0D3] mr-3">
                <span className="text-[#C72030] text-sm">1</span>
              </div>
              Basic Information
            </h2>
          </div>
          <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Checklist Title *"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={fieldStyles}
            />

            <FormControl fullWidth sx={fieldStyles}>
              <InputLabel>Category *</InputLabel>
              <Select
                value={category}
                label="Category *"
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              sx={fieldStyles}
              disabled={!category || loadingSubCategories}
            >
              <InputLabel>Sub Category </InputLabel>
              <Select
                value={subCategory}
                label="Sub Category *"
                onChange={(e) => setSubCategory(e.target.value)}
              >
                {subCategories.map((subCat) => (
                  <MenuItem key={subCat.id} value={subCat.id.toString()}>
                    {subCat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          </div>
        </div>

        {/* Questions Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#E5E0D3] mr-3">
                  <span className="text-[#C72030] text-sm">2</span>
                </div>
                Questions
              </h2>
              <Button
                type="button"
                onClick={handleAddQuestion}
                className="bg-[#C72030] hover:bg-[#A01828] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-6 relative"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-gray-800">
                    Question {index + 1}
                  </h3>
                  {questions.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveQuestion(question.id)}
                      size="small"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </IconButton>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Question Text *"
                      variant="outlined"
                      // fullWidth
                      // multiline
                      // rows={1}
                      value={question.text}
                      onChange={(e) =>
                        handleQuestionChange(question.id, "text", e.target.value)
                      }
                       sx={fieldStyles}
                    />

                    <FormControl fullWidth sx={fieldStyles}>
                      <InputLabel>Answer Type *</InputLabel>
                      <Select
                        value={question.answerType}
                        label="Answer Type *"
                        onChange={(e) =>
                          handleQuestionChange(
                            question.id,
                            "answerType",
                            e.target.value
                          )
                        }
                      >
                        <MenuItem value="multiple">Multiple Choice</MenuItem>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="description">Description</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  <div className="flex items-center gap-4">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={question.mandatory}
                            onChange={(e) =>
                              handleQuestionChange(
                                question.id,
                                "mandatory",
                                e.target.checked
                              )
                            }
                            sx={{
                              color: "#C72030",
                              "&.Mui-checked": {
                                color: "#C72030",
                              },
                            }}
                          />
                        }
                        label="Mandatory"
                      />
                      {/* <FormControlLabel
                        control={
                          <Checkbox
                            checked={question.imageMandatory}
                            onChange={(e) =>
                              handleQuestionChange(
                                question.id,
                                "imageMandatory",
                                e.target.checked
                              )
                            }
                            sx={{
                              color: "#C72030",
                              "&.Mui-checked": {
                                color: "#C72030",
                              },
                            }}
                          />
                        }
                        label="Image Mandatory"
                      /> */}
                    </div>
                  {/* Answer Options for Multiple Choice */}
                  {question.answerType === "multiple" && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Answer Options
                        </h4>
                        <Button
                          type="button"
                          onClick={() => handleAddAnswerOption(question.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Option
                        </Button>
                      </div>

                      {question.answerOptions?.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex items-center gap-2"
                        >
                          <TextField
                            label={`Option ${optionIndex + 1}`}
                            variant="outlined"
                            fullWidth
                            value={option.text}
                            onChange={(e) =>
                              handleAnswerOptionChange(
                                question.id,
                                optionIndex,
                                e.target.value
                              )
                            }
                            sx={fieldStyles}
                          />
                          <FormControl sx={{ minWidth: 150, ...fieldStyles }}>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={option.type}
                              label="Type"
                              onChange={(e) =>
                                handleAnswerOptionTypeChange(
                                  question.id,
                                  optionIndex,
                                  e.target.value as "p" | "n"
                                )
                              }
                            >
                              <MenuItem value="p">Positive</MenuItem>
                              <MenuItem value="n">Negative</MenuItem>
                            </Select>
                          </FormControl>
                          {question.answerOptions &&
                            question.answerOptions.length > 1 && (
                              <IconButton
                                onClick={() =>
                                  handleRemoveAnswerOption(
                                    question.id,
                                    optionIndex
                                  )
                                }
                                size="small"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </IconButton>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/fitout/checklists")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateChecklist}
            disabled={isSubmitting || loading}
            className="bg-[#C72030] hover:bg-[#A01828] text-white"
          >
            {isSubmitting ? (
              <>Creating...</>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Checklist
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddFitoutChecklistPage;
