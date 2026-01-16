import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, getAuthHeader, getFullUrl } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { Switch } from "@mui/material";


const ImageConfig = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const [imageConfigs, setImageConfigs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageConfigPermissions, setImageConfigPermissions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const getImageConfigPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.image_config || {}; // Fetching image config specific permissions
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const permissions = getImageConfigPermissions();
    setImageConfigPermissions(permissions);
  }, []);

  const fetchImageConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/system_constants.json?q[description_eq]=ImagesConfiguration`, {
       headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json',
              },
      });

      let allConfigs = response.data || [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allConfigs = allConfigs.filter((config) =>
          config.name?.toLowerCase().includes(query) ||
          config.value?.toLowerCase().includes(query)
        );
      }

      setTotalCount(allConfigs.length);
      setTotalPages(Math.ceil(allConfigs.length / itemsPerPage) || 1);

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedConfigs = allConfigs.slice(startIndex, startIndex + itemsPerPage);
      setImageConfigs(paginatedConfigs);
    } catch (err) {
      console.error("Error fetching image configurations:", err);
      toast.error("Failed to fetch image configuration data");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchImageConfigs();
  }, [fetchImageConfigs]);

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
    navigate("/settings/image-config-create");
  };

  const handleEdit = (id) => {
    navigate(`/settings/image-config-edit/${id}`);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this image configuration?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${baseURL}/system_constants/${id}.json`, {
         headers: {
                  'Authorization': getAuthHeader(),
                  'Content-Type': 'application/json',
                },
      });
      toast.success("Image configuration deleted successfully!");
      fetchImageConfigs();
    } catch (error) {
      console.error("Error deleting image configuration:", error);
      toast.error("Error deleting image configuration. Please try again.");
    }
  };

  const handleToggleActive = async (id, currentValue) => {
    try {
      setImageConfigs(prevConfigs =>
        prevConfigs.map(config =>
          config.id === id
            ? { ...config, active: !currentValue }
            : config
        )
      );

      const response = await axios.patch(`${baseURL}/system_constants/${id}.json`, 
        { system_constant: { active: !currentValue } },
        {
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to update active status');
      }

      toast.success(`Image configuration ${!currentValue ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating active status:', error);
      toast.error('Failed to update configuration status');
      setImageConfigs(prevConfigs =>
        prevConfigs.map(config =>
          config.id === id
            ? { ...config, active: currentValue }
            : config
        )
      );
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "value", label: "Value", sortable: true },
    { key: "description", label: "Description", sortable: false },
    { key: "active", label: "Active/Inactive", sortable: false },
  ];

  const renderCell = (item, columnKey) => {
    const index = imageConfigs.findIndex(c => c.id === item.id);
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
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item.id)}
              className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button> */}
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "name":
        return <span>{item.name || "-"}</span>;
      case "value":
        return <span>{item.value || "-"}</span>;
      case "description":
        return <span>{item.description || "-"}</span>;
      case "active":
        return (
          <Switch
            checked={item.active || false}
            onChange={() => handleToggleActive(item.id, item.active)}
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
        data={imageConfigs}
        columns={columns}
        renderCell={renderCell}
        enableExport={false}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        leftActions={renderCustomActions()}
        loading={loading}
        loadingMessage="Loading image configurations..."
      />
      {!loading && imageConfigs.length > 0 && totalPages > 1 && (
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

export default ImageConfig;