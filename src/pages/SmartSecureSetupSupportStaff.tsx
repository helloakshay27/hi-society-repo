import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Briefcase, Truck, X } from "lucide-react";
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

interface StaffCategory {
  id: number;
  name: string;
  type?: string;
  estimatedTime: string;
  icon: string;
  active?: boolean;
  createdOn: string;
  createdBy: string;
}

const STAFF_ICONS = [
  { value: "medical", label: "🏥" },
  { value: "dryer", label: "💨" },
  { value: "package", label: "📦" },
  { value: "washing", label: "🧺" },
  { value: "worker", label: "👷" },
  { value: "card", label: "💳" },
  { value: "plus", label: "➕" },
  { value: "person2", label: "👨‍💼" },
  { value: "person3", label: "👨‍🔧" },
  { value: "woman2", label: "👩‍💼" },
  { value: "person4", label: "👨‍🏭" },
  { value: "virus", label: "🦠" },
  { value: "box4", label: "📦" },
  { value: "person5", label: "👨‍🔬" },
  { value: "person6", label: "👨‍🍳" },
  { value: "woman3", label: "👩‍🔬" },
  { value: "person7", label: "👨‍🎓" },
  { value: "settings", label: "⚙️" },
];

const DELIVERY_ICONS = [
  { value: "swiggy", label: "Swiggy", bg: "bg-orange-500", text: "text-white" },
  { value: "zomato", label: "Zomato", bg: "bg-red-500", text: "text-white" },
  { value: "dunzo", label: "Dunzo", bg: "bg-blue-400", text: "text-white" },
  { value: "box8", label: "BOX8", bg: "bg-red-600", text: "text-white" },
  { value: "dominos", label: "Dominos", bg: "bg-blue-600", text: "text-white" },
  { value: "amazon", label: "Amazon", bg: "bg-gray-200", text: "text-black" },
  {
    value: "flipkart",
    label: "Flipkart",
    bg: "bg-yellow-400",
    text: "text-blue-900",
  },
  { value: "myntra", label: "Myntra", bg: "bg-pink-500", text: "text-white" },
  {
    value: "rickshaw",
    label: "🛺",
    bg: "bg-gray-100",
    text: "text-black",
    border: true,
  },
  { value: "ola", label: "OLA", bg: "bg-green-500", text: "text-white" },
  { value: "uber", label: "Uber", bg: "bg-black", text: "text-white" },
  { value: "meru", label: "Meru", bg: "bg-yellow-500", text: "text-black" },
  { value: "rapido", label: "Rapido", bg: "bg-yellow-300", text: "text-black" },
  {
    value: "amazonprime",
    label: "Prime",
    bg: "bg-gray-300",
    text: "text-black",
  },
  { value: "dominos2", label: "🍕", bg: "bg-red-500", text: "text-white" },
  { value: "flipkart2", label: "📦", bg: "bg-blue-400", text: "text-white" },
  { value: "swiggy2", label: "🍔", bg: "bg-orange-400", text: "text-white" },
  { value: "zomato2", label: "🍽️", bg: "bg-red-400", text: "text-white" },
  { value: "dunzo2", label: "Dunzo", bg: "bg-blue-300", text: "text-white" },
  {
    value: "blinkit",
    label: "Blinkit",
    bg: "bg-yellow-400",
    text: "text-black",
  },
  { value: "dunzo3", label: "🚚", bg: "bg-green-400", text: "text-white" },
  {
    value: "grofers",
    label: "Grofers",
    bg: "bg-orange-500",
    text: "text-white",
  },
  { value: "dmart", label: "DMart", bg: "bg-green-600", text: "text-white" },
  {
    value: "bharatgas",
    label: "Bharat",
    bg: "bg-yellow-500",
    text: "text-black",
  },
  { value: "box82", label: "BOX8", bg: "bg-red-500", text: "text-white" },
  {
    value: "bluedart",
    label: "Blue Dart",
    bg: "bg-blue-500",
    text: "text-white",
  },
];

const SmartSecureSetupSupportStaff: React.FC = () => {
  const [activeTab, setActiveTab] = useState("society-staff");
  const [societyStaffData, setSocietyStaffData] = useState<StaffCategory[]>([
    {
      id: 1,
      name: "Ambulance",
      estimatedTime: "",
      icon: "medical",
      createdOn: "08/01/2026 4:20 PM",
      createdBy: "Godrej Living",
    },
    {
      id: 2,
      name: "Other",
      estimatedTime: "",
      icon: "",
      createdOn: "26/06/2023 3:54 PM",
      createdBy: "Godrej Hisociety",
    },
    {
      id: 3,
      name: "Labor",
      estimatedTime: "",
      icon: "",
      createdOn: "26/06/2023 3:54 PM",
      createdBy: "Godrej Hisociety",
    },
    {
      id: 4,
      name: "Contractor",
      estimatedTime: "",
      icon: "more",
      createdOn: "26/06/2023 3:54 PM",
      createdBy: "Godrej Hisociety",
    },
  ]);
  const [deliveryServiceData, setDeliveryServiceData] = useState<
    StaffCategory[]
  >([
    {
      id: 1,
      name: "Blue Dart",
      type: "Support_staff",
      estimatedTime: "",
      icon: "bluedart",
      active: true,
      createdOn: "13/08/2025 5:50 PM",
      createdBy: "Runwal Projects",
    },
    {
      id: 2,
      name: "BOX8",
      type: "Support_staff",
      estimatedTime: "",
      icon: "box8",
      active: true,
      createdOn: "07/05/2025 2:24 PM",
      createdBy: "Rustompee Lockated",
    },
    {
      id: 3,
      name: "Bharat Gas",
      type: "Support_staff",
      estimatedTime: "",
      icon: "bharatgas",
      active: true,
      createdOn: "07/05/2025 1:58 PM",
      createdBy: "Runwal Gardens",
    },
    {
      id: 4,
      name: "Rickshaw",
      type: "Cab",
      estimatedTime: "",
      icon: "rickshaw",
      active: true,
      createdOn: "21/09/2023 2:10 PM",
      createdBy: "Demo Demo",
    },
    {
      id: 5,
      name: "Rapido",
      type: "Cab",
      estimatedTime: "",
      icon: "rapido",
      active: true,
      createdOn: "15/09/2023 2:23 PM",
      createdBy: "Demo Demo",
    },
    {
      id: 6,
      name: "InDrive",
      type: "Cab",
      estimatedTime: "",
      icon: "indrive",
      active: true,
      createdOn: "15/09/2023 1:10 PM",
      createdBy: "Demo Demo",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffCategory | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    estimatedTime: "",
    selectedIcon: "",
    active: false,
    days: "",
    hours: "",
    minutes: "",
  });

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

  const handleEdit = (item: StaffCategory) => {
    setEditingItem(item);

    let days = "";
    let hours = "";
    let minutes = "";

    if (item.estimatedTime) {
      const d = item.estimatedTime.match(/(\d+)\s*Days?/i);
      const h = item.estimatedTime.match(/(\d+)\s*Hrs?/i);
      const m = item.estimatedTime.match(/(\d+)\s*Min/i);
      if (d) days = d[1];
      if (h) hours = h[1];
      if (m) minutes = m[1];
    }

    setFormData({
      name: item.name,
      type: item.type || "",
      estimatedTime: item.estimatedTime,
      selectedIcon: item.icon,
      active: item.active || false,
      days,
      hours,
      minutes,
    });
    setIsEditModalOpen(true);
  };

  const handleAddCategory = () => {
    if (!formData.name.trim()) {
      setTimeout(() => {
        toast.error("Please enter a category name");
      }, 0);
      return;
    }

    const newCategory: StaffCategory = {
      id: Date.now(),
      name: formData.name,
      estimatedTime: formData.estimatedTime,
      icon: "",
      createdOn: new Date().toLocaleString(),
      createdBy: "Current User",
    };

    if (activeTab === "society-staff") {
      setSocietyStaffData((prev) => [...prev, newCategory]);
    } else {
      setDeliveryServiceData((prev) => [...prev, newCategory]);
    }

    setFormData({
      name: "",
      type: "",
      estimatedTime: "",
      selectedIcon: "",
      active: false,
      days: "",
      hours: "",
      minutes: "",
    });
    setIsAddModalOpen(false);
    setTimeout(() => {
      toast.success("Category added successfully!");
    }, 0);
  };

  const handleUpdateCategory = () => {
    if (!formData.name.trim()) {
      setTimeout(() => {
        toast.error("Please enter a category name");
      }, 0);
      return;
    }

    if (!editingItem) return;

    const updatedCategory: StaffCategory = {
      ...editingItem,
      name: formData.name,
      estimatedTime:
        activeTab === "society-staff"
          ? [
              formData.days ? `${formData.days} Days` : "",
              formData.hours ? `${formData.hours} Hrs` : "",
              formData.minutes ? `${formData.minutes} Min` : "",
            ]
              .filter(Boolean)
              .join(" ")
          : formData.estimatedTime,
      icon: formData.selectedIcon,
    };

    const updateData = (prev: StaffCategory[]) =>
      prev.map((item) => (item.id === editingItem.id ? updatedCategory : item));

    if (activeTab === "society-staff") {
      setSocietyStaffData(updateData);
    } else {
      setDeliveryServiceData(updateData);
    }

    setEditingItem(null);
    setFormData({
      name: "",
      type: "",
      estimatedTime: "",
      selectedIcon: "",
      active: false,
      days: "",
      hours: "",
      minutes: "",
    });
    setIsEditModalOpen(false);
    setTimeout(() => {
      toast.success("Category updated successfully!");
    }, 0);
  };

  const renderIcon = (iconType: string) => {
    if (iconType === "medical") {
      return (
        <div className="flex justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
          </svg>
        </div>
      );
    } else if (iconType === "more") {
      return (
        <div className="flex justify-center">
          <svg
            className="w-8 h-8 text-gray-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </div>
      );
    }
    return null;
  };

  const renderCell = (
    item: StaffCategory,
    columnKey: string,
    index: number
  ) => {
    switch (columnKey) {
      case "sno":
        return index + 1;
      case "type":
        return item.type || "-";
      case "active":
        return item.active ? "True" : "False";
      case "icon": {
        // For delivery service, show brand logos as text/emoji placeholders
        if (activeTab === "delivery-service") {
          const iconConfig = DELIVERY_ICONS.find((i) => i.value === item.icon);
          if (iconConfig) {
            return (
              <div className="flex justify-center">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded ${iconConfig.bg} ${
                    iconConfig.border ? "border" : ""
                  }`}
                >
                  <span className={`text-xs font-bold ${iconConfig.text}`}>
                    {iconConfig.label}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div className="flex justify-center">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                <span className="text-xs font-semibold">{item.icon}</span>
              </div>
            </div>
          );
        }

        const staffIcon = STAFF_ICONS.find((i) => i.value === item.icon);
        if (staffIcon) {
          return (
            <div className="flex justify-center">
              <span className="text-2xl">{staffIcon.label}</span>
            </div>
          );
        }

        return renderIcon(item.icon);
      }
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
        return item[columnKey as keyof StaffCategory] || "-";
    }
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
            renderCell={renderCell}
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            leftActions={
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
        </TabsContent>

        <TabsContent value="delivery-service" className="mt-6">
          <EnhancedTable
            data={deliveryServiceData}
            columns={deliveryServiceColumns}
            renderCell={renderCell}
            pagination={true}
            enableGlobalSearch={true}
            searchPlaceholder="Search"
            leftActions={
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
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white p-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-4 border-b bg-white relative">
            <DialogTitle className="text-center font-bold text-lg">
              {activeTab === "society-staff" ? "Create Staff Category" : "Add"}
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
                {/* Society Staff Category Form */}
                {/* Category Name */}
                <div className="space-y-2">
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

                {/* Estimated Time */}
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="text"
                    value={formData.days}
                    onChange={(e) =>
                      setFormData({ ...formData, days: e.target.value })
                    }
                    placeholder="Days"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.hours}
                    onChange={(e) =>
                      setFormData({ ...formData, hours: e.target.value })
                    }
                    placeholder="Hrs"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, minutes: e.target.value })
                    }
                    placeholder="Min"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                  />
                </div>

                {/* Icon Selection Grid */}
                <div className="grid grid-cols-7 gap-4 p-4 border border-gray-200 rounded">
                  {/* Row 1 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="box1"
                      checked={formData.selectedIcon === "box1"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">📦</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="box2"
                      checked={formData.selectedIcon === "box2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">📦</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="cart"
                      checked={formData.selectedIcon === "cart"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🛒</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="medical"
                      checked={formData.selectedIcon === "medical"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">⚕️</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="heart"
                      checked={formData.selectedIcon === "heart"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">❤️</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="woman"
                      checked={formData.selectedIcon === "woman"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👩</span>
                  </label>

                  {/* Row 2 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="more"
                      checked={formData.selectedIcon === "more"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">⋯</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="luggage"
                      checked={formData.selectedIcon === "luggage"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🧳</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="dryer"
                      checked={formData.selectedIcon === "dryer"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">💨</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="package"
                      checked={formData.selectedIcon === "package"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">📦</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="washing"
                      checked={formData.selectedIcon === "washing"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🧺</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="worker"
                      checked={formData.selectedIcon === "worker"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👷</span>
                  </label>

                  {/* Row 3 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="card"
                      checked={formData.selectedIcon === "card"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">💳</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="plus"
                      checked={formData.selectedIcon === "plus"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl text-red-500 font-bold">➕</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="user"
                      checked={formData.selectedIcon === "user"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👤</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="mask"
                      checked={formData.selectedIcon === "mask"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">😷</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="building"
                      checked={formData.selectedIcon === "building"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🏛️</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="screw"
                      checked={formData.selectedIcon === "screw"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🔩</span>
                  </label>

                  {/* Row 4 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person1"
                      checked={formData.selectedIcon === "person1"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="delivery"
                      checked={formData.selectedIcon === "delivery"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🚚</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="box3"
                      checked={formData.selectedIcon === "box3"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">📦</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person2"
                      checked={formData.selectedIcon === "person2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨‍💼</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person3"
                      checked={formData.selectedIcon === "person3"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨‍🔧</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="woman2"
                      checked={formData.selectedIcon === "woman2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👩‍💼</span>
                  </label>

                  {/* Row 5 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person4"
                      checked={formData.selectedIcon === "person4"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨‍🏭</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="virus"
                      checked={formData.selectedIcon === "virus"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">🦠</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="box4"
                      checked={formData.selectedIcon === "box4"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">📦</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person5"
                      checked={formData.selectedIcon === "person5"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨‍🔬</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person6"
                      checked={formData.selectedIcon === "person6"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨‍🍳</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="woman3"
                      checked={formData.selectedIcon === "woman3"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👩‍🔬</span>
                  </label>

                  {/* Row 6 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="person7"
                      checked={formData.selectedIcon === "person7"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">👨‍🎓</span>
                  </label>
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="icon"
                      value="settings"
                      checked={formData.selectedIcon === "settings"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <span className="text-3xl">⚙️</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Cab & Delivery Service Provider Form */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Name Input */}
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter Name"
                    className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                  />

                  {/* Type Dropdown */}
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
                      <SelectItem value="Support_staff">
                        Support_staff
                      </SelectItem>
                      <SelectItem value="Cab">Cab</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, active: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Active
                  </label>
                </div>

                {/* Select Icon Label */}
                <div className="text-sm font-medium text-gray-700">
                  Select Icon
                </div>

                {/* Delivery Service Icon Grid */}
                <div className="grid grid-cols-6 gap-3 p-4 border border-gray-200 rounded max-h-[400px] overflow-y-auto">
                  {/* Row 1 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="swiggy"
                      checked={formData.selectedIcon === "swiggy"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-orange-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Swiggy
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="zomato"
                      checked={formData.selectedIcon === "zomato"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-red-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Zomato
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="dunzo"
                      checked={formData.selectedIcon === "dunzo"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-blue-400 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Dunzo
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="box8"
                      checked={formData.selectedIcon === "box8"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-red-600 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">BOX8</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="dominos"
                      checked={formData.selectedIcon === "dominos"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-blue-600 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Dominos
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="amazon"
                      checked={formData.selectedIcon === "amazon"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
                      <span className="text-black font-bold text-xs">
                        Amazon
                      </span>
                    </div>
                  </label>

                  {/* Row 2 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="flipkart"
                      checked={formData.selectedIcon === "flipkart"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-yellow-400 flex items-center justify-center rounded">
                      <span className="text-blue-900 font-bold text-xs">
                        Flipkart
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="myntra"
                      checked={formData.selectedIcon === "myntra"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-pink-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Myntra
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="rickshaw"
                      checked={formData.selectedIcon === "rickshaw"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded border">
                      <span className="text-black font-bold text-xs">🛺</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="ola"
                      checked={formData.selectedIcon === "ola"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-green-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">OLA</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="uber"
                      checked={formData.selectedIcon === "uber"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-black flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">Uber</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="meru"
                      checked={formData.selectedIcon === "meru"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-yellow-500 flex items-center justify-center rounded">
                      <span className="text-black font-bold text-xs">Meru</span>
                    </div>
                  </label>

                  {/* Row 3 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="rapido"
                      checked={formData.selectedIcon === "rapido"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-yellow-300 flex items-center justify-center rounded">
                      <span className="text-black font-bold text-xs">
                        Rapido
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="amazonprime"
                      checked={formData.selectedIcon === "amazonprime"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-gray-300 flex items-center justify-center rounded">
                      <span className="text-black font-bold text-xs">
                        Prime
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="dominos2"
                      checked={formData.selectedIcon === "dominos2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-red-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">🍕</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="flipkart2"
                      checked={formData.selectedIcon === "flipkart2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-blue-400 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">📦</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="swiggy2"
                      checked={formData.selectedIcon === "swiggy2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-orange-400 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">🍔</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="zomato2"
                      checked={formData.selectedIcon === "zomato2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-red-400 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">🍽️</span>
                    </div>
                  </label>

                  {/* Row 4 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="dunzo2"
                      checked={formData.selectedIcon === "dunzo2"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-blue-300 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Dunzo
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="blinkit"
                      checked={formData.selectedIcon === "blinkit"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-yellow-400 flex items-center justify-center rounded">
                      <span className="text-black font-bold text-xs">
                        Blinkit
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="dunzo3"
                      checked={formData.selectedIcon === "dunzo3"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-green-400 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">🚚</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="grofers"
                      checked={formData.selectedIcon === "grofers"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-orange-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Grofers
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="dmart"
                      checked={formData.selectedIcon === "dmart"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-green-600 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        DMart
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="bharatgas"
                      checked={formData.selectedIcon === "bharatgas"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-yellow-500 flex items-center justify-center rounded">
                      <span className="text-black font-bold text-xs">
                        Bharat
                      </span>
                    </div>
                  </label>

                  {/* Row 5 */}
                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="box82"
                      checked={formData.selectedIcon === "box82"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-red-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">BOX8</span>
                    </div>
                  </label>

                  <label className="flex flex-col items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deliveryIcon"
                      value="bluedart"
                      checked={formData.selectedIcon === "bluedart"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selectedIcon: e.target.value,
                        })
                      }
                      className="mb-2"
                    />
                    <div className="w-16 h-16 bg-blue-500 flex items-center justify-center rounded">
                      <span className="text-white font-bold text-xs">
                        Blue Dart
                      </span>
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white sticky bottom-0 z-10">
            <Button
              onClick={handleAddCategory}
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
          <DialogHeader className="p-4 border-b bg-[#F6F4EE] relative">
            <DialogTitle className="text-center font-bold text-lg">
              {activeTab === "society-staff"
                ? "Edit Staff Category"
                : "Edit Category"}
            </DialogTitle>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          {activeTab === "society-staff" ? (
            <div className="p-6 bg-white space-y-6">
              <div className="space-y-1">
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

              <div className="flex gap-4">
                <Input
                  type="text"
                  value={formData.days}
                  onChange={(e) =>
                    setFormData({ ...formData, days: e.target.value })
                  }
                  placeholder="Days"
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 w-full"
                />
                <Input
                  type="text"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: e.target.value })
                  }
                  placeholder="Hrs"
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 w-full"
                />
                <Input
                  type="text"
                  value={formData.minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, minutes: e.target.value })
                  }
                  placeholder="Min"
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Selected Icon
                </div>
                <div className="flex items-center justify-start">
                  <span className="text-6xl text-red-500">
                    {STAFF_ICONS.find((i) => i.value === formData.selectedIcon)
                      ?.label ||
                      (formData.selectedIcon ? (
                        <span className="text-3xl">
                          {formData.selectedIcon}
                        </span>
                      ) : (
                        <Plus className="w-12 h-12" />
                      ))}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Select Icon
                </div>
                <div className="grid grid-cols-6 gap-3 p-4 border border-gray-200 rounded max-h-[200px] overflow-y-auto">
                  {STAFF_ICONS.map((icon) => (
                    <label
                      key={icon.value}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="icon"
                        value={icon.value}
                        checked={formData.selectedIcon === icon.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            selectedIcon: e.target.value,
                          })
                        }
                        className="mb-2"
                      />
                      <span className="text-3xl">{icon.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-white space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="relative">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                      Name <span className="text-[#C72030]">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter category name"
                      className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                      Estimated Time
                    </label>
                    <Input
                      type="text"
                      value={formData.estimatedTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedTime: e.target.value,
                        })
                      }
                      placeholder="Enter estimated time"
                      className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selection for Delivery Service */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  Selected Icon
                </div>
                <div className="flex items-center justify-start h-20">
                  {formData.selectedIcon ? (
                    (() => {
                      const icon = DELIVERY_ICONS.find(
                        (i) => i.value === formData.selectedIcon
                      );
                      const isImage = false; // Logic for brand icons vs emojis? All in DELIVERY_ICONS are styled divs
                      if (icon) {
                        return (
                          <div
                            className={`w-16 h-16 flex items-center justify-center rounded ${icon.bg} ${icon.border ? "border" : ""}`}
                          >
                            <span className={`${icon.text} font-bold text-xs`}>
                              {icon.label}
                            </span>
                          </div>
                        );
                      }
                      return <span className="text-gray-500">No Icon</span>;
                    })()
                  ) : (
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
                <div className="grid grid-cols-6 gap-3 p-4 border border-gray-200 rounded max-h-[200px] overflow-y-auto">
                  {DELIVERY_ICONS.map((icon) => (
                    <label
                      key={icon.value}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="deliveryEditIcon"
                        value={icon.value}
                        checked={formData.selectedIcon === icon.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            selectedIcon: e.target.value,
                          })
                        }
                        className="mb-2"
                      />
                      <div
                        className={`w-16 h-16 flex items-center justify-center rounded ${icon.bg} ${icon.border ? "border" : ""}`}
                      >
                        <span className={`${icon.text} font-bold text-xs`}>
                          {icon.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleUpdateCategory}
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

export default SmartSecureSetupSupportStaff;
