import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { SelectionPanel } from "@/components/water-asset-details/PannelTab";

interface Testimonial {
  id: number;
  user_name: string;
  content: string;
  active: boolean;
  show_on_home: boolean;
  created_at: string;
  updated_at: string;
}

interface TestimonialPermissions {
  create?: string;
  update?: string;
  delete?: string;
  show?: string;
}

const TestimonialList = () => {
  const baseURL = API_CONFIG.BASE_URL;
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [testimonialPermissions, setTestimonialPermissions] = useState<TestimonialPermissions>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const getTestimonialPermissions = () => {
    try {
      const lockRolePermissions = localStorage.getItem("lock_role_permissions");
      if (!lockRolePermissions) return {};

      const permissions = JSON.parse(lockRolePermissions);
      return permissions.testimonial || {};
    } catch (e) {
      console.error("Error parsing lock_role_permissions:", e);
      return {};
    }
  };

  useEffect(() => {
    setTestimonialPermissions(getTestimonialPermissions());
  }, []);

  const fetchTestimonials = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await axios.get(`${baseURL}testimonials.json?company_id=1`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      const testimonialsData = response.data.testimonials || [];

      // Client-side search filtering
      let filteredTestimonials = testimonialsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTestimonials = testimonialsData.filter((testimonial: Testimonial) =>
          testimonial.user_name?.toLowerCase().includes(searchLower) ||
          testimonial.content?.toLowerCase().includes(searchLower)
        );
      }

      // Client-side pagination
      const itemsPerPage = 10;
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedTestimonials = filteredTestimonials.slice(startIndex, endIndex);

      setTestimonials(paginatedTestimonials);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredTestimonials.length / itemsPerPage));
      setTotalCount(filteredTestimonials.length);

      // Cache all testimonials
      sessionStorage.setItem('cached_testimonials', JSON.stringify(testimonialsData));
    } catch (error) {
      toast.error("Failed to fetch testimonials.");
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [baseURL]);

  useEffect(() => {
    fetchTestimonials(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchTestimonials]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddTestimonial = () => navigate("/setup-member/testimonials");
  const handleEditTestimonial = (id: number) => navigate("/setup-member/testimonial-edit", { state: { testimonial: testimonials.find(t => t.id === id) } });
  const handleClearSelection = () => { setShowActionPanel(false); };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      await axios.put(
        `${baseURL}testimonials/${id}.json`,
        { testimonial: { active: !currentStatus } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      fetchTestimonials(currentPage, searchTerm);
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error toggling testimonial status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleToggleShow = async (id: number, currentStatus: boolean) => {
    toast.dismiss();
    try {
      await axios.put(
        `${baseURL}testimonials/${id}.json`,
        { testimonial: { show_on_home: !currentStatus } },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      fetchTestimonials(currentPage, searchTerm);
      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      let errorMessage = "An error occurred.";
      if (error.response && error.response.status === 400) {
        const errors = error.response.data.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.join(" ");
        } else if (typeof errors === "string") {
          errorMessage = errors;
        }
      }
      toast.error(errorMessage);
    }
  };

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'id', label: 'Sr No', sortable: true },
    { key: 'user_name', label: 'User Name', sortable: true },
    { key: 'content', label: 'Content', sortable: false },
    { key: 'active', label: 'Active', sortable: false },
    { key: 'show_on_home', label: 'Show on Home', sortable: false },
  ];

  const renderCell = (item: Testimonial, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-1">
            {testimonialPermissions.update === "true" && (
              <Button variant="ghost" size="sm" onClick={() => handleEditTestimonial(item.id)} title="Edit">
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      case 'user_name':
        return item.user_name || "-";
      case 'content':
        return (
          <div style={{ maxWidth: "300px", wordWrap: "break-word", whiteSpace: "normal" }}>
            {item.content || "-"}
          </div>
        );
      case 'active':
        return (
          <button
            onClick={() => handleToggle(item.id, item.active)}
            className="toggle-button"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              width: "70px",
            }}
          >
            {item.active ? (
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
      case 'show_on_home':
        return (
          <button
            onClick={() => handleToggleShow(item.id, item.show_on_home)}
            className="toggle-button"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 0,
              width: "70px",
            }}
          >
            {item.show_on_home ? (
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
        return item[columnKey as keyof Testimonial] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button 
        onClick={() => setShowActionPanel((prev) => !prev)}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
        Action
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      {showActionPanel && (
        <SelectionPanel
          onAdd={handleAddTestimonial}
          onClearSelection={handleClearSelection}
        />
      )}
      <>
        <EnhancedTable
          data={testimonials}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="testimonials"
          storageKey="testimonials-table"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search testimonials..."
          leftActions={renderCustomActions()}
          loading={isSearching || loading}
          loadingMessage={isSearching ? "Searching testimonials..." : "Loading testimonials..."}
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
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
      </>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default TestimonialList;
