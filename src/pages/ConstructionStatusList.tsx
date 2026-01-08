

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

const ConstructionStatusList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [constructionStatusPermissions, setConstructionStatusPermissions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const getConstructionStatusPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};
  
      const permissions = JSON.parse(lockRolePermissions);
      return permissions.construction || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const permissions = getConstructionStatusPermissions();
    setConstructionStatusPermissions(permissions);
  }, []);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/construction_statuses.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      let allStatuses = response.data || [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allStatuses = allStatuses.filter((status) =>
          (status.construction_status || "").toLowerCase().includes(query)
        );
      }

      setTotalCount(allStatuses.length);
      setTotalPages(Math.ceil(allStatuses.length / itemsPerPage) || 1);

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedStatuses = allStatuses.slice(startIndex, startIndex + itemsPerPage);
      setStatuses(paginatedStatuses);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast.error("Failed to load construction statuses.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleGlobalSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setIsSearching(true);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAdd = () => {
    navigate("/settings/construction-status");
  };

  const handleEdit = (id) => {
    navigate(`/settings/construction-status-edit/${id}`);
  };

  const handleToggle = async (id, currentStatus) => {
    toast.dismiss();
    const updatedStatus = !currentStatus;
    try {
      await axios.put(`${baseURL}/construction_statuses/${id}.json`, {
        construction_status: { active: updatedStatus },
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Status updated successfully!");
      fetchStatuses(); // Refetch to maintain consistency
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "construction_status", label: "Status Name", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item, columnKey) => {
    const index = statuses.findIndex(s => s.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            {/* {constructionStatusPermissions.update === "true" && ( */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(item.id)}
                className="h-8 w-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
              </Button>
            {/* )} */}
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "construction_status":
        return <span>{item.construction_status || "-"}</span>;
      case "status":
        return (
         <button
  type="button"
  onClick={() => handleToggle(item.id, item.active)}
  style={{
    width: "32px",          
    height: "12px",         
    backgroundColor: "#e5e5e5",
    borderRadius: "999px",
    border: "none",
    padding: "0",
    cursor: "pointer",
    position: "relative",
  }}
>
  <span
    style={{
      width: "14px",        
      height: "14px",
      borderRadius: "50%",
      backgroundColor: "#d32f2f",
      position: "absolute",
      top: "-1px",          
      left: "0px",
      transform: item.active ? "translateX(18px)" : "translateX(0px)",
      transition: "transform 0.2s ease",
    }}
  />
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
        data={statuses}
        columns={columns}
        renderCell={renderCell}
        enableExport={false}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        leftActions={renderCustomActions()}
        loading={loading}
        loadingMessage="Loading construction statuses..."
      />
      {!loading && statuses.length > 0 && totalPages > 1 && (
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

export default ConstructionStatusList;
