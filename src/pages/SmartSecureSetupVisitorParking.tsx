import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

interface VisitorParkingSlot {
  id: number;
  visitor_slot_number: string;
  vehicle_type: string;
  visitor_parking_status: string;
  society_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  created_by: {
    id: number;
    full_name: string;
  };
}

interface FilterOptions {
  vehicle_types: { label: string; value: string }[];
  parking_statuses: { label: string; value: string }[];
  active_states: { label: string; value: string }[];
  created_by_users: { id: number; full_name: string }[];
}

interface ActiveFilters {
  vehicle_type: string;
  parking_status: string;
  active: string;
  created_by_id: string;
}

const emptyFilters: ActiveFilters = {
  vehicle_type: "",
  parking_status: "",
  active: "",
  created_by_id: "",
};

// ── Filter Dialog ──────────────────────────────────────────────────────────────
interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: FilterOptions | null;
  onApply: (filters: ActiveFilters) => void;
  onClear: () => void;
}

const ParkingFilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filterOptions,
  onApply,
  onClear,
}) => {
  const [local, setLocal] = useState<ActiveFilters>(emptyFilters);

  const fieldCls =
    "h-10 w-full rounded border border-gray-300 bg-white text-sm focus:ring-0 focus:border-gray-400";

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(emptyFilters);
    onClear();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-xl shadow-xl p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold text-gray-900 tracking-wide uppercase">
            Filter Parking Slots
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Vehicle Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Vehicle Type</Label>
            <Select
              value={local.vehicle_type}
              onValueChange={(v) => setLocal((p) => ({ ...p, vehicle_type: v }))}
            >
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Select Vehicle Type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions?.vehicle_types.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parking Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Parking Status</Label>
            <Select
              value={local.parking_status}
              onValueChange={(v) => setLocal((p) => ({ ...p, parking_status: v }))}
            >
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions?.parking_statuses.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active State */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Active State</Label>
            <Select
              value={local.active}
              onValueChange={(v) => setLocal((p) => ({ ...p, active: v }))}
            >
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions?.active_states.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Created By */}
          {/* <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Created By</Label>
            <Select
              value={local.created_by_id}
              onValueChange={(v) => setLocal((p) => ({ ...p, created_by_id: v }))}
            >
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {filterOptions?.created_by_users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-100 flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white px-6"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const SmartSecureSetupVisitorParking: React.FC = () => {
  const [data, setData] = useState<VisitorParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(emptyFilters);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisitorParkingSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    visitor_slot_number: "",
    vehicle_type: "",
  });

  // ── Fetch filter options ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(getFullUrl("/crm/admin/visitor_parking_slots/filters.json"), {
      headers: { Authorization: getAuthHeader() },
    })
      .then((r) => r.json())
      .then((d) => setFilterOptions(d))
      .catch(() => toast.error("Failed to load filter options"));
  }, []);

  // ── Fetch list ────────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (filters: ActiveFilters = emptyFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.vehicle_type) params.set("q[vehicle_type_eq]", filters.vehicle_type);
      if (filters.parking_status) params.set("q[visitor_parking_status_eq]", filters.parking_status);
      if (filters.active) params.set("q[active_eq]", filters.active);
      if (filters.created_by_id) params.set("q[created_by_id_eq]", filters.created_by_id);
      const qs = params.toString();
      const url = getFullUrl(`/crm/admin/visitor_parking_slots.json${qs ? `?${qs}` : ""}`);
      const response = await fetch(url, { headers: { Authorization: getAuthHeader() } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const d = await response.json();
      setData(Array.isArray(d) ? d : d.visitor_parking_slots || []);
    } catch {
      toast.error("Failed to fetch parking slots");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots(activeFilters);
  }, [activeFilters, fetchSlots]);

  // ── Cleanup body scroll lock ───────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "unset";
    document.body.style.paddingRight = "0px";
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, []);

  // ── Add slot ──────────────────────────────────────────────────────────────
  const handleAddSlot = async () => {
    if (!formData.visitor_slot_number || !formData.vehicle_type) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        getFullUrl("/crm/admin/visitor_parking_slots.json"),
        {
          method: "POST",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ visitor_parking_slot: formData }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setFormData({ visitor_slot_number: "", vehicle_type: "" });
      setIsAddModalOpen(false);
      toast.success("Parking slot added successfully!");
      fetchSlots(activeFilters);
    } catch {
      toast.error("Failed to add parking slot");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit slot ─────────────────────────────────────────────────────────────
  const handleEdit = (item: VisitorParkingSlot) => {
    setEditingItem(item);
    setFormData({
      visitor_slot_number: item.visitor_slot_number,
      vehicle_type: item.vehicle_type,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSlot = async () => {
    if (!formData.visitor_slot_number || !formData.vehicle_type) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!editingItem) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        getFullUrl(`/crm/admin/visitor_parking_slots/${editingItem.id}.json`),
        {
          method: "PUT",
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ visitor_parking_slot: formData }),
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setEditingItem(null);
      setFormData({ visitor_slot_number: "", vehicle_type: "" });
      setIsEditModalOpen(false);
      toast.success("Parking slot updated successfully!");
      fetchSlots(activeFilters);
    } catch {
      toast.error("Failed to update parking slot");
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveFilters =
    !!activeFilters.vehicle_type ||
    !!activeFilters.parking_status ||
    !!activeFilters.active ||
    !!activeFilters.created_by_id;

  const columns = [
    { key: "sno", label: "S.No.", sortable: false },
    { key: "visitor_slot_number", label: "Slot Number", sortable: true },
    { key: "vehicle_type", label: "Vehicle Type", sortable: true },
    { key: "visitor_parking_status", label: "Status", sortable: true },
    { key: "created_at", label: "Created On", sortable: true },
    { key: "created_by", label: "Created By", sortable: true },
    { key: "active", label: "Active", sortable: false },
    { key: "action", label: "Action", sortable: false },
  ];

  const renderCell = (
    item: VisitorParkingSlot,
    columnKey: string,
    index: number
  ) => {
    switch (columnKey) {
      case "sno":
        return <span className="text-sm text-gray-700">{index + 1}</span>;
      case "visitor_slot_number":
        return item.visitor_slot_number || "-";
      case "vehicle_type":
        return item.vehicle_type || "-";
      case "visitor_parking_status":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.visitor_parking_status === "Occupied"
                ? "bg-yellow-100 text-yellow-700"
                : item.visitor_parking_status === "Available"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {item.visitor_parking_status || "-"}
          </span>
        );
      case "created_at":
        return item.created_at || "-";
      case "created_by":
        return item.created_by?.full_name || "-";
      case "active":
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.active ? "Active" : "Inactive"}
          </span>
        );
      case "action":
        return item.can_edit ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <span className="text-xs text-gray-400 px-2">—</span>
        );
      default:
        return "-";
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          setFormData({ visitor_slot_number: "", vehicle_type: "" });
          setIsAddModalOpen(true);
        }}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        Add
      </Button>
    </div>
  );

  // ── Slot form fields (shared by add/edit) ──────────────────────────────────
  const renderSlotFormFields = () => (
    <div className="p-8 grid grid-cols-2 gap-6 bg-white">
      <div className="space-y-2">
        <div className="relative">
          <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
            Slot Number <span className="text-[#C72030]">*</span>
          </label>
          <Input
            type="text"
            value={formData.visitor_slot_number}
            onChange={(e) =>
              setFormData({ ...formData, visitor_slot_number: e.target.value })
            }
            placeholder="Enter slot number"
            className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
            Vehicle Type <span className="text-[#C72030]">*</span>
          </label>
          <Select
            value={formData.vehicle_type}
            onValueChange={(val) => setFormData({ ...formData, vehicle_type: val })}
          >
            <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions?.vehicle_types.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              )) ?? (
                <>
                  <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                  <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />

      <EnhancedTable
        data={data}
        columns={columns}
        renderCell={renderCell}
        pagination={true}
        enableExport={true}
        exportFileName="visitor-parking-slots"
        storageKey="visitor-parking-table"
        enableGlobalSearch={true}
        searchPlaceholder="Search parking slots..."
        leftActions={renderCustomActions()}
        rightActions={
          hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters(emptyFilters)}
              className="h-8 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </Button>
          ) : undefined
        }
        onFilterClick={() => setIsFilterOpen(true)}
        loading={loading}
        loadingMessage="Loading parking slots..."
        emptyMessage="No parking slots found"
      />

      {/* Filter Dialog */}
      <ParkingFilterDialog
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterOptions={filterOptions}
        onApply={(filters) => setActiveFilters(filters)}
        onClear={() => setActiveFilters(emptyFilters)}
      />

      {/* Add Modal */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsAddModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-[#F6F4EE]">
            <DialogTitle className="text-center font-bold text-lg">
              Add Parking Slot
            </DialogTitle>
          </DialogHeader>
          {renderSlotFormFields()}
          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleAddSlot}
              disabled={submitting}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              {submitting ? "Saving…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsEditModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-[#F6F4EE]">
            <DialogTitle className="text-center font-bold text-lg">
              Edit Parking Slot
            </DialogTitle>
          </DialogHeader>
          {renderSlotFormFields()}
          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleUpdateSlot}
              disabled={submitting}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              {submitting ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartSecureSetupVisitorParking;
