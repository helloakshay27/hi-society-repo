import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HI_SOCIETY_CONFIG } from "@/config/apiConfig";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

interface KYCDocument {
  id: number;
  type: string;
  attachments: { url: string; alt: string }[];
  verify: string;
  verifiedBy: string;
  verifiedOn: string;
}

interface KYCDetailData {
  userName: string;
  userEmail: string;
  userMobile: string;
  documents: KYCDocument[];
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
};

const formatStatus = (status: string | null | undefined) => {
  if (!status) return "-";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const documentColumns: ColumnConfig[] = [
  { key: "type", label: "Type", sortable: false, draggable: false },
  { key: "attachments", label: "Attachments", sortable: false, draggable: false },
  { key: "verify", label: "Verify", sortable: false, draggable: false },
  { key: "verifiedBy", label: "Verified By", sortable: false, draggable: false },
  { key: "verifiedOn", label: "Verified On", sortable: false, draggable: false },
  { key: "actions", label: "Actions", sortable: false, draggable: false },
];

export const KYCDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KYCDetailData | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const fetchKYCDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;

      if (!baseUrl) {
        throw new Error("Base URL is not configured");
      }
      if (!token) {
        throw new Error("Authentication token is missing. Please login again.");
      }

      const url = `${baseUrl}/crm/admin/kyc_details/${id}.json`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = response.data;
      const item = result?.data?.kyc_detail || result?.data || result;
      const user = item?.user || {};
      const attachments = item?.kyc_attachments || [];

      setData({
        userName:
          user.full_name ||
          [user.firstname, user.lastname].filter(Boolean).join(" ") ||
          "",
        userEmail: user.email || "",
        userMobile: user.mobile || "",
        documents: attachments.map((att: any) => ({
          id: att.id,
          type: att.attachment_type || "-",
          attachments: att.document_url
            ? [{ url: att.document_url, alt: att.document_file_name || att.document_name || att.attachment_type }]
            : [],
          verify: formatStatus(att.status),
          verifiedBy: att.verified_by || "-",
          verifiedOn: formatDate(att.verified_at),
        })),
      });
    } catch (error: any) {
      console.error("Error fetching KYC detail:", error);
      toast.error(error.message || "Failed to load KYC detail");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchKYCDetail();
  }, [id]);

  const handleVerifyAttachment = async (kycAttachmentId: number) => {
    if (!id) return;
    setVerifyingId(kycAttachmentId);
    try {
      const baseUrl = HI_SOCIETY_CONFIG.BASE_URL;
      const token = HI_SOCIETY_CONFIG.TOKEN;

      if (!baseUrl) {
        throw new Error("Base URL is not configured");
      }
      if (!token) {
        throw new Error("Authentication token is missing. Please login again.");
      }

      const url = `${baseUrl}/crm/admin/kyc_details/${id}/verify_attachment.json`;
      await axios.get(url, {
        params: { kyc_attachment_id: kycAttachmentId },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Document verified successfully");
      await fetchKYCDetail();
    } catch (error: any) {
      console.error("Error verifying attachment:", error);
      toast.error(error.message || "Failed to verify document");
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p>Loading KYC details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-[#fafafa] min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p>KYC Detail not found</p>
          <Button onClick={() => navigate("/setup/kyc-details")} className="mt-4">
            Back to KYC Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen">
      {/* Header with Back Button */}
      <div className="">
        <div className="py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/settings/kyc-details")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {data.userName} - KYC Details
          </h1>
        </div>
      </div>

      {/* KYC Documents Table */}
      <div className="">
        <EnhancedTable
          data={data.documents}
          columns={documentColumns}
          getItemId={(doc) => String(doc.id)}
          emptyMessage="No documents found"
          hideTableSearch={true}
          hideColumnsButton={true}
          renderCell={(doc, columnKey) => {
            switch (columnKey) {
              case "type":
                return <span className="text-sm text-gray-900">{doc.type}</span>;
              case "attachments":
                return (
                  <div className="flex gap-2">
                    {doc.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-20 h-20 border rounded overflow-hidden block"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.alt}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                );
              case "verify":
                return (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.verify === "Verified"
                      ? "bg-green-100 text-green-800"
                      : doc.verify === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                      }`}
                  >
                    {doc.verify}
                  </span>
                );
              case "verifiedBy":
                return <span className="text-sm text-gray-900">{doc.verifiedBy}</span>;
              case "verifiedOn":
                return <span className="text-sm text-gray-900">{doc.verifiedOn}</span>;
              case "actions":
                return (
                  <div className="flex items-center justify-center">
                    {doc.verify === "Pending" && (
                      <Button
                        type="button"
                        disabled={verifyingId === doc.id}
                        onClick={() => handleVerifyAttachment(doc.id)}
                        title="Verify"
                        className="bg-primary rounded"
                      // className="h-7 px-3 flex items-center gap-1.5 rounded-full text-xs font-medium border border-[#798c5e] text-[#798c5e] hover:bg-[#798c5e] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#798c5e]"
                      >
                        {/* {verifyingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )} */}
                        <span className="ml-2">
                          {verifyingId === doc.id ? "Verifying..." : "Verify"}
                        </span>
                      </Button>
                    )}
                  </div>
                );
              default:
                return null;
            }
          }}
        />
      </div>
    </div>
  );
};
