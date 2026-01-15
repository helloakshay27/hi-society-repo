import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Info,
  Loader2,
  Edit,
  Trash2,
  Clock,
  MapPin,
  User,
  Calendar,
  Building2,
  Home,
  DollarSign,
  Paperclip,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { apiClient } from "@/utils/apiClient";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";

// Type definitions matching the API response
interface FitoutDocument {
  id: number;
  active: number;
  document_url: string;
}

interface SnagQuestOption {
  id: number;
  question_id: number;
  qname: string;
  active: number;
  company_id: number;
  option_type: string;
}

interface SnagQuestion {
  id: number;
  qtype: string;
  descr: string;
  checklist_id: number;
  user_id: number;
  img_mandatory: boolean;
  quest_mandatory: boolean;
  snag_audit_category_id: number | null;
  snag_audit_sub_category_id: number | null;
  active: number;
  qnumber: number;
  snag_quest_options: SnagQuestOption[];
}

interface SnagAnswer {
  id: number;
  question_id: number;
  quest_option_id: number | null;
  ans_descr: string;
  answer_type: string | null;
  company_id: number | null;
  checklist_id: number | null;
  quest_map_id: number;
  created_at: string;
  docs: any[];
}

interface SnagQuestionMap {
  id: number;
  question_id: number;
  level_id: number | null;
  checklist_id: number;
  snag_question: SnagQuestion;
  snag_answers: SnagAnswer[];
}

interface FitoutResponse {
  id: number;
  name: string;
  snag_questions: SnagQuestionMap[];
}

interface TabularResponseData {
  id: string;
  annexure_name: string;
  question_number: number;
  question: string;
  question_type: string;
  answer: string;
  answered_at: string;
  is_mandatory: string;
  has_attachments: string;
}

interface FitoutRequestCategory {
  id: number;
  fitout_category_id: number;
  amount: number;
  complaint_status_id: number | null;
  category_name: string;
  status_name: string | null;
  documents: FitoutDocument[];
}

interface LockPayment {
  convenience_charge?: number;
  [key: string]: any;
}

interface FitoutRequestDetail {
  id: number;
  fitout_category_id: number | null;
  description: string;
  society_id: number;
  user_society_id: number;
  user_id: number;
  site_id: number;
  unit_id: number;
  pms_supplier_id: number | null;
  active: number | null;
  status_id: number | null;
  amount: number;
  created_at: string;
  updated_at: string;
  contactor_name: string;
  contactor_no: string;
  expiry_date: string;
  refund_date: string;
  category_name: string | null;
  status_name: string | null;
  start_date: string;
  end_date: string | null;
  fitout_request_categories: FitoutRequestCategory[];
  osr_logs: any[];
  lock_payment: LockPayment | null;
  // Additional fields that might come from API
  tower?: string;
  flat?: string;
  user_name?: string;
  created_by?: string;
}

const FitoutRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<FitoutRequestDetail | null>(null);
  const [activeTab, setActiveTab] = useState("request-information");
  const [responses, setResponses] = useState<FitoutResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFitoutRequestDetails(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === "responses") {
      fetchFitoutResponses(parseInt(id));
    }
  }, [id, activeTab]);

  const fetchFitoutRequestDetails = async (requestId: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/crm/admin/fitout_requests/${requestId}.json`);
      console.log("Fitout Request Details:", response.data);
      setRequestData(response.data);
    } catch (error: any) {
      console.error("Error fetching fitout request details:", error);
      toast.error(`Failed to load fitout request details: ${error.message || 'Unknown error'}`, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFitoutResponses = async (requestId: number) => {
    setResponsesLoading(true);
    try {
      const response = await apiClient.get(`/crm/admin/fitout_requests/${requestId}/fitout_responses.json`);
      console.log("Fitout Responses:", response.data);
      setResponses(response.data || []);
    } catch (error: any) {
      console.error("Error fetching fitout responses:", error);
      toast.error(`Failed to load responses: ${error.message || 'Unknown error'}`, {
        duration: 5000,
      });
      setResponses([]);
    } finally {
      setResponsesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      // Handle DD/MM/YYYY format
      if (dateString.includes('/')) {
        return dateString;
      }
      // Handle ISO format
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleBack = () => {
    navigate("/fitout/requests");
  };

  const handleEdit = () => {
    navigate(`/fitout/requests/edit/${id}`);
  };

  const handleDelete = () => {
    toast.info("Delete functionality - Coming soon");
  };

  const downloadDocument = async (docUrl: string, fileName: string) => {
    try {
      const response = await fetch(docUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Transform responses into tabular format for EnhancedTable
  const getTabularResponseData = (): TabularResponseData[] => {
    const tabularData: TabularResponseData[] = [];
    
    responses.forEach((categoryResponse) => {
      categoryResponse.snag_questions.forEach((questionMap) => {
        const question = questionMap.snag_question;
        
        // Determine question type display
        const questionTypeDisplay = 
          question.qtype === 'multiple' ? 'Multiple Choice' :
          question.qtype === 'text' ? 'Text' :
          question.qtype === 'description' ? 'Description' :
          question.qtype === 'date' ? 'Date' :
          question.qtype;
        
        // Get answer text
        let answerText = '—';
        let answeredAt = '—';
        
        if (questionMap.snag_answers && questionMap.snag_answers.length > 0) {
          const firstAnswer = questionMap.snag_answers[0];
          answeredAt = formatDateTime(firstAnswer.created_at);
          
          if (question.qtype === 'multiple' && firstAnswer.quest_option_id) {
            const selectedOption = question.snag_quest_options.find(
              opt => opt.id === firstAnswer.quest_option_id
            );
            answerText = selectedOption?.qname || 'Selected';
          } else {
            answerText = firstAnswer.ans_descr || '—';
          }
        }
        
        tabularData.push({
          id: `${categoryResponse.id}-${questionMap.id}`,
          annexure_name: categoryResponse.name,
          question_number: question.qnumber,
          question: question.descr,
          question_type: questionTypeDisplay,
          answer: answerText,
          answered_at: answeredAt,
          is_mandatory: question.quest_mandatory ? 'Yes' : 'No',
          has_attachments: questionMap.snag_answers.some(ans => ans.docs && ans.docs.length > 0) ? 'Yes' : 'No',
        });
      });
    });
    
    return tabularData;
  };

  // Define columns for tabular display
  const getResponseColumns = () => [
    { key: 'annexure_name', label: 'Annexure', sortable: true, defaultVisible: true },
    // { key: 'question_number', label: 'Q#', sortable: true, defaultVisible: true },
    { key: 'question', label: 'Question', sortable: true, defaultVisible: true },
    { key: 'question_type', label: 'Type', sortable: true, defaultVisible: true },
    { key: 'answer', label: 'Answer', sortable: false, defaultVisible: true },
    { key: 'is_mandatory', label: 'Required', sortable: true, defaultVisible: true },
    { key: 'has_attachments', label: 'Attachments', sortable: true, defaultVisible: true },
    { key: 'answered_at', label: 'Answered At', sortable: true, defaultVisible: true },
  ];

  // Render cell for tabular display
  const renderResponseCell = (item: TabularResponseData, columnKey: string) => {
    const cellValue = item[columnKey as keyof TabularResponseData];

    if (columnKey === 'question_number') {
      return (
        <div className="w-8 h-8 rounded-full bg-[#C72030] text-white flex items-center justify-center text-xs font-semibold">
          {cellValue}
        </div>
      );
    }

    if (columnKey === 'question_type') {
      return (
        <Badge variant="outline" className="text-xs">
          {cellValue}
        </Badge>
      );
    }

    if (columnKey === 'is_mandatory') {
      return cellValue === 'Yes' ? (
        <Badge variant="outline" className="text-xs text-red-600 border-red-300">
          Required
        </Badge>
      ) : (
        <span className="text-gray-500 text-xs">Optional</span>
      );
    }

    if (columnKey === 'has_attachments') {
      return cellValue === 'Yes' ? (
        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
          <Paperclip className="w-3 h-3 mr-1" />
          Yes
        </Badge>
      ) : (
        <span className="text-gray-400 text-xs">No</span>
      );
    }

    if (columnKey === 'question') {
      return (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-2">{cellValue}</p>
        </div>
      );
    }

    if (columnKey === 'answer') {
      return (
        <div className="max-w-md">
          <p className="text-sm text-gray-700">{cellValue}</p>
        </div>
      );
    }

    return <span className="text-sm">{cellValue}</span>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
          <span className="ml-2 text-gray-600">
            Loading fitout request details...
          </span>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">
            Fitout Request not found
          </h2>
          <p className="text-gray-600 mt-2">
            The requested fitout request could not be found.
          </p>
          <Button
            onClick={() => navigate("/fitout/requests")}
            className="mt-4"
          >
            Back to Fitout Requests
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = requestData.fitout_request_categories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalDocuments = requestData.fitout_request_categories.reduce((sum, cat) => sum + cat.documents.length, 0);

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fitout Requests
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
              Fitout Request #{requestData.id}
            </h1>
            <Badge
              variant={requestData.status_name ? "default" : "secondary"}
              className="text-xs"
              style={requestData.status_name ? { backgroundColor: '#C72030' } : {}}
            >
              {requestData.status_name || 'Pending'}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              style={{ borderColor: "#C72030", color: "#C72030" }}
              className="hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tabs */}
        <Card className="w-full bg-white shadow-sm border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap bg-gray-50 rounded-t-lg h-auto p-0 text-sm border-b border-gray-200">
              {[
                { label: "Request Information", value: "request-information" },
                { label: "Annexures", value: "annexures" },
                // { label: "Transactions", value: "transactions" },
                { label: "Responses", value: "responses" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 min-w-0 bg-white data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] px-3 py-2 border-r border-gray-200 last:border-r-0 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Request Information */}
            <TabsContent value="request-information" className="p-4 sm:p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Annexures</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {requestData.fitout_request_categories.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Documents</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {totalDocuments}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Created</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(requestData.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Information Card */}
              <Card className="mb-6 border-none bg-transparent shadow-none">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="px-6 py-3 border-b border-gray-200"
                    style={{ backgroundColor: "#F6F4EE" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                        <FileText className="w-4 h-4" style={{ color: '#C72030' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">Request Details</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Request ID</span>
                        <span className="font-medium text-gray-900">#{requestData.id}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Status</span>
                        <span className="font-medium text-gray-900">{requestData.status_name || 'Pending'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Tower</span>
                        <span className="font-medium text-gray-900">{requestData.tower || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Flat</span>
                        <span className="font-medium text-gray-900">{requestData.flat || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">User Name</span>
                        <span className="font-medium text-gray-900">{requestData.user_name || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Start Date</span>
                        <span className="font-medium text-gray-900">{formatDate(requestData.start_date)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Expiry Date</span>
                        <span className="font-medium text-gray-900">{formatDate(requestData.expiry_date)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Refund Date</span>
                        <span className="font-medium text-gray-900">{formatDate(requestData.refund_date)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Contractor Name</span>
                        <span className="font-medium text-gray-900">{requestData.contactor_name || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Contractor Mobile</span>
                        <span className="font-medium text-gray-900">{requestData.contactor_no || '—'}</span>
                      </div>
                      <div className="flex flex-col md:col-span-2">
                        <span className="text-gray-600 text-xs mb-1">Description</span>
                        <span className="font-medium text-gray-900">{requestData.description || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Created At</span>
                        <span className="font-medium text-gray-900">{formatDateTime(requestData.created_at)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Updated At</span>
                        <span className="font-medium text-gray-900">{formatDateTime(requestData.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              {requestData.lock_payment && (
                <Card className="mb-6 border-none bg-transparent shadow-none">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div
                      className="px-6 py-3 border-b border-gray-200"
                      style={{ backgroundColor: "#F6F4EE" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                          <DollarSign className="w-4 h-4" style={{ color: '#C72030' }} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Payment Information</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-600 text-xs mb-1">Convenience Charge</span>
                          <span className="font-medium text-gray-900">
                            ₹{requestData.lock_payment.convenience_charge?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-600 text-xs mb-1">Total Amount (with charges)</span>
                          <span className="font-medium text-gray-900">
                            ₹{(totalAmount + (requestData.lock_payment.convenience_charge || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Annexures */}
            <TabsContent value="annexures" className="p-4 sm:p-6">
              <Card className="mb-6 border-none bg-transparent shadow-none">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="px-6 py-3 border-b border-gray-200"
                    style={{ backgroundColor: "#F6F4EE" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                        <FileText className="w-4 h-4" style={{ color: '#C72030' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Annexures ({requestData.fitout_request_categories.length})
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {requestData.fitout_request_categories.length > 0 ? (
                      <div className="space-y-6">
                        {requestData.fitout_request_categories.map((category, index) => (
                          <div
                            key={category.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-base font-semibold text-gray-900 mb-1">
                                  {index + 1}. {category.category_name}
                                </h4>
                                {category.status_name && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: '#C72030', color: '#C72030' }}
                                  >
                                    {category.status_name}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Amount</p>
                                <p className="text-lg font-bold text-gray-900">
                                  ₹{category.amount.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Documents Section */}
                            {category.documents.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                  Documents ({category.documents.length})
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                  {category.documents.map((doc, docIndex) => (
                                    <div
                                      key={doc.id}
                                      className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                                    >
                                      <img
                                        src={decodeURIComponent(doc.document_url)}
                                        alt={`Document ${docIndex + 1}`}
                                        className="w-full h-32 object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => downloadDocument(doc.document_url, `document-${doc.id}.png`)}
                                        >
                                          <Download className="w-4 h-4 mr-1" />
                                          Download
                                        </Button>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 text-center">
                                        Doc {docIndex + 1}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Annexures Found
                        </h3>
                        <p className="text-gray-500">
                          No annexure categories have been added to this request yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Transactions */}
            <TabsContent value="transactions" className="p-4 sm:p-6">
              <Card className="mb-6 border-none bg-transparent shadow-none">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="px-6 py-3 border-b border-gray-200"
                    style={{ backgroundColor: "#F6F4EE" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                        <DollarSign className="w-4 h-4" style={{ color: '#C72030' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">Transaction Details</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                      <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Transactions Found
                      </h3>
                      <p className="text-gray-500">
                        No payment transactions have been recorded for this fitout request yet.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Responses */}
            <TabsContent value="responses" className="p-4 sm:p-6">
              <Card className="mb-6 border border-gray-200 bg-white shadow-none">
                <div
                  className="px-6 py-3 border-b border-gray-200"
                  style={{ backgroundColor: "#F6F4EE" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                      <FileText className="w-4 h-4" style={{ color: '#C72030' }} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Responses</h3>
                  </div>
                </div>
                <div className="p-6">
                  {responsesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
                      <span className="ml-2 text-gray-600">Loading responses...</span>
                    </div>
                  ) : responses.length > 0 ? (
                    <EnhancedTable
                      data={getTabularResponseData()}
                      columns={getResponseColumns()}
                      renderCell={renderResponseCell}
                      storageKey="fitout-responses-table"
                      exportFileName="fitout-responses"
                      enableSearch={true}
                      searchPlaceholder="Search responses..."
                      emptyMessage="No response data available"
                      pagination={true}
                      pageSize={10}
                      className="border border-gray-200 rounded-lg"
                    />
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                      <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Responses Found
                      </h3>
                      <p className="text-gray-500">
                        No responses have been submitted for this fitout request yet.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default FitoutRequestDetails;
