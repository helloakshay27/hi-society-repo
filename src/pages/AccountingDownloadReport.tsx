import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/config/apiConfig";

const AccountingDownloadReport: React.FC = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const lockAccountId = localStorage.getItem("lock_account_id");
    if (!lockAccountId) {
      toast.error("Unable to determine account for this report");
      return;
    }

    setDownloading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(
        `${baseUrl}/lock_accounts/${lockAccountId}/cost_centres.xlsx`,
        {
          responseType: "blob",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cost_centres.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white p-2 sm:p-4 lg:p-6 max-w-full min-h-screen overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Download Report</h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16 px-6 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "#E5E0D3" }}
        >
          <Download size={24} color="var(--color-primary,#da7756)" />
        </div>
        <p className="mb-6 max-w-md text-sm text-gray-600">
          Generate and download the latest cost centre report for your account.
        </p>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="min-w-[180px] bg-[#C72030] text-white hover:bg-[#A01020]"
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? "Downloading..." : "Download Report"}
        </Button>
      </div>
    </div>
  );
};

export default AccountingDownloadReport;
