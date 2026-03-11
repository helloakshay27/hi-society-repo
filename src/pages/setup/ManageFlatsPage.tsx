import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { CommonImportModal } from "@/components/CommonImportModal";
import { AddFlatDialog } from "./manage-flats-dialogs/AddFlatDialog";
import { ConfigureTowerDialog } from "./manage-flats-dialogs/ConfigureTowerDialog";
import { ConfigureFlatTypeDialog } from "./manage-flats-dialogs/ConfigureFlatTypeDialog";
import { FiltersDialog } from "./manage-flats-dialogs/FiltersDialog";
import { ActionsModal } from "./manage-flats-dialogs/ActionsModal";
import { toast } from "sonner";
import { getFullUrl } from "@/config/apiConfig";

// Column configuration matching the image
const columns: ColumnConfig[] = [
  { key: "actions", label: "Actions", sortable: false, draggable: false },
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
  const [loading, setLoading] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigureDialog, setShowConfigureDialog] = useState(false);

  // Add Flat Dialog states
  const [showAddFlatDialog, setShowAddFlatDialog] = useState(false);

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
  const [addFlatFormData, setAddFlatFormData] = useState({
    status: true,
    possession: true,
    sold: false,
    tower: "",
    flat: "",
    carpetArea: "",
    builtUpArea: "",
    flatType: "",
    occupied: "",
    nameOnBill: "",
    dateOfPossession: "",
    rmUser: "",
  });

  const fetchFlats = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/society_flats.json?society_id=${localStorage.getItem('selectedSocietyId')}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setFlats(response.data.society_flats)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch flats")
    }
  }

  useEffect(() => {
    fetchFlats()
  }, [])

  const handleAddFlat = () => {
    setShowAddFlatDialog(true);
    setShowActionPanel(false);
  };

  const handleAddFlatInputChange = (field: string, value: string | boolean) => {
    setAddFlatFormData(prev => ({ ...prev, [field]: value }));
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
    toast.success("Filters applied successfully!");
    setShowFiltersDialog(false);
  };

  const handleResetFilters = () => {
    setFilters({
      tower: [],
      flat: [],
      flatType: [],
      status: [],
      occupancy: "",
    });
    toast.info("Filters reset");
  };

  const handleEditFlat = (flatId: string) => {
    console.log("Edit flat:", flatId);
    navigate(`/setup/manage-flats/edit/${flatId}`);
  };

  const handleToggleStatus = (flatId: string) => {
    toast.success("Status updated successfully!");
  };

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
            handleExport={() => { }}
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
          />
        </div>

        {/* Add Flat Dialog */}
        <AddFlatDialog
          open={showAddFlatDialog}
          onOpenChange={setShowAddFlatDialog}
          formData={addFlatFormData}
          onChange={handleAddFlatInputChange}
          onSubmit={() => { }}
          loading={loading}
          towerOptions={[]}
          flatTypeOptions={[]}
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
          towerOptions={[]}
          flatTypeOptions={[]}
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
          onImport={() => { }}
          onSampleDownload={() => { }}
          isUploading={isImporting}
        />
      </div>
    </div>
  );
};
