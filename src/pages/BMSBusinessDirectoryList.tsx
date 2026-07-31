import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { BMSBusinessDirectoryFilterModal } from "@/components/BMSBusinessDirectoryFilterModal";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BusinessDirectory {
  id: string;
  company_name: string;
  category: string;
  sub_category: string;
  contact_name: string;
  mobile: string;
  key_offering: string;
  active: boolean;
}

const PAGE_SIZE = 10;

const renderPaginationItems = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) => {
  if (!totalPages || totalPages <= 0) {
    return null;
  }
  const items = [];
  const showEllipsis = totalPages > 7;

  if (showEllipsis) {
    items.push(
      <PaginationItem key={1} className="cursor-pointer">
        <PaginationLink onClick={() => onPageChange(1)} isActive={currentPage === 1}>
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
            <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
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
            <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
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
              <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
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
          <PaginationLink onClick={() => onPageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
  } else {
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <PaginationItem key={i} className="cursor-pointer">
          <PaginationLink onClick={() => onPageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
  }

  return items;
};

const columns = [
  { key: "company_name", label: "Company Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "sub_category", label: "Sub Category", sortable: true },
  { key: "contact_name", label: "Contact Person", sortable: true },
  { key: "mobile", label: "Mobile", sortable: false },
  { key: "key_offering", label: "Key Offerings", sortable: false },
  { key: "active", label: "Status", sortable: false },
];

const BMSBusinessDirectoryList: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl")
  const token = localStorage.getItem("token")

  const navigate = useNavigate();
  const [directories, setDirectories] = useState<BusinessDirectory[]>([]);
  const [loading, setLoading] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    subCategory: '',
    status: '',
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDirectories = React.useMemo(() => {
    if (!searchTerm.trim()) return directories;
    const query = searchTerm.toLowerCase();
    return directories.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [directories, searchTerm]);

  const totalPages = Math.ceil(filteredDirectories.length / PAGE_SIZE) || 1;
  const paginatedDirectories = filteredDirectories.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const fetchDirectories = async (filters = appliedFilters) => {
    try {
      setLoading(true)
      const params: any = {};

      if (filters.category) {
        params["q[category_id_eq]"] = filters.category;
      }
      if (filters.subCategory) {
        params["q[sub_category_id_eq]"] = filters.subCategory;
      }
      if (filters.status !== '') {
        params["q[active_eq]"] = filters.status;
      }

      const response = await axios.get(`https://${baseUrl}/crm/admin/business_directories.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      })
      setDirectories(response.data.business_directories)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch directories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDirectories()
  }, [])

  const handleAdd = () => {
    navigate("/bms/business-directory/add");
  };

  const handleFilters = () => {
    setIsFilterModalOpen(true);
  };

  const handleFilterApply = (filters: any) => {
    setAppliedFilters(filters);
    fetchDirectories(filters);
  };

  const handleView = (item: BusinessDirectory) => {
    navigate(`/business-directory/view/${item.id}`);
  };

  const handleToggleStatus = async (item: BusinessDirectory, checked: boolean) => {
    try {
      const payload = {
        business_directory: {
          active: checked
        }
      }
      await axios.put(`https://${baseUrl}/crm/admin/business_directories/${item.id}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setDirectories(prev => prev.map(d => d.id === item.id ? { ...d, active: checked } : d));
      toast.success(
        `${item.company_name} status ${checked ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const renderActions = (item: BusinessDirectory) => {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleView(item)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
    )
  }

  const renderCell = (item: BusinessDirectory, columnKey: string) => {
    switch (columnKey) {
      case "key_offering":
        return (
          <div className="text-sm text-gray-600 max-w-[200px] truncate">{item.key_offering}</div>
        );
      case "active":
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleToggleStatus(item, !item.active)}
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
      default:
        return item[columnKey as keyof BusinessDirectory];
    }
  };

  const renderLeftActions = (
    <div className="flex gap-2">
      <Button
        onClick={handleAdd}
        className="bg-[#C72030] hover:bg-[#A01828] !text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <EnhancedTable
        data={paginatedDirectories}
        columns={columns}
        renderActions={renderActions}
        renderCell={renderCell}
        searchPlaceholder="Search"
        enableSearch={true}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onFilterClick={handleFilters}
        leftActions={renderLeftActions}
        loading={loading}
        emptyMessage="No businesses found"
        pagination={false}
      />

      <div className="mt-4 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {renderPaginationItems(currentPage, totalPages, handlePageChange)}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <BMSBusinessDirectoryFilterModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        onApply={handleFilterApply}
      />
    </div>
  );
};

export default BMSBusinessDirectoryList;
