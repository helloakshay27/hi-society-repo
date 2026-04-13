import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Briefcase, Truck, User, X } from "lucide-react";
import { toast } from "sonner";
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
import {
  fetchVisitorSetupData,
  fetchApprovedSocieties,
  fetchStaffFilters,
  createVisitPurpose,
  editVisitPurpose,
  createMimoPurpose,
  editMimoPurpose,
  createStaffType,
  editStaffType,
  type VisitPurposeItem,
  type MimoPurposeItem,
  type StaffTypeItem,
  type SocietyOption,
  type WorkTypeOption,
} from "@/services/smartSecureSetupAPI";

interface SetupItem {
  id: number;
  purpose: string;
  status: boolean;
  workType?: string;
}

const mapVisitPurpose = (item: VisitPurposeItem): SetupItem => ({
  id: item.id,
  purpose: item.purpose,
  status: item.active === 1,
});

const mapMimoPurpose = (item: MimoPurposeItem): SetupItem => ({
  id: item.id,
  purpose: item.purpose,
  status: item.active === 1,
});

const mapStaffType = (item: StaffTypeItem): SetupItem => ({
  id: item.id,
  purpose: item.staff_type,
  status: item.active === 1,
  workType: item.related_to || "-",
});

const SmartSecureSetupGeneral: React.FC = () => {
  const [activeTab, setActiveTab] = useState("visit-purpose");
  const [visitPurposeData, setVisitPurposeData] = useState<SetupItem[]>([]);
  const [moveInOutData, setMoveInOutData] = useState<SetupItem[]>([]);
  const [staffTypeData, setStaffTypeData] = useState<SetupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SetupItem | null>(null);

  // Society dropdown
  const [societies, setSocieties] = useState<SocietyOption[]>([]);
  const [societyId, setSocietyId] = useState<string>("");

  // Work type options from staff_filters API
  const [workTypeOptions, setWorkTypeOptions] = useState<WorkTypeOption[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    society: "",
    purpose: "",
    status: false,
    workType: "",
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

  // Fetch societies for dropdown
  const loadSocieties = useCallback(async () => {
    try {
      const data = await fetchApprovedSocieties();
      // Deduplicate by id_society
      const unique = data.filter(
        (s, i, arr) => arr.findIndex((x) => x.id_society === s.id_society) === i
      );
      setSocieties(unique);

      // Pre-select current society from localStorage
      const storedSocietyId = localStorage.getItem("selectedSocietyId") || "";
      if (storedSocietyId) {
        setSocietyId(storedSocietyId);
        setFormData((prev) => ({ ...prev, society: storedSocietyId }));
      }
    } catch (error) {
      console.error("Failed to fetch societies:", error);
    }
  }, []);

  // Fetch work type options from staff_filters API
  const loadWorkTypes = useCallback(async () => {
    try {
      const data = await fetchStaffFilters();
      setWorkTypeOptions(data);
    } catch (error) {
      console.error("Failed to fetch work types:", error);
    }
  }, []);

  // Fetch visitor setup data (list API)
  const loadSetupData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVisitorSetupData();
      setSocietyId(data.society_id || societyId);
      setVisitPurposeData(data.visit_purposes.map(mapVisitPurpose));
      setMoveInOutData(data.mimo_purposes.map(mapMimoPurpose));
      setStaffTypeData(data.staff_types.map(mapStaffType));
    } catch (error) {
      console.error("Failed to fetch setup data:", error);
      toast.error("Failed to load setup data");
    } finally {
      setLoading(false);
    }
  }, [societyId]);

  useEffect(() => {
    loadSocieties();
    loadWorkTypes();
    loadSetupData();
  }, [loadSocieties, loadWorkTypes, loadSetupData]);

  // Toggle status via edit API
  const handleToggleStatus = async (
    id: number,
    currentStatus: boolean,
    dataType: "visit" | "move" | "staff"
  ) => {
    const newActive = !currentStatus;
    try {
      if (dataType === "visit") {
        const item = visitPurposeData.find((v) => v.id === id);
        if (item) await editVisitPurpose(id, societyId, item.purpose, newActive);
      } else if (dataType === "move") {
        const item = moveInOutData.find((v) => v.id === id);
        if (item) await editMimoPurpose(id, societyId, item.purpose, newActive);
      } else {
        const item = staffTypeData.find((v) => v.id === id);
        if (item)
          await editStaffType(id, societyId, item.purpose, item.workType || "Society", newActive);
      }

      // Update local state
      const updateData = (prev: SetupItem[]) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newActive } : item
        );

      if (dataType === "visit") setVisitPurposeData(updateData);
      else if (dataType === "move") setMoveInOutData(updateData);
      else setStaffTypeData(updateData);

      toast.success("Status updated successfully!");
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Failed to update status");
    }
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

  // Add purpose via API
  const handleAddPurpose = async () => {
    if (!formData.purpose.trim()) {
      toast.error("Please enter a purpose");
      return;
    }

    const selectedSociety = formData.society || societyId;
    if (!selectedSociety) {
      toast.error("Please select a society");
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === "visit-purpose") {
        await createVisitPurpose(selectedSociety, formData.purpose, formData.status);
      } else if (activeTab === "move-in-out") {
        await createMimoPurpose(selectedSociety, formData.purpose, formData.status);
      } else {
        await createStaffType(
          selectedSociety,
          formData.purpose,
          formData.workType,
          formData.status
        );
      }

      setFormData({ society: selectedSociety, purpose: "", status: false, workType: "" });
      setIsAddModalOpen(false);
      toast.success(
        `${activeTab === "staff-type" ? "Staff type" : "Purpose"} added successfully!`
      );
      // Refresh data
      loadSetupData();
    } catch (error) {
      console.error("Failed to add:", error);
      toast.error(
        `Failed to add ${activeTab === "staff-type" ? "staff type" : "purpose"}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update purpose via API
  const handleUpdatePurpose = async () => {
    if (!editFormData.purpose.trim()) {
      toast.error("Please enter a purpose");
      return;
    }
    if (!editingItem) return;

    setSubmitting(true);
    try {
      if (activeTab === "visit-purpose") {
        await editVisitPurpose(editingItem.id, societyId, editFormData.purpose, editFormData.status);
      } else if (activeTab === "move-in-out") {
        await editMimoPurpose(editingItem.id, societyId, editFormData.purpose, editFormData.status);
      } else {
        await editStaffType(
          editingItem.id,
          societyId,
          editFormData.purpose,
          editFormData.workType,
          editFormData.status
        );
      }

      setEditingItem(null);
      setEditFormData({ purpose: "", status: true, workType: "" });
      setIsEditModalOpen(false);
      toast.success(
        `${activeTab === "staff-type" ? "Staff type" : "Purpose"} updated successfully!`
      );
      loadSetupData();
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error(
        `Failed to update ${activeTab === "staff-type" ? "staff type" : "purpose"}`
      );
    } finally {
      setSubmitting(false);
    }
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
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                item.status
                  ? "bg-[#00A651] text-white"
                  : "bg-red-500 text-white"
              }`}
              onClick={() => handleToggleStatus(item.id, item.status, dataType)}
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

  const getAddLabel = () => {
    switch (activeTab) {
      case "visit-purpose":
        return "Enter purpose";
      case "move-in-out":
        return "Enter purpose";
      case "staff-type":
        return "Enter staff type";
      default:
        return "Enter purpose";
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
                className="bg-[#C72030] hover:bg-[#C72030] text-white"
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

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-white relative">
            <DialogTitle className="text-center font-bold text-lg">
              Add {getTabLabel()}
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
                  {societies.map((s) => (
                    <SelectItem key={s.id_society} value={s.id_society}>
                      {s.society?.building_name || `Society ${s.id_society}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {getAddLabel()}
              </label>
              <Input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                placeholder={getAddLabel().toLowerCase()}
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
                    {workTypeOptions.map((wt) => (
                      <SelectItem key={wt.value} value={wt.value}>
                        {wt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex justify-start bg-white">
            <Button
              onClick={handleAddPurpose}
              disabled={submitting}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-white relative">
            <DialogTitle className="text-center font-bold text-lg">
              Edit {getTabLabel()}
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
              <label className="text-sm font-medium text-gray-700">
                {activeTab === "staff-type" ? "Staff Type" : "Purpose"}
              </label>
              <Input
                type="text"
                name="purpose"
                value={editFormData.purpose}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, purpose: e.target.value })
                }
                placeholder={
                  activeTab === "staff-type"
                    ? "Enter staff type"
                    : "Enter purpose"
                }
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
                    {workTypeOptions.map((wt) => (
                      <SelectItem key={wt.value} value={wt.value}>
                        {wt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex justify-start bg-white">
            <Button
              onClick={handleUpdatePurpose}
              disabled={submitting}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartSecureSetupGeneral;
