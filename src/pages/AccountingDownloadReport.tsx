import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";

const AccountingDownloadReport: React.FC = () => {
  const navigate = useNavigate();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    const downloadReport = async () => {
      const lockAccountId = localStorage.getItem("lock_account_id");
      if (!lockAccountId) {
        toast.error("Unable to determine account for this report");
        navigate(-1);
        return;
      }

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
        navigate(-1);
      }
    };

    downloadReport();
  }, [navigate]);

  return null;
};

export default AccountingDownloadReport;
