import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

interface Faq {
  id: number;
  question: string;
  answer: string;
  faq_category_name?: string;
  faq_tag?: string;
  active: boolean;
}

const FaqList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);
  const [toggleLoading, setToggleLoading] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      const urlParams = new URLSearchParams(location.search);
      const searchParam = urlParams.get("s[question_cont]");
      if (searchParam) {
        params["s[question_cont]"] = searchParam;
      }

      const response = await axios.get(`${baseURL}/faqs.json`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        params,
      });

      if (response.data && response.data.faqs) {
        let allFaqs = response.data.faqs;
        setCategoryId(response.data.faq_category_id);
        setSubCategoryId(response.data.faq_sub_category_id);

        // Client-side search
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          allFaqs = allFaqs.filter((faq: Faq) =>
            (faq.question && faq.question.toLowerCase().includes(query)) ||
            (faq.answer && faq.answer.toLowerCase().includes(query)) ||
            (faq.faq_tag && faq.faq_tag.toLowerCase().includes(query))
          );
        }

        setTotalCount(allFaqs.length);
        setTotalPages(Math.ceil(allFaqs.length / itemsPerPage) || 1);

        // Client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedFaqs = allFaqs.slice(startIndex, startIndex + itemsPerPage);
        setFaqs(paginatedFaqs);
      } else {
        setFaqs([]);
      }
    } catch (error: any) {
      console.error("Error fetching FAQs:", error.response || error);
      setError("Failed to fetch FAQs. Please try again later.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, location.search, searchTerm, currentPage]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setIsSearching(true);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleAdd = () => {
    navigate("/maintenance/faq-create");
  };

  const handleEdit = (id: number) => {
    navigate(`/maintenance/faq-edit/${id}`);
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    setToggleLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      await axios.put(
        `${baseURL}/faqs/${id}.json`,
        { 
          faq: {
            active: !currentStatus 
          }
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      
      setFaqs(faqs.map(faq => 
        faq.id === id ? { ...faq, active: !currentStatus } : faq
      ));
      
      setError(null);
      toast.success("Status updated successfully!");
      
    } catch (error: any) {
      console.error("Error toggling FAQ status:", error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            `Server error: ${error.response.status}`;
        setError(`Failed to update FAQ status: ${errorMessage}`);
      } else if (error.request) {
        setError("Failed to update FAQ status: No response from server");
      } else {
        setError("Failed to update FAQ status: " + error.message);
      }
    } finally {
      setToggleLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "faq_category", label: "FAQ Category", sortable: true },
    { key: "question", label: "Question", sortable: true },
    { key: "answer", label: "Answer", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item: Faq, columnKey: string) => {
    const index = faqs.findIndex(f => f.id === item.id);
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
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "faq_category":
        return <span>{item.faq_category_name || "-"}</span>;
      case "question":
        return (
          <div className="max-w-xs truncate" title={item.question}>
            {item.question || "-"}
          </div>
        );
      case "answer":
        return (
          <div className="max-w-md" style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
            {item.answer || "-"}
          </div>
        );
      case "status":
        return (
          <div className="flex items-center gap-2 text-[11px] font-medium select-none">
            <div
              role="switch"
              aria-checked={item.active}
              aria-label={item.active ? "Deactivate FAQ" : "Activate FAQ"}
              tabIndex={0}
              onClick={() => !toggleLoading[item.id] && handleToggleActive(item.id, item.active)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !toggleLoading[item.id] && handleToggleActive(item.id, item.active)}
              className="cursor-pointer"
              style={{ 
                transform: item.active ? 'scaleX(1)' : 'scaleX(-1)',
                opacity: toggleLoading[item.id] ? 0.5 : 1,
                pointerEvents: toggleLoading[item.id] ? 'none' : 'auto'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" viewBox="0 0 22 14" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M16.3489 9.70739H6.13079C4.13825 9.70739 2.55444 8.12357 2.55444 6.13104C2.55444 4.1385 4.13825 2.55469 6.13079 2.55469H16.3489C18.3415 2.55469 19.9253 4.1385 19.9253 6.13104C19.9253 8.12357 18.3415 9.70739 16.3489 9.70739Z" fill="#DEDEDE"/>
                <g filter={`url(#filter0_dd_faq_status_${item.id})`}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M6.1308 11.2396C8.95246 11.2396 11.2399 8.95222 11.2399 6.13055C11.2399 3.30889 8.95246 1.02148 6.1308 1.02148C3.30914 1.02148 1.02173 3.30889 1.02173 6.13055C1.02173 8.95222 3.30914 11.2396 6.1308 11.2396Z" fill="#C72030"/>
                  <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke={`url(#paint0_linear_faq_status_${item.id})`} strokeWidth="0.255453"/>
                  <path d="M6.1311 1.14941C8.88208 1.14958 11.1125 3.37984 11.1125 6.13086C11.1124 8.88174 8.88198 11.1121 6.1311 11.1123C3.38009 11.1123 1.14982 8.88184 1.14966 6.13086C1.14966 3.37974 3.37998 1.14941 6.1311 1.14941Z" stroke={`url(#paint1_linear_faq_status_${item.id})`} strokeWidth="0.255453"/>
                </g>
                <defs>
                  <filter id={`filter0_dd_faq_status_${item.id}`} x="-8.54731e-05" y="-0.000329614" width="12.2619" height="13.2842" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dy="1.02181"/>
                    <feGaussianBlur stdDeviation="0.510907"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_faq_status"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset/>
                    <feGaussianBlur stdDeviation="0.510907"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0"/>
                    <feBlend mode="normal" in2="effect1_dropShadow_faq_status" result="effect2_dropShadow_faq_status"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_faq_status" result="shape"/>
                  </filter>
                  <linearGradient id={`paint0_linear_faq_status_${item.id}`} x1="1.07172" y1="1.02148" x2="1.07172" y2="11.1396" gradientUnits="userSpaceOnUse">
                    <stop stopOpacity="0"/>
                    <stop offset="0.8" stopOpacity="0.02"/>
                    <stop offset="1" stopOpacity="0.04"/>
                  </linearGradient>
                  <linearGradient id={`paint1_linear_faq_status_${item.id}`} x1="1.02173" y1="1.02148" x2="1.02173" y2="11.2396" gradientUnits="userSpaceOnUse">
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
        return null;
    }
  };

  const renderCustomActions = () => (
    <Button
      onClick={handleAdd}
      className="bg-[#C72030] hover:bg-[#A01828] text-white"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add
    </Button>
  );

  const renderListTab = () => (
    <div className="space-y-6">
          <EnhancedTable
            data={faqs}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            leftActions={renderCustomActions()}
            loading={loading}
            loadingMessage="Loading FAQs..."
          />
          {!loading && faqs.length > 0 && totalPages > 1 && (
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

export default FaqList;