import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit } from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

// Type definitions
interface QuestionOption {
  id: number;
  qname: string;
  option_type: string;
  active: number;
}

interface Question {
  id: number;
  descr: string;
  qtype: string;
  quest_mandatory: boolean;
  img_mandatory: boolean | null;
  qnumber: number;
  options: QuestionOption[];
}

interface FitoutChecklistDetails {
  id: number;
  name: string;
  check_type: string;
  active: number;
  company_id: number;
  project_id: number;
  resource_type: string | null;
  resource_id: number | null;
  snag_audit_category_id: number;
  snag_audit_sub_category_id: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  sub_category_name: string;
  questions: Question[];
}

export const FitoutChecklistDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklistData, setChecklistData] = useState<FitoutChecklistDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChecklistData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await apiClient.get(`/crm/admin/snag_checklists/${id}.json`);
        console.log("Fitout Checklist Details:", response.data);
        setChecklistData(response.data);
      } catch (error) {
        console.error("Error fetching checklist details:", error);
        toast.error("Failed to Load Checklist Data", {
          description: "Unable to fetch checklist details",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadChecklistData();
  }, [id]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/master/fitout-checklists")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fitout Checklists
        </Button>
        {!loading && checklistData && (
          <Button
            onClick={() => navigate(`/master/fitout-checklists/edit/${id}`)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="w-4 h-4" />
            Edit Checklist
          </Button>
        )}
      </div>

      {/* Main Checklist Content Card */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Fitout Checklist Details
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading checklist data...</div>
            </div>
          ) : !checklistData ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Checklist not found</div>
            </div>
          ) : (
            <>
              {/* Checklist Basic Information */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Checklist Title
                    </label>
                    <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                      {checklistData.name || "Untitled Checklist"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Questions
                    </label>
                    <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                      {checklistData.questions?.length || 0} Questions
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check Type
                    </label>
                    <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                      {checklistData.check_type
                        ? checklistData.check_type.charAt(0).toUpperCase() + 
                          checklistData.check_type.slice(1)
                        : "Not Specified"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                      {checklistData.category_name || "Not Assigned"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub Category
                    </label>
                    <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                      {checklistData.sub_category_name || "Not Assigned"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="text-base font-medium bg-gray-50 px-3 py-2 rounded-md border">
                      <span
                        className={`${
                          checklistData.active === 1 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {checklistData.active === 1 ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              {!loading && checklistData && (
                <div>
                  <div className="mb-4 pb-2 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Checklist Questions
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {checklistData.questions?.length || 0} question(s) configured for this checklist
                    </p>
                  </div>
                  <div className="space-y-6">
                    {checklistData.questions?.map((question: Question, index) => (
                      <Card
                        key={question.id}
                        className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-600">
                                {index + 1}
                              </span>
                            </div>
                            <CardTitle className="text-base font-medium text-gray-900">
                              Question {index + 1}
                            </CardTitle>
                            <span
                              className={`
                                px-2 py-1 text-xs font-medium rounded-full
                                ${
                                  question.qtype === "multiple"
                                    ? "bg-blue-100 text-blue-800"
                                    : question.qtype === "text"
                                    ? "bg-green-100 text-green-800"
                                    : question.qtype === "rating"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : question.qtype === "emoji"
                                    ? "bg-purple-100 text-purple-800"
                                    : question.qtype === "description"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              `}
                            >
                              {question.qtype === "multiple"
                                ? "Multiple Choice"
                                : question.qtype === "text"
                                ? "Text"
                                : question.qtype === "rating"
                                ? "Rating"
                                : question.qtype === "emoji"
                                ? "Emoji"
                                : question.qtype === "description"
                                ? "Description"
                                : question.qtype || "Unknown"}
                            </span>
                            {question.quest_mandatory && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Required
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Question Text
                              </label>
                              <input
                                type="text"
                                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                                value={question.descr || ""}
                                disabled
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Answer Type
                              </label>
                              <Select
                                value={
                                  question.qtype === "multiple"
                                    ? "Multiple Choice"
                                    : question.qtype === "text"
                                    ? "Text"
                                    : question.qtype === "rating"
                                    ? "Rating"
                                    : question.qtype === "emoji"
                                    ? "Emojis"
                                    : question.qtype === "description"
                                    ? "Description"
                                    : "Unknown Type"
                                }
                                disabled
                              >
                                <SelectTrigger className="w-full h-10 bg-gray-50">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                                  <SelectItem value="Text">Text</SelectItem>
                                  <SelectItem value="Description">Description</SelectItem>
                                  <SelectItem value="Rating">Rating</SelectItem>
                                  <SelectItem value="Emojis">Emojis</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Answer Options */}
                          {question.options && question.options.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Answer Options
                              </label>
                              <div className="space-y-3">
                                {question.options.map((option: QuestionOption, optIdx: number) => (
                                  <div
                                    key={option.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200"
                                  >
                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center border border-gray-300">
                                      <span className="text-xs font-medium text-gray-600">
                                        {optIdx + 1}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        className="w-full h-9 px-3 border border-gray-300 rounded-md bg-white text-gray-700"
                                        value={option.qname}
                                        disabled
                                        readOnly
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                                          option.option_type === "p"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {option.option_type === "p" ? "Positive" : "Negative"}
                                      </span>
                                      <span
                                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                                          option.active === 1
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {option.active === 1 ? "Active" : "Inactive"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Question Meta Information */}
                          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`mandatory-${question.id}`}
                                checked={question.quest_mandatory || false}
                                disabled
                                className="data-[state=checked]:bg-gray-400"
                              />
                              <label
                                htmlFor={`mandatory-${question.id}`}
                                className="text-sm text-gray-700"
                              >
                                Mandatory Question
                              </label>
                            </div>
                            {question.img_mandatory !== null && (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`img-mandatory-${question.id}`}
                                  checked={question.img_mandatory || false}
                                  disabled
                                  className="data-[state=checked]:bg-gray-400"
                                />
                                <label
                                  htmlFor={`img-mandatory-${question.id}`}
                                  className="text-sm text-gray-700"
                                >
                                  Image Mandatory
                                </label>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FitoutChecklistDetailsPage;
