import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, RefreshCw, Loader2, Car, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactSelect from "react-select";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

const reactSelectStyles = {
  control: (base: object) => ({
    ...base,
    minHeight: '40px',
    border: '1px solid #d1d5db',
    boxShadow: 'none',
    borderRadius: '4px',
    '&:hover': { border: '1px solid #cbd5e1' },
  }),
  option: (base: object, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#dbeafe' : state.isFocused ? '#f0f9ff' : 'white',
    color: state.isSelected ? '#1e40af' : '#374151',
  }),
};

interface FlatParking {
  id: number;
  vehicle_number: string;
  active: number;
  status: string;
  society_flat_id?: number;
  charge_setup_id?: number;
  parking_slot: {
    id?: number;
    slot_name: string;
    vehicle_type: string;
    parking_type: string;
    sticker_number: string;
  };
  society_flat: {
    id?: number;
    flat_no: string;
    block_name: string;
  };
}

interface SocietyBlock {
  id: number;
  name: string;
}

interface SocietyFlat {
  id: number;
  flat_no: string;
  block_name: string;
  flat_str: string;
}

interface ChargeOption {
  id: number;
  name: string;
}

const vehicleTypes = ["2 Wheeler", "4 Wheeler"];
const parkingTypes = ["SUV", "Sedan", "Hatchback", "Bike", "Scooter"];

const emptyForm = {
  slotName: "",
  vehicleType: "",
  parkingType: "",
  stickerNumber: "",
  tower: "",
  towerId: "",
  flatId: "",
  vehicleNumber: "",
  chargeSetupId: "",
};

const BMSParking: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [parkingList, setParkingList] = useState<FlatParking[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown data
  const [blocks, setBlocks] = useState<SocietyBlock[]>([]);
  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [chargeOptions, setChargeOptions] = useState<ChargeOption[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);
  const [loadingCharges, setLoadingCharges] = useState(false);

  const societyId = localStorage.getItem("selectedSocietyId") || "";

  // ── Fetch parking list ──────────────────────────────────────────────────────
  const fetchParkingList = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/configure-parking.json?page=${page}`),
        { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
      );
      if (response.ok) {
        const data = await response.json();
        setParkingList(data.flat_parkings || []);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalCount(data.pagination?.total_count || 0);
      } else {
        toast.error("Failed to load parking data");
      }
    } catch {
      toast.error("Failed to load parking data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParkingList(currentPage);
  }, [fetchParkingList, currentPage]);

  // ── Fetch blocks (towers) ───────────────────────────────────────────────────
  const fetchBlocks = useCallback(async () => {
    if (!societyId) return;
    setLoadingBlocks(true);
    try {
      const response = await fetch(
        getFullUrl(`/get_society_blocks.json?society_id=${societyId}`),
        { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
      );
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.society_blocks || []);
      }
    } catch {
      toast.error("Failed to load blocks");
    } finally {
      setLoadingBlocks(false);
    }
  }, [societyId]);

  // ── Fetch flats by block ────────────────────────────────────────────────────
  const fetchFlats = useCallback(async (blockId: string) => {
    if (!societyId || !blockId) return;
    setLoadingFlats(true);
    try {
      const response = await fetch(
        getFullUrl(`/get_society_flats.json?society_id=${societyId}&society_block_id=${blockId}`),
        { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
      );
      if (response.ok) {
        const data = await response.json();
        setFlats(data.society_flats || []);
      }
    } catch {
      toast.error("Failed to load flats");
    } finally {
      setLoadingFlats(false);
    }
  }, [societyId]);

  // ── Fetch charge options ────────────────────────────────────────────────────
  const fetchChargeOptions = useCallback(async () => {
    setLoadingCharges(true);
    try {
      const response = await fetch(
        getFullUrl("/crm/admin/parking_charges.json"),
        { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
      );
      if (response.ok) {
        const data = await response.json();
        setChargeOptions(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Failed to load charge options");
    } finally {
      setLoadingCharges(false);
    }
  }, []);

  // ── Open Add modal ──────────────────────────────────────────────────────────
  const handleAddParking = () => {
    setFormData({ ...emptyForm });
    setFlats([]);
    fetchBlocks();
    fetchChargeOptions();
    setIsAddModalOpen(true);
  };

  // ── Open Edit modal ─────────────────────────────────────────────────────────
  const handleEditParking = async (item: FlatParking) => {
    setEditingId(item.parking_slot?.id ?? item.id);  // use parking_slot.id for PUT URL
    // Pre-fill known values immediately so modal can open
    setFormData({
      slotName: item.parking_slot?.slot_name || "",
      vehicleType: item.parking_slot?.vehicle_type || "",
      parkingType: item.parking_slot?.parking_type || "",
      stickerNumber: item.parking_slot?.sticker_number || "",
      tower: item.society_flat?.block_name || "",
      towerId: "",
      flatId: "",
      vehicleNumber: item.vehicle_number || "",
      chargeSetupId: item.charge_setup_id ? item.charge_setup_id.toString() : "",
    });
    setFlats([]);
    fetchChargeOptions();
    setIsEditModalOpen(true);

    // Fetch blocks, then resolve towerId from block_name, then fetch flats and resolve flatId
    if (!societyId) return;
    setLoadingBlocks(true);
    try {
      const res = await fetch(
        getFullUrl(`/get_society_blocks.json?society_id=${societyId}`),
        { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        const fetchedBlocks: SocietyBlock[] = data.society_blocks || [];
        setBlocks(fetchedBlocks);

        // Match block by block_name from the parking item
        const matchedBlock = fetchedBlocks.find(
          (b) => b.name === item.society_flat?.block_name
        );
        if (matchedBlock) {
          const blockIdStr = matchedBlock.id.toString();
          setFormData((prev) => ({ ...prev, towerId: blockIdStr, tower: matchedBlock.name }));

          // Now fetch flats for this block
          setLoadingFlats(true);
          try {
            const flatRes = await fetch(
              getFullUrl(`/get_society_flats.json?society_id=${societyId}&society_block_id=${blockIdStr}`),
              { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
            );
            if (flatRes.ok) {
              const flatData = await flatRes.json();
              const fetchedFlats: SocietyFlat[] = flatData.society_flats || [];
              setFlats(fetchedFlats);

              // Match flat by flat_no or by society_flat_id
              const flatIdFromItem = item.society_flat?.id || item.society_flat_id;
              const matchedFlat = flatIdFromItem
                ? fetchedFlats.find((f) => f.id === flatIdFromItem)
                : fetchedFlats.find((f) => f.flat_no === item.society_flat?.flat_no);
              if (matchedFlat) {
                setFormData((prev) => ({ ...prev, flatId: matchedFlat.id.toString() }));
              }
            }
          } catch {
            toast.error("Failed to load flats");
          } finally {
            setLoadingFlats(false);
          }
        }
      }
    } catch {
      toast.error("Failed to load blocks");
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFlats([]);
  };

  // ── Handle tower change → load flats ───────────────────────────────────────
  const handleTowerChange = (blockId: string) => {
    const block = blocks.find((b) => b.id.toString() === blockId);
    setFormData((prev) => ({ ...prev, towerId: blockId, tower: block?.name || "", flatId: "" }));
    fetchFlats(blockId);
  };

  // ── Submit Add ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = {
        parking_slot: {
          sticker_number: formData.stickerNumber,
          slot_name: formData.slotName,
          vehicle_type: formData.vehicleType,
          parking_type: formData.parkingType,
          active: 1,
        },
        flat_parking: {
          society_flat_id: formData.flatId ? parseInt(formData.flatId) : undefined,
          charge_setup_id: formData.chargeSetupId ? parseInt(formData.chargeSetupId) : undefined,
          vehicle_number: formData.vehicleNumber,
        },
      };

      const isEdit = isEditModalOpen && editingId;
      const url = isEdit
        ? getFullUrl(`/crm/admin/configure-parking/${editingId}.json`)
        : getFullUrl("/crm/admin/configure-parking.json");
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(isEdit ? "Parking slot updated successfully!" : "Parking slot added successfully!");
        handleCloseModal();
        fetchParkingList(currentPage);
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.message || (isEdit ? "Failed to update parking slot" : "Failed to add parking slot"));
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteParking = async (item: FlatParking) => {
    if (!confirm("Are you sure you want to delete this parking slot?")) return;
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/configure-parking/${item.id}.json`),
        { method: "DELETE", headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } }
      );
      if (response.ok) {
        toast.success("Parking slot deleted successfully!");
        fetchParkingList(currentPage);
      } else {
        toast.error("Failed to delete parking slot");
      }
    } catch {
      toast.error("Failed to delete parking slot");
    }
  };

  // ── Table columns ───────────────────────────────────────────────────────────
  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "slotName", label: "Slot Name", sortable: true },
    { key: "blockName", label: "Tower / Block", sortable: true },
    { key: "flatNo", label: "Flat No.", sortable: true },
    { key: "vehicleNumber", label: "Vehicle Number", sortable: true },
    { key: "vehicleType", label: "Vehicle Type", sortable: true },
    { key: "parkingType", label: "Parking Type", sortable: true },
    { key: "stickerNumber", label: "Sticker Number", sortable: false },
    { key: "status", label: "Status", sortable: true },
  ];

  const renderCell = (item: FlatParking, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <div className="flex gap-1">
            {/* <Button size="sm" variant="ghost" onClick={() => navigate(`/parking/view/${item.id}`)} className="h-8 w-8 p-0 hover:bg-[#DBC2A9]">
              <Eye className="h-4 w-4" />
            </Button> */}
            <Button size="sm" variant="ghost" onClick={() => handleEditParking(item)} className="h-8 w-8 p-0 hover:bg-[#DBC2A9]">
              <Edit className="h-4 w-4 text-[#C72030]" />
            </Button>
            {/* <Button size="sm" variant="ghost" onClick={() => handleDeleteParking(item)} className="h-8 w-8 p-0 hover:bg-red-100 text-red-600">
              <Trash2 className="h-4 w-4 text-[#C72030]" />
            </Button> */}
          </div>
        );
      case "slotName":
        return (
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            {item.parking_slot?.slot_name || "--"}
          </span>
        );
      case "blockName":
        return <span className="font-medium">{item.society_flat?.block_name || "--"}</span>;
      case "flatNo":
        return <span>{item.society_flat?.flat_no || "--"}</span>;
      case "vehicleNumber":
        return <span className="font-mono text-sm">{item.vehicle_number || "--"}</span>;
      case "vehicleType":
        return (
          <span className="flex items-center gap-1">
            <Car className="w-4 h-4 text-gray-500" />
            {item.parking_slot?.vehicle_type || "--"}
          </span>
        );
      case "parkingType":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {item.parking_slot?.parking_type || "--"}
          </Badge>
        );
      case "stickerNumber":
        return <span className="text-sm">{item.parking_slot?.sticker_number || "--"}</span>;
      case "status":
        return (
          <Badge variant="outline" className={item.status === "Active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
            {item.status}
          </Badge>
        );
      default:
        return "--";
    }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 7;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>1</PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 3) items.push(<PaginationItem key="e1"><span className="px-4">...</span></PaginationItem>);
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
      if (currentPage < totalPages - 2) items.push(<PaginationItem key="e2"><span className="px-4">...</span></PaginationItem>);
      items.push(
        <PaginationItem key={totalPages} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  // ── Shared modal form ───────────────────────────────────────────────────────
  const renderModalForm = (isEdit: boolean) => (
    <form onSubmit={handleSubmit} className="space-y-6 py-2">
      {/* Parking Slot Details */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Parking Slot Details</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Slot Name</Label>
            <Input
              placeholder="Enter slot name"
              value={formData.slotName}
              onChange={(e) => setFormData((p) => ({ ...p, slotName: e.target.value }))}
              className="h-10 border-gray-300 focus:border-gray-500 focus:ring-0"
              style={{ borderRadius: '4px' }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Vehicle Type</Label>
            <ReactSelect
              options={[
                ...vehicleTypes.map((t) => ({ value: t, label: t })),
                ...(formData.vehicleType && !vehicleTypes.includes(formData.vehicleType)
                  ? [{ value: formData.vehicleType, label: formData.vehicleType }]
                  : []),
              ]}
              value={formData.vehicleType ? { value: formData.vehicleType, label: formData.vehicleType } : null}
              onChange={(selected) => setFormData((p) => ({ ...p, vehicleType: selected ? selected.value : '' }))}
              placeholder="Select Vehicle Type"
              isClearable
              styles={reactSelectStyles}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Parking Type</Label>
            <ReactSelect
              options={[
                ...parkingTypes.map((t) => ({ value: t, label: t })),
                ...(formData.parkingType && !parkingTypes.includes(formData.parkingType)
                  ? [{ value: formData.parkingType, label: formData.parkingType }]
                  : []),
              ]}
              value={formData.parkingType ? { value: formData.parkingType, label: formData.parkingType } : null}
              onChange={(selected) => setFormData((p) => ({ ...p, parkingType: selected ? selected.value : '' }))}
              placeholder="Select Parking Type"
              isClearable
              styles={reactSelectStyles}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Sticker Number</Label>
            <Input
              placeholder="Enter sticker number"
              value={formData.stickerNumber}
              onChange={(e) => setFormData((p) => ({ ...p, stickerNumber: e.target.value }))}
              className="h-10 border-gray-300 focus:border-gray-500 focus:ring-0"
              style={{ borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      {/* Associate With Flat */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Associate With Flat</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Tower / Block</Label>
            <ReactSelect
              options={blocks.map((b) => ({ value: b.id.toString(), label: b.name }))}
              value={formData.towerId ? { value: formData.towerId, label: blocks.find((b) => b.id.toString() === formData.towerId)?.name || formData.tower } : null}
              onChange={(selected) => handleTowerChange(selected ? selected.value : '')}
              placeholder={loadingBlocks ? 'Loading...' : 'Select Tower / Block'}
              isLoading={loadingBlocks}
              isDisabled={loadingBlocks}
              isClearable
              styles={reactSelectStyles}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Select Flat</Label>
            <ReactSelect
              options={flats.map((f) => ({ value: f.id.toString(), label: f.flat_str || (f.block_name && f.flat_no ? `${f.block_name} - ${f.flat_no}` : f.flat_no || f.id.toString()) }))}
              value={formData.flatId ? (() => { const f = flats.find((f) => f.id.toString() === formData.flatId); return f ? { value: f.id.toString(), label: f.flat_str || (f.block_name && f.flat_no ? `${f.block_name} - ${f.flat_no}` : f.flat_no || f.id.toString()) } : { value: formData.flatId, label: formData.flatId }; })() : null}
              onChange={(selected) => setFormData((p) => ({ ...p, flatId: selected ? selected.value : '' }))}
              placeholder={loadingFlats ? 'Loading...' : !formData.towerId ? 'Select tower first' : 'Select Flat'}
              isLoading={loadingFlats}
              isDisabled={loadingFlats || !formData.towerId}
              isClearable
              styles={reactSelectStyles}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Vehicle Number</Label>
            <Input
              placeholder="Enter vehicle number"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData((p) => ({ ...p, vehicleNumber: e.target.value }))}
              className="h-10 border-gray-300 focus:border-gray-500 focus:ring-0"
              style={{ borderRadius: '4px' }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Charge Applicable</Label>
            <ReactSelect
              options={chargeOptions.map((c) => ({ value: c.id.toString(), label: c.name }))}
              value={formData.chargeSetupId ? { value: formData.chargeSetupId, label: chargeOptions.find((c) => c.id.toString() === formData.chargeSetupId)?.name || formData.chargeSetupId } : null}
              onChange={(selected) => setFormData((p) => ({ ...p, chargeSetupId: selected ? selected.value : '' }))}
              placeholder={loadingCharges ? 'Loading...' : 'Select Charge'}
              isLoading={loadingCharges}
              isDisabled={loadingCharges}
              isClearable
              styles={reactSelectStyles}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t">
        <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting} className="mr-3">
          Cancel
        </Button>
        <Button type="submit" className="bg-[#C72030] hover:bg-[#a01828] text-white px-8" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? 'Updating...' : 'Saving...'}</> : isEdit ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Parking Management</h1>
      </div>

      <EnhancedTable
        data={parkingList}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        onSearchChange={(q) => setSearchQuery(q)}
        searchPlaceholder="Search by slot, vehicle number..."
        enableSearch={true}
        leftActions={
          <Button onClick={handleAddParking} className="bg-[#C72030] hover:bg-[#a01828] text-white h-9 px-4 text-sm font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
        emptyMessage="No parking slots found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-parking-table"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages || isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Parking Slot</DialogTitle>
          </DialogHeader>
          {renderModalForm(false)}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit Parking Slot</DialogTitle>
          </DialogHeader>
          {renderModalForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BMSParking;