import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/apiConfig";
import { Toaster, toast } from "sonner";
import { ChevronRight, ArrowLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";

interface Company {
  id: number;
  name: string;
  active: boolean;
  attachfile?: {
    document_url?: string;
  };
}

interface Permissions {
  create?: string;
  update?: string;
  delete?: string;
}

const CompanyList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const itemsPerPage = 10;

  const getCompanyPermission = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissionsData = JSON.parse(lockRolePermissions);
      return permissionsData.company || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const perms = getCompanyPermission();
    console.log("Company permissions:", perms);
    setPermissions(perms);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/company_setups.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const allCompanies = response.data.company_setups || [];
      
      let filteredItems = allCompanies;
      if (searchTerm.trim()) {
        filteredItems = allCompanies.filter((company: Company) =>
          company.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      console.error("Error fetching companies:", error);
      toast.error("Failed to fetch companies");
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
    navigate("/setup-member/company-create");
  };

  const handleEdit = (item: Company) => {
    navigate(`/company-edit/${item.id}`);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    const updatedStatus = !currentStatus;

    try {
      await axios.put(
        `${baseURL}/company_setups/${id}.json`,
        { company_setup: { active: updatedStatus } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      toast.success("Status updated successfully!");
      fetchItems();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleClearSelection = () => {
    setShowActionPanel(false);
  };

  const columns = [
    { key: "srNo", label: "Sr No", width: "100px" },
    { key: "name", label: "Company Name", minWidth: "200px" },
    { key: "logo", label: "Logo", width: "150px", align: "center" as const },
  ];

  const renderCell = (item: Company, columnKey: string, index: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "srNo":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "name":
        return <span>{item.name || "-"}</span>;
      case "logo":
        return (
          <div className="flex justify-center items-center">
            {item.attachfile?.document_url ? (
              <img
                src={item.attachfile.document_url}
                alt={item.name || "Company Logo"}
                className="rounded-lg border border-gray-200"
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "contain",
                }}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">No Logo</span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderCustomActions = (item: Company) => (
    <div className="flex items-center gap-2">
      {permissions.update === "true" && (
        <button
          onClick={() => handleEdit(item)}
          className="text-gray-600 hover:text-[#C72030] transition-colors"
          title="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
      )}
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
            <span className="text-[#C72030] font-medium">Company</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">COMPANY</h1>
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
            searchPlaceholder="Search companies..."
            showSelection={false}
            renderCustomActions={renderCustomActions}
            emptyMessage={
              isSearching
                ? "No companies found matching your search"
                : "No companies found"
            }
            customAddButton={
              permissions.create === "true" ? (
                <Button
                  onClick={handleAdd}
                  style={{ backgroundColor: "#C72030" }}
                  className="hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </Button>
              ) : undefined
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

export default CompanyList;
