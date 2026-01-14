import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { apiClient } from "@/utils/apiClient";

interface AnnexureItem {
  id: number;
  annexure: string;
  status: string;
  amount: number;
  attachments: number;
  comments: string;
}

interface TransactionItem {
  reference_number: string;
  payment_status: string;
  amount_paid: number;
  payment_method: string;
  payment_mode: string;
  paid_on: string;
  notes: string;
  attachment: string;
}

interface ViolationItem {
  id: number;
  description: string;
  status: string;
  created_at: string;
  comments: string;
}

const FitoutRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);

  useEffect(() => {
    const fetchFitoutRequestDetails = async () => {
      if (!id) {
        toast.error("Fitout request ID is missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get(`/crm/admin/fitout_requests/${id}.json`);
        console.log("Fitout Request Details:", response.data);
        
        setRequestData(response.data);
      } catch (error) {
        console.error("Error fetching fitout request details:", error);
        toast.error("Failed to load fitout request details");
      } finally {
        setLoading(false);
      }
    };

    fetchFitoutRequestDetails();
  }, [id]);

  const handleBack = () => {
    navigate("/fitout/requests");
  };

  const handleEdit = () => {
    navigate(`/fitout/requests/edit/${id}`);
  };

  const handleCapturePayment = () => {
    toast.info("Capture Payment - Coming soon");
  };

  const handleLogs = () => {
    toast.info("Logs - Coming soon");
  };

  const handleChecklist = () => {
    toast.info("Checklist - Coming soon");
  };

  // Annexure Columns
  const annexureColumns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "annexure", label: "Annexure", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "amount", label: "Amount", sortable: true },
    { key: "attachments", label: "Attachments", sortable: false },
    { key: "attachments_count", label: "Attachments Count", sortable: false },
    { key: "comments", label: "Comments", sortable: false },
  ];

  const renderAnnexureCell = (item: AnnexureItem, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="text-blue-600">✎</span>
            </Button>
          </div>
        );
      case "status":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {item.status}
          </span>
        );
      case "amount":
        return <span>{item.amount ? item.amount.toFixed(1) : '0.0'}</span>;
      case "attachments_count":
        return <span>{item.attachments}</span>;
      default:
        return <span>{item[columnKey as keyof AnnexureItem]}</span>;
    }
  };

  // Transaction Columns
  const transactionColumns = [
    { key: "reference_number", label: "Reference Number", sortable: false },
    { key: "payment_status", label: "Payment Status", sortable: false },
    { key: "amount_paid", label: "Amount Paid", sortable: false },
    { key: "payment_method", label: "Payment Method", sortable: false },
    { key: "payment_mode", label: "Payment Mode", sortable: false },
    { key: "paid_on", label: "Paid On", sortable: false },
    { key: "notes", label: "Notes", sortable: false },
    { key: "attachment", label: "Attachment", sortable: false },
  ];

  const renderTransactionCell = (item: TransactionItem, columnKey: string) => {
    return <span>{item[columnKey as keyof TransactionItem] || "-"}</span>;
  };

  // Violation Columns
  const violationColumns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "description", label: "Description", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "created_at", label: "Created At", sortable: true },
    { key: "comments", label: "Comments", sortable: false },
  ];

  const renderViolationCell = (item: ViolationItem, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="text-blue-600">👁</span>
          </Button>
        </div>
      );
    }
    return <span>{item[columnKey as keyof ViolationItem] || "-"}</span>;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fitout request details...</p>
        </div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Toaster position="top-right" richColors closeButton />
        <div className="text-center py-8">
          <p className="text-gray-600">Fitout request not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen" style={{ backgroundColor: "#FAF9F7" }}>
      <Toaster position="top-right" richColors closeButton />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Fitout Requests
        </button>
        <div className="flex gap-2">
          <Button
            onClick={handleCapturePayment}
            className="bg-green-600 text-white hover:bg-green-700 h-9 px-4 text-sm"
          >
            Capture Payment
          </Button>
          <Button
            onClick={handleEdit}
            className="bg-orange-500 text-white hover:bg-orange-600 h-9 px-4 text-sm"
          >
            Edit
          </Button>
          <Button
            onClick={handleLogs}
            className="bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 text-sm"
          >
            Logs
          </Button>
          <Button
            onClick={handleChecklist}
            className="bg-purple-600 text-white hover:bg-purple-700 h-9 px-4 text-sm"
          >
            Checklist
          </Button>
        </div>
      </div>

      {/* Fitout Detail Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div
          className="px-6 py-3 border-b border-gray-200"
          style={{ backgroundColor: "#F6F4EE" }}
        >
          <h2 className="text-lg font-semibold text-gray-900">Fitout Detail</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="bg-gray-50 px-3 py-2 rounded-md border">
                <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-red-500 text-white">
                  {requestData.status}
                </span>
              </div>
            </div>

            {/* ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.id}
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs">
                  i
                </span>
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.total_amount ? requestData.total_amount.toFixed(1) : '0.0'}
              </div>
            </div>

            {/* Tower */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tower
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.tower}
              </div>
            </div>

            {/* Flat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flat
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.flat}
              </div>
            </div>

            {/* Created on */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created on
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.created_on}
              </div>
            </div>

            {/* Created by */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created by
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.created_by}
              </div>
            </div>

            {/* Requested date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested date
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border">
                {requestData.requested_date}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-md border min-h-[42px]">
                {requestData.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annexure Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div
          className="px-6 py-3 border-b border-gray-200"
          style={{ backgroundColor: "#F6F4EE" }}
        >
          <h2 className="text-base font-semibold text-gray-900">ANNEXURE DETAILS</h2>
        </div>
        <div className="p-6">
          <EnhancedTable
            data={requestData.annexures || []}
            columns={annexureColumns}
            renderCell={renderAnnexureCell}
            pagination={false}
            enableExport={false}
            storageKey="fitout-annexures-table"
            enableGlobalSearch={true}
            searchPlaceholder="Search..."
          />
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div
          className="px-6 py-3 border-b border-gray-200"
          style={{ backgroundColor: "#F6F4EE" }}
        >
          <h2 className="text-base font-semibold text-gray-900">TRANSACTION DETAILS</h2>
        </div>
        <div className="p-6">
          <EnhancedTable
            data={requestData.transactions || []}
            columns={transactionColumns}
            renderCell={renderTransactionCell}
            pagination={false}
            enableExport={false}
            storageKey="fitout-transactions-table"
            enableGlobalSearch={false}
          />
        </div>
      </div>

      {/* Violations */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div
          className="px-6 py-3 border-b border-gray-200"
          style={{ backgroundColor: "#F6F4EE" }}
        >
          <h2 className="text-base font-semibold text-gray-900">VIOLATIONS</h2>
        </div>
        <div className="p-6">
          {(!requestData.violations || requestData.violations.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              No Matching Records Found
            </div>
          ) : (
            <EnhancedTable
              data={requestData.violations}
              columns={violationColumns}
              renderCell={renderViolationCell}
              pagination={false}
              enableExport={false}
              storageKey="fitout-violations-table"
              enableGlobalSearch={true}
              searchPlaceholder="Search..."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FitoutRequestDetails;
