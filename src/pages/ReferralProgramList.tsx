import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Referral {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  active: boolean;
  attachments?: Array<{
    document_url: string;
    document_content_type: string;
  }>;
}

const ReferralProgramList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${baseURL}/referral_configs.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data;
      let allReferrals = data.referrals || data.referral_configs || data || [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allReferrals = allReferrals.filter((referral: Referral) =>
          (referral.title || referral.name || "").toLowerCase().includes(query) ||
          (referral.description || "").toLowerCase().includes(query)
        );
      }

      setTotalCount(allReferrals.length);
      setTotalPages(Math.ceil(allReferrals.length / itemsPerPage) || 1);

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedReferrals = allReferrals.slice(startIndex, startIndex + itemsPerPage);
      setReferrals(paginatedReferrals);
    } catch (error) {
      console.error("Error fetching referral data:", error);
      setError("Failed to fetch referral data. Please try again.");
      toast.error("Failed to fetch referral programs");
      setReferrals([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setIsSearching(true);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleEdit = (id: number) => {
    navigate(`/referral-program-edit/${id}`);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    const updatedStatus = !currentStatus;

    try {
      if (updatedStatus) {
        const deactivatePromises = referrals
          .filter((item) => item.active && item.id !== id)
          .map((item) =>
            axios.put(
              `${baseURL}/referral_configs/${item.id}.json`,
              { referral_config: { active: false } },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
              }
            )
          );
        await Promise.all(deactivatePromises);
      }

      await axios.put(
        `${baseURL}/referral_configs/${id}.json`,
        { referral_config: { active: updatedStatus } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setReferrals((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, active: updatedStatus }
            : updatedStatus
            ? { ...item, active: false }
            : item
        )
      );

      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "title", label: "Title", sortable: true },
    { key: "description", label: "Description", sortable: false },
    { key: "attachments", label: "Attachments", sortable: false },
  ];

  const renderCell = (item: Referral, columnKey: string) => {
    const index = referrals.findIndex(r => r.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(item.id)}
              className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <button
              onClick={() => handleToggle(item.id, item.active)}
              className="text-gray-600 hover:opacity-80 transition-opacity"
              title={item.active ? "Deactivate" : "Activate"}
            >
              {item.active ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="24"
                  fill="#28a745"
                  viewBox="0 0 16 16"
                >
                  <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="24"
                  fill="#6c757d"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zm-6 8a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
                </svg>
              )}
            </button>
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "title":
        return <span>{item.title || "-"}</span>;
      case "description":
        return (
          <div style={{ maxWidth: "350px", wordWrap: "break-word", whiteSpace: "normal", lineHeight: "1.5" }}>
            {item.description || "-"}
          </div>
        );
      case "attachments":
        return (
          <div className="flex justify-center items-center">
            {item.attachments && item.attachments.length > 0 ? (
              (() => {
                const previewFile = item.attachments.find(
                  (file) =>
                    file.document_content_type?.startsWith("image/") ||
                    file.document_content_type?.startsWith("video/")
                );

                if (!previewFile)
                  return <span className="text-sm text-gray-500">Attachment available</span>;

                return previewFile.document_content_type.startsWith("video/") ? (
                  <video
                    width="100"
                    height="65"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="rounded-lg border border-gray-200"
                    style={{ objectFit: "cover" }}
                  >
                    <source
                      src={previewFile.document_url}
                      type={previewFile.document_content_type}
                    />
                  </video>
                ) : (
                  <img
                    src={previewFile.document_url}
                    alt="Preview"
                    className="rounded-lg border border-gray-200"
                    style={{ width: "100px", height: "65px", objectFit: "cover" }}
                  />
                );
              })()
            ) : (
              <span className="text-sm text-gray-500 italic">No attachments</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderListTab = () => (
    <div className="space-y-6">
          <EnhancedTable
            data={referrals}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            loading={loading}
            loadingMessage="Loading referral programs..."
          />
          {!loading && referrals.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center mt-6">
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
    </div>
  );
};

export default ReferralProgramList;
