import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, Upload, X, FileText, Clock, User, MessageSquare, Paperclip, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Attachment {
  id: number;
  document_file_name: string;
  document_content_type: string;
  document_file_size: number;
}

interface Comment {
  id: number;
  body: string;
  created_at: string;
  commentor?: {
    id: number;
    email: string;
  };
}

interface DeviationDetail {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
  comment?: string;
  user: {
    id: number;
    email: string;
  };
  user_society?: {
    id: number;
    society_flat: {
      id: number;
      flat_no: string;
      block_no: string | null;
    };
  };
  attachments: Attachment[];
  comments: Comment[];
}

interface ApiResponse {
  deviation_detail: DeviationDetail;
  complaint_statuses: unknown[];
}

interface ViolationTableRow {
  violation: string;
  attachments: number;
  created_at: string;
  created_by: string;
}

const ViolationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { deviation_id } = useParams<{ deviation_id: string }>();
  const baseURL = API_CONFIG.BASE_URL;
  
  const [deviation, setDeviation] = useState<DeviationDetail | null>(null);
  const [violationDetails, setViolationDetails] = useState<ViolationTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("deviation-details");
  const [logs, setLogs] = useState<any[]>([]);
  
  // Edit Status Dialog State
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [statusOptions, setStatusOptions] = useState<{ id: number; name: string; color_code?: string }[]>([]);
  
  // Fetch complaint statuses for dropdown
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await axios.get(`${baseURL}/fitout_categories/get_complaint_statuses.json?q[of_atype_eq]=fitout_category`, {
          headers: { 'Authorization': getAuthHeader() }
        });
        const statuses = res.data.complaint_statuses || [];
        setStatusOptions(statuses);
      } catch (err) {
        toast.error('Failed to fetch status options');
      }
    };
    fetchStatuses();
  }, [baseURL]);
  
  // Send Violation Dialog State
  const [isSendViolationOpen, setIsSendViolationOpen] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isSubmittingViolation, setIsSubmittingViolation] = useState(false);

  const fetchViolationDetail = useCallback(async (search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get<any>(
        `${baseURL}/crm/admin/deviation_details/${deviation_id}.json`,
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      const deviationDetail = response.data.deviation_detail;
      if (!deviationDetail) {
        toast.error('Violation detail not found');
        navigate(-1);
        return;
      }
      setDeviation(deviationDetail);
      setLogs(deviationDetail.logs || []);

      // Create violation details table - one row showing the main violation
      const violationRow: ViolationTableRow = {
        violation: `Deviation #${deviationDetail.id}`,
        attachments: deviationDetail.attachments.length,
        created_at: deviationDetail.created_at,
        created_by: deviationDetail.user.email,
      };

      let filteredData = [violationRow];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = [violationRow].filter((item) =>
          item.violation?.toLowerCase().includes(searchLower) ||
          item.created_by?.toLowerCase().includes(searchLower)
        );
      }

      setViolationDetails(filteredData);
    } catch (err) {
      toast.error('Failed to fetch violation details.');
      console.error('Error fetching violation details:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, deviation_id, navigate]);

  useEffect(() => {
    fetchViolationDetail(searchTerm);
  }, [searchTerm, fetchViolationDetail]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditStatus = () => {
    if (deviation) {
      // Try to find the status id by name
      const found = statusOptions.find(opt => opt.name === deviation.status);
      setSelectedStatus(found ? String(found.id) : '');
      setStatusComment('');
    }
    setIsEditStatusOpen(true);
  };

  const handleSendViolation = () => {
    setViolationMessage('');
    setAttachmentFiles([]);
    setIsSendViolationOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setAttachmentFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitStatusEdit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    setIsSubmittingStatus(true);
    try {
      await axios.put(
        `${baseURL}/crm/fitout_requests/update_deviation_status.json?id=${deviation_id}`,
        {
          complaint_status_id: Number(selectedStatus),
          comment: statusComment,
        },
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Status updated successfully');
      setIsEditStatusOpen(false);
      fetchViolationDetail(searchTerm);
    } catch (err) {
      toast.error('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleSubmitViolation = async () => {
    if (!violationMessage.trim()) {
      toast.error('Please enter a violation message');
      return;
    }

    setIsSubmittingViolation(true);
    try {
      // TODO: Replace with actual API call
      // const formData = new FormData();
      // formData.append('message', violationMessage);
      // attachmentFiles.forEach(file => {
      //   formData.append('attachments[]', file);
      // });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Violation sent successfully');
      setIsSendViolationOpen(false);
    } catch (err) {
      toast.error('Failed to send violation');
      console.error('Error sending violation:', err);
    } finally {
      setIsSubmittingViolation(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const columns = [
    { key: 'violation', label: 'Violation', sortable: true },
    { key: 'attachments', label: 'Attachments', sortable: false },
    { key: 'created_at', label: 'Created At', sortable: true },
    { key: 'created_by', label: 'Created By', sortable: true },
  ];

  const renderCell = (item: ViolationTableRow, columnKey: string) => {
    switch (columnKey) {
      case 'violation':
        return <span className="text-gray-900">{item.violation}</span>;
      case 'attachments':
        return <span className="text-gray-900">{item.attachments > 0 ? item.attachments : '-'}</span>;
      case 'created_at':
        return <span className="text-gray-900">{formatDate(item.created_at)}</span>;
      case 'created_by':
        return <span className="text-gray-900">{item.created_by}</span>;
      default:
        return item[columnKey as keyof ViolationTableRow] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
    </div>
  );

  if (!deviation) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Toaster position="top-right" richColors closeButton />
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading violation details...</div>
        </div>
      </div>
    );
  }

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
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
              Deviation #{deviation.id}
            </h1>
            <Badge
              variant={deviation.status ? "default" : "secondary"}
              className="text-xs"
              style={deviation.status ? { backgroundColor: '#C72030' } : {}}
            >
              {deviation.status || 'Pending'}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEditStatus}
              variant="outline"
              size="sm"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Status
            </Button>
            <Button
              onClick={handleSendViolation}
              size="sm"
              style={{ backgroundColor: "#00B8D9", color: "white" }}
              className="hover:opacity-90"
            >
              Send Violation
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Deviation ID</p>
                <p className="text-lg font-semibold text-gray-900">
                  #{deviation.id}
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
                <p className="text-xs text-gray-600">Attachments</p>
                <p className="text-lg font-semibold text-gray-900">
                  {deviation.attachments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Comments</p>
                <p className="text-lg font-semibold text-gray-900">
                  {deviation.comments.length}
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
                  {formatDate(deviation.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Card className="w-full bg-white shadow-sm border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap bg-gray-50 rounded-t-lg h-auto p-0 text-sm border-b border-gray-200">
              {[
                { label: "Deviation Details", value: "deviation-details" },
                { label: "Attachments", value: "attachments" },
                { label: "Comments", value: "comments" },
                { label: "Logs", value: "logs" },
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

            {/* Deviation Details Tab */}
            <TabsContent value="deviation-details" className="p-4 sm:p-6">
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
                      <h3 className="text-base font-semibold text-gray-900">Deviation Information</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Deviation ID</span>
                        <span className="font-medium text-gray-900">#{deviation.id}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Status</span>
                        <span className="font-medium text-gray-900">{deviation.status || 'Pending'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Tower</span>
                        <span className="font-medium text-gray-900">{deviation.user_society?.society_flat?.block_no || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Flat</span>
                        <span className="font-medium text-gray-900">{deviation.user_society?.society_flat?.flat_no || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">User Society ID</span>
                        <span className="font-medium text-gray-900">{deviation.user_society?.id || '—'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Created By</span>
                        <span className="font-medium text-gray-900">{deviation.user.email}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Created At</span>
                        <span className="font-medium text-gray-900">{formatDate(deviation.created_at)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Updated At</span>
                        <span className="font-medium text-gray-900">{formatDate(deviation.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="p-4 sm:p-6">
              <Card className="mb-6 border-none bg-transparent shadow-none">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="px-6 py-3 border-b border-gray-200"
                    style={{ backgroundColor: "#F6F4EE" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                        <Paperclip className="w-4 h-4" style={{ color: '#C72030' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Attachments ({deviation.attachments.length})
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {deviation.attachments.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {deviation.attachments.map((attachment, index) => (
                          <div
                            key={attachment.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-gray-300"
                          >
                            <div className="flex flex-col items-center text-center">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <p className="text-xs font-medium text-gray-900 truncate w-full mb-1">
                                {attachment.document_file_name}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">
                                {(attachment.document_file_size / 1024).toFixed(2)} KB
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs h-7"
                                onClick={() => window.open(attachment.document_file_name, '_blank')}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <Paperclip className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Attachments
                        </h3>
                        <p className="text-gray-500">
                          No attachments have been added to this deviation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="p-4 sm:p-6">
              <Card className="mb-6 border-none bg-transparent shadow-none">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="px-6 py-3 border-b border-gray-200"
                    style={{ backgroundColor: "#F6F4EE" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                        <MessageSquare className="w-4 h-4" style={{ color: '#C72030' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Comments ({deviation.comments.length + (deviation.comment ? 1 : 0)})
                      </h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Main deviation comment (admin/primary) */}
                    {deviation.comment && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-semibold text-orange-800">
                                Admin
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(deviation.updated_at)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-800">{deviation.comment}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Threaded comments */}
                    {deviation.comments.length > 0 ? (
                      <div className="space-y-4">
                        {deviation.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {comment.commentor?.full_name || comment.commentor?.email || 'User'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700">{comment.comment || comment.body}</p>
                                {/* Attachments for this comment */}
                                {Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-xs font-semibold text-gray-600 mb-1">Attachments:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {comment.attachments.map((att: any) => (
                                        <div key={att.id} className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1 bg-gray-50">
                                          <FileText className="w-4 h-4 text-blue-600" />
                                          <a
                                            href={att.document_url || att.document_file_name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-700 underline truncate max-w-[120px]"
                                          >
                                            {att.document_file_name}
                                          </a>
                                          <span className="text-xs text-gray-400 ml-1">{(att.document_file_size / 1024).toFixed(1)} KB</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !deviation.comment && (
                        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Comments
                          </h3>
                          <p className="text-gray-500">
                            No comments have been added to this deviation yet.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="p-4 sm:p-6">
              <Card className="mb-6 border-none bg-transparent shadow-none">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="px-6 py-3 border-b border-gray-200"
                    style={{ backgroundColor: "#F6F4EE" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                        <Clock className="w-4 h-4" style={{ color: '#C72030' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Logs ({logs.length})
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {logs.length > 0 ? (
                      <div className="space-y-4">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all duration-200"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {log.commentor?.full_name || log.commentor?.email || 'User'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(log.created_at)}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-700">{log.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Logs
                        </h3>
                        <p className="text-gray-500">
                          No logs have been added to this deviation yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={isEditStatusOpen} onOpenChange={setIsEditStatusOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Update the status and add comments for this violation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Status Dropdown */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comments */}
            <div className="grid gap-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Enter your comments here..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditStatusOpen(false)}
              disabled={isSubmittingStatus}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitStatusEdit}
              disabled={isSubmittingStatus}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {isSubmittingStatus ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Violation Dialog */}
      <Dialog open={isSendViolationOpen} onOpenChange={setIsSendViolationOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Violation</DialogTitle>
            <DialogDescription>
              Send a violation notice with message and attachments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Violation Message */}
            <div className="grid gap-2">
              <Label htmlFor="violation-message">Violation Message *</Label>
              <Textarea
                id="violation-message"
                placeholder="Enter violation details..."
                value={violationMessage}
                onChange={(e) => setViolationMessage(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="grid gap-2">
              <Label htmlFor="attachments">Attachments</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('attachments')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
              
              {/* Display selected files */}
              {attachmentFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-gray-600">Selected files:</p>
                  {attachmentFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border"
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendViolationOpen(false)}
              disabled={isSubmittingViolation}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitViolation}
              disabled={isSubmittingViolation}
              className="bg-[#00B8D9] text-white hover:bg-[#00B8D9]/90"
            >
              {isSubmittingViolation ? 'Sending...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViolationDetail;
