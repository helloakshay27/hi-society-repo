import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { API_CONFIG, getAuthHeader } from '@/config/apiConfig';
import axios from 'axios';

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
  commentor: {
    id: number;
    email: string;
  };
}

interface Deviation {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
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
  fitout_request: {
    id: number;
  };
  attachments: Attachment[];
  comments: Comment[];
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
  
  const [deviation, setDeviation] = useState<Deviation | null>(null);
  const [violationDetails, setViolationDetails] = useState<ViolationTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fetchViolationDetail = useCallback(async (search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}/crm/admin/deviation_details.json`, {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      const deviationDetails = response.data.deviation_details || [];
      
      // Find the specific deviation
      let foundDeviation: Deviation | null = null;
      for (const detail of deviationDetails) {
        const dev = detail.deviations.find((d: Deviation) => d.id.toString() === deviation_id);
        if (dev) {
          foundDeviation = dev;
          break;
        }
      }

      if (!foundDeviation) {
        toast.error('Violation detail not found');
        navigate(-1);
        return;
      }

      setDeviation(foundDeviation);

      // Create violation details table - one row showing the main violation
      const violationRow: ViolationTableRow = {
        violation: `ID Card Notice`, // You can customize this based on fitout_request or other data
        attachments: foundDeviation.attachments.length,
        created_at: foundDeviation.created_at,
        created_by: foundDeviation.user.email,
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
    toast.info('Edit Status - Coming soon');
  };

  const handleSendViolation = () => {
    toast.info('Send Violation - Coming soon');
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={handleEditStatus}
            className="bg-orange-500 text-white hover:bg-orange-600 h-9 px-4 text-sm font-medium"
          >
            Edit Status
          </Button>
          <Button 
            onClick={handleSendViolation}
            className="bg-[#00B8D9] text-white hover:bg-[#00B8D9]/90 h-9 px-4 text-sm font-medium"
          >
            Send Violation
          </Button>
        </div>
      </div>

      {/* Main Violation Detail Card */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Violation Detail
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Violation Basic Information */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-md border">
                  <span 
                    className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                      deviation.status === 'Complied' 
                        ? 'bg-green-500 text-white' 
                        : deviation.status === 'Pending'
                        ? 'bg-yellow-500 text-white'
                        : deviation.status === 'Work In Progress'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {deviation.status}
                  </span>
                </div>
              </div>

              {/* ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                  {deviation.id}
                </div>
              </div>

              {/* Tower */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tower
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                  {deviation.user_society?.society_flat?.block_no || 'A'}
                </div>
              </div>

              {/* Flat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                  {deviation.user_society?.society_flat?.flat_no || '101'}
                </div>
              </div>

              {/* Created on */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created on
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                  {formatDate(deviation.created_at)}
                </div>
              </div>

              {/* Created by */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created by
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                  {deviation.user.email}
                </div>
              </div>

              {/* Comments */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border min-h-[42px]">
                  {deviation.comments.length > 0 
                    ? deviation.comments.map(c => c.body).join(', ')
                    : 'Not Available'
                  }
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                  ID Cards
                </div>
              </div>
            </div>
          </div>

          {/* Violation Details Section */}
          <div>
            <div className="mb-4 pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Violation Details
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Detailed information about this violation
              </p>
            </div>
            
            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-base font-semibold text-gray-900">
                  VIOLATION DETAILS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <EnhancedTable
                  data={violationDetails}
                  columns={columns}
                  renderCell={renderCell}
                  pagination={false}
                  enableExport={false}
                  storageKey="violation-details-table"
                  enableGlobalSearch={true}
                  onGlobalSearch={handleGlobalSearch}
                  searchPlaceholder="Search..."
                  leftActions={<div />}
                  loading={isSearching || loading}
                  loadingMessage={isSearching ? "Searching..." : "Loading..."}
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViolationDetail;
