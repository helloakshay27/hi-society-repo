import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Edit, Pencil, Plus } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface PressRelease {
  id: number;
  title: string;
  description: string;
  press_source: string;
  release_date: string;
  attachfile?: {
    document_url: string;
  };
  company_name?: string;
  project_name?: string;
  pr_image_1_by_1?: {
    document_url: string;
  };
  pr_image_9_by_16?: {
    document_url: string;
  };
  pr_image_3_by_2?: {
    document_url: string;
  };
  pr_image_16_by_9?: {
    document_url: string;
  };
}

interface PressReleasePermissions {
  create?: string;
  update?: string;
  delete?: string;
}

const PressReleasesList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<PressReleasePermissions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const getPressReleasePermissions = (): PressReleasePermissions => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};
  
      const permissions = JSON.parse(lockRolePermissions);
      return permissions.press_releases || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  // Cleanup body overflow styles when component mounts (fixes scroll-lock from modals)
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  useEffect(() => {
    const perms = getPressReleasePermissions();
    setPermissions(perms);
  }, []);

  const fetchPressReleases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/press_releases.json`, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (Array.isArray(data.press_releases)) {
        let allReleases = data.press_releases;

        // Client-side search
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          allReleases = allReleases.filter((release: PressRelease) =>
            (release.title && release.title.toLowerCase().includes(query)) ||
            (release.company_name && release.company_name.toLowerCase().includes(query)) ||
            (release.project_name && release.project_name.toLowerCase().includes(query)) ||
            (release.description && release.description.toLowerCase().includes(query))
          );
        }

        setTotalCount(allReleases.length);
        setTotalPages(Math.ceil(allReleases.length / itemsPerPage) || 1);

        // Client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedReleases = allReleases.slice(startIndex, startIndex + itemsPerPage);
        setPressReleases(paginatedReleases);
      } else {
        console.error("API response does not contain press_releases array", data);
        toast.error("Failed to fetch press releases");
      }
    } catch (error) {
      console.error("Error fetching press releases:", error);
      toast.error("Error fetching press releases");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, currentPage, searchTerm]);

  useEffect(() => {
    fetchPressReleases();
  }, [fetchPressReleases]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setIsSearching(true);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleAdd = () => {
    navigate("/maintenance/press-releases-create");
  };

  const handleEdit = (id: number) => {
    navigate(`/maintenance/press-releases-edit/${id}`);
  };

  const handleClearSelection = () => {
    setShowActionPanel(false);
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "title", label: "Title", sortable: true },
    { key: "description", label: "Description", sortable: false },
    { key: "press_source", label: "Press Source", sortable: true },
    { key: "release_date", label: "Release Date", sortable: true },
    { key: "attachment", label: "Attachment", sortable: false },
  ];

  const renderCell = (item: PressRelease, columnKey: string) => {
    const index = pressReleases.findIndex(r => r.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            {/* {permissions.update === "true" && ( */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(item.id)}
                className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            {/* )} */}
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "title":
        return <span>{item.title || "-"}</span>;
      case "description":
        return (
          <div style={{ maxWidth: "250px", wordWrap: "break-word", whiteSpace: "normal", lineHeight: "1.5" }}>
            {item.description || "-"}
          </div>
        );
      case "press_source":
        return <span>{item.press_source || "-"}</span>;
      case "release_date":
        return <span>{item.release_date || "-"}</span>;
      case "attachment":
        const imageUrl = item.pr_image_16_by_9?.document_url || 
                        item.pr_image_1_by_1?.document_url || 
                        item.pr_image_3_by_2?.document_url || 
                        item.pr_image_9_by_16?.document_url ||
                        item.attachfile?.document_url;
        
        return (
          <div className="flex justify-center items-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Press Release"
                className="rounded-lg border border-gray-200"
                style={{ width: "80px", height: "80px", objectFit: "cover" }}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">No image</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderCustomActions = () => {
    return (
      <>
        {/* {permissions.create === "true" && ( */}
          <Button
            onClick={handleAdd}
            className="bg-[#C72030] hover:bg-[#A01828] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        {/* // )} */}
      </>
    );
  };

  const renderListTab = () => (
    <div className="space-y-6">
          <EnhancedTable
            data={pressReleases}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            leftActions={renderCustomActions()}
            loading={loading}
            loadingMessage="Loading press releases..."
          />
          {!loading && pressReleases.length > 0 && totalPages > 1 && (
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

export default PressReleasesList;
