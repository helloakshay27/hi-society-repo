import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { API_CONFIG } from "@/config/apiConfig";
import { ChevronRight, ArrowLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";

interface Organization {
  id: number;
  name: string;
  domain?: string;
  sub_domain?: string;
  mobile?: string;
  attachfile?: {
    document_url?: string;
  };
}

interface Permissions {
  create?: string;
  update?: string;
  delete?: string;
}

const OrganizationList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const itemsPerPage = 10;

  const getOrganizationPermission = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};
  
      const permissionsData = JSON.parse(lockRolePermissions);
      return permissionsData.organization || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const perms = getOrganizationPermission();
    console.log("Organization permissions:", perms);
    setPermissions(perms);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/organizations.json`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      
      let allOrgs: Organization[] = [];
      if (Array.isArray(data)) {
        allOrgs = data;
      } else if (data?.organizations && Array.isArray(data.organizations)) {
        allOrgs = data.organizations;
      } else {
        console.error("Unexpected API response format:", data);
      }

      let filteredItems = allOrgs;
      if (searchTerm.trim()) {
        filteredItems = allOrgs.filter((org) =>
          org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.sub_domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.mobile?.includes(searchTerm)
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
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
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
    navigate("/setup-member/organization-create");
  };

  const handleEdit = (item: Organization) => {
    navigate(`/organization-update/${item.id}`);
  };

  const handleClearSelection = () => {
    setShowActionPanel(false);
  };

  const columns = [
    { key: "srNo", label: "Sr No", width: "80px" },
    { key: "name", label: "Name", minWidth: "180px" },
    { key: "domain", label: "Domain", minWidth: "150px" },
    { key: "subDomain", label: "Sub Domain", minWidth: "150px" },
    { key: "attachment", label: "Attachment", width: "120px", align: "center" as const },
    { key: "mobile", label: "Mobile Number", width: "150px" },
  ];

  const renderCell = (item: Organization, columnKey: string, index: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "srNo":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "name":
        return <span>{item.name || "-"}</span>;
      case "domain":
        return <span>{item.domain || "-"}</span>;
      case "subDomain":
        return <span>{item.sub_domain || "-"}</span>;
      case "attachment":
        return (
          <div className="flex justify-center items-center">
            {item.attachfile?.document_url ? (
              <img
                src={item.attachfile.document_url}
                alt="Organization Logo"
                className="rounded-lg border border-gray-200"
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">No Logo</span>
            )}
          </div>
        );
      case "mobile":
        return <span>{item.mobile || "N/A"}</span>;
      default:
        return null;
    }
  };

  const renderCustomActions = (item: Organization) => {
    if (permissions.update !== "true") return null;
    
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleEdit(item)}
          className="text-gray-600 hover:text-[#C72030] transition-colors"
          title="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>
    );
  };

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
            <span className="text-[#C72030] font-medium">Organization</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ORGANIZATION</h1>
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
            searchPlaceholder="Search organizations..."
            showSelection={false}
            renderCustomActions={renderCustomActions}
            emptyMessage={
              isSearching
                ? "No organizations found matching your search"
                : "No organizations found"
            }
            customAddButton={
              permissions.create === "true" ? (
                <Button
                  onClick={handleAdd}
                  style={{ backgroundColor: "#C72030" }}
                  className="hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Organization
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

export default OrganizationList;
