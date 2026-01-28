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
  Download,
  X,
  Plus,
  Logs,
  MessageSquare,
  Upload,
  FileQuestion,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { apiClient } from "@/utils/apiClient";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Feed } from "@mui/icons-material";
import { getAuthHeader } from "@/config/apiConfig";

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
  complaint_status_id?: number | null;
  complaint_status_name?: string;
  status?: string;
  status_color?: string;
  comments?: Array<{
    id: number;
    body: string;
    commentor_id: number;
    commentor_name: string;
    created_at: string;
    updated_at: string;
  }>;
  snag_quest_maps: SnagQuestionMap[];
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
  snag_quest_maps?: SnagQuestionMap[];
  comments?: Array<{
    id: number;
    body: string;
    commentor_id: number;
    commentor_name: string;
    created_at: string;
    updated_at: string;
  }>;
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
  deviation_details?: DeviationDetail[];
}

interface ChecklistQuestion {
  id: number;
  question: string;
  qtype: string;
  quest_mandatory: boolean;
  response: string | null;
  comments: string;
  attachment: File | null;
  options?: Array<{
    id: number;
    qname: string;
    option_type: string;
  }>;
}

interface PaymentFormData {
  amount: string;
  payment_mode: string;
  cheque_transaction_number: string;
  notes: string;
  image: File | null;
}

interface DeviationAttachment {
  id: number;
  document_file_name: string;
  document_content_type: string;
  document_file_size: number;
  created_at: string;
  document_url: string;
}

interface DeviationDetail {
  id: number;
  complaint_status_id: number | null;
  description: string;
  snag_checklist_id: number;
  user_society_id: number;
  comments: any[];
  user_id: number;
  created_at: string;
  status: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    mobile: string | null;
  };
  complaint_status_name: string | null;
  attachments: DeviationAttachment[];
}

interface DeviationStatus {
  id: number;
  society_id: number;
  name: string;
  color_code: string;
  fixed_state: string;
  active: number;
  created_at: string;
  updated_at: string;
  position: number;
  of_phase: string | null;
  of_atype: string;
  email: boolean;
}

const FitoutRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<FitoutRequestDetail | null>(null);
  const [activeTab, setActiveTab] = useState("request-information");
  const [responses, setResponses] = useState<FitoutResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: '',
    payment_mode: '',
    cheque_transaction_number: '',
    notes: '',
    image: null,
  });
  const [paymentImagePreview, setPaymentImagePreview] = useState<string | null>(null);
  
  // Checklist Modal State
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklistQuestions, setChecklistQuestions] = useState<ChecklistQuestion[]>([]);
  const [checklistRemarks, setChecklistRemarks] = useState('');
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  
  // Annexure responses state
  const [annexureResponses, setAnnexureResponses] = useState<FitoutResponse[]>([]);
  const [categoryStatuses, setCategoryStatuses] = useState<{ [key: number]: number | null }>({});
  const [statuses, setStatuses] = useState<any[]>([]);

  const [annexureResponsesEditMode, setAnnexureResponsesEditMode] = useState(false);
  const [editedAnnexureAnswers, setEditedAnnexureAnswers] = useState<
    Record<number, { ans_descr?: string; quest_option_id?: number | null }>
  >({});

  const [editedAnnexureFilesByMapId, setEditedAnnexureFilesByMapId] = useState<Record<number, File[]>>({});
  const [editedAnnexureSignaturesByMapId, setEditedAnnexureSignaturesByMapId] = useState<Record<number, string>>({});

  const [annexureSaveLoading, setAnnexureSaveLoading] = useState(false);
  
  // Logs Modal State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Deviation Modal State
  const [deviationModalOpen, setDeviationModalOpen] = useState(false);
  const [selectedDeviation, setSelectedDeviation] = useState<DeviationDetail | null>(null);
  const [deviationStatuses, setDeviationStatuses] = useState<DeviationStatus[]>([]);
  const [deviationStatusId, setDeviationStatusId] = useState<string>('');
  const [deviationComment, setDeviationComment] = useState('');
  const [deviationLoading, setDeviationLoading] = useState(false);

  // Annexure Status Change Modal State
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FitoutRequestCategory | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [statusComment, setStatusComment] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // File Upload Modal State
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = useState<FitoutRequestCategory | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFitoutRequestDetails(parseInt(id));
      fetchStatuses();
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === "responses") {
      fetchFitoutResponses(parseInt(id));
    }
  }, [id, activeTab]);

  const fetchStatuses = async () => {
    try {
      const statusesResponse = await apiClient.get('/fitout_categories/get_complaint_statuses.json?q[of_atype_eq]=fitout_category');
      const statusesArray = statusesResponse.data?.complaint_statuses || [];
      console.log('Statuses Array:', statusesArray);
      setStatuses(statusesArray);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const fetchDeviationStatuses = async () => {
    try {
      const response = await apiClient.get('/fitout_categories/get_complaint_statuses.json?q[of_atype_eq]=deviation_details');
      const statusesArray = response.data?.complaint_statuses || [];
      console.log('Deviation Statuses:', statusesArray);
      setDeviationStatuses(statusesArray);
    } catch (error) {
      console.error('Error fetching deviation statuses:', error);
    }
  };

  const fetchLogs = async () => {
    if (!id) return;
    
    setLogsLoading(true);
    try {
      const response = await apiClient.get(`/crm/admin/fitout_requests/${id}/feeds.json`);
      console.log('Logs Response:', response.data);
      setLogs(response.data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error(`Failed to load logs: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogsOpen = () => {
    setLogsModalOpen(true);
    fetchLogs();
  };

  const SignatureCanvas: React.FC<{
    mapId: number;
    value?: string;
    onChange: (dataUrl: string) => void;
  }> = ({ mapId, value, onChange }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.offsetWidth;
      canvas.height = 200;

      if (value) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = value;
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, [value]);

    const startDrawing = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (
      e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
      const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (!canvas) return;
      onChange(canvas.toDataURL('image/png'));
    };

    const clearSignature = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      onChange('');
    };

    return (
      <div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full border-2 border-gray-300 rounded cursor-crosshair bg-white"
          style={{ touchAction: 'none' }}
        />
        <Button
          type="button"
          onClick={clearSignature}
          variant="outline"
          size="sm"
          className="mt-2 border-gray-300 hover:bg-gray-50"
        >
          Clear Signature
        </Button>
      </div>
    );
  };

  const handleAnnexureResponsesEditButtonClick = async () => {
    if (!annexureResponsesEditMode) {
      setEditedAnnexureAnswers({});
      setEditedAnnexureFilesByMapId({});
      setEditedAnnexureSignaturesByMapId({});
      setAnnexureResponsesEditMode(true);
      return;
    }

    try {
      setAnnexureSaveLoading(true);

      const questMapById = new Map<number, SnagQuestionMap>();
      annexureResponses.forEach((categoryResponse) => {
        (categoryResponse.snag_quest_maps || []).forEach((questMap) => {
          questMapById.set(questMap.id, questMap);
        });
      });

      const editedMapIds = new Set<number>([
        ...Object.keys(editedAnnexureAnswers).map((k) => Number(k)),
        ...Object.keys(editedAnnexureFilesByMapId).map((k) => Number(k)),
        ...Object.keys(editedAnnexureSignaturesByMapId).map((k) => Number(k)),
      ]);

      if (editedMapIds.size === 0) {
        toast.error('No changes to save', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
        setAnnexureResponsesEditMode(false);
        setEditedAnnexureAnswers({});
        setEditedAnnexureFilesByMapId({});
        setEditedAnnexureSignaturesByMapId({});
        return;
      }

      const formData = new FormData();

      const signatureFilesByMapId: Record<number, File> = {};
      for (const [mapIdStr, dataUrl] of Object.entries(editedAnnexureSignaturesByMapId)) {
        const mapIdNum = Number(mapIdStr);
        if (!dataUrl) continue;
        const blob = await fetch(dataUrl).then((r) => r.blob());
        signatureFilesByMapId[mapIdNum] = new File([blob], `signature_${mapIdStr}_${Date.now()}.png`, {
          type: 'image/png',
        });
      }

      editedMapIds.forEach((mapIdNum) => {
        const questMap = questMapById.get(mapIdNum);
        if (!questMap) return;
        const question = questMap.snag_question;
        const existingAnswer = Array.isArray(questMap.snag_answers) && questMap.snag_answers.length > 0
          ? questMap.snag_answers[questMap.snag_answers.length - 1]
          : undefined;

        const edited = editedAnnexureAnswers[mapIdNum];
        const qKeyBase = `snag_answers[${mapIdNum}]`;

        formData.append(`${qKeyBase}[snag_quest_map_id]`, String(mapIdNum));
        formData.append(`${qKeyBase}[snag_question_id]`, String(question.id));

        if (question.qtype === 'multiple') {
          if (edited && Object.prototype.hasOwnProperty.call(edited, 'quest_option_id')) {
            formData.append(
              `${qKeyBase}[snag_quest_option_id]`,
              edited.quest_option_id ? String(edited.quest_option_id) : ''
            );
            formData.append(`${qKeyBase}[ans_descr]`, (edited.ans_descr ?? '').toString());
          } else if (existingAnswer?.quest_option_id) {
            formData.append(`${qKeyBase}[snag_quest_option_id]`, String(existingAnswer.quest_option_id));
            formData.append(`${qKeyBase}[ans_descr]`, (existingAnswer.ans_descr ?? '').toString());
          } else {
            formData.append(`${qKeyBase}[snag_quest_option_id]`, '');
            formData.append(`${qKeyBase}[ans_descr]`, (edited?.ans_descr ?? '').toString());
          }
        } else if (question.qtype === 'file') {
          formData.append(`${qKeyBase}[snag_quest_option_id]`, '');
          formData.append(`${qKeyBase}[ans_descr]`, '');
          const files = editedAnnexureFilesByMapId[mapIdNum] || [];
          files.forEach((f) => formData.append(`${qKeyBase}[docs][]`, f));
        } else if (question.qtype === 'signature') {
          formData.append(`${qKeyBase}[snag_quest_option_id]`, '');
          formData.append(`${qKeyBase}[ans_descr]`, '');
          const signatureFile = signatureFilesByMapId[mapIdNum];
          if (signatureFile) {
            formData.append(`${qKeyBase}[docs][]`, signatureFile);
          }
        } else {
          formData.append(`${qKeyBase}[ans_descr]`, (edited?.ans_descr ?? '').toString());
        }
      });

      await apiClient.post('/fitout_requests/create_feedback', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      toast.success('Responses updated successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });

      setAnnexureResponsesEditMode(false);
      setEditedAnnexureAnswers({});
      setEditedAnnexureFilesByMapId({});
      setEditedAnnexureSignaturesByMapId({});

      if (id) {
        fetchFitoutRequestDetails(parseInt(id));
      }
    } catch (error: any) {
      console.error('Error updating responses:', error);
      toast.error(`Failed to update responses: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } finally {
      setAnnexureSaveLoading(false);
    }
  };

  const handleDeviationEdit = async (deviation: DeviationDetail) => {
    setSelectedDeviation(deviation);
    setDeviationStatusId(deviation.complaint_status_id?.toString() || '');
    setDeviationComment('');
    setDeviationModalOpen(true);
    if (deviationStatuses.length === 0) {
      await fetchDeviationStatuses();
    }
  };

  const handleStatusChangeOpen = (category: FitoutRequestCategory) => {
    setSelectedCategory(category);
    setSelectedStatusId(category.complaint_status_id?.toString() || '');
    setStatusComment('');
    setStatusChangeModalOpen(true);
  };

  const handleFileUploadOpen = (category: FitoutRequestCategory) => {
    setSelectedCategoryForUpload(category);
    setUploadFiles([]);
    setFileUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadFiles(prev => [...prev, ...fileArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUploadSubmit = async () => {
    if (!selectedCategoryForUpload) return;
    
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      
      uploadFiles.forEach((file, index) => {
        formData.append(`documents[]`, file);
      });

      await apiClient.post(
        `/crm/admin/fitout_requests/${id}/fitout_request_categories/${selectedCategoryForUpload.id}/upload_documents.json`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      toast.success('Files uploaded successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setFileUploadModalOpen(false);
      setSelectedCategoryForUpload(null);
      setUploadFiles([]);
      
      // Refresh the data
      if (id) {
        fetchFitoutRequestDetails(parseInt(id));
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(`Failed to upload files: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedCategory) return;
    
    if (!selectedStatusId) {
      toast.error('Please select a status', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      return;
    }

    try {
      setStatusLoading(true);
      const newStatusId = parseInt(selectedStatusId);
      const previousStatusId = categoryStatuses[selectedCategory.id];
      
      setCategoryStatuses(prev => ({ ...prev, [selectedCategory.id]: newStatusId }));
      
      const requestBody: any = {
        complaint_status_id: newStatusId,
      };
      
      if (statusComment.trim()) {
        requestBody.comment = {
          body: statusComment
        };
      } else {
        requestBody.comment = {
          body: `Status changed from ${selectedCategory.status_name || 'N/A'} to ${statuses.find(s => s.id === newStatusId)?.name || 'Unknown'}`
        };
      }
      
      await apiClient.put(`/fitout_request_categories/${selectedCategory.id}/change_status.json`, requestBody);
      
      toast.success('Status updated successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setStatusChangeModalOpen(false);
      setSelectedCategory(null);
      setSelectedStatusId('');
      setStatusComment('');
      
      // Refresh the data
      if (id) {
        fetchFitoutRequestDetails(parseInt(id));
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      // Revert to previous status on error
      if (selectedCategory) {
        setCategoryStatuses(prev => ({ ...prev, [selectedCategory.id]: categoryStatuses[selectedCategory.id] }));
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeviationUpdate = async () => {
    if (!selectedDeviation) return;
    
    // if (!deviationStatusId) {
    //   toast.error('Please select a status');
    //   return;
    // }

    try {
      setDeviationLoading(true);
      
      const formData = new FormData();
      formData.append('complaint_status_id', deviationStatusId);
      if (deviationComment) {
        formData.append('comment', deviationComment);
      }

      await apiClient.put(
        `/crm/fitout_requests/update_deviation_status.json?id=${selectedDeviation.id}`,
        formData
      );

      toast.success('Deviation updated successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setDeviationModalOpen(false);
      setSelectedDeviation(null);
      setDeviationStatusId('');
      setDeviationComment('');
      
      // Refresh the data
      if (id) {
        fetchFitoutRequestDetails(parseInt(id));
      }
    } catch (error: any) {
      console.error('Error updating deviation:', error);
      toast.error(`Failed to update deviation: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } finally {
      setDeviationLoading(false);
    }
  };

  const fetchFitoutRequestDetails = async (requestId: number) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/crm/admin/fitout_requests/${requestId}.json`);
      console.log("Fitout Request Details:", response.data);
      console.log("Categories with comments:", response.data.fitout_request_categories?.map((cat: any) => ({
        id: cat.id,
        name: cat.category_name,
        commentsCount: cat.comments?.length || 0,
        comments: cat.comments
      })));
      setRequestData(response.data);
      
      // Fetch responses for annexures tab
      const responsesResponse = await apiClient.get(`/crm/admin/fitout_requests/${requestId}/fitout_responses.json`);
      setAnnexureResponses(responsesResponse.data || []);
      
      // Initialize category statuses
      const statuses: { [key: number]: number | null } = {};
      response.data.fitout_request_categories?.forEach((cat: FitoutRequestCategory) => {
        statuses[cat.id] = cat.complaint_status_id;
      });
      setCategoryStatuses(statuses);
    } catch (error: any) {
      console.error("Error fetching fitout request details:", error);
      toast.error(`Failed to load fitout request details: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
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
    toast.info("Delete functionality - Coming soon", {
      position: 'top-right',
      duration: 3000,
      style: {
        background: '#fff',
        color: 'black',
        border: 'none',
      },
    });
  };

  const handleCapturePayment = () => {
    const totalAmount = requestData?.fitout_request_categories.reduce((sum, cat) => sum + (cat.amount || 0), 0) || 0;
    
    setPaymentFormData({
      amount: totalAmount.toString(),
      payment_mode: '',
      cheque_transaction_number: '',
      notes: '',
      image: null,
    });
    setPaymentImagePreview(null);
    setPaymentModalOpen(true);
  };

  const handlePaymentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
        return;
      }
      setPaymentFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentFormData.payment_mode) {
      toast.error('Please select a payment mode', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      return;
    }
    
    if (!paymentFormData.amount) {
      toast.error('Please enter amount', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      return;
    }
    
    try {
      const formData = new FormData();
      
      formData.append('lock_payment[payment_status]', 'full');
      formData.append('lock_payment[total_amount]', paymentFormData.amount);
      formData.append('lock_payment[paid_amount]', paymentFormData.amount);
      formData.append('lock_payment[payment_method]', paymentFormData.payment_mode);
      formData.append('lock_payment[pg_transaction_id]', paymentFormData.cheque_transaction_number);
      formData.append('lock_payment[notes]', paymentFormData.notes);
      
      if (paymentFormData.image) {
        formData.append('image', paymentFormData.image);
      }

      await apiClient.post(`/crm/admin/fitout_requests/${id}/payment.json`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Payment captured successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setPaymentModalOpen(false);
      fetchFitoutRequestDetails(parseInt(id!));
    } catch (error: any) {
      console.error('Error capturing payment:', error);
      toast.error(`Failed to capture payment: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    }
  };

  const handleChecklistOpen = async () => {
    setChecklistModalOpen(true);
    setChecklistLoading(true);
    
    try {
      const response = await apiClient.get('/crm/admin/snag_checklists.json?q[check_type_eq]=Fitout');
      const checklistsData = response.data?.data || [];
      
      // Use the first checklist if available
      if (checklistsData.length > 0) {
        const firstChecklist = checklistsData[0];
        setSelectedChecklistId(firstChecklist.id);
        
        // Extract questions from the first checklist
        const allQuestions: ChecklistQuestion[] = [];
        
        if (firstChecklist.questions && Array.isArray(firstChecklist.questions)) {
          firstChecklist.questions.forEach((question: any) => {
            allQuestions.push({
              id: question.id,
              question: `${firstChecklist.name} - ${question.descr}`,
              qtype: question.qtype,
              quest_mandatory: question.quest_mandatory,
              response: null,
              comments: '',
              attachment: null,
              options: question.options || [],
            });
          });
        }
        
        setChecklistQuestions(allQuestions);
      } else {
        toast.error('No Fitout checklists available', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
        setChecklistQuestions([]);
      }
    } catch (error: any) {
      console.error('Error fetching checklist:', error);
      toast.error('Failed to load checklist questions', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setChecklistQuestions([]);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleChecklistQuestionChange = (index: number, field: keyof ChecklistQuestion, value: any) => {
    setChecklistQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddQuestion = () => {
    const newQuestion: ChecklistQuestion = {
      id: Date.now(),
      question: '',
      response: null,
      comments: '',
      attachment: null,
    };
    setChecklistQuestions(prev => [...prev, newQuestion]);
  };

  const handleChecklistSubmit = async () => {
    // Validate mandatory fields
    for (let i = 0; i < checklistQuestions.length; i++) {
      const question = checklistQuestions[i];
      if (question.quest_mandatory && !question.response) {
        toast.error(`Please answer question ${i + 1} (mandatory)`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
        return;
      }
      // if (!question.comments) {
      //   toast.error(`Please add comments for question ${i + 1}`);
      //   return;
      // }
      // if (!question.attachment) {
      //   toast.error(`Please upload attachment for question ${i + 1}`);
      //   return;
      // }
    }

    if (!selectedChecklistId) {
      toast.error('No checklist selected', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      return;
    }

    try {
      const formData = new FormData();
      
      // Add required top-level parameters
      formData.append('id', id || '');
      formData.append('snag_checklist_id', selectedChecklistId.toString());
      formData.append('comment', checklistRemarks);
      
      // Add questions with dynamic structure: question[index][field]
      checklistQuestions.forEach((question, index) => {
        formData.append(`question[${index}][name]`, question.question);
        
        // For multiple choice questions, get the option text instead of ID
        let answerText = question.response || '';
        if (question.qtype === 'multiple' && question.response && question.options) {
          const selectedOption = question.options.find(opt => opt.id.toString() === question.response);
          answerText = selectedOption?.qname || question.response;
        }
        
        formData.append(`question[${index}][answer]`, answerText);
        formData.append(`question[${index}][comment]`, question.comments);
        
        // Add attachment(s) - API expects attachments[] array
        if (question.attachment) {
          formData.append(`question[${index}][attachments][]`, question.attachment);
        }
      });

      await apiClient.post(`/fitout_requests/${id}/checklist_submission.json`, formData, {
                  // headers: {
                  //   'Authorization': getAuthHeader(),
                  //   'Content-Type': 'application/json',
                  // },
      });
      
      toast.success('Checklist submitted successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      setChecklistModalOpen(false);
      setChecklistRemarks('');
      setChecklistQuestions([]);
      setSelectedChecklistId(null);
    } catch (error: any) {
      console.error('Error submitting checklist:', error);
      toast.error(`Failed to submit checklist: ${error.response?.data?.message || error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    }
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
      toast.success('Document downloaded successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    }
  };

  // Transform responses into tabular format for EnhancedTable
  const getTabularResponseData = (): TabularResponseData[] => {
    const tabularData: TabularResponseData[] = [];
    
    // Add null/undefined checks
    if (!responses || !Array.isArray(responses)) {
      return tabularData;
    }
    
    responses.forEach((categoryResponse) => {
      // Check if snag_quest_maps exists and is an array
      if (!categoryResponse?.snag_quest_maps || !Array.isArray(categoryResponse.snag_quest_maps)) {
        // Even if no questions, show the annexure name
        tabularData.push({
          id: `${categoryResponse.id}-empty`,
          annexure_name: categoryResponse.name || 'Unknown',
          question_number: 0,
          question: '-',
          question_type: '—',
          answer: '—',
          answered_at: '—',
          is_mandatory: 'No',
          has_attachments: 'No',
        });
        return;
      }
      
      // If snag_quest_maps is empty array, still show the annexure
      if (categoryResponse.snag_quest_maps.length === 0) {
        tabularData.push({
          id: `${categoryResponse.id}-empty`,
          annexure_name: categoryResponse.name || 'Unknown',
          question_number: 0,
          question: '-',
          question_type: '—',
          answer: '—',
          answered_at: '—',
          is_mandatory: 'No',
          has_attachments: 'No',
        });
        return;
      }
      
      categoryResponse.snag_quest_maps.forEach((questionMap) => {
        // Check if snag_question exists
        if (!questionMap?.snag_question) {
          return;
        }
        
        const question = questionMap.snag_question;
        
        // Determine question type display
        const questionTypeDisplay = 
          question.qtype === 'multiple' ? 'Multiple Choice' :
          question.qtype === 'text' ? 'Text' :
          question.qtype === 'description' ? 'Description' :
          question.qtype === 'date' ? 'Date' :
          question.qtype || 'Unknown';
        
        // Get answer text
        let answerText = '—';
        let answeredAt = '—';
        
        if (questionMap.snag_answers && questionMap.snag_answers.length > 0) {
          const firstAnswer = questionMap.snag_answers[0];
          answeredAt = formatDateTime(firstAnswer.created_at);
          
          if (question.qtype === 'multiple' && firstAnswer.quest_option_id) {
            const selectedOption = question.snag_quest_options?.find(
              opt => opt.id === firstAnswer.quest_option_id
            );
            answerText = selectedOption?.qname || 'Selected';
          } else {
            answerText = firstAnswer.ans_descr || '—';
          }
        }
        
        tabularData.push({
          id: `${categoryResponse.id}-${questionMap.id}`,
          annexure_name: categoryResponse.name || 'Unknown',
          question_number: question.qnumber || 0,
          question: question.descr || 'No question text',
          question_type: questionTypeDisplay,
          answer: answerText,
          answered_at: answeredAt,
          is_mandatory: question.quest_mandatory ? 'Yes' : 'No',
          has_attachments: questionMap.snag_answers?.some(ans => ans.docs && ans.docs.length > 0) ? 'Yes' : 'No',
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

  const totalAmount = requestData.fitout_request_categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
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
              style={{
                backgroundColor: statuses.find(s => s.id === requestData.status_id)?.color_code || '#C72030',
                color: 'white'
              }}
            >
              {requestData.status_name || 'Pending'}
            </Badge>
          </div>

          <div className="flex gap-2">
            {!requestData.lock_payment && (
              <Button
                onClick={handleCapturePayment}
                size="sm"
                style={{ backgroundColor: '#C72030', color: 'white' }}
                className="hover:opacity-90"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Capture Payment
              </Button>
            )}
           
            <Button
              onClick={handleEdit}
              // variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
              <Button
              onClick={handleLogsOpen}
              size="sm"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Logs className="w-4 h-4 mr-2" />
              Logs
            </Button>
             <Button
              onClick={handleChecklistOpen}
              size="sm"
              style={{ backgroundColor: '#C72030', color: 'white' }}
              className="hover:opacity-90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Checklist
            </Button>

            {/* <Button
              onClick={handleDelete}
              variant="outline"
              size="sm"
              style={{ borderColor: "#C72030", color: "#C72030" }}
              className="hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button> */}
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
                { label: "Deviations", value: "deviations" },
                // { label: "Transactions", value: "transactions" },
                { label: "Captured Payment", value: "responses" },
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
                        ₹{(totalAmount || 0).toFixed(2)}
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
                        <span className="text-gray-600 text-xs mb-1">Fitout Type</span>
                        <span className="font-medium text-gray-900">{requestData.fitout_type || 'Pending'}</span>
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
                        <span className="text-gray-600 text-xs mb-1">Description</span>
                        <span className="font-medium text-gray-900">{requestData.description || '—'}</span>
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
                        <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Amount</span>
                        <span className="font-medium text-gray-900">{requestData.amount || '—'}</span>
                      </div>
                       <div className="flex flex-col">
                        <span className="text-gray-600 text-xs mb-1">Convenience Charge</span>
                        <span className="font-medium text-gray-900">{requestData.convenience_charge || '—'}</span>
                      </div>
                        <div className="flex flex-col">
                      <span className="text-gray-600 text-xs mb-1">Deposit</span>
                        <span className="font-medium text-gray-900">{requestData.deposit || '—'}</span>
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
                            ₹{((totalAmount || 0) + (requestData.lock_payment.convenience_charge || 0)).toFixed(2)}
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
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E5E0D3' }}>
                          <FileText className="w-4 h-4" style={{ color: '#C72030' }} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Annexures ({requestData.fitout_request_categories.length})
                        </h3>
                      </div>

                      <Button
                        onClick={handleAnnexureResponsesEditButtonClick}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-gray-300 hover:bg-gray-50"
                        disabled={annexureSaveLoading}
                      >
                        {annexureSaveLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Edit className="w-3 h-3 mr-1" />
                        )}
                        {annexureResponsesEditMode ? 'Done' : 'Edit Responses'}
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    {requestData.fitout_request_categories.length > 0 ? (
                      <div className="space-y-6">
                        {annexureResponses.map((categoryResponse, index) => {
                          // Find matching category from requestData
                          const category = requestData.fitout_request_categories.find(
                            (cat) => cat.category_name === categoryResponse.name
                          );

                          // Get comments and check if has file-type questions
                          const comments = categoryResponse.comments || [];
                          const hasFileQuestions = categoryResponse.snag_quest_maps?.some(
                            (qm) => qm.snag_question.qtype === 'file'
                          );
                          
                          return (
                            <div
                              key={categoryResponse.id}
                              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300"
                            >
                              {/* Category Header */}
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-[#C72030] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {categoryResponse.name}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <p className="text-lg font-bold text-gray-900 mr-2">
                                      ₹{(category?.amount || 0).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 ml-11">
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: categoryResponse.status_color || '#C72030',
                                      color: 'white',
                                      borderColor: categoryResponse.status_color || '#C72030'
                                    }}
                                  >
                                    {categoryResponse.status || categoryResponse.complaint_status_name || 'Pending'}
                                  </Badge>
                                  <Button
                                    onClick={() => category && handleStatusChangeOpen(category)}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-gray-300 hover:bg-gray-50"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Change Status
                                  </Button>
                                  {hasFileQuestions && (
                                    <Button
                                      onClick={() => category && handleFileUploadOpen(category)}
                                      size="sm"
                                      style={{ backgroundColor: '#C72030', color: 'white' }}
                                      className="h-7 text-xs hover:opacity-90"
                                    >
                                      <Upload className="w-3 h-3 mr-1" />
                                      Upload
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Category Content */}
                              <div className=" space-y-4">
                                {/* Comments Section */}
                                {comments && Array.isArray(comments) && comments.length > 0 && (
                                  <div className="bg-[#f6f4ee] rounded-lg p-4">
                                    <div className="flex items-start gap-2 mb-3">
                                      <MessageSquare className="w-4 h-4 text-[#C72030] mt-0.5 flex-shrink-0" />
                                      <h5 className="font-semibold text-gray-900 text-sm">Comments ({comments.length})</h5>
                                    </div>
                                    <div className="space-y-3">
                                      {comments.map((comment: any) => (
                                        <div key={comment.id} className="bg-white rounded-lg p-3 border border-blue-100">
                                          <div className="flex items-start gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#C72030] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                              {comment.commentor_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-sm font-medium text-gray-900">{comment.commentor_name}</p>
                                                <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(comment.created_at)}</p>
                                              </div>
                                              <p className="text-sm text-gray-700">{comment.body}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Questions and Responses Section */}
                              {categoryResponse?.snag_quest_maps && categoryResponse.snag_quest_maps.length > 0 && (
                                <div className="pt-4 border-t border-gray-200">
                                  <div className="flex items-center gap-2 mb-4 ml-4">
                                    <div className="w-8 h-8 rounded-full bg-[#C72030] bg-opacity-10 flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-[#C72030]" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      Questions & Responses
                                    </p>
                                    <Badge variant="outline" className="text-xs bg-gray-50">
                                      {categoryResponse.snag_quest_maps.length} Questions
                                    </Badge>
                                  </div>
                                  <div className="space-y-3">
                                    {categoryResponse.snag_quest_maps.map((questMap, qIndex) => {
                                      const question = questMap.snag_question;
                                      const allAnswers = Array.isArray(questMap.snag_answers)
                                        ? [...questMap.snag_answers]
                                        : [];
                                      const sortedAnswers = allAnswers.sort(
                                        (a, b) =>
                                          new Date(a.created_at).getTime() -
                                          new Date(b.created_at).getTime()
                                      );
                                      const latestAnswer =
                                        sortedAnswers.length > 0
                                          ? sortedAnswers[sortedAnswers.length - 1]
                                          : undefined;

                                      const edited = editedAnnexureAnswers[questMap.id];
                                      const currentAnsDescr = edited?.ans_descr ?? latestAnswer?.ans_descr ?? '';
                                      const currentOptionId =
                                        edited?.quest_option_id ?? latestAnswer?.quest_option_id ?? null;
                                      
                                      let answerDisplay = 'No response';
                                      if (latestAnswer) {
                                        if (question.qtype === 'multiple' && latestAnswer.quest_option_id) {
                                          const selectedOption = question.snag_quest_options?.find(
                                            opt => opt.id === latestAnswer.quest_option_id
                                          );
                                          answerDisplay = selectedOption?.qname || 'Selected';
                                        } else {
                                          answerDisplay = latestAnswer.ans_descr || 'No response';
                                        }
                                      }
                                      
                                      return (
                                        <div
                                          key={questMap.id}
                                          className="bg-white rounded-lg p-4 border border-gray-200"
                                        >
                                          <div className="space-y-3">
                                            {/* Question */}
                                            <div className="flex items-start gap-3">
                                              <div className="w-6 h-6 rounded-full bg-[#C72030] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {question.qnumber}
                                              </div>
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">
                                                  {question.descr}
                                                </p>
                                              </div>
                                            </div>
                                            
                                            {/* Answer */}
                                            <div className="ml-9 space-y-2">
                                              <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                                                {annexureResponsesEditMode ? (
                                                  question.qtype === 'multiple' ? (
                                                    <Select
                                                      value={currentOptionId ? String(currentOptionId) : ''}
                                                      onValueChange={(val) => {
                                                        const selectedId = val ? Number(val) : null;
                                                        const selectedOption = question.snag_quest_options?.find(
                                                          (opt) => opt.id === selectedId
                                                        );
                                                        setEditedAnnexureAnswers((prev) => ({
                                                          ...prev,
                                                          [questMap.id]: {
                                                            quest_option_id: selectedId,
                                                            ans_descr: selectedOption?.qname || '',
                                                          },
                                                        }));
                                                      }}
                                                    >
                                                      <SelectTrigger className="h-9 bg-white">
                                                        <SelectValue placeholder="Select" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {(question.snag_quest_options || []).map((opt) => (
                                                          <SelectItem key={opt.id} value={String(opt.id)}>
                                                            {opt.qname}
                                                          </SelectItem>
                                                        ))}
                                                      </SelectContent>
                                                    </Select>
                                                  ) : question.qtype === 'date' ? (
                                                    <Input
                                                      type="date"
                                                      value={currentAnsDescr}
                                                      onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditedAnnexureAnswers((prev) => ({
                                                          ...prev,
                                                          [questMap.id]: {
                                                            ...prev[questMap.id],
                                                            ans_descr: val,
                                                          },
                                                        }));
                                                      }}
                                                      className="h-9 bg-white"
                                                    />
                                                  ) : question.qtype === 'file' ? (
                                                    <div className="space-y-2">
                                                      <Input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => {
                                                          const files = e.target.files ? Array.from(e.target.files) : [];
                                                          setEditedAnnexureFilesByMapId((prev) => ({
                                                            ...prev,
                                                            [questMap.id]: files,
                                                          }));
                                                        }}
                                                        className="bg-white"
                                                      />
                                                      {editedAnnexureFilesByMapId[questMap.id] &&
                                                        editedAnnexureFilesByMapId[questMap.id].length > 0 && (
                                                          <p className="text-xs text-gray-600">
                                                            {editedAnnexureFilesByMapId[questMap.id].length} file(s) selected
                                                          </p>
                                                        )}
                                                    </div>
                                                  ) : question.qtype === 'signature' ? (
                                                    <div className="space-y-2">
                                                      <SignatureCanvas
                                                        mapId={questMap.id}
                                                        value={editedAnnexureSignaturesByMapId[questMap.id]}
                                                        onChange={(dataUrl) => {
                                                          setEditedAnnexureSignaturesByMapId((prev) => ({
                                                            ...prev,
                                                            [questMap.id]: dataUrl,
                                                          }));
                                                        }}
                                                      />
                                                    </div>
                                                  ) : (
                                                    <Input
                                                      value={currentAnsDescr}
                                                      onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditedAnnexureAnswers((prev) => ({
                                                          ...prev,
                                                          [questMap.id]: {
                                                            ...prev[questMap.id],
                                                            ans_descr: val,
                                                            quest_option_id: null,
                                                          },
                                                        }));
                                                      }}
                                                      className="h-9 bg-white"
                                                    />
                                                  )
                                                ) : (
                                                  <p className={`text-sm ${latestAnswer ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                                    {answerDisplay}
                                                  </p>
                                                )}
                                              </div>

                                              {sortedAnswers.length > 1 && (
                                                <div className="space-y-2">
                                                  <p className="text-xs font-medium text-gray-600">
                                                    Response History ({sortedAnswers.length})
                                                  </p>
                                                  <div className="space-y-2">
                                                    {sortedAnswers
                                                      .slice(0, -1)
                                                      .reverse()
                                                      .map((ans) => (
                                                        <div
                                                          key={ans.id}
                                                          className="bg-white rounded-md p-3 border border-gray-200"
                                                        >
                                                          <div className="flex items-center justify-between gap-2 mb-1">
                                                            <p className="text-xs text-gray-500">
                                                              {formatDateTime(ans.created_at)}
                                                            </p>
                                                            {ans.id && (
                                                              <p className="text-[10px] text-gray-400">#{ans.id}</p>
                                                            )}
                                                          </div>
                                                          <p className="text-sm text-gray-700">
                                                            {ans.ans_descr || '—'}
                                                          </p>
                                                        </div>
                                                      ))}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {/* Answer Documents */}
                                              {latestAnswer?.docs && latestAnswer.docs.length > 0 && (
                                                <div className="space-y-2">
                                                  <p className="text-xs font-medium text-gray-600">
                                                    Attachments ({latestAnswer.docs.length})
                                                  </p>
                                                  <div className="grid grid-cols-2 gap-2">
                                                    {latestAnswer.docs.map((doc: any, docIdx: number) => (
                                                      <div
                                                        key={doc.id}
                                                        className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all"
                                                      >
                                                        {doc.document_type?.startsWith('image/') ? (
                                                          <img
                                                            src={doc.document}
                                                            alt={`Attachment ${docIdx + 1}`}
                                                            className="w-full h-24 object-cover"
                                                            onError={(e) => {
                                                              const target = e.target as HTMLImageElement;
                                                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                                                            }}
                                                          />
                                                        ) : (
                                                          <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                                                            <Paperclip className="w-8 h-8 text-gray-400" />
                                                          </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                                          <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 h-auto"
                                                            onClick={() => window.open(doc.document, '_blank')}
                                                          >
                                                            <Download className="w-3 h-3 mr-1" />
                                                            View
                                                          </Button>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 text-center truncate">
                                                          {doc.document_type?.split('/')[1]?.toUpperCase() || 'File'}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

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
                          );
                        })}
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

            {/* Deviations */}
            <TabsContent value="deviations" className="p-4 sm:p-6">
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
                        Deviations ({requestData.deviation_details?.length || 0})
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    {requestData.deviation_details && requestData.deviation_details.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead style={{ backgroundColor: '#F6F4EE' }}>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Created At
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Comments
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {requestData.deviation_details.map((deviation) => (
                              <tr key={deviation.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Button
                                    onClick={() => handleDeviationEdit(deviation)}
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-300"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="max-w-md">
                                    <p className="text-sm text-gray-900">{deviation.description}</p>
                                    {deviation.attachments && deviation.attachments.length > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        {/* <Paperclip className="w-3 h-3 text-gray-400" /> */}
                                        {/* <span className="text-xs text-gray-500">
                                          {deviation.attachments.length} attachment(s)
                                        </span> */}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {deviation.complaint_status_name ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      style={{ borderColor: '#C72030', color: '#C72030' }}
                                    >
                                      {deviation.complaint_status_name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      {deviation.status}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <p className="text-sm text-gray-900">{formatDateTime(deviation.created_at)}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-sm text-gray-900">
                                    {deviation.comments && deviation.comments.length > 0
                                      ? `${deviation.comments.length} comment(s)`
                                      : 'No comments'}
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Deviations Found
                        </h3>
                        <p className="text-gray-500">
                          No deviation details have been recorded for this fitout request yet.
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
                      <DollarSign className="w-4 h-4" style={{ color: '#C72030' }} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Captured Payment</h3>
                  </div>
                </div>
                <div className="p-6">
                  {requestData.lock_payment ? (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow style={{ backgroundColor: '#F6F4EE' }}>
                              <TableHead className="font-semibold text-gray-900">Field</TableHead>
                              <TableHead className="font-semibold text-gray-900">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700">Payment ID</TableCell>
                              <TableCell className="text-gray-900">#{requestData.lock_payment.id}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700">Payment Status</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="default" 
                                  style={{ backgroundColor: requestData.lock_payment.payment_status === 'full' ? '#10b981' : '#f59e0b' }}
                                >
                                  {requestData.lock_payment.payment_status === 'full' ? 'Fully Paid' : 
                                   requestData.lock_payment.payment_status === 'partial' ? 'Partially Paid' : 
                                   requestData.lock_payment.payment_status || 'Pending'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700">Total Amount</TableCell>
                              <TableCell className="text-gray-900 font-semibold">₹{parseFloat(requestData.lock_payment.total_amount || '0').toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700">Payment Method</TableCell>
                              <TableCell className="text-gray-900 capitalize">{requestData.lock_payment.payment_method || '—'}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-gray-700">Transaction ID</TableCell>
                              <TableCell className="text-gray-900">{requestData.lock_payment.pg_transaction_id || '—'}</TableCell>
                            </TableRow>
                            {requestData.lock_payment.order_number && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Order Number</TableCell>
                                <TableCell className="text-gray-900">{requestData.lock_payment.order_number}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.payment_mode && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Payment Mode</TableCell>
                                <TableCell className="text-gray-900">{requestData.lock_payment.payment_mode}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.sub_total && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Sub Total</TableCell>
                                <TableCell className="text-gray-900">₹{parseFloat(requestData.lock_payment.sub_total || '0').toFixed(2)}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.gst && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">GST</TableCell>
                                <TableCell className="text-gray-900">₹{parseFloat(requestData.lock_payment.gst || '0').toFixed(2)}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.discount && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Discount</TableCell>
                                <TableCell className="text-gray-900">₹{parseFloat(requestData.lock_payment.discount || '0').toFixed(2)}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.convenience_charge && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Convenience Charge</TableCell>
                                <TableCell className="text-gray-900">₹{parseFloat(requestData.lock_payment.convenience_charge || '0').toFixed(2)}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.payment_gateway && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Payment Gateway</TableCell>
                                <TableCell className="text-gray-900">{requestData.lock_payment.payment_gateway}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.bank_name && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Bank Name</TableCell>
                                <TableCell className="text-gray-900">{requestData.lock_payment.bank_name}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.pg_response_code && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Response Code</TableCell>
                                <TableCell className="text-gray-900">{requestData.lock_payment.pg_response_code}</TableCell>
                              </TableRow>
                            )}
                            {requestData.lock_payment.pg_response_msg && (
                              <TableRow>
                                <TableCell className="font-medium text-gray-700">Response Message</TableCell>
                                <TableCell className="text-gray-900">{requestData.lock_payment.pg_response_msg}</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Payment Receipt/Attachment */}
                      {requestData.lock_payment.receipt_pdf && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div
                            className="px-4 py-3 border-b border-gray-200"
                            style={{ backgroundColor: "#F6F4EE" }}
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" style={{ color: '#C72030' }} />
                              <h4 className="text-sm font-semibold text-gray-900">Attachment</h4>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
                              <img
                                src={requestData.lock_payment.receipt_pdf}
                                alt="Payment Receipt"
                                className="w-full h-64 object-contain bg-gray-50"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EReceipt%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => window.open(requestData.lock_payment.receipt_pdf, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                {/* <Button
                                  size="sm"
                                  variant="secondary"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => downloadDocument(requestData.lock_payment.receipt_pdf, `payment-receipt-${requestData.lock_payment.id}.pdf`)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                      <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Payment Captured
                      </h3>
                      <p className="text-gray-500 mb-4">
                        No payment has been captured for this fitout request yet.
                      </p>
                      <Button
                        onClick={handleCapturePayment}
                        style={{ backgroundColor: '#C72030', color: 'white' }}
                        className="hover:opacity-90"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Capture Payment
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Capture Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b pb-4" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex items-center justify-between px-6 py-3">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Receive Payment
              </DialogTitle>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="payment-amount" className="text-sm font-medium text-gray-700">
                Amount *
              </Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentFormData.amount}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full"
                style={{ backgroundColor: '#F6F4EE' }}
                placeholder="Enter amount"
              />
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <Label htmlFor="payment-mode" className="text-sm font-medium text-gray-700">
                Payment Mode *
              </Label>
              <Select
                value={paymentFormData.payment_mode}
                onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, payment_mode: value }))}
              >
                <SelectTrigger className="w-full" style={{ backgroundColor: '#F6F4EE' }}>
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  {/* <SelectItem value="online">Online Transfer</SelectItem> */}
                  {/* <SelectItem value="upi">UPI</SelectItem> */}
                  {/* <SelectItem value="card">Card</SelectItem> */}
                </SelectContent>
              </Select>
            </div>

            {/* Cheque/Transaction Number */}
            <div className="space-y-2">
              <Label htmlFor="transaction-number" className="text-sm font-medium text-gray-700">
                Cheque/Transaction Number
              </Label>
              <Input
                id="transaction-number"
                type="text"
                value={paymentFormData.cheque_transaction_number}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, cheque_transaction_number: e.target.value }))}
                className="w-full"
                style={{ backgroundColor: '#F6F4EE' }}
                placeholder="Enter transaction number"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="payment-notes" className="text-sm font-medium text-gray-700">
                Notes
              </Label>
              <Textarea
                id="payment-notes"
                value={paymentFormData.notes}
                onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full min-h-[80px]"
                style={{ backgroundColor: '#F6F4EE' }}
                placeholder="Add payment notes..."
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="payment-image" className="text-sm font-medium text-gray-700">
                Image
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('payment-image-input')?.click()}
                  className="border-gray-300"
                >
                  Choose file
                </Button>
                <span className="text-sm text-gray-500">
                  {paymentFormData.image ? paymentFormData.image.name : 'No file chosen'}
                </span>
                <input
                  id="payment-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentImageChange}
                  className="hidden"
                />
              </div>
              {paymentImagePreview && (
                <div className="mt-2">
                  <img
                    src={paymentImagePreview}
                    alt="Payment preview"
                    className="w-32 h-32 object-cover rounded border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handlePaymentSubmit}
                style={{ backgroundColor: '#C72030', color: 'white' }}
                className="px-8 hover:opacity-90"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checklist Modal */}
      <Dialog open={checklistModalOpen} onOpenChange={setChecklistModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex items-center justify-between px-6 py-3">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Checklist
              </DialogTitle>
              <button
                onClick={() => setChecklistModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {checklistLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
                <span className="ml-2 text-gray-600">Loading checklist...</span>
              </div>
            ) : (
              <>
                {/* Questions */}
                <div className="space-y-6">
                  {checklistQuestions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4" style={{ backgroundColor: '#FAFAFA' }}>
                      {/* Question Number and Text */}
                      <div className="mb-3">
                        <Label className="text-sm font-semibold text-gray-900">
                          {index + 1}) {question.question || 'Question'}
                          {question.quest_mandatory && (
                            <span className="text-red-600 ml-1">*</span>
                          )}
                        </Label>
                        <span className="text-xs text-gray-500 ml-2">
                          ({question.qtype === 'multiple' ? 'Multiple Choice' : 
                            question.qtype === 'text' ? 'Text' : 
                            question.qtype === 'file' ? 'File Upload' : 
                            question.qtype === 'date' ? 'Date' : 
                            question.qtype})
                        </span>
                      </div>

                      {/* Response based on question type - Hide for file type */}
                      {question.qtype !== 'file' && (
                        <div className="mb-3">
                          <Label className="text-xs font-medium text-gray-700 mb-2 block">
                            Response{question.quest_mandatory ? ' *' : ''}:
                          </Label>
                          
                          {question.qtype === 'multiple' && question.options && question.options.length > 0 ? (
                            <RadioGroup
                              value={question.response || ''}
                              onValueChange={(value) => handleChecklistQuestionChange(index, 'response', value)}
                              className="flex flex-col gap-2"
                            >
                              {question.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option.id.toString()} id={`option-${question.id}-${option.id}`} />
                                  <Label htmlFor={`option-${question.id}-${option.id}`} className="text-sm font-normal cursor-pointer">
                                    {option.qname}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          ) : question.qtype === 'text' || question.qtype === 'description' ? (
                            <Textarea
                              value={question.response || ''}
                              onChange={(e) => handleChecklistQuestionChange(index, 'response', e.target.value)}
                              className="w-full min-h-[60px] text-sm"
                              style={{ backgroundColor: '#F6F4EE' }}
                              placeholder="Enter your response..."
                            />
                          ) : question.qtype === 'date' ? (
                            <Input
                              type="date"
                              value={question.response || ''}
                              onChange={(e) => handleChecklistQuestionChange(index, 'response', e.target.value)}
                              className="w-full"
                              style={{ backgroundColor: '#F6F4EE' }}
                            />
                          ) : (
                            <Input
                              type="text"
                              value={question.response || ''}
                              onChange={(e) => handleChecklistQuestionChange(index, 'response', e.target.value)}
                              className="w-full"
                              style={{ backgroundColor: '#F6F4EE' }}
                              placeholder="Enter your response..."
                            />
                          )}
                        </div>
                      )}

                      {/* Comments - Always Mandatory */}
                      <div className="mb-3">
                        <Label htmlFor={`comments-${question.id}`} className="text-xs font-medium text-gray-700 mb-1 block">
                          Comments 
                          {/* <span className="text-red-600">*</span> */}
                        </Label>
                        <Textarea
                          id={`comments-${question.id}`}
                          value={question.comments}
                          onChange={(e) => handleChecklistQuestionChange(index, 'comments', e.target.value)}
                          className="w-full min-h-[60px] text-sm"
                          style={{ backgroundColor: '#F6F4EE' }}
                          placeholder="Add your comments..."
                          required
                        />
                      </div>

                      {/* File Upload - Always Mandatory */}
                      <div className="mb-3">
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">
                          Attachment 
                          {/* <span className="text-red-600">*</span> */}
                        </Label>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`attachment-file-${question.id}`)?.click()}
                            className="border-gray-300 text-sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Choose File
                          </Button>
                          <span className="text-xs text-gray-500">
                            {question.attachment ? question.attachment.name : 'No file chosen'}
                          </span>
                          <input
                            id={`attachment-file-${question.id}`}
                            type="file"
                            accept="*/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleChecklistQuestionChange(index, 'attachment', file);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Question Button */}
                <div className="flex justify-center pt-2 pb-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newQuestion = {
                        id: Date.now(),
                        question: '',
                        qtype: 'text',
                        quest_mandatory: false,
                        response: null,
                        comments: '',
                        attachment: null,
                        options: []
                      };
                      setChecklistQuestions([...checklistQuestions, newQuestion]);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Question
                  </Button>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="checklist-remarks" className="text-sm font-medium text-gray-700">
                    Remarks
                  </Label>
                  <Textarea
                    id="checklist-remarks"
                    value={checklistRemarks}
                    onChange={(e) => setChecklistRemarks(e.target.value)}
                    className="w-full min-h-[80px]"
                    style={{ backgroundColor: '#F6F4EE' }}
                    placeholder="Add overall remarks..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleChecklistSubmit}
                    style={{ backgroundColor: '#C72030', color: 'white' }}
                    className="px-8 hover:opacity-90"
                  >
                    Submit
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex items-center justify-between px-6 py-3">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                LOGS
              </DialogTitle>
              <button
                onClick={() => setLogsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="p-6">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#C72030]" />
                <span className="ml-2 text-gray-600">Loading logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs available
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date Header */}
                {logs.map((logEntry, index) => {
                  const showDateHeader = index === 0 || 
                    (index > 0 && new Date(logEntry.created_at).toDateString() !== new Date(logs[index - 1].created_at).toDateString());
                  
                  return (
                    <React.Fragment key={logEntry.id || index}>
                      {showDateHeader && (
                        <div className="text-center py-2">
                          <span className="text-sm font-medium text-gray-600">
                            {new Date(logEntry.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Time */}
                          <div className="text-xs text-gray-500 mb-1">
                            {new Date(logEntry.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                          
                          {/* User and Action */}
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {logEntry.user_name || 'System'}
                            </span>
                            <span className="text-gray-700 ml-1">
                              {logEntry.action || logEntry.description || 'made changes'}
                            </span>
                          </div>
                          
                          {/* Category/Details */}
                          {logEntry.category && (
                            <div className="text-sm text-gray-600 mt-1">
                              {logEntry.category}
                            </div>
                          )}
                          
                          {/* Status */}
                          {logEntry.status && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-700">
                                Status - {logEntry.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deviation Edit Modal */}
      <Dialog open={deviationModalOpen} onOpenChange={setDeviationModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b pb-4" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex items-center justify-between px-6 py-3">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Edit Deviation
              </DialogTitle>
              <button
                onClick={() => setDeviationModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {selectedDeviation && (
              <>
                {/* Description (Read-only) */}
                {/* <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-900">{selectedDeviation.description}</p>
                  </div>
                </div> */}

                {/* Status Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="deviation-status" className="text-sm font-medium text-gray-700">
                    Status 
                  </Label>
                  <Select
                    value={deviationStatusId}
                    onValueChange={setDeviationStatusId}
                  >
                    <SelectTrigger className="w-full" style={{ backgroundColor: '#F6F4EE' }}>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviationStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: status.color_code }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor="deviation-comment" className="text-sm font-medium text-gray-700">
                    Comment
                  </Label>
                  <Textarea
                    id="deviation-comment"
                    value={deviationComment}
                    onChange={(e) => setDeviationComment(e.target.value)}
                    className="w-full min-h-[100px]"
                    style={{ backgroundColor: '#F6F4EE' }}
                    placeholder="Add your comment..."
                  />
                </div>

                {/* Attachments (Read-only) */}
                {selectedDeviation.attachments && selectedDeviation.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Attachments
                    </Label>
                    <div className="space-y-2">
                      {selectedDeviation.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {attachment.document_file_name}
                            </span>
                          </div>
                          <Button
                            onClick={() => window.open(attachment.document_url, '_blank')}
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleDeviationUpdate}
                    disabled={deviationLoading}
                    style={{ backgroundColor: '#C72030', color: 'white' }}
                    className="px-8 hover:opacity-90"
                  >
                    {deviationLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={statusChangeModalOpen} onOpenChange={setStatusChangeModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b pb-4" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex items-center justify-between px-6 py-3">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Change Annexure Status
              </DialogTitle>
              <button
                onClick={() => setStatusChangeModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {selectedCategory && (
              <>
                {/* Annexure Name (Read-only) */}
                {/* <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Annexure
                  </Label>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-900 font-medium">{selectedCategory.category_name}</p>
                  </div>
                </div> */}

                {/* Current Status (Read-only) */}
                {/* <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Current Status
                  </Label>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: '#C72030', color: '#C72030' }}
                    >
                      {selectedCategory.status_name || 'No Status'}
                    </Badge>
                  </div>
                </div> */}

                {/* Status Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="status-select" className="text-sm font-medium text-gray-700">
                    New Status *
                  </Label>
                  <Select
                    value={selectedStatusId}
                    onValueChange={setSelectedStatusId}
                  >
                    <SelectTrigger className="w-full" style={{ backgroundColor: '#F6F4EE' }}>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status: any) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor="status-comment" className="text-sm font-medium text-gray-700">
                    Comment (Optional)
                  </Label>
                  <Textarea
                    id="status-comment"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    className="w-full min-h-[100px]"
                    style={{ backgroundColor: '#F6F4EE' }}
                    placeholder="Add a comment about this status change..."
                  />
                  <p className="text-xs text-gray-500">
                    If no comment is provided, a default message will be added.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={statusLoading}
                    style={{ backgroundColor: '#C72030', color: 'white' }}
                    className="px-8 hover:opacity-90"
                  >
                    {statusLoading ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Modal */}
      <Dialog open={fileUploadModalOpen} onOpenChange={setFileUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="border-b pb-4" style={{ backgroundColor: '#F6F4EE' }}>
            <div className="flex items-center justify-between px-6 py-3">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Upload Files
              </DialogTitle>
              <button
                onClick={() => setFileUploadModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {selectedCategoryForUpload && (
              <>
             
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Annexure
                  </Label>
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-900 font-medium">{selectedCategoryForUpload.category_name}</p>
                  </div>
                </div>

           
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                    Select Files *
                  </Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('annexure-file-input')?.click()}
                      className="border-gray-300"
                    >
                      <Paperclip className="w-4 h-4 mr-2" />
                      Choose files
                    </Button>
                    <span className="text-sm text-gray-500">
                      {uploadFiles.length === 0 ? 'No files chosen' : `${uploadFiles.length} file(s) selected`}
                    </span>
                    <input
                      id="annexure-file-input"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

              
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Selected Files
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {uploadFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            onClick={() => handleRemoveFile(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleFileUploadSubmit}
                    disabled={uploadLoading || uploadFiles.length === 0}
                    style={{ backgroundColor: '#C72030', color: 'white' }}
                    className="px-8 hover:opacity-90"
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload Files'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FitoutRequestDetails;
