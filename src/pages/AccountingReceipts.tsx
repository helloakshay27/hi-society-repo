import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";
import { FileText, Plus } from "lucide-react";
import { CommonImportModal } from "@/components/CommonImportModal";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";

interface BillPaymentAPI {
  formatted_number?: string;
  payment_date?: string;
  ledger_name?: string;
}

interface LockPaymentAPI {
  id: number;
  receipt_number?: string;
  payment_number?: string;
  order_number?: string;
  neft_reference?: string;
  pg_transaction_id?: string;
  payment_mode?: string;
  payment_method?: string;
  paid_amount?: string | number;
  payment_amount?: string | number;
  total_amount?: string | number;
  resident_name?: string;
  flat_name?: string;
  unit_name?: string;
  ledger_name?: string;
  created_at?: string;
  bill_payments?: BillPaymentAPI[];
}

interface ReceiptRow {
  id: number;
  receiptNumber: string;
  invoiceNumber: string;
  flat: string;
  customerName: string;
  amountReceived: number;
  paymentMode: string;
  transactionNumber: string;
  paymentDate: string;
}

const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false },
  { key: "receiptNumber", label: "Receipt Number", sortable: true },
  { key: "invoiceNumber", label: "Invoice Number", sortable: true },
  { key: "flat", label: "Flat", sortable: true },
  { key: "customerName", label: "Customer Name", sortable: true },
  { key: "amountReceived", label: "Amount Received ₹", sortable: true },
  { key: "paymentMode", label: "Payment Mode", sortable: true },
  { key: "transactionNumber", label: "Transaction Number", sortable: true },
  { key: "paymentDate", label: "Payment Date", sortable: true },
];

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const toRow = (lp: LockPaymentAPI): ReceiptRow => ({
  id: lp.id,
  receiptNumber: lp.receipt_number || lp.payment_number || String(lp.id),
  invoiceNumber: lp.bill_payments?.[0]?.formatted_number || lp.order_number || "",
  flat: lp.flat_name || lp.unit_name || lp.ledger_name || lp.bill_payments?.[0]?.ledger_name || "",
  customerName: lp.resident_name || "",
  amountReceived:
    parseFloat(String(lp.paid_amount || lp.payment_amount || lp.total_amount || "0")) || 0,
  paymentMode: lp.payment_mode || lp.payment_method || "",
  transactionNumber: lp.neft_reference || lp.pg_transaction_id || lp.order_number || "",
  paymentDate: lp.bill_payments?.[0]?.payment_date || lp.created_at || "",
});

const AccountingReceipts: React.FC = () => {
  const [payments, setPayments] = useState<LockPaymentAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [previewRow, setPreviewRow] = useState<ReceiptRow | null>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const lockAccountId = localStorage.getItem("lock_account_id") || "3";

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const url = `${baseUrl}/lock_account_bills/receipts.json`;
      const response = await axios.get(url, {
        params: { lock_account_id: lockAccountId },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = response.data;
      setPayments(data?.receipts || data?.lock_payments || data?.data || data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast.error("Failed to fetch receipts");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [lockAccountId]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const rows = useMemo(() => payments.map(toRow), [payments]);

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }
    setIsImporting(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const formData = new FormData();
      formData.append("upl_file", importFile);
      await axios.post(
        `${baseUrl}/lock_account_bills/import_receipts`,
        formData,
        {
          params: { lock_account_id: lockAccountId },
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      toast.success("Receipts imported successfully");
      setIsImportOpen(false);
      setImportFile(null);
      fetchReceipts();
    } catch (error) {
      console.error("Error importing receipts:", error);
      toast.error("Failed to import receipts");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSample = async () => {
    setIsDownloadingSample(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/lock_account_bills/download_sample_receipts`, {
        params: { lock_account_id: lockAccountId },
        responseType: "blob",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const contentType = response.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "receipts-sample.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading sample file:", error);
      toast.error("Failed to download sample file");
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(
        `${baseUrl}/lock_account_bills/download_receipts_list.xlsx`,
        {
          params: { lock_account_id: lockAccountId },
          responseType: "blob",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "receipts-list.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting receipts:", error);
      toast.error("Failed to export receipts");
    }
  };

  const renderCell = (item: ReceiptRow, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <FileText
            className="h-4 w-4 cursor-pointer text-[#3b82c4] hover:text-[#C72030]"
            onClick={() => setPreviewRow(item)}
          />
        );
      case "receiptNumber":
        return item.receiptNumber;
      case "invoiceNumber":
        return item.invoiceNumber ? `#${item.invoiceNumber}` : "";
      case "flat":
        return item.flat;
      case "customerName":
        return item.customerName;
      case "amountReceived":
        return item.amountReceived.toFixed(1);
      case "paymentMode":
        return item.paymentMode;
      case "transactionNumber":
        return item.transactionNumber;
      case "paymentDate":
        return formatDate(item.paymentDate);
      default:
        return "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.id)}
        pagination
        pageSize={20}
        enableExport
        onExport={handleExportExcel}
        storageKey="accounting-receipts-table"
        leftActions={
          <Button
            onClick={() => setShowActionPanel(true)}
            variant="ghost"
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            <Plus className="mr-2 h-4 w-4" /> Action
          </Button>
        }
        loading={loading}
        loadingMessage="Loading receipts..."
        emptyMessage="No matching records found"
      />

      {showActionPanel && (
        <SelectionPanel
          className="selection-panel--end"
          onImport={() => {
            setShowActionPanel(false);
            setIsImportOpen(true);
          }}
          onClearSelection={() => setShowActionPanel(false)}
        />
      )}

      <CommonImportModal
        selectedFile={importFile}
        setSelectedFile={setImportFile}
        open={isImportOpen}
        onOpenChange={(open) => {
          setIsImportOpen(open);
          if (!open) setImportFile(null);
        }}
        title="Import Receipts"
        entityType="Receipts"
        onImport={handleImport}
        isUploading={isImporting}
        onSampleDownload={handleDownloadSample}
        isDownloading={isDownloadingSample}
      />

      <Dialog open={Boolean(previewRow)} onOpenChange={(open) => !open && setPreviewRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt {previewRow?.receiptNumber}</DialogTitle>
          </DialogHeader>
          {previewRow && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number</span>
                <span className="font-medium">#{previewRow.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Flat</span>
                <span className="font-medium">{previewRow.flat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer Name</span>
                <span className="font-medium">{previewRow.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Received</span>
                <span className="font-medium">₹{previewRow.amountReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode</span>
                <span className="font-medium">{previewRow.paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction Number</span>
                <span className="font-medium">{previewRow.transactionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Date</span>
                <span className="font-medium">{formatDate(previewRow.paymentDate)}</span>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingReceipts;
