import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";


const LockFunctionList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [lockFunctions, setLockFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchLockFunctions = useCallback(async () => {
    setLoading(true);
    setIsSearching(!!searchTerm);
    try {
      const response = await axios.get(
        `${baseURL}/lock_functions.json`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      const functionsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.lock_functions && Array.isArray(response.data.lock_functions))
        ? response.data.lock_functions
        : [];

      // Client-side search filtering
      let filteredFunctions = functionsData;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filteredFunctions = functionsData.filter((func) =>
          func.name?.toLowerCase().includes(query) ||
          func.action_name?.toLowerCase().includes(query) ||
          func.parent_function?.toLowerCase().includes(query)
        );
      }

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedFunctions = filteredFunctions.slice(startIndex, startIndex + itemsPerPage);
      
      setLockFunctions(paginatedFunctions);
      setTotalCount(filteredFunctions.length);
      setTotalPages(Math.ceil(filteredFunctions.length / itemsPerPage) || 1);
    } catch (error) {
      console.error("Error fetching lock functions:", error);
      toast.error("Failed to load lock functions");
      setLockFunctions([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchLockFunctions();
  }, [fetchLockFunctions]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(
        `${baseURL}/lock_functions/${id}.json`,
        {
          lock_function: {
            active: currentStatus === 1 ? 0 : 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Lock function status updated successfully");
      fetchLockFunctions(); // Refresh the list
    } catch (error) {
      console.error("Error updating lock function status:", error);
      toast.error("Failed to update lock function status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this lock function?")) {
      try {
        await axios.delete(
          `${baseURL}/lock_functions/${id}.json`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        toast.success("Lock function deleted successfully");
        fetchLockFunctions(); // Refresh the list
      } catch (error) {
        console.error("Error deleting lock function:", error);
        toast.error("Failed to delete lock function");
      }
    }
  };

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
    navigate("/setup-member/lock-function-create");
  };

  const handleEdit = (id) => {
    navigate(`/setup-member/lock-function-edit/${id}`);
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "action_name", label: "Action Name", sortable: true },
    { key: "parent_function", label: "Parent Function", sortable: true },
    { key: "module_id", label: "Module ID", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item, columnKey) => {
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item.id)}
              className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      case "id":
        return <span className="font-medium">{item.id || "-"}</span>;
      case "name":
        return <span>{item.name || "-"}</span>;
      case "action_name":
        return <span>{item.action_name || "-"}</span>;
      case "parent_function":
        return <span>{item.parent_function || "-"}</span>;
      case "module_id":
        return <span>{item.module_id || "-"}</span>;
      case "status":
        return (
          <button
            onClick={() => handleToggleStatus(item.id, item.active)}
            className="toggle-button"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              width: "70px",
            }}
          >
            {item.active === 1 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="25"
                fill="#de7008"
                className="bi bi-toggle-on"
                viewBox="0 0 16 16"
              >
                <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="25"
                fill="#667085"
                className="bi bi-toggle-off"
                viewBox="0 0 16 16"
              >
                <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zm-6 8a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
              </svg>
            )}
          </button>
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
            data={lockFunctions}
            columns={columns}
            renderCell={renderCell}
            enableExport={false}
            enableGlobalSearch={true}
            onGlobalSearch={handleGlobalSearch}
            leftActions={renderCustomActions()}
            loading={loading}
            loadingMessage="Loading lock functions..."
          />
          {!loading && lockFunctions.length > 0 && totalPages > 1 && (
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

export default LockFunctionList;