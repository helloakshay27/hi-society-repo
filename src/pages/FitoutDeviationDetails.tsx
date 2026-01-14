import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import axios from 'axios';

interface Deviation {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
  user: {
    id: number;
    email: string;
  };
  fitout_request: {
    id: number;
  };
  attachments: any[];
  comments: any[];
}

interface DeviationDetail {
  flat_id: number | null;
  society_flat?: {
    id: number;
    flat_no: string;
    block_no: string | null;
  };
  deviations: Deviation[];
}

interface TableDeviation {
  id: number;
  fitout_request_id: number;
  description: string;
  status: string;
  created_on: string;
  created_by: string;
  comments: string;
  attachments: number;
  send_violation: string;
}

const FitoutDeviationDetails: React.FC = () => {
  const navigate = useNavigate();
  const { flat_id } = useParams<{ flat_id: string }>();
  const baseURL = API_CONFIG.BASE_URL;
  
  const [deviations, setDeviations] = useState<TableDeviation[]>([]);
  const [flatDetails, setFlatDetails] = useState<{ tower: string; flat: string }>({ tower: '', flat: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchDeviationDetails = useCallback(async (search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/crm/admin/deviation_details.json`, {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      const deviationDetails: DeviationDetail[] = response.data.deviation_details || [];
      
      // Find the specific flat's deviations
      const flatDetail = deviationDetails.find(
        (detail) => detail.flat_id?.toString() === flat_id
      );

      if (!flatDetail) {
        toast.error('Fitout deviation details not found');
        navigate('/maintenance/fitout-deviations');
        return;
      }

      // Set flat details
      setFlatDetails({
        tower: flatDetail.society_flat?.block_no || '-',
        flat: flatDetail.society_flat?.flat_no || '-',
      });

      // Get unique fitout requests with their deviations
      const fitoutRequestMap = new Map<number, Deviation[]>();
      
      flatDetail.deviations.forEach((deviation) => {
        const requestId = deviation.fitout_request.id;
        if (!fitoutRequestMap.has(requestId)) {
          fitoutRequestMap.set(requestId, []);
        }
        fitoutRequestMap.get(requestId)?.push(deviation);
      });

      // Transform to table format - one row per fitout request
      const transformedData: TableDeviation[] = Array.from(fitoutRequestMap.entries()).map(
        ([requestId, deviationList]) => {
          // Get the first deviation for main info
          const firstDeviation = deviationList[0];
          
          // Get most recent status
          const sortedByDate = [...deviationList].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateB - dateA;
          });
          
          const mostRecentStatus = sortedByDate[0].status;
          
          // Count total attachments and comments
          const totalAttachments = deviationList.reduce((sum, d) => sum + d.attachments.length, 0);
          const totalComments = deviationList.reduce((sum, d) => sum + d.comments.length, 0);

          return {
            id: firstDeviation.id,
            fitout_request_id: requestId,
            description: `Fitout Request #${requestId}`,
            status: mostRecentStatus,
            created_on: firstDeviation.created_at,
            created_by: firstDeviation.user.email,
            comments: totalComments > 0 ? `${totalComments} comment(s)` : 'Not Available',
            attachments: totalAttachments,
            send_violation: 'Send Violation',
          };
        }
      );

      // Client-side search filtering
      let filteredData = transformedData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = transformedData.filter((item) =>
          item.description?.toLowerCase().includes(searchLower) ||
          item.status?.toLowerCase().includes(searchLower) ||
          item.created_by?.toLowerCase().includes(searchLower)
        );
      }

      setDeviations(filteredData);
    } catch (err) {
      toast.error('Failed to fetch deviation details.');
      console.error('Error fetching deviation details:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, flat_id, navigate]);

  useEffect(() => {
    fetchDeviationDetails(searchTerm);
  }, [searchTerm, fetchDeviationDetails]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleBack = () => {
    navigate('/maintenance/fitout-deviations');
  };

  const handleViewDeviation = (id: number) => {
    navigate(`/maintenance/fitout-deviation-detail/${id}`);
  };

  const handleSendViolation = (id: number) => {
    toast.info(`Send Violation for deviation #${id} - Coming soon`);
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
    { key: 'fitout_request_id', label: 'Fitout Request ID', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_on', label: 'Created On', sortable: true },
    { key: 'created_by', label: 'Created By', sortable: true },
    { key: 'comments', label: 'Comments', sortable: false },
    { key: 'attachments', label: 'Attachments', sortable: false },
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
          </div>
        );
      case 'id':
        return item.id;
      case 'fitout_request_id':
        return item.fitout_request_id;
      case 'description':
        return item.description;
      case 'status':
        return (
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.status === 'Complied' 
                ? 'bg-green-100 text-green-800' 
                : item.status === 'Pending'
                ? 'bg-yellow-100 text-yellow-800'
                : item.status === 'Work In Progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {item.status}
          </span>
        );
      case 'created_on':
        return formatDate(item.created_on);
      case 'created_by':
        return item.created_by;
      case 'comments':
        return item.comments;
      case 'attachments':
        return item.attachments > 0 ? item.attachments : '-';
      case 'send_violation':
        return (
          <Button 
            onClick={() => handleSendViolation(item.id)}
            className="bg-[#00B8D9] text-white hover:bg-[#00B8D9]/90 h-8 px-3 text-xs font-medium"
          >
            Send Violation
          </Button>
        );
      default:
        return item[columnKey as keyof TableDeviation] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      <Button 
        onClick={handleBack}
        variant="outline"
        className="h-9 px-4 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <Button 
        onClick={() => {}}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        Export
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fit Out Rounder Checklist</h1>
        <div className="mt-2 flex gap-4 text-sm text-gray-600">
          <span><strong>Tower:</strong> {flatDetails.tower}</span>
          <span><strong>Flat:</strong> {flatDetails.flat}</span>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <EnhancedTable
          data={deviations}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="fitout-deviation-details"
          storageKey="fitout-deviation-details-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search deviations..."
          leftActions={renderCustomActions()}
          loading={isSearching || loading}
          loadingMessage={isSearching ? "Searching..." : "Loading deviations..."}
        />
      </div>
    </div>
  );
};

export default FitoutDeviationDetails;
