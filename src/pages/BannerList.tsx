import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";
import { Switch } from "@mui/material";

interface Banner {
  id: number;
  title: string;
  banner_video_9_by_16?: {
    document_url?: string;
    document_content_type?: string;
  };
  banner_video_1_by_1?: {
    document_url?: string;
    document_content_type?: string;
  };
  banner_video_16_by_9?: {
    document_url?: string;
    document_content_type?: string;
  };
  banner_video_3_by_2?: {
    document_url?: string;
    document_content_type?: string;
  };
  active: boolean;
}

interface BannerPermissions {
  create?: string;
  update?: string;
  delete?: string;
}

const BannerList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerPermissions, setBannerPermissions] = useState<BannerPermissions>(
    {}
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const getBannerPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.banner || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  console.log("banner permission:", bannerPermissions);

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
    setBannerPermissions(getBannerPermissions());
  }, []);

  const fetchBanners = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      setIsSearching(!!search);
      try {
        const response = await axios.get(`${baseURL}/banners.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          params: {
            banner_name: true,
            title: true,
            image: true,
            banners_list: true,
          },
        });

        const bannersData =
          response.data.banners || response.data.banners_list || [];

        // Client-side search filtering
        let filteredBanners = bannersData;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredBanners = bannersData.filter((banner: Banner) =>
            banner.title?.toLowerCase().includes(searchLower)
          );
        }

        // Client-side pagination
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBanners = filteredBanners.slice(startIndex, endIndex);

        setBanners(paginatedBanners);
        setCurrentPage(page);
        setTotalPages(Math.ceil(filteredBanners.length / itemsPerPage));
        setTotalCount(filteredBanners.length);

        // Cache all banners
        sessionStorage.setItem("cached_banners", JSON.stringify(bannersData));
      } catch (error) {
        toast.error("Failed to fetch banners.");
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [baseURL]
  );

  useEffect(() => {
    fetchBanners(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchBanners]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddBanner = () => navigate("/maintenance/banner-add");
  const handleEditBanner = (id: number) =>
    navigate(`/maintenance/banner-edit/${id}`);
  const handleClearSelection = () => {
    setShowActionPanel(false);
  };

  const onToggle = async (bannerId: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      const response = await axios.put(
        `${baseURL}/banners/${bannerId}.json`,
        {
          banner: {
            active: !currentStatus,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Refresh the banners list
        fetchBanners(currentPage, searchTerm);
        toast.success("Banner status updated successfully!");
      }
    } catch (error) {
      console.error("Error toggling banner status:", error);
      toast.error(
        "Limit reached: only 5 active banners allowed. Please deactivate one before activating another."
      );
    }
  };

  const columns = [
    { key: "actions", label: "Action", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "title", label: "Title", sortable: true },
    { key: "banner", label: "Banner", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item: Banner, columnKey: string, index: number) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            {/* {bannerPermissions.update === "true" && ( */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditBanner(item.id)}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            {/* )} */}
          </div>
        );
      case "id":
        return (
          <span className="text-sm text-gray-700">
            {(currentPage - 1) * 10 + index + 1}
          </span>
        );
      case "title":
        return item.title || "-";
      case "banner":
        return (
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "banner_video_9_by_16", ratio: "9:16" },
              { key: "banner_video_1_by_1", ratio: "1:1" },
              { key: "banner_video_16_by_9", ratio: "16:9" },
              { key: "banner_video_3_by_2", ratio: "3:2" },
            ]
              .filter((mediaItem) => item?.[mediaItem.key as keyof Banner])
              .map((mediaItem) => {
                const media = item[mediaItem.key as keyof Banner] as any;
                const isVideo =
                  media?.document_content_type?.startsWith("video/");
                const url = media?.document_url || "-";

                return (
                  <div key={mediaItem.key} className="flex-shrink-0">
                    {isVideo ? (
                      <video
                        width="100"
                        height="65"
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="rounded border border-gray-200"
                        style={{ objectFit: "cover" }}
                      >
                        <source src={url} type={media?.document_content_type} />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={url}
                        className="rounded border border-gray-200"
                        alt={item?.title || `Banner ${mediaItem.ratio}`}
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        );
      case "status":
        return (
          <Switch
            checked={item.active}
            onChange={() => onToggle(item.id, item.active)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#C72030",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#C72030",
              },
            }}
          />
        );
      default:
        return (item[columnKey as keyof Banner] as React.ReactNode) ?? "-";
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button
        onClick={handleAddBanner}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        Add
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      {/* {showActionPanel && (
        <SelectionPanel
          onAdd={handleAddBanner}
          onClearSelection={handleClearSelection}
        />
      )} */}
      <>
        <EnhancedTable
          data={banners}
          columns={columns}
          renderCell={renderCell}
          pagination={true}
          enableExport={true}
          exportFileName="banners"
          storageKey="banners-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search banners..."
          leftActions={renderCustomActions()}
          loading={isSearching || loading}
          loadingMessage={
            isSearching ? "Searching banners..." : "Loading banners..."
          }
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">{renderListTab()}</div>
    </div>
  );
};

export default BannerList;
