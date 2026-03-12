import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { CommonImportModal } from "@/components/CommonImportModal";
import { AddFlatDialog } from "./manage-flats-dialogs/AddFlatDialog";
import { EditFlatDialog } from "./manage-flats-dialogs/EditFlatDialog";
import { ConfigureTowerDialog } from "./manage-flats-dialogs/ConfigureTowerDialog";
import { ConfigureFlatTypeDialog } from "./manage-flats-dialogs/ConfigureFlatTypeDialog";
import { FiltersDialog } from "./manage-flats-dialogs/FiltersDialog";
import { ActionsModal } from "./manage-flats-dialogs/ActionsModal";
import { toast } from "sonner";
import { getFullUrl } from "@/config/apiConfig";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Column configuration matching the image
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
  { key: "id", label: "Id", sortable: false, draggable: false },
  { key: "block_no", label: "Tower", sortable: true, draggable: true },
  { key: "flat_no", label: "Flat", sortable: true, draggable: true },
  { key: "flat_type", label: "Flat Type", sortable: true, draggable: true },
  { key: "super_area", label: "Built Up Area(Sq.Ft)", sortable: true, draggable: true },
  { key: "build_up_area", label: "Carpet Area(Sq.Ft)", sortable: true, draggable: true },
  { key: "bill_to_party", label: "Name On Bill", sortable: true, draggable: true },
  { key: "possession", label: "Possession", sortable: true, draggable: true },
  { key: "occupancy", label: "Occupancy", sortable: true, draggable: true },
  { key: "lives_here_user", label: "Occupied By", sortable: true, draggable: true },
  { key: "ownership", label: "Owner/Tenant", sortable: true, draggable: true },
  { key: "site_visits", label: "Site Visits", sortable: true, draggable: true },
  { key: "sold", label: "Sold", sortable: true, draggable: true },
  { key: "status", label: "Status", sortable: true, draggable: true },
];

interface FlatType {
  id: number;
  flatUnitType: string;
  apartmentType: string;
  status: boolean;
}

export const ManageFlatsPage = () => {
  const navigate = useNavigate();
  const baseUrl = localStorage.getItem("baseUrl")
  const token = localStorage.getItem("token")

  const [flats, setFlats] = useState([]);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigureDialog, setShowConfigureDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_count: 0,
    total_pages: 0,
  });

  // Add/Edit Flat Dialog states
  const [showAddFlatDialog, setShowAddFlatDialog] = useState(false);
  const [showEditFlatDialog, setShowEditFlatDialog] = useState(false);
  const [editingFlatId, setEditingFlatId] = useState<string | null>(null);

  // Configure Tower Dialog states
  const [showConfigureTowerDialog, setShowConfigureTowerDialog] = useState(false);
  const [editingTower, setEditingTower] = useState<number | null>(null);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [filters, setFilters] = useState({
    tower: [],
    flat: [],
    flatType: [],
    status: [],
    occupancy: "",
  });
  const [towerOptions, setTowerOptions] = useState([]);
  const [flatTypeOptions, setFlatTypeOptions] = useState([]);
  const [flatOptions, setFlatOptions] = useState<{ label: string; value: string }[]>([]);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);

  const fetchTowers = async () => {
    try {
      const response = await axios.get(
        `https://${baseUrl}/crm/admin/society_blocks.json?society_id=${localStorage.getItem(
          "selectedSocietyId"
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTowerOptions(response.data.society_blocks.map((t: any) => ({ id: t.id, name: t.name })));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchFlatTypes = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/flat_types.json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFlatTypeOptions(response.data.map((ft: any) => ({ id: ft.id, name: ft.society_flat_type })));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchFlatOptions = async () => {
    try {
      let url = `https://${baseUrl}/get_society_flats.json?society_id=${localStorage.getItem(
        "selectedSocietyId"
      )}`;

      if (filters.tower.length > 0) {
        filters.tower.forEach((tId: string) => {
          url += `&society_block_id=${tId.value}`;
        });
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFlatOptions(response.data.society_flats.map((f: any) => ({ value: f.id, label: f.flat_no })))
    } catch (error) {
      console.log(error);
    }
  };

  const fetchFlats = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    try {
      let url = `https://${baseUrl}/crm/admin/society_flats.json?society_id=${localStorage.getItem(
        "selectedSocietyId"
      )}&page=${page}`;

      // Append filters to URL using Ransack format
      if (currentFilters.tower.length > 0) {
        currentFilters.tower.forEach((tId: any) => {
          url += `&q[society_block_id_in][]=${tId.value}`;
        });
      }
      if (currentFilters.flatType.length > 0) {
        currentFilters.flatType.forEach((ftId: any) => {
          url += `&q[society_flat_type_id_in][]=${ftId.value}`;
        });
      }
      if (currentFilters.status.length > 0) {
        currentFilters.status.forEach((s: any) => {
          // Map "active" to true, "inactive" to false if applicable
          const val = s.value === "active" ? true : s.value === "inactive" ? false : s.value;
          url += `&q[approve_in][]=${val}`;
        });
      }
      if (currentFilters.occupancy) {
        url += `&q[occupancy_eq]=${currentFilters.occupancy}`;
      }
      if (currentFilters.flat.length > 0) {
        currentFilters.flat.forEach((f: any) => {
          url += `&q[id_in][]=${f.value}`;
        });
      }
      if (searchTerm) {
        url += `&q[flat_no_cont]=${searchTerm}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFlats(response.data.society_flats);
      if (response.data.pagination) {
        setPagination({
          current_page: response.data.pagination.current_page,
          total_count: response.data.pagination.total_count,
          total_pages: response.data.pagination.total_pages,
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch flats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
    fetchTowers();
    fetchFlatTypes();
  }, [])

  useEffect(() => {
    fetchFlatOptions();
  }, [filters.tower]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFlats(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddFlat = () => {
    setShowAddFlatDialog(true);
    setShowActionPanel(false);
  };

  const handleAddUnit = () => {
    setShowConfigureDialog(true);
    setShowActionPanel(false);
  };

  const handleAddTower = () => {
    setShowConfigureTowerDialog(true);
    setShowActionPanel(false);
  };

  const handleImport = () => {
    setShowImportModal(true);
    setShowActionDropdown(false);
  };

  const handleFilters = () => {
    setShowFiltersDialog(true);
    setShowActionPanel(false);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchFlats(1, filters);
    setShowFiltersDialog(false);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      tower: [],
      flat: [],
      flatType: [],
      status: [],
      occupancy: "",
    };
    setFilters(defaultFilters);
    fetchFlats(1, defaultFilters);
    toast.info("Filters reset");
  };

  const handleEditFlat = (flatId: string) => {
    setEditingFlatId(flatId);
    setShowEditFlatDialog(true);
  };

  const handleToggleStatus = (flatId: string) => {
    toast.success("Status updated successfully!");
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_flats.xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "flats.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
      toast.error("Failed to export users")
    }
  }

  const handleDownloadSample = async () => {
    setIsDownloadingSample(true)
    try {
      const response = await axios.get(`https://${baseUrl}/assets/sample_flats.xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample_flat.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Sample file downloaded successfully.');
    } catch (error) {
      console.log(error)
      toast.error("Failed to download sample file.")
    } finally {
      setIsDownloadingSample(false)
    }
  }

  const handleImportFlats = async () => {
    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('product_import[file]', selectedImportFile);

      const response = await axios.post(`https://${baseUrl}/crm/admin/upload_flats.json`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.[0]?.error) {
        toast.error(response.data?.[0]?.error)
        return
      }

      toast.success('Users imported successfully.');

      // Refresh the users list
      fetchFlats(1);
      setShowImportModal(false);
      setSelectedImportFile(null);
    } catch (error) {
      console.error('Error importing users:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to import users. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsImporting(false)
    }
  }

  // Render cell content based on column key
  const renderCell = (flat: any, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleEditFlat(flat.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>
        );
      case "status":
        const isActive = flat.approve || null;
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => handleToggleStatus(flat.id)}
              style={{
                backgroundColor: isActive ? "#22c55e" : "#ef4444",
              }}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isActive ? "focus:ring-green-300" : "focus:ring-red-300"
                }`}
              role="switch"
              aria-checked={isActive}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${isActive ? "translate-x-5" : "translate-x-0.5"
                  }`}
              />
            </button>
          </div>
        );
      case "site_visits":
        return (
          <div className="text-center">
            <span className="text-sm text-gray-900">{flat[columnKey] ?? "-"}</span>
          </div>
        );
      case "sold":
      case "possession":
        return (
          <div className="text-center">
            <span className="text-sm text-gray-900">
              {flat[columnKey] ? "Yes" : "No"}
            </span>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <span className="text-sm text-gray-900">{flat[columnKey] || "-"}</span>
          </div>
        );
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.total_pages || page === pagination.current_page || loading) {
      return;
    }
    fetchFlats(page);
  };

  const renderPaginationItems = () => {
    if (!pagination.total_pages || pagination.total_pages <= 0) {
      return null;
    }
    const items = [];
    const totalPages = pagination.total_pages;
    const currentPage = pagination.current_page;
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={loading}
            className={loading ? "pointer-events-none opacity-50" : ""}
          >
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
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-50" : ""}
              >
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
              <PaginationLink
                onClick={() => handlePageChange(i)}
                isActive={currentPage === i}
                aria-disabled={loading}
                className={loading ? "pointer-events-none opacity-50" : ""}
              >
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
                <PaginationLink
                  onClick={() => handlePageChange(i)}
                  isActive={currentPage === i}
                  aria-disabled={loading}
                  className={loading ? "pointer-events-none opacity-50" : ""}
                >
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
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
              aria-disabled={loading}
              className={loading ? "pointer-events-none opacity-50" : ""}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={loading}
              className={loading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-full mx-auto">
        {/* Table */}
        <div className="">
          <EnhancedTable
            columns={columns}
            data={flats}
            onRowClick={(flat) => console.log("Row clicked:", flat)}
            renderCell={renderCell}
            enableExport={true}
            handleExport={handleExport}
            onFilterClick={handleFilters}
            enableSelection={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search flats..."
            leftActions={
              <div className="flex gap-2 items-center">
                {/* Action Button */}
                <Button
                  size="sm"
                  onClick={() => setShowActionDropdown(true)}
                  className="bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Action
                </Button>

                {/* Unit and Tower Buttons */}
                <Button
                  size="sm"
                  onClick={handleAddUnit}
                  className="bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Unit Type
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddTower}
                  className="bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tower
                </Button>
              </div>
            }
            loading={loading}
          />
        </div>

        {pagination.total_pages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                    className={
                      pagination.current_page === 1 || loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(pagination.total_pages, pagination.current_page + 1))
                    }
                    className={
                      pagination.current_page === pagination.total_pages || loading
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Add Flat Dialog */}
        <AddFlatDialog
          open={showAddFlatDialog}
          onOpenChange={setShowAddFlatDialog}
          fetchFlats={fetchFlats}
        />

        {/* Edit Flat Dialog */}
        <EditFlatDialog
          open={showEditFlatDialog}
          onOpenChange={setShowEditFlatDialog}
          fetchFlats={fetchFlats}
          flatId={editingFlatId}
        />

        {/* Configure Tower Dialog */}
        <ConfigureTowerDialog
          open={showConfigureTowerDialog}
          onOpenChange={setShowConfigureTowerDialog}
          editingTower={editingTower}
          setEditingTower={setEditingTower}
        />

        {/* Configure Flat Type Dialog */}
        <ConfigureFlatTypeDialog
          open={showConfigureDialog}
          onOpenChange={setShowConfigureDialog}
        />

        {/* Filters Dialog */}
        <FiltersDialog
          open={showFiltersDialog}
          onOpenChange={setShowFiltersDialog}
          filters={filters}
          onFilterChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          towerOptions={towerOptions}
          flatTypeOptions={flatTypeOptions}
          flatOptions={flatOptions}
        />

        {/* Actions Modal */}
        <ActionsModal
          show={showActionDropdown}
          onClose={() => setShowActionDropdown(false)}
          onAdd={handleAddFlat}
          onImport={handleImport}
        />

        <CommonImportModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          selectedFile={selectedImportFile}
          setSelectedFile={setSelectedImportFile}
          title="Import Flats"
          entityType="Flats"
          onImport={handleImportFlats}
          onSampleDownload={handleDownloadSample}
          isDownloading={isDownloadingSample}
          isUploading={isImporting}
        />
      </div>
    </div>
  );
};
