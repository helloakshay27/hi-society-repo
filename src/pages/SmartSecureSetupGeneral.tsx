import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Briefcase, Truck, User, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@mui/material";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SetupItem {
  id: number;
  purpose: string;
  status: boolean;
  workType?: string;
}

const SmartSecureSetupGeneral: React.FC = () => {
  const [activeTab, setActiveTab] = useState("visit-purpose");
  const [visitPurposeData, setVisitPurposeData] = useState<SetupItem[]>([
    { id: 1, purpose: "Other", status: true },
    { id: 2, purpose: "Site Visit", status: true },
    { id: 3, purpose: "Meeting", status: true },
    { id: 4, purpose: "Personal", status: true },
    { id: 5, purpose: "Guest", status: true },
  ]);
  const [moveInOutData, setMoveInOutData] = useState<SetupItem[]>([]);
  const [staffTypeData, setStaffTypeData] = useState<SetupItem[]>([
    { id: 1, purpose: "FM Team", status: true, workType: "Society" },
    { id: 2, purpose: "Housekeeping", status: true, workType: "Society" },
    { id: 3, purpose: "Chef", status: true, workType: "Personal" },
    { id: 4, purpose: "Fitout", status: true, workType: "Personal" },
    {
      id: 5,
      purpose: "Construction Workers",
      status: true,
      workType: "Society",
    },
    {
      id: 6,
      purpose: "Construction Workers",
      status: true,
      workType: "Personal",
    },
    { id: 7, purpose: "Labour", status: true, workType: "Society" },
  ]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetupItem | null>(null);
  const [formData, setFormData] = useState({
    society: "",
    purpose: "",
    status: false,
    workType: "Society",
  });
  const [editFormData, setEditFormData] = useState({
    purpose: "",
    status: true,
    workType: "",
  });

  const columns = [
    { key: "purpose", label: "Purpose", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "action", label: "Action", sortable: false },
  ];

  const staffColumns = [
    { key: "purpose", label: "Staff Type", sortable: true },
    { key: "status", label: "Status", sortable: false },
    { key: "workType", label: "Work Type", sortable: true },
    { key: "action", label: "Action", sortable: false },
  ];

  const handleToggleStatus = (
    id: number,
    currentStatus: boolean,
    dataType: "visit" | "move" | "staff"
  ) => {
    const updateData = (prev: SetupItem[]) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: !currentStatus } : item
      );

    if (dataType === "visit") {
      setVisitPurposeData(updateData);
    } else if (dataType === "move") {
      setMoveInOutData(updateData);
    } else {
      setStaffTypeData(updateData);
    }

    setTimeout(() => {
      toast.success("Status updated successfully!");
    }, 0);
  };

  const handleEdit = (item: SetupItem) => {
    setEditingItem(item);
    setEditFormData({
      purpose: item.purpose,
      status: item.status,
      workType: item.workType || "Society",
    });
    setIsEditModalOpen(true);
  };

  const handleAddPurpose = () => {
    if (!formData.purpose.trim()) {
      setTimeout(() => {
        toast.error("Please enter a purpose");
      }, 0);
      return;
    }

    const newItem: SetupItem = {
      id: Date.now(),
      purpose: formData.purpose,
      status: formData.status,
      workType: activeTab === "staff-type" ? formData.workType : undefined,
    };

    if (activeTab === "visit-purpose") {
      setVisitPurposeData((prev) => [...prev, newItem]);
    } else if (activeTab === "move-in-out") {
      setMoveInOutData((prev) => [...prev, newItem]);
    } else {
      setStaffTypeData((prev) => [...prev, newItem]);
    }

    setFormData({
      society: "",
      purpose: "",
      status: false,
      workType: "Society",
    });
    setIsAddModalOpen(false);
    setTimeout(() => {
      toast.success("Purpose added successfully!");
    }, 0);
  };

  const handleUpdatePurpose = () => {
    if (!editFormData.purpose.trim()) {
      setTimeout(() => {
        toast.error("Please enter a purpose");
      }, 0);
      return;
    }

    if (!editingItem) return;

    const updatedItem: SetupItem = {
      id: editingItem.id,
      purpose: editFormData.purpose,
      status: editFormData.status,
      workType: activeTab === "staff-type" ? editFormData.workType : undefined,
    };

    const updateData = (prev: SetupItem[]) =>
      prev.map((item) => (item.id === editingItem.id ? updatedItem : item));

    if (activeTab === "visit-purpose") {
      setVisitPurposeData(updateData);
    } else if (activeTab === "move-in-out") {
      setMoveInOutData(updateData);
    } else {
      setStaffTypeData(updateData);
    }

    setEditingItem(null);
    setEditFormData({ purpose: "", status: true, workType: "" });
    setIsEditModalOpen(false);
    setTimeout(() => {
      toast.success("Purpose updated successfully!");
    }, 0);
  };

  const renderCell = (
    item: SetupItem,
    columnKey: string,
    dataType: "visit" | "move" | "staff"
  ) => {
    switch (columnKey) {
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
      case "status":
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                item.status
                  ? "bg-[#00A651] text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {item.status ? "Active" : "Inactive"}
            </span>
          </div>
        );
      case "workType":
        return item.workType || "-";
      default:
        return item[columnKey as keyof SetupItem];
    }
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case "visit-purpose":
        return "Visit Purpose";
      case "move-in-out":
        return "Move In/Out";
      case "staff-type":
        return "Staff Type";
      default:
        return "Purpose";
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "visit-purpose":
        return visitPurposeData;
      case "move-in-out":
        return moveInOutData;
      case "staff-type":
        return staffTypeData;
      default:
        return [];
    }
  };

  const getDataType = (): "visit" | "move" | "staff" => {
    switch (activeTab) {
      case "visit-purpose":
        return "visit";
      case "move-in-out":
        return "move";
      case "staff-type":
        return "staff";
      default:
        return "visit";
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Setup</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
          <TabsTrigger
            value="visit-purpose"
            className="group flex items-center justify-center gap-2 data-[state=active]:bg-[#eeeae3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 border-none font-semibold py-3"
          >
            <Briefcase className="w-4 h-4" />
            Visit Purpose
          </TabsTrigger>

          <TabsTrigger
            value="move-in-out"
            className="group flex items-center justify-center gap-2 data-[state=active]:bg-[#eeeae3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 border-none font-semibold py-3"
          >
            <Truck className="w-4 h-4" />
            Move In/Out
          </TabsTrigger>

          <TabsTrigger
            value="staff-type"
            className="group flex items-center justify-center gap-2 data-[state=active]:bg-[#eeeae3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 border-none font-semibold py-3"
          >
            <User className="w-4 h-4" />
            Staff Type
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visit-purpose" className="mt-6">
          <EnhancedTable
            data={visitPurposeData}
            columns={columns}
            renderCell={(item, columnKey) =>
              renderCell(item, columnKey, "visit")
            }
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            rightActions={
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-  [#C72030] hover:bg-[#C72030] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Purpose
              </Button>
            }
            loading={loading}
            emptyMessage="No Matching Records Found"
          />
        </TabsContent>

        <TabsContent value="move-in-out" className="mt-6">
          <EnhancedTable
            data={moveInOutData}
            columns={columns}
            renderCell={(item, columnKey) =>
              renderCell(item, columnKey, "move")
            }
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            rightActions={
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#C72030] hover:bg-[#C72030] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Move In/Out
              </Button>
            }
            loading={loading}
            emptyMessage="No Matching Records Found"
          />
        </TabsContent>

        <TabsContent value="staff-type" className="mt-6">
          <EnhancedTable
            data={staffTypeData}
            columns={staffColumns}
            renderCell={(item, columnKey) =>
              renderCell(item, columnKey, "staff")
            }
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            rightActions={
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#C72030] hover:bg-[#C72030] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Staff Type
              </Button>
            }
            loading={loading}
            emptyMessage="No Matching Records Found"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-white relative">
            <DialogTitle className="text-center font-bold text-lg">
              Add Purpose
            </DialogTitle>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select society
              </label>
              <Select
                onValueChange={(val) =>
                  setFormData({ ...formData, society: val })
                }
                value={formData.society}
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                  <SelectValue placeholder="Select society" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="society1">Society 1</SelectItem>
                  <SelectItem value="society2">Society 2</SelectItem>
                  <SelectItem value="society3">Society 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Enter purpose
              </label>
              <Input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                placeholder="enter purpose"
                className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="add-active"
                checked={formData.status}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked as boolean,
                  })
                }
                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <label
                htmlFor="add-active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active
              </label>
            </div>

            {activeTab === "staff-type" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Work Type
                </label>
                <Select
                  onValueChange={(val) =>
                    setFormData({ ...formData, workType: val })
                  }
                  value={formData.workType}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Society">Society</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex justify-start bg-white">
            <Button
              onClick={handleAddPurpose}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Purpose Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-white relative">
            <DialogTitle className="text-center font-bold text-lg">
              Edit Purpose
            </DialogTitle>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                name="purpose"
                value={editFormData.purpose}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, purpose: e.target.value })
                }
                placeholder="Enter purpose"
                className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={editFormData.status}
                onCheckedChange={(checked) =>
                  setEditFormData({
                    ...editFormData,
                    status: checked as boolean,
                  })
                }
                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <label
                htmlFor="active"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active
              </label>
            </div>

            {activeTab === "staff-type" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Work Type
                </label>
                <Select
                  onValueChange={(val) =>
                    setEditFormData({ ...editFormData, workType: val })
                  }
                  value={editFormData.workType}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Society">Society</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex justify-start bg-white">
            <Button
              onClick={handleUpdatePurpose}
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

export default SmartSecureSetupGeneral;
