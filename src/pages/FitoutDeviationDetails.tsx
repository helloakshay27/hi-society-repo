import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft, Send, Upload, X, Pencil, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
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

interface Deviation {
  id: number;
  resource_id: number;
  resource_type: string;
  user_id: number;
  active: boolean;
  description: string;
  complaint_status_id: number | null;
  created_at: string;
  updated_at: string;
  snag_checklist_id: number | null;
  user_society_id: number | null;
  comment: string | null;
}

interface ApiResponse {
  success: boolean;
  society_flat_id: number;
  deviations: Deviation[];
  complaint_statuses: unknown[];
}

interface TableDeviation {
  id: number;
  resource_id: number;
  description: string;
  status: string;
  created_on: string;
  updated_on: string;
  comment: string;
  user_id: number;
  snag_checklist_id: number | null;
}

const FitoutDeviationDetails: React.FC = () => {
  const navigate = useNavigate();
  const { flat_id } = useParams<{ flat_id: string }>();
  const baseURL = API_CONFIG.BASE_URL;
  
  const [allDeviations, setAllDeviations] = useState<TableDeviation[]>([]);
  const [flatDetails, setFlatDetails] = useState<{ societyFlatId: number | null }>({ societyFlatId: null });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Edit Status Dialog State
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [selectedEditDeviationId, setSelectedEditDeviationId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState(''); // will store status id as string
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
  const [selectedDeviationId, setSelectedDeviationId] = useState<number | null>(null);
  const [violationMessage, setViolationMessage] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isSubmittingViolation, setIsSubmittingViolation] = useState(false);

  const fetchDeviationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(
        `${baseURL}/crm/admin/deviation_details/flat_deviations.json`,
        {
          params: {
            society_flat_id: flat_id,
          },
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.success) {
        toast.error('Failed to fetch deviation details');
        navigate('/fitout/deviations');
        return;
      }

      // Set flat details
      setFlatDetails({
        societyFlatId: response.data.society_flat_id,
      });

      // Transform the deviations data
      const transformedData: TableDeviation[] = response.data.deviations.map((deviation) => ({
        id: deviation.id,
        resource_id: deviation.resource_id,
        description: deviation.description,
        status: deviation.complaint_status_id 
          ? 'Resolved' 
          : deviation.active 
          ? 'Active' 
          : 'Inactive',
        created_on: deviation.created_at,
        updated_on: deviation.updated_at,
        comment: deviation.comment || 'No comment',
        user_id: deviation.user_id,
        snag_checklist_id: deviation.snag_checklist_id,
      }));

      setAllDeviations(transformedData);
      setTotalPages(Math.ceil(transformedData.length / itemsPerPage));
    } catch (err) {
      toast.error('Failed to fetch deviation details.');
      console.error('Error fetching deviation details:', err);
    } finally {
      setLoading(false);
    }
  }, [baseURL, flat_id, navigate, itemsPerPage]);

  useEffect(() => {
    fetchDeviationDetails();
  }, [fetchDeviationDetails]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredDeviations = useMemo(() => {
    let filtered = allDeviations;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = allDeviations.filter((item) =>
        item.description?.toLowerCase().includes(searchLower) ||
        item.status?.toLowerCase().includes(searchLower) ||
        item.comment?.toLowerCase().includes(searchLower) ||
        item.resource_id?.toString().includes(searchLower)
      );
    }
    
    // Update total pages based on filtered results
    const pages = Math.ceil(filtered.length / itemsPerPage);
    if (pages !== totalPages) {
      setTotalPages(pages);
    }
    
    // Apply pagination only when not searching
    if (!searchTerm) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    }
    
    return filtered;
  }, [allDeviations, searchTerm, currentPage, itemsPerPage, totalPages]);

  const handleBack = () => {
    navigate('/fitout/deviations');
  };

  const handleViewDeviation = (id: number) => {
    navigate(`/fitout/deviation-detail/${id}`);
  };

  const handleEditStatus = (item: TableDeviation) => {
    setSelectedEditDeviationId(item.id);
    // Try to find the status id by name
    const found = statusOptions.find(opt => opt.name === item.status);
    setSelectedStatus(found ? String(found.id) : '');
    setStatusComment(item.comment || '');
    setIsEditStatusOpen(true);
  };

  const handleSubmitStatusEdit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    if (!selectedEditDeviationId) {
      toast.error('No deviation selected');
      return;
    }
    setIsSubmittingStatus(true);
    try {
      await axios.put(
        `${baseURL}/crm/fitout_requests/update_deviation_status.json?id=${selectedEditDeviationId}`,
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
      setSelectedStatus('');
      setStatusComment('');
      setSelectedEditDeviationId(null);
      fetchDeviationDetails();
    } catch (err) {
      toast.error('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleSendDeviation = (id: number) => {
    setSelectedDeviationId(id);
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

  const handleSubmitViolation = async () => {
    if (!violationMessage.trim()) {
      toast.error('Please enter a violation message');
      return;
    }

    if (!selectedDeviationId) {
      toast.error('No deviation selected');
      return;
    }

    setIsSubmittingViolation(true);
    try {
      const formData = new FormData();
      formData.append('comment', violationMessage);
      
      attachmentFiles.forEach((file) => {
        formData.append('attachments[]', file);
      });

      await axios.put(
        `${baseURL}/crm/admin/deviation_details/${selectedDeviationId}/send_notice.json`,
        formData,
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      toast.success('Violation sent successfully');
      setIsSendViolationOpen(false);
      setViolationMessage('');
      setAttachmentFiles([]);
      setSelectedDeviationId(null);
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
    { key: 'actions', label: 'Actions', sortable: false },
    { key: 'id', label: 'ID', sortable: true },
    { key: 'resource_id', label: 'Resource ID', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_on', label: 'Created On', sortable: true },
    { key: 'updated_on', label: 'Updated On', sortable: true },
    { key: 'comment', label: 'Comment', sortable: false },
    { key: 'user_id', label: 'User ID', sortable: true },
    { key: 'snag_checklist_id', label: 'Checklist ID', sortable: true },
    { key: 'send_violation', label: 'Send Violation', sortable: false },
  ];

  const renderCell = (item: TableDeviation, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleViewDeviation(item.id)} title="View">
              <Eye className="w-4 h-4 text-gray-700" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEditStatus(item)} title="Edit Status">
              <Pencil className="w-4 h-4 text-orange-600" />
            </Button>
          </div>
        );
      case 'id':
        return item.id;
      case 'resource_id':
        return item.resource_id;
      case 'description':
        return <span className="max-w-xs truncate" title={item.description}>{item.description}</span>;
      case 'status':
        return (
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'Resolved' 
                ? 'bg-green-100 text-green-800' 
                : item.status === 'Active'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.status}
          </span>
        );
      case 'created_on':
        return formatDate(item.created_on);
      case 'updated_on':
        return formatDate(item.updated_on);
      case 'comment':
        return <span className="max-w-xs truncate" title={item.comment}>{item.comment}</span>;
      case 'user_id':
        return item.user_id;
      case 'snag_checklist_id':
        return item.snag_checklist_id ?? '-';
      case 'send_violation':
        return (
          <Button 
            onClick={() => handleSendDeviation(item.id)}
            className="bg-[#00B8D9] text-white hover:bg-[#00B8D9]/90 h-8 px-3 text-xs font-medium"
          >
            Send Violation
          </Button>
        );
      default:
        return item[columnKey as keyof TableDeviation] as React.ReactNode ?? '-';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Fit Out Rounder Checklist</h1>
          <div className="mt-1 flex gap-4 text-sm text-gray-600">
            <span><strong>Society Flat ID:</strong> {flatDetails.societyFlatId || flat_id}</span>
            <span><strong>Total Deviations:</strong> {allDeviations.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <EnhancedTable
          data={filteredDeviations}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="fitout-deviation-details"
          storageKey="fitout-deviation-details-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search deviations..."
          loading={loading}
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-3 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {/* Page 1 */}
                <PaginationItem>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(1); }}
                    isActive={currentPage === 1}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                
                {/* Page 2 */}
                {totalPages >= 2 && (
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(2); }}
                      isActive={currentPage === 2}
                    >
                      2
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Ellipsis before current page range */}
                {currentPage > 3 && (
                  <PaginationItem>
                    <span className="px-3 py-2">...</span>
                  </PaginationItem>
                )}
                
                {/* Current page if > 2 and not last page */}
                {currentPage > 2 && currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage); }}
                      isActive={true}
                    >
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                {/* Ellipsis after current page */}
                {currentPage < totalPages - 1 && totalPages > 3 && (
                  <PaginationItem>
                    <span className="px-3 py-2">...</span>
                  </PaginationItem>
                )}
                
                {/* Last page */}
                {totalPages > 2 && (
                  <PaginationItem>
                    <PaginationLink 
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Edit Status Dialog */}
      <Dialog open={isEditStatusOpen} onOpenChange={setIsEditStatusOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>
              Update the status and add comments for this deviation.
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

export default FitoutDeviationDetails;
