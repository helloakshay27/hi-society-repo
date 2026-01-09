import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Pencil } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";

interface Banner {
  id: number;
  title: string;
  banner_video_9_by_16?: { document_url?: string; document_content_type?: string };
  banner_video_1_by_1?: { document_url?: string; document_content_type?: string };
  banner_video_16_by_9?: { document_url?: string; document_content_type?: string };
  banner_video_3_by_2?: { document_url?: string; document_content_type?: string };
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
  const [bannerPermissions, setBannerPermissions] = useState<BannerPermissions>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    setBannerPermissions(getBannerPermissions());
  }, []);

  const fetchBanners = useCallback(async (page: number, search: string) => {
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
          banners_list: true
        }
      });

      const bannersData = response.data.banners || response.data.banners_list || [];

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
      sessionStorage.setItem('cached_banners', JSON.stringify(bannersData));
    } catch (error) {
      toast.error("Failed to fetch banners.");
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

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
  const handleEditBanner = (id: number) => navigate(`/maintenance/banner-edit/${id}`);
  const handleClearSelection = () => { setShowActionPanel(false); };

  const onToggle = async (bannerId: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      const response = await axios.put(
        `${baseURL}/banners/${bannerId}.json`,
        {
          banner: {
            active: !currentStatus
          }
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
      toast.error("Limit reached: only 5 active banners allowed. Please deactivate one before activating another.");
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'banner', label: 'Banner', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
  ];

  const renderCell = (item: Banner, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {/* {bannerPermissions.update === "true" && ( */}
              <Button variant="ghost" size="sm" onClick={() => handleEditBanner(item.id)} title="Edit">
                <Pencil className="w-4 h-4" />
              </Button>
            {/* )} */}
          </div>
        );
      case 'title':
        return item.title || "-";
      case 'banner':
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
                const isVideo = media?.document_content_type?.startsWith("video/");
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
      case 'status':
        return (
          <div className="flex items-center gap-2 text-[11px] font-medium select-none">
            <div
              role="switch"
              aria-checked={item.active}
              aria-label={item.active ? "Deactivate banner" : "Activate banner"}
              tabIndex={0}
              onClick={() => onToggle(item.id, item.active)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle(item.id, item.active)}
              className="cursor-pointer"
              style={{ transform: item.active ? 'scaleX(1)' : 'scaleX(-1)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" viewBox="0 0 22 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                <g filter={`url(#filter0_dd_banner_status_${item.id})`}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                  <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke={`url(#paint0_linear_banner_status_${item.id})`} strokeWidth="0.255453"/>
                  <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke={`url(#paint1_linear_banner_status_${item.id})`} strokeWidth="0.255453"/>
                </g>
                <defs>
                  <filter id={`filter0_dd_banner_status_${item.id}`} x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="1.02181"/>
                    <feGaussianBlur stdDeviation="0.510907"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_banner_status"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset/>
                    <feGaussianBlur stdDeviation="0.510907"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                    <feBlend mode="normal" in2="effect1_dropShadow_banner_status" result="effect2_dropShadow_banner_status"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_banner_status" result="shape"/>
                  </filter>
                  <linearGradient id={`paint0_linear_banner_status_${item.id}`} x1="1.07172" y1="1.02148" x2="1.07172" y2="11.1396" gradientUnits="userSpaceOnUse">
                    <stop stopOpacity="0"/>
                    <stop offset="0.8" stopOpacity="0.02"/>
                    <stop offset="1" stopOpacity="0.04"/>
                  </linearGradient>
                  <linearGradient id={`paint1_linear_banner_status_${item.id}`} x1="1.02173" y1="1.02148" x2="1.02173" y2="11.2396" gradientUnits="userSpaceOnUse">
                    <stop stopColor="white" stopOpacity="0.12"/>
                    <stop offset="0.2" stopColor="white" stopOpacity="0.06"/>
                    <stop offset="1" stopColor="white" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        );
      default:
        return item[columnKey as keyof Banner] as React.ReactNode ?? '-';
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
          pagination={false}
          enableExport={true}
          exportFileName="banners"
          storageKey="banners-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search banners..."
          leftActions={renderCustomActions()}
          loading={isSearching || loading}
          loadingMessage={isSearching ? "Searching banners..." : "Loading banners..."}
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
      </>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default BannerList;