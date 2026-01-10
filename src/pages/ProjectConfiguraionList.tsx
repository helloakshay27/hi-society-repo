
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
import { Switch } from "@mui/material";

const ProjectConfigurationList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectConfigurationPermission, setProjectConfigurationPermission] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const getProjectConfigurationPermission = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.project_config || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const permissions = getProjectConfigurationPermission();
    setProjectConfigurationPermission(permissions);
  }, []);

  const fetchConfigurations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/configuration_setups.json`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      let allConfigurations = response.data || [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allConfigurations = allConfigurations.filter((config) =>
          config.name?.toLowerCase().includes(query)
        );
      }

      setTotalCount(allConfigurations.length);
      setTotalPages(Math.ceil(allConfigurations.length / itemsPerPage) || 1);

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedConfigurations = allConfigurations.slice(startIndex, startIndex + itemsPerPage);
      setConfigurations(paginatedConfigurations);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to fetch project configurations");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

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
    navigate("/settings/project-configuration");
  };

  const handleEdit = (id) => {
    navigate(`/settings/project-configuration-edit/${id}`);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    toast.dismiss();
    try {
      await axios.patch(`${baseURL}/configuration_setups/${id}.json`, {
        active: !currentStatus,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
      });
      toast.success("Status updated successfully!");
      fetchConfigurations(); // Refetch to maintain consistency
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "attachment", label: "Attachment", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const renderCell = (item, columnKey) => {
    const index = configurations.findIndex(c => c.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            {/* {projectConfigurationPermission.update === "true" && ( */}
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
      case "name":
        return <span>{item.name || "-"}</span>;
      case "attachment":
        return (
          <div className="flex justify-center">
            {item.attachfile?.document_file_name ? (
              item.attachfile.document_content_type?.startsWith("image/") ? (
                <img
                  src={item.attachfile.document_url}
                  alt="Attachment"
                  className="rounded-lg border border-gray-200"
                  style={{ width: "80px", height: "80px", objectFit: "cover" }}
                />
              ) : (
                <a
                  href={item.attachfile.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  {item.attachfile.document_file_name}
                </a>
              )
            ) : (
              <span className="text-sm text-gray-500 italic">No attachment</span>
            )}
          </div>
        );
      case "status":
        return (
          <Switch
            checked={item.active}
            onChange={(e) => handleToggleStatus(item.id, item.active)}
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
        data={configurations}
        columns={columns}
        renderCell={renderCell}
        enableExport={false}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        leftActions={renderCustomActions()}
        loading={loading}
        loadingMessage="Loading project configurations..."
      />
      {!loading && configurations.length > 0 && totalPages > 1 && (
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

export default ProjectConfigurationList;
