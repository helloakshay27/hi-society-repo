import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

const AmenitiesList = () => {
  const { shouldShow } = useDynamicPermissions();
  const baseURL = API_CONFIG.BASE_URL;
  const [amenities, setAmenities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [amenitiesPermissions, setAmenitiesPermissions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const getAmenitiesPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.amenities || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    const permissions = getAmenitiesPermissions();
    setAmenitiesPermissions(permissions);
  }, []);

  const fetchAmenities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseURL}/amenity_setups.json`, {
        headers: {
                                 Authorization: getAuthHeader(),
                               },
      });
      let allAmenities = response.data.amenities_setups || [];

      // Client-side search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        allAmenities = allAmenities.filter((amenity) =>
          amenity.name?.toLowerCase().includes(query)
        );
      }

      setTotalCount(allAmenities.length);
      setTotalPages(Math.ceil(allAmenities.length / itemsPerPage) || 1);

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedAmenities = allAmenities.slice(startIndex, startIndex + itemsPerPage);
      setAmenities(paginatedAmenities);
    } catch (err) {
      console.error("Error fetching amenities:", err);
      toast.error("Failed to fetch amenities data");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL, searchTerm, currentPage]);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

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

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const handleAdd = () => {
    navigate("/settings/amenities");
  };

  const handleEdit = (id) => {
    navigate(`/settings/amenities-edit/${id}`);
  };

  const handleToggle = async (id, currentStatus) => {
    const updatedStatus = !currentStatus;
    try {
      await axios.put(`${baseURL}/amenity_setups/${id}.json`, {
        amenity_setup: { active: updatedStatus },
      }, {
        headers: {
                                 Authorization: getAuthHeader(),
                               },
      });

      fetchAmenities();
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleNightModeToggle = async (id, currentNightMode) => {
    try {
      const updatedValue = !currentNightMode;

      await axios.put(`${baseURL}/amenity_setups/${id}.json`, {
        amenity_setup: {
          night_mode: updatedValue,
        },
      }, {
        headers: {
                                 Authorization: getAuthHeader(),
                               },
      });

      fetchAmenities();
      toast.success(`Night Mode ${updatedValue ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error("Failed to toggle night mode");
      console.error(err);
    }
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "Sr No", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "icon", label: "Icon", sortable: false },
    { key: "dark_mode_icon", label: "Dark Mode Icon", sortable: false },
    { key: "status", label: "Status", sortable: false },
    // { key: "night_mode", label: "Night Mode", sortable: false },
  ];

  const renderCell = (item, columnKey) => {
    const index = amenities.findIndex(a => a.id === item.id);
    const startIndex = (currentPage - 1) * itemsPerPage;

    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-2">
            {shouldShow("Amenities", "update") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(item.id)}
                className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case "id":
        return <span className="font-medium">{startIndex + index + 1}</span>;
      case "name":
        return <span>{item.name || "-"}</span>;
      case "icon":
        return (
          <div className="flex justify-center">
            {item.icon_url ? (
              <img
                src={item.icon_url}
                alt={item.name}
                className="rounded-lg border border-gray-200"
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">No Icon</span>
            )}
          </div>
        );
      case "dark_mode_icon":
        return (
          <div className="flex justify-center">
            {item.dark_mode_icon_url ? (
              <img
                src={item.dark_mode_icon_url}
                alt={item.name}
                className="rounded-lg border border-gray-200"
                style={{ width: "60px", height: "60px", objectFit: "cover" }}
              />
            ) : (
              <span className="text-sm text-gray-500 italic">No Icon</span>
            )}
          </div>
        );
      case "status":
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleToggle(item.id, item.active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.active ? "bg-[#C72030]" : "bg-gray-300"
              }`}
            >
              <div
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      case "night_mode":
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleNightModeToggle(item.id, item.night_mode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                item.night_mode ? "bg-[#C72030]" : "bg-gray-300"
              }`}
            >
              <div
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.night_mode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCustomActions = () => (
    <>
      {shouldShow("Amenities", "create") && (
        <Button
          onClick={handleAdd}
variant="ghost"
           className="btn-primary h-9 px-4 text-sm font-medium"         >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      )}
    </>
  );

  const renderListTab = () => (
    <div className="space-y-6">
      <EnhancedTable
        data={amenities}
        columns={columns}
        renderCell={renderCell}
        enableExport={false}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        leftActions={renderCustomActions()}
        loading={loading}
        loadingMessage="Loading amenities..."
      />
      {totalCount > 0 && (
        <div className="flex items-center justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

export default AmenitiesList;
