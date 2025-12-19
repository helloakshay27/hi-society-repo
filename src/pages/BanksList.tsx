import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";

const BankList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    setIsSearching(!!searchTerm);
    try {
      const response = await axios.get(`${baseURL}banks.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });

      let banksData = [];
      if (Array.isArray(response.data)) {
        banksData = response.data;
      } else if (response.data.banks) {
        banksData = response.data.banks;
      } else if (Array.isArray(response.data.data)) {
        banksData = response.data.data;
      } else if (response.data.bank) {
        banksData = [response.data.bank];
      }

      // Client-side search filtering
      let filteredBanks = banksData;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filteredBanks = banksData.filter((bank) =>
          bank.bank_name?.toLowerCase().includes(query)
        );
      }

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedBanks = filteredBanks.slice(startIndex, startIndex + itemsPerPage);
      
      setBanks(paginatedBanks);
      setTotalCount(filteredBanks.length);
      setTotalPages(Math.ceil(filteredBanks.length / itemsPerPage) || 1);
    } catch (error) {
      console.error("Error fetching banks:", error);
      toast.error("Failed to load banks.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const handleGlobalSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAdd = () => {
    navigate("/setup-member/banks/create");
  };

  const handleEdit = (id) => {
    navigate(`/setup-member/banks/${id}/edit`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "-";
    }
  };

  const columns = [
    { key: "actions", label: "Action", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "bank_name", label: "Bank Name", sortable: true },
    { key: "interest_rate", label: "Interest Rate (%)", sortable: true },
    { key: "bank_logo", label: "Bank Logo", sortable: false },
    { key: "created_at", label: "Created Date", sortable: true },
  ];

  const renderCell = (item, columnKey) => {
    const index = banks.findIndex(b => b.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(item.id)}
            className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </Button>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "bank_name":
        return <span>{item.bank_name || "-"}</span>;
      case "interest_rate":
        return <span>{item.interest_rate ? `${item.interest_rate}%` : "-"}</span>;
      case "bank_logo":
        return item.bank_logo ? (
          <img
            src={item.bank_logo}
            className="img-fluid rounded"
            alt={item.bank_name || "Bank Logo"}
            style={{
              maxWidth: "80px",
              maxHeight: "60px",
              objectFit: "contain",
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="text-gray-500">No Logo</span>
        );
      case "created_at":
        return <span>{formatDate(item.created_at)}</span>;
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
      Add Bank
    </Button>
  );

  const renderListTab = () => (
    <div className="space-y-6">
          <EnhancedTable
            data={banks}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            leftActions={renderCustomActions()}
            loading={loading}
            loadingMessage="Loading banks..."
          />
          {!loading && banks.length > 0 && totalPages > 1 && (
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

export default BankList;