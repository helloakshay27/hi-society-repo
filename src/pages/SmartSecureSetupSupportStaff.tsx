import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Edit, Briefcase, Truck, X } from "lucide-react";
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
  fetchSupportStaffSetup,
  fetchDeliveryServiceProviders,
  createSupportStaffCategory,
  updateSupportStaffCategory,
  fetchSupportStaffCategoryById,
  createDeliveryServiceProvider,
  updateDeliveryServiceProvider,
  fetchDeliveryServiceProviderById,
  calculateEstimatedTimeMinutes,
  parseEstimatedTime,
  mapStaffCategory,
  mapDeliveryProvider,
  type SupportStaffCategory,
  type DeliveryServiceProvider,
  type IconItem,
} from "@/services/supportStaffAPI";

const INITIAL_FORM = {
  name: "",
  type: "",
  estimatedTime: "",
  selectedIconId: 0,
  active: false,
  days: "",
  hours: "",
  minutes: "",
};

const SmartSecureSetupSupportStaff: React.FC = () => {
  const [activeTab, setActiveTab] = useState("society-staff");
  const [societyStaffData, setSocietyStaffData] = useState<
    SupportStaffCategory[]
  >([]);
  const [deliveryServiceData, setDeliveryServiceData] = useState<
    DeliveryServiceProvider[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Icons from API
  const [staffCategoryIcons, setStaffCategoryIcons] = useState<IconItem[]>([]);
  const [deliveryProviderIcons, setDeliveryProviderIcons] = useState<
    IconItem[]
  >([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  const resetForm = () => setFormData({ ...INITIAL_FORM });

  const columns = [
    { key: "sno", label: "S.No.", sortable: false },
    { key: "name", label: "Name", sortable: true },
    { key: "estimatedTime", label: "Estimated Time", sortable: true },
    { key: "icon", label: "Icon", sortable: false },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
    { key: "action", label: "", sortable: false },
  ];

  const deliveryServiceColumns = [
    { key: "sno", label: "S.No.", sortable: false },
    { key: "name", label: "Name", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "active", label: "Active", sortable: false },
    { key: "icon", label: "Icon", sortable: false },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
    { key: "action", label: "", sortable: false },
  ];

  // ---- Data loading ----

  const loadSetupData = useCallback(async () => {
    setLoading(true);
    try {
      const [setupData, deliveryProviders] = await Promise.all([
        fetchSupportStaffSetup(),
        fetchDeliveryServiceProviders(),
      ]);

      setSocietyStaffData(
        setupData.support_staff_category.map(mapStaffCategory)
      );
      setStaffCategoryIcons(
        setupData.staff_category_icons.filter((i) => i.active)
      );
      setDeliveryProviderIcons(
        setupData.delivery_service_provider_icons.filter((i) => i.active)
      );
      setDeliveryServiceData(deliveryProviders.map(mapDeliveryProvider));
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load setup data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSetupData();
  }, [loadSetupData]);

  // ---- Edit handlers ----

  const handleEditStaffCategory = async (item: SupportStaffCategory) => {
    try {
      const detail = await fetchSupportStaffCategoryById(item.id);
      const parsed = parseEstimatedTime(detail.estimated_time || "");
      setEditingItemId(item.id);
      setFormData({
        name: detail.name || item.name,
        type: "",
        estimatedTime: detail.estimated_time || "",
        selectedIconId: detail.icon_id || 0,
        active: (detail.active ?? item.active) === 1 || detail.active === true,
        days: parsed.days ? String(parsed.days) : "",
        hours: parsed.hours ? String(parsed.hours) : "",
        minutes: parsed.minutes ? String(parsed.minutes) : "",
      });
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch category details:", error);
      // Fallback to local data
      const parsed = parseEstimatedTime(item.estimatedTime);
      setEditingItemId(item.id);
      setFormData({
        name: item.name,
        type: "",
        estimatedTime: item.estimatedTime,
        selectedIconId: 0,
        active: item.active,
        days: parsed.days ? String(parsed.days) : "",
        hours: parsed.hours ? String(parsed.hours) : "",
        minutes: parsed.minutes ? String(parsed.minutes) : "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditDeliveryProvider = async (item: DeliveryServiceProvider) => {
    try {
      const detail = await fetchDeliveryServiceProviderById(item.id);
      setEditingItemId(item.id);
      setFormData({
        name: detail.name || item.name,
        type: detail.provider_type || item.providerType || "",
        estimatedTime: "",
        selectedIconId: detail.icon_id || 0,
        active: detail.active ?? item.active,
        days: "",
        hours: "",
        minutes: "",
      });
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch provider details:", error);
      setEditingItemId(item.id);
      setFormData({
        name: item.name,
        type: item.providerType || "",
        estimatedTime: "",
        selectedIconId: 0,
        active: item.active,
        days: "",
        hours: "",
        minutes: "",
      });
      setIsEditModalOpen(true);
    }
  };

  // ---- Create handlers ----

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === "society-staff") {
        const totalMinutes = calculateEstimatedTimeMinutes(
          Number(formData.days) || 0,
          Number(formData.hours) || 0,
          Number(formData.minutes) || 0
        );
        await createSupportStaffCategory({
          name: formData.name,
          estimatedTime: totalMinutes,
          active: formData.active,
          iconId: formData.selectedIconId || undefined,
        });
        toast.success("Staff category created successfully!");
      } else {
        await createDeliveryServiceProvider({
          name: formData.name,
          providerType: formData.type || "support_staff",
          active: formData.active,
          iconId: formData.selectedIconId || undefined,
        });
        toast.success("Delivery service provider created successfully!");
      }
      resetForm();
      setIsAddModalOpen(false);
      loadSetupData();
    } catch (error) {
      console.error("Failed to create:", error);
      toast.error("Failed to create. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Update handlers ----

  const handleUpdateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!editingItemId) return;

    setSubmitting(true);
    try {
      if (activeTab === "society-staff") {
        const totalMinutes = calculateEstimatedTimeMinutes(
          Number(formData.days) || 0,
          Number(formData.hours) || 0,
          Number(formData.minutes) || 0
        );
        await updateSupportStaffCategory(editingItemId, {
          name: formData.name,
          estimatedTime: totalMinutes,
          active: formData.active,
          iconId: formData.selectedIconId || undefined,
        });
        toast.success("Staff category updated successfully!");
      } else {
        await updateDeliveryServiceProvider(editingItemId, {
          name: formData.name,
          providerType: formData.type || "support_staff",
          active: formData.active,
          iconId: formData.selectedIconId || undefined,
        });
        toast.success("Delivery service provider updated successfully!");
      }
      resetForm();
      setEditingItemId(null);
      setIsEditModalOpen(false);
      loadSetupData();
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error("Failed to update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Icon rendering ----

  const renderIconImage = (iconUrl: string | null) => {
    if (!iconUrl) {
      return (
        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-400 text-xs">-</span>
        </div>
      );
    }
    return (
      <img
        src={iconUrl}
        alt="icon"
        className="w-10 h-10 rounded object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  };

  const renderIconGrid = (
    icons: IconItem[],
    radioName: string
  ) => (
    <div className="grid grid-cols-6 gap-3 p-4 border border-gray-200 rounded max-h-[300px] overflow-y-auto">
      {icons.map((icon) => (
        <label
          key={icon.id}
          className={`flex flex-col items-center cursor-pointer p-1 rounded ${
            formData.selectedIconId === icon.id
              ? "ring-2 ring-[#C72030] bg-red-50"
              : ""
          }`}
        >
          <input
            type="radio"
            name={radioName}
            value={icon.id}
            checked={formData.selectedIconId === icon.id}
            onChange={() =>
              setFormData({ ...formData, selectedIconId: icon.id })
            }
            className="mb-1"
          />
          {icon.image_url ? (
            <img
              src={icon.image_url}
              alt={`Icon ${icon.id}`}
              className="w-12 h-12 rounded object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "";
                (e.target as HTMLImageElement).alt = "?";
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">{icon.id}</span>
            </div>
          )}
        </label>
      ))}
      {icons.length === 0 && (
        <div className="col-span-6 text-center text-gray-400 py-4">
          No icons available
        </div>
      )}
    </div>
  );

  // ---- Table cell renderers ----

  const renderStaffCell = (
    item: SupportStaffCategory,
    columnKey: string,
    index: number
  ) => {
    switch (columnKey) {
      case "sno":
        return index + 1;
      case "icon":
        return (
          <div className="flex justify-center">
            {renderIconImage(item.iconUrl)}
          </div>
        );
      case "action":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-600"
            onClick={() => handleEditStaffCategory(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        );
      default:
        return item[columnKey as keyof SupportStaffCategory] || "-";
    }
  };

  const renderDeliveryCell = (
    item: DeliveryServiceProvider,
    columnKey: string,
    index: number
  ) => {
    switch (columnKey) {
      case "sno":
        return index + 1;
      case "type":
        return item.providerType || "-";
      case "active":
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              item.active
                ? "bg-[#00A651] text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {item.active ? "True" : "False"}
          </span>
        );
      case "icon":
        return (
          <div className="flex justify-center">
            {renderIconImage(item.iconUrl)}
          </div>
        );
      case "action":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-600"
            onClick={() => handleEditDeliveryProvider(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        );
      default:
        return item[columnKey as keyof DeliveryServiceProvider] || "-";
    }
  };

  // ---- Selected icon preview ----

  const getSelectedIconPreview = () => {
    if (!formData.selectedIconId) return null;
    const icons =
      activeTab === "society-staff" ? staffCategoryIcons : deliveryProviderIcons;
    const icon = icons.find((i) => i.id === formData.selectedIconId);
    if (!icon) return null;
    if (icon.image_url) {
      return (
        <img
          src={icon.image_url}
          alt="Selected icon"
          className="w-16 h-16 rounded object-contain"
        />
      );
    }
    return (
      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
        <span className="text-gray-400">{icon.id}</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Setup</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger
            value="society-staff"
            className="group flex items-center justify-center gap-2 data-[state=active]:bg-[#eeeae3] data-[state=active]:text-[#c81e1e] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 border-none font-semibold py-3"
          >
            <Briefcase className="w-4 h-4" />
            Society Staff Category
          </TabsTrigger>

          <TabsTrigger
            value="delivery-service"
            className="group flex items-center justify-center gap-2 data-[state=active]:bg-[#eeeae3] data-[state=active]:text-[#c81e1e] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700 border-none font-semibold py-3"
          >
            <Truck className="w-4 h-4" />
            Cab & Delivery Service Provider
          </TabsTrigger>
        </TabsList>

        <TabsContent value="society-staff" className="mt-6">
          <EnhancedTable
            data={societyStaffData}
            columns={columns}
            renderCell={renderStaffCell}
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            leftActions={
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="bg-cyan-400 hover:bg-cyan-500 text-white"
              >
                Create
              </Button>
            }
            loading={loading}
            emptyMessage="No Matching Records Found"
          />
        </TabsContent>

        <TabsContent value="delivery-service" className="mt-6">
          <EnhancedTable
            data={deliveryServiceData}
            columns={deliveryServiceColumns}
            renderCell={renderDeliveryCell}
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            leftActions={
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="bg-cyan-400 hover:bg-cyan-500 text-white"
              >
                Create
              </Button>
            }
            loading={loading}
            emptyMessage="No Matching Records Found"
          />
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-4 border-b bg-white relative">
            <DialogTitle className="text-center font-bold text-lg">
              {activeTab === "society-staff"
                ? "Create Staff Category"
                : "Create Delivery Service Provider"}
            </DialogTitle>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <div className="p-6 bg-white space-y-4">
            {activeTab === "society-staff" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter Category Name"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Estimated Time
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      value={formData.days}
                      onChange={(e) =>
                        setFormData({ ...formData, days: e.target.value })
                      }
                      placeholder="Days"
                      className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                    />
                    <Input
                      type="number"
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData({ ...formData, hours: e.target.value })
                      }
                      placeholder="Hrs"
                      className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                    />
                    <Input
                      type="number"
                      value={formData.minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, minutes: e.target.value })
                      }
                      placeholder="Min"
                      className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Icon
                  </label>
                  {renderIconGrid(staffCategoryIcons, "staffIconAdd")}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter Name"
                      className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <Select
                      onValueChange={(val) =>
                        setFormData({ ...formData, type: val })
                      }
                      value={formData.type}
                    >
                      <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support_staff">
                          Support Staff
                        </SelectItem>
                        <SelectItem value="cab">Cab</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-active"
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, active: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="add-active"
                    className="text-sm font-medium leading-none"
                  >
                    Active
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Icon
                  </label>
                  {renderIconGrid(deliveryProviderIcons, "deliveryIconAdd")}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white sticky bottom-0 z-10">
            <Button
              onClick={handleAddCategory}
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
        <DialogContent className="sm:max-w-[600px] bg-white p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-4 border-b bg-[#F6F4EE] relative">
            <DialogTitle className="text-center font-bold text-lg">
              {activeTab === "society-staff"
                ? "Edit Staff Category"
                : "Edit Delivery Service Provider"}
            </DialogTitle>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingItemId(null);
                resetForm();
              }}
              className="absolute right-4 top-4 text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          {activeTab === "society-staff" ? (
            <div className="p-6 bg-white space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter Name"
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Estimated Time
                </label>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    value={formData.days}
                    onChange={(e) =>
                      setFormData({ ...formData, days: e.target.value })
                    }
                    placeholder="Days"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 w-full"
                  />
                  <Input
                    type="number"
                    value={formData.hours}
                    onChange={(e) =>
                      setFormData({ ...formData, hours: e.target.value })
                    }
                    placeholder="Hrs"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 w-full"
                  />
                  <Input
                    type="number"
                    value={formData.minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, minutes: e.target.value })
                    }
                    placeholder="Min"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Selected Icon
                </div>
                <div className="flex items-center justify-start h-20">
                  {getSelectedIconPreview() || (
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded border border-dashed border-gray-300">
                      <span className="text-gray-400 text-xs">None</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Select Icon
                </div>
                {renderIconGrid(staffCategoryIcons, "staffIconEdit")}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Name <span className="text-[#C72030]">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter name"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <Select
                    onValueChange={(val) =>
                      setFormData({ ...formData, type: val })
                    }
                    value={formData.type}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support_staff">
                        Support Staff
                      </SelectItem>
                      <SelectItem value="cab">Cab</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked as boolean })
                  }
                />
                <label
                  htmlFor="edit-active"
                  className="text-sm font-medium leading-none"
                >
                  Active
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Selected Icon
                </div>
                <div className="flex items-center justify-start h-20">
                  {getSelectedIconPreview() || (
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded border border-dashed border-gray-300">
                      <span className="text-gray-400 text-xs">None</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Select Icon
                </div>
                {renderIconGrid(deliveryProviderIcons, "deliveryIconEdit")}
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t flex justify-center bg-white sticky bottom-0 z-10">
            <Button
              onClick={handleUpdateCategory}
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

export default SmartSecureSetupSupportStaff;
