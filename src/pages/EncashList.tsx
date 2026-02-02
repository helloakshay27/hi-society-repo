import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import SelectBox from '../components/ui/select-box';
// import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { getAuthHeader } from '@/config/apiConfig';

interface EncashRequest {
  id: number;
  person_name: string;
  points_to_encash: number;
  facilitation_fee: number;
  amount_payable: number;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  created_at: string;
  status: string;
  transaction_mode: string;
  transaction_number: string;
}

const EncashList = () => {
  const [encashRequests, setEncashRequests] = useState<EncashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EncashRequest | null>(null);
  const [transactionMode, setTransactionMode] = useState('');
  const [transactionNumber, setTransactionNumber] = useState('');

  const transactionModeOptions = [
    { label: "Select Mode", value: "" },
    { label: "UPI", value: "UPI" },
    { label: "NEFT", value: "NEFT" },
    { label: "RTGS", value: "RTGS" },
    { label: "IMPS", value: "IMPS" },
  ];

  const fetchEncashRequests = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      // const response = await fetch(getFullUrl('/encash_requests.json?is_admin=true'), {
      const response = await fetch('https://runwal-api.lockated.com/encash_requests.json?is_admin=true&token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ', {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch encash requests: ${response.statusText}`);
      }

      const data = await response.json();
      const requestsData = Array.isArray(data) ? data : [];

      // Client-side search filtering
      let filteredRequests = requestsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredRequests = requestsData.filter((request: EncashRequest) =>
          request.person_name?.toLowerCase().includes(searchLower) ||
          request.account_number?.toLowerCase().includes(searchLower) ||
          request.status?.toLowerCase().includes(searchLower) ||
          request.ifsc_code?.toLowerCase().includes(searchLower) ||
          request.branch_name?.toLowerCase().includes(searchLower)
        );
      }

      // Client-side pagination
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

      setEncashRequests(paginatedRequests);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredRequests.length / itemsPerPage));
      setTotalCount(filteredRequests.length);
    } catch (error) {
      toast.error('Failed to fetch encash requests');
      console.error('Error fetching encash requests:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchEncashRequests(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchEncashRequests]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    if (status === "completed") {
      const request = encashRequests.find((req) => req.id === id);
      setSelectedRequest(request || null);
      setShowModal(true);
    }
  };

  const handleCompleteRequest = async () => {
    if (!selectedRequest || !transactionMode || !transactionNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // const response = await fetch(getFullUrl(`/encash_requests/${selectedRequest.id}.json`), {
      const response = await fetch(`https://runwal-api.lockated.com/encash_requests/${selectedRequest.id}.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encash_request: {
            status: "completed",
            transaction_mode: transactionMode,
            transaction_number: transactionNumber,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update request: ${response.statusText}`);
      }

      setShowModal(false);
      setTransactionMode("");
      setTransactionNumber("");
      setSelectedRequest(null);

      await fetchEncashRequests(currentPage, searchTerm);
      toast.success("Request completed successfully!");
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Failed to update request");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'person_name', label: 'Person Name', sortable: true },
    { key: 'points_to_encash', label: 'Points', sortable: true },
    { key: 'facilitation_fee', label: 'Fee', sortable: true },
    { key: 'amount_payable', label: 'Amount', sortable: true },
    { key: 'account_number', label: 'Account Number', sortable: true },
    { key: 'ifsc_code', label: 'IFSC Code', sortable: true },
    { key: 'branch_name', label: 'Branch', sortable: true },
    { key: 'created_at', label: 'Created At', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'transaction', label: 'Transaction', sortable: false },
  ];

  const renderCell = (item: EncashRequest, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return <span className="font-medium">{item.id}</span>;
      case 'person_name':
        return item.person_name || '-';
      case 'points_to_encash':
        return <span className="text-right">{item.points_to_encash?.toLocaleString() || '0'}</span>;
      case 'facilitation_fee':
        return <span className="text-right">{formatCurrency(item.facilitation_fee)}</span>;
      case 'amount_payable':
        return <span className="text-right font-semibold">{formatCurrency(item.amount_payable)}</span>;
      case 'account_number':
        return item.account_number || '-';
      case 'ifsc_code':
        return item.ifsc_code || '-';
      case 'branch_name':
        return item.branch_name || '-';
      case 'created_at':
        return <span className="text-sm">{formatDate(item.created_at)}</span>;
      case 'status':
        return (
          <select
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border outline-none transition-colors ${
              item.status === "completed"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-yellow-100 text-yellow-800 border-yellow-300"
            }`}
            value={item.status}
            onChange={(e) => handleStatusChange(item.id, e.target.value)}
          >
            <option value="requested">Requested</option>
            <option value="completed">Completed</option>
          </select>
        );
      case 'transaction':
        if (item.transaction_mode && item.transaction_number) {
          return (
            <div className="text-sm">
              <div className="font-medium">{item.transaction_mode}</div>
              <div className="text-gray-500">{item.transaction_number}</div>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      default:
        return item[columnKey as keyof EncashRequest] as React.ReactNode ?? '-';
    }
  };

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={encashRequests}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="encash-requests"
        storageKey="encash-requests-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search encash requests (name, account, status, IFSC, branch)..."
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching encash requests..." : "Loading encash requests..."}
      />
      {!searchTerm && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
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
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      {renderListTab()}

      {/* Complete Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Complete Encash Request</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {selectedRequest && (
                <div>
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Request Details:</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Person:</span>
                        <span className="ml-2 font-medium">{selectedRequest.person_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Points:</span>
                        <span className="ml-2 font-medium">{selectedRequest.points_to_encash?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount Payable:</span>
                        <span className="ml-2 font-medium text-[#c72030]">{formatCurrency(selectedRequest.amount_payable)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Account:</span>
                        <span className="ml-2 font-medium">{selectedRequest.account_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Transaction Mode
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <SelectBox
                        label=""
                        options={transactionModeOptions}
                        defaultValue={transactionMode}
                        onChange={(value) => setTransactionMode(value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Transaction Number
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c72030] focus:border-transparent outline-none transition-all"
                        value={transactionNumber}
                        onChange={(e) => setTransactionNumber(e.target.value)}
                        placeholder="Enter transaction number"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteRequest}
                className="px-6 py-2 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors font-medium"
              >
                Complete Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncashList;
