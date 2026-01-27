import React, { useState } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@mui/material";
import { Plus, Edit, X } from "lucide-react";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface RMUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  userType: string;
  section: string;
  createdOn: string;
  status: boolean;
}

const MOCK_DATA: RMUser[] = [
  {
    id: 250,
    name: "Abhishek Sharma",
    email: "abhishek.sharma@runwalgroup.in",
    mobile: "1893749821",
    userType: "Cs User",
    section: "Phase 1",
    createdOn: "18/08/2024",
    status: true,
  },
  {
    id: 249,
    name: "Vishwas Pratham",
    email: "vishwas.pratham@runwalgroup.in",
    mobile: "1119735509",
    userType: "Cs User",
    section: "Phase 1",
    createdOn: "18/08/2024",
    status: true,
  },
  {
    id: 234,
    name: "Akhil Raj",
    email: "akhil.raj@runwalgroup.in",
    mobile: "2269315808",
    userType: "Rm User",
    section: "Phase 2",
    createdOn: "09/07/2024",
    status: true,
  },
  {
    id: 228,
    name: "Anand Shah",
    email: "anand.shah@runwalgroup.in",
    mobile: "8097499915",
    userType: "Cs User",
    section: "Phase 2",
    createdOn: "09/07/2024",
    status: true,
  },
  {
    id: 176,
    name: "Rakesh Shah",
    email: "rakesh.shah@runwal.com",
    mobile: "9833857240",
    userType: "Cs User",
    section: "Phase 3",
    createdOn: "25/01/2023",
    status: true,
  },
  {
    id: 141,
    name: "Shriniwas Dalvi",
    email: "shriniwas.dalvi@runwalgroup.in",
    mobile: "9833050775",
    userType: "Cs User",
    section: "Phase 3",
    createdOn: "13/12/2022",
    status: true,
  },
];

const AppointmentzRMConfig = () => {
  const [data, setData] = useState<RMUser[]>(MOCK_DATA);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    userType: "",
    section: "",
  });

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile", sortable: true },
    { key: "userType", label: "User Type", sortable: true },
    { key: "section", label: "Section", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setData(MOCK_DATA);
      return;
    }
    const lowerTerm = term.toLowerCase();
    const filtered = MOCK_DATA.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerTerm) ||
        item.email.toLowerCase().includes(lowerTerm) ||
        item.mobile.includes(term) ||
        (item.section && item.section.toLowerCase().includes(lowerTerm))
    );
    setData(filtered);
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: !currentStatus } : item
      )
    );
    toast.success("Status updated successfully!");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, userType: value }));
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      userType: "",
      section: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: RMUser) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    const [first, ...last] = item.name.split(" ");
    setFormData({
      firstName: first || "",
      lastName: last.join(" ") || "",
      email: item.email,
      mobile: item.mobile,
      password: "",
      userType: item.userType === "Cs User" ? "cs" : "rm",
      section: item.section || "",
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.mobile ||
      (!isEditMode && !formData.password) ||
      !formData.userType ||
      !formData.section
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (isEditMode && selectedId) {
      setData((prev) =>
        prev.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                mobile: formData.mobile,
                userType: formData.userType === "cs" ? "Cs User" : "Rm User",
                section: formData.section,
              }
            : item
        )
      );
      toast.success("User updated successfully!");
    } else {
      const newUser: RMUser = {
        id: Math.floor(Math.random() * 1000),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        mobile: formData.mobile,
        userType: formData.userType === "cs" ? "Cs User" : "Rm User",
        section: formData.section,
        createdOn: new Date().toLocaleDateString("en-GB"),
        status: true,
      };
      setData((prev) => [newUser, ...prev]);
      toast.success("User added successfully!");
    }
    setIsAddModalOpen(false);
  };

  const renderCell = (item: RMUser, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-600"
            onClick={() => handleOpenEdit(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        );
      case "status":
        return (
          <Switch
            checked={item.status}
            onChange={() => handleToggleStatus(item.id, item.status)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#65C466",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#65C466",
              },
            }}
          />
        );
      default:
        // @ts-expect-error: accessing property by string key
        return item[columnKey];
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Toaster position="top-right" richColors />

      <EnhancedTable
        data={data}
        columns={columns}
        renderCell={renderCell}
        pagination={true}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search"
        leftActions={
          <Button
            onClick={handleOpenAdd}
            className="bg-[#1C2434] hover:bg-[#2c3a52] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
        loading={loading}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-[#F6F4EE]">
          <DialogHeader className="bg-white p-4 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-center w-full font-bold text-lg">
              {isEditMode ? "Edit" : "Add"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-x-6 gap-y-12 bg-[#F6F4EE]">
            <div className="relative">
              <label
                htmlFor="firstName"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                First Name <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
              />
            </div>

            <div className="relative">
              <label
                htmlFor="lastName"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Last Name <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
              />
            </div>

            <div className="relative">
              <label
                htmlFor="email"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Email <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isEditMode}
                className={`bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 ${
                  isEditMode ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div className="relative">
              <label
                htmlFor="mobile"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Mobile <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="mobile"
                name="mobile"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={handleInputChange}
                className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
              />
            </div>

            {!isEditMode && (
              <div className="relative">
                <label
                  htmlFor="password"
                  className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
                >
                  Password <span className="text-[#C72030]">*</span>
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
                />
              </div>
            )}

            <div className="relative">
              <label className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10">
                User Type <span className="text-[#C72030]">*</span>
              </label>
              <Select
                onValueChange={handleSelectChange}
                value={formData.userType}
              >
                <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                  <SelectValue placeholder="Select User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Cs User</SelectItem>
                  <SelectItem value="rm">Rm User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <label
                htmlFor="section"
                className="absolute -top-2 left-2 bg-[#F6F4EE] px-1 text-xs font-semibold text-gray-600 z-10"
              >
                Section <span className="text-[#C72030]">*</span>
              </label>
              <Input
                id="section"
                name="section"
                placeholder="Enter Section"
                value={formData.section}
                onChange={handleInputChange}
                className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10"
              />
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t flex justify-center">
            <Button
              onClick={handleSubmit}
              className="bg-[#00A651] hover:bg-[#008f45] text-white px-8"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzRMConfig;
