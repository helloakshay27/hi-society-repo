import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "../components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/utils/apiClient";

interface Question {
  id: number;
  descr: string;
  qtype: string;
  quest_mandatory: boolean;
  img_mandatory: boolean;
  qnumber: number;
  options: Array<{
    id: number;
    qname: string;
    option_type: string;
    active: number;
  }>;
}

interface FitoutChecklistItem {
  id: number;
  name: string;
  check_type: string;
  active: number;
  company_id: number;
  project_id: number;
  resource_type: string;
  resource_id: number;
  snag_audit_category_id: number;
  snag_audit_sub_category_id: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
  category_name: string;
  sub_category_name: string;
  questions: Question[];
}

interface FilterState {
  checklistName: string;
  categoryId: string;
  checkType: string;
}

const FitoutChecklists: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<FitoutChecklistItem[]>([]);
  const [allChecklists, setAllChecklists] = useState<FitoutChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    checklistName: "",
    categoryId: "all",
    checkType: "Fitout",
  });

  useEffect(() => {
    fetchChecklistData();
  }, []);

  const fetchChecklistData = useCallback(
    async (filters?: FilterState) => {
      try {
        setLoading(true);
        let url = `/crm/admin/snag_checklists.json?check_type=Fitout`;

        if (filters) {
          if (filters.checklistName) {
            url += `&q[name_cont]=${encodeURIComponent(filters.checklistName)}`;
          }
          if (filters.categoryId && filters.categoryId !== "all") {
            url += `&q[category_name_eq]=${filters.categoryId}`;
          }
        }

        const response = await apiClient.get(url);
        console.log("Fitout Checklist response:", response.data);
        const checklistData = response.data.data || [];

        setAllChecklists(checklistData);
        setTotalPages(Math.ceil(checklistData.length / itemsPerPage));
      } catch (error) {
        console.error("Error fetching Fitout Checklist data:", error);
        setChecklists([]);
        toast({
          title: "Error",
          description: "Failed to fetch Fitout Checklist data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddChecklist = () => {
    navigate(`/fitout/checklists/add`);
  };

  const handleExportChecklists = useCallback(async () => {
    try {
      let url = `/crm/admin/snag_checklists.xlsx?check_type=Fitout&export=true`;

      if (appliedFilters.checklistName) {
        url += `&q[name_cont]=${encodeURIComponent(appliedFilters.checklistName)}`;
      }
      if (appliedFilters.categoryId && appliedFilters.categoryId !== "all") {
        url += `&q[category_name_eq]=${appliedFilters.categoryId}`;
      }

      const response = await apiClient.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "fitout-checklist-data.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Export Successful",
        description: "Fitout Checklist data has been exported successfully",
      });
    } catch (error) {
      console.error("Error exporting checklists:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export checklist data",
        variant: "destructive",
      });
    }
  }, [appliedFilters, toast]);

  const handleRowAction = (action: string, checklistId: number) => {
    console.log(`${action} action for Checklist ${checklistId}`);
    if (action === "Edit") {
      navigate(`/fitout/checklists/edit/${checklistId}`);
    } else if (action === "View") {
      navigate(`/fitout/checklists/details/${checklistId}`);
    } else {
      toast({
        title: `${action} Action`,
        description: `${action} action performed for Checklist ${checklistId}`,
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        draggable: false,
        defaultVisible: true,
      },
      {
        key: "name",
        label: "Checklist Name",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "check_type",
        label: "Check Type",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "category_name",
        label: "Category",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "sub_category_name",
        label: "Sub Category",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "questions_count",
        label: "No. of Questions",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: "active",
        label: "Status",
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  const renderCell = useCallback(
    (item: FitoutChecklistItem, columnKey: string) => {
      switch (columnKey) {
        case "actions":
          return (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handleRowAction("View", item.id)}
                className="p-1 text-black-600 hover:text-black-800"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRowAction("Edit", item.id)}
                className="p-1 text-black-600 hover:text-black-800"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          );
        case "name":
          return <span>{item.name}</span>;
        case "check_type":
          return <span className="capitalize">{item.check_type || "-"}</span>;
        case "category_name":
          return <span>{item.category_name || "-"}</span>;
        case "sub_category_name":
          return <span>{item.sub_category_name || "-"}</span>;
        case "questions_count":
          return <div className="text-center">{item.questions?.length || 0}</div>;
        case "created_at":
          return (
            <span>
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </span>
          );
        case "active":
          return (
            <span
              className={`font-medium ${
                item.active === 1 ? "text-green-600" : "text-red-600"
              }`}
            >
              {item.active === 1 ? "Active" : "Inactive"}
            </span>
          );
        default:
          const value = item[columnKey as keyof FitoutChecklistItem];
          return (
            <span>
              {value !== null && value !== undefined ? String(value) : "-"}
            </span>
          );
      }
    },
    [navigate, toast]
  );

  const filteredChecklists = useMemo(() => {
    let filtered = allChecklists;
    
    // Apply search filter
    if (searchTerm) {
      filtered = allChecklists.filter((checklist) => {
        const matchesSearch =
          checklist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (checklist.category_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (checklist.sub_category_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    }
    
    // Update total pages based on filtered results
    const pages = Math.ceil(filtered.length / itemsPerPage);
    if (pages !== totalPages) {
      setTotalPages(pages);
    }
    
    // Apply pagination only when not searching
    if (!searchTerm) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filtered.slice(startIndex, endIndex);
    }
    
    return filtered;
  }, [allChecklists, searchTerm, currentPage, itemsPerPage, totalPages]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="text-center py-8">Loading fitout checklists...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Heading level="h1" variant="default">
            Fitout Checklists
          </Heading>
        </div>
      </div>

      <div>
        <EnhancedTable
          data={filteredChecklists}
          columns={columns}
          selectable={false}
          getItemId={(item) => item.id.toString()}
          renderCell={renderCell}
          storageKey="fitout-checklist-table-v1"
          enableExport={true}
          exportFileName="fitout-checklist-data"
          enableGlobalSearch={true}
          onGlobalSearch={handleGlobalSearch}
          searchPlaceholder="Search checklists..."
          pagination={false}
          leftActions={
            <div className="flex flex-wrap items-center gap-2 md:gap-4">
              <Button
                onClick={handleAddChecklist}
                className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
              {/* <Button
                onClick={() => navigate('/fitout/categories-subcategories')}
                className="flex items-center gap-2 bg-[#F2EEE9] text-[#BF213E] border-0 hover:bg-[#F2EEE9]/80"
              >
                <Settings className="w-4 h-4" />
                Add Categories & Subcategories
              </Button> */}
            </div>
          }
          handleExport={handleExportChecklists}
          loading={loading}
        />
        {!searchTerm && totalPages > 1 && (
          <div className="mt-3 flex justify-center">
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
    </div>
  );
};

export default FitoutChecklists;
