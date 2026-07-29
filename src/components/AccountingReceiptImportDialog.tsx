import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { toast } from "sonner";

interface AccountingReceiptImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => Promise<void>;
}

const SAMPLE_HEADERS = [
  "Receipt Number",
  "Invoice Number",
  "Flat",
  "Customer Name",
  "Amount Received",
  "Payment Mode",
  "Transaction Number",
  "Payment Date",
];

export const AccountingReceiptImportDialog: React.FC<AccountingReceiptImportDialogProps> = ({
  open,
  onOpenChange,
  onImport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setSelectedFile(null);
    onOpenChange(false);
  };

  const handleDownloadSample = () => {
    const csv = SAMPLE_HEADERS.join(",");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "receipts-import-sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please choose a file to import.");
      return;
    }
    setSubmitting(true);
    try {
      await onImport(selectedFile);
      setSelectedFile(null);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 [&>button]:hidden">
        <div className="flex items-center justify-between bg-cyan-500 px-6 py-3">
          <h2 className="text-lg font-medium text-white">Import Receipts</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:opacity-80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <span className="relative inline-block pb-1 font-medium text-gray-800">
              File
              <span className="absolute -bottom-0.5 left-0 h-0.5 w-4 bg-red-500" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-600">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadSample} className="gap-1">
              <Download className="h-4 w-4" /> Sample
            </Button>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-w-[140px] bg-green-600 text-white hover:bg-green-700"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountingReceiptImportDialog;
