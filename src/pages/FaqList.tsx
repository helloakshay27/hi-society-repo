import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Edit, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { Switch } from "@mui/material";

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
              <Pencil className="h-4 w-4" />
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
          <Switch
            checked={item.active}
            onChange={() => !toggleLoading[item.id] && handleToggleActive(item.id, item.active)}
            disabled={toggleLoading[item.id]}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#C72030',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#C72030',
              },
            }}
          />
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
                  
                  {/* First page */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(1); }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Pages around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage || 
                             page === currentPage - 1 || 
                             page === currentPage + 1 ||
                             (currentPage <= 2 && page <= 3) ||
                             (currentPage >= totalPages - 1 && page >= totalPages - 2);
                    })
                    .map(page => (
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
                  
                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
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