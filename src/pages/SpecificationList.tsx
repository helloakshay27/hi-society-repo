import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";

interface Specification {
  id: number;
  name: string;
  icon_url?: string;
}

interface Permissions {
  create?: string;
  update?: string;
  delete?: string;
}

const SpecificationList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  
  const [items, setItems] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const itemsPerPage = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/specification_setups.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const allItems = response.data?.specification_setups || [];
      
      let filteredItems = allItems;
      if (searchTerm.trim()) {
        filteredItems = allItems.filter((item: Specification) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }

      const total = filteredItems.length;
      const pages = Math.ceil(total / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

      setItems(paginatedItems);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (error) {
      console.error("Error fetching specifications:", error);
      toast.error("Failed to fetch specifications");
      setItems([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [baseURL, currentPage, searchTerm]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAdd = () => {
    navigate("/setup-member/specification");
  };

  const handleEdit = (item: Specification) => {
    navigate(`/specification-update/${item.id}`);
  };

  const handleDelete = async (item: Specification) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this specification?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${baseURL}/specification_setups/${item.id}.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      toast.success("Specification deleted successfully!");
      fetchItems();
    } catch (error) {
      console.error("Error deleting specification:", error);
      toast.error("Error deleting specification. Please try again.");
    }
  };

  const handleClearSelection = () => {
    setShowActionPanel(false);
  };

  const columns = [
    { key: "srNo", label: "Sr No", width: "100px" },
    { key: "name", label: "Name", minWidth: "200px" },
    { key: "icon", label: "Icon", width: "150px", align: "center" as const },
  ];

  const renderCell = (item: Specification, columnKey: string, index: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "srNo":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "name":
        return <span>{item.name || "N/A"}</span>;
      case "icon":
        return (
          <div className="flex justify-center items-center">
            {item.icon_url ? (
              <img
                src={item.icon_url}
                alt="icon"
                className="rounded-lg border border-gray-200"
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">No Icon</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderCustomActions = (item: Specification) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleEdit(item)}
        className="text-gray-600 hover:text-[#C72030] transition-colors"
        title="Edit"
      >
        <Pencil className="w-5 h-5" />
      </button>
      <button
        onClick={() => handleDelete(item)}
        className="text-gray-600 hover:text-red-600 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );

  const renderListTab = () => (
    <div className="h-full bg-gray-50">
      <div className="p-6 max-w-full h-[calc(100vh-50px)] overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-[#C72030] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">Setup</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#C72030] font-medium">Specification</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SPECIFICATION</h1>
        </div>


          <EnhancedTable
            data={items}
            columns={columns}
            renderCell={renderCell}
            loading={loading}
            onGlobalSearch={handleGlobalSearch}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            searchPlaceholder="Search specifications..."
            showSelection={false}
            renderCustomActions={renderCustomActions}
            emptyMessage={
              isSearching
                ? "No specifications found matching your search"
                : "No specifications found"
            }
            customAddButton={
              <Button
                onClick={handleAdd}
                style={{ backgroundColor: "#C72030" }}
                className="hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Specification
              </Button>
            }
          />
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      {renderListTab()}
    </>
  );
};

export default SpecificationList;
