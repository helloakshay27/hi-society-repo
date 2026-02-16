import React, { useState, useEffect } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VisitorParkingSlot {
  id: number;
  slotNumber: string;
  type: string;
  status: string;
  createdOn: string;
  createdBy: string;
  active: boolean;
}

const SmartSecureSetupVisitorParking: React.FC = () => {
  const [data, setData] = useState<VisitorParkingSlot[]>([
    {
      id: 1,
      slotNumber: "Parking 1",
      type: "2 Wheeler",
      status: "Occupied",
      createdOn: "09/12/2024 3:24 PM",
      createdBy: "Godrej Living",
      active: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisitorParkingSlot | null>(
    null
  );

  // Filter states
  const [searchSlot, setSearchSlot] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterState, setFilterState] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    slotNumber: "",
    type: "",
    status: "",
  });

  const columns = [
    { key: "sno", label: "S.No.", sortable: false },
    { key: "slotNumber", label: "Slot Number", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
    { key: "active", label: "Active", sortable: false },
    { key: "action", label: "", sortable: false },
  ];

  const handleApplyFilters = () => {
    // Apply filter logic here
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    setSearchSlot("");
    setFilterType("");
    setFilterStatus("");
    setFilterState("");
    toast.info("Filters reset");
  };

  const handleEdit = (item: VisitorParkingSlot) => {
    setEditingItem(item);
    setFormData({
      slotNumber: item.slotNumber,
      type: item.type,
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const handleAddSlot = () => {
    if (!formData.slotNumber || !formData.type || !formData.status) {
      setTimeout(() => {
        toast.error("Please fill all required fields");
      }, 0);
      return;
    }

    const newSlot: VisitorParkingSlot = {
      id: Date.now(),
      slotNumber: formData.slotNumber,
      type: formData.type,
      status: formData.status,
      createdOn: new Date().toLocaleString(),
      createdBy: "Current User",
      active: true,
    };

    setData((prev) => [...prev, newSlot]);
    setFormData({ slotNumber: "", type: "", status: "" });
    setIsAddModalOpen(false);
    setTimeout(() => {
      toast.success("Parking slot added successfully!");
    }, 0);
  };

  const handleUpdateSlot = () => {
    if (!formData.slotNumber || !formData.type || !formData.status) {
      setTimeout(() => {
        toast.error("Please fill all required fields");
      }, 0);
      return;
    }

    if (!editingItem) return;

    const updatedSlot: VisitorParkingSlot = {
      ...editingItem,
      slotNumber: formData.slotNumber,
      type: formData.type,
      status: formData.status,
    };

    setData((prev) =>
      prev.map((item) => (item.id === editingItem.id ? updatedSlot : item))
    );

    setEditingItem(null);
    setFormData({ slotNumber: "", type: "", status: "" });
    setIsEditModalOpen(false);
    setTimeout(() => {
      toast.success("Parking slot updated successfully!");
    }, 0);
  };

  const renderCell = (
    item: VisitorParkingSlot,
    columnKey: string,
    index: number
  ) => {
    switch (columnKey) {
      case "sno":
        return index + 1;
      case "status":
        return (
          <span
            className={`px-3 py-1 rounded text-xs font-semibold ${
              item.status === "Occupied"
                ? "bg-yellow-400 text-white"
                : item.status === "Available"
                  ? "bg-green-500 text-white"
                  : "bg-gray-400 text-white"
            }`}
          >
            {item.status}
          </span>
        );
      case "active":
        return (
          <span className="px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold">
            Can't Edit
          </span>
        );
      case "action":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-600"
            onClick={() => handleEdit(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        );
      default:
        return item[columnKey as keyof VisitorParkingSlot];
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Visitor Parking Setup
        </h1>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <Input
              type="text"
              placeholder="Search Slot"
              value={searchSlot}
              onChange={(e) => setSearchSlot(e.target.value)}
              className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
            />
          </div>

          <div className="space-y-1">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-wheeler">2 Wheeler</SelectItem>
                <SelectItem value="4-wheeler">4 Wheeler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Select value={filterState} onValueChange={setFilterState}>
              <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              Apply
            </Button>
            <Button
              onClick={handleResetFilters}
              className="bg-cyan-400 hover:bg-cyan-500 text-white"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <EnhancedTable
        data={data}
        columns={columns}
        renderCell={renderCell}
        pagination={true}
        enableGlobalSearch={true}
        searchPlaceholder="Search"
        rightActions={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-cyan-400 hover:bg-cyan-500 text-white"
          >
            Create
          </Button>
        }
        loading={loading}
        emptyMessage="No Matching Records Found"
      />

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-[#F6F4EE]">
            <DialogTitle className="text-center font-bold text-lg">
              Add Parking Slot
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-6 bg-white">
            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Slot Number <span className="text-[#C72030]">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.slotNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, slotNumber: e.target.value })
                  }
                  placeholder="Enter slot number"
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Type <span className="text-[#C72030]">*</span>
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                    <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Status <span className="text-[#C72030]">*</span>
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleAddSlot}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-[#F6F4EE]">
            <DialogTitle className="text-center font-bold text-lg">
              Edit Parking Slot
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-6 bg-white">
            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Slot Number <span className="text-[#C72030]">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.slotNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, slotNumber: e.target.value })
                  }
                  placeholder="Enter slot number"
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Type <span className="text-[#C72030]">*</span>
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2 Wheeler">2 Wheeler</SelectItem>
                    <SelectItem value="4 Wheeler">4 Wheeler</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Status <span className="text-[#C72030]">*</span>
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleUpdateSlot}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartSecureSetupVisitorParking;
