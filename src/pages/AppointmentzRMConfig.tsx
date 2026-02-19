import React, { useState, useEffect, useCallback } from "react";
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
import {
  getRMUsers,
  getRMUserById,
  createRMUser,
  updateRMUser,
  RMUserData as APIRMUser,
} from "@/services/appointmentzService";

interface RMUser {
  id: number;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  userType: string;
  createdOn: string;
  status: boolean;
}

const AppointmentzRMConfig = () => {
  const [data, setData] = useState<RMUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingUserName, setEditingUserName] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    userType: "",
  });

  // Fetch RM users on component mount
  const fetchRMUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRMUsers();
      // Transform API data to component format
      const transformedData: RMUser[] = response.data.map((user) => ({
        id: user.id,
        userId: `${user.user_id}`,
        name: user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email,
        mobile: user.mobile,
        userType: user.user_type === "cs" ? "Cs User" : "Rm User",
        createdOn: new Date(user.created_at).toLocaleDateString("en-GB"),
        status: user.active,
      }));
      setData(transformedData);
    } catch (error) {
      console.error("Error fetching RM users:", error);
      setTimeout(() => {
        toast.error("Failed to fetch RM users");
      }, 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRMUsers();
  }, [fetchRMUsers]);

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "id", label: "ID", sortable: true },
    { key: "userId", label: "User ID", sortable: true },
    { key: "name", label: "Full Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile", sortable: true },
    { key: "userType", label: "User Type", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    // Search is handled by filtering the already-fetched data
    // For server-side search, you would call the API with search params
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await updateRMUser(id, {
        rm_user: {
          active: !currentStatus,
        },
      });
      // Update local state
      setData((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: !currentStatus } : item
        )
      );
      setTimeout(() => {
        toast.success("Status updated successfully!");
      }, 0);
    } catch (error) {
      console.error("Error updating status:", error);
      setTimeout(() => {
        toast.error("Failed to update status");
      }, 0);
    }
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
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = async (item: RMUser) => {
    try {
      setIsEditMode(true);
      setSelectedId(item.id);
      setEditingUserName(`${item.firstName} ${item.lastName}`);
      
      // Fetch the latest user details from API
      const response = await getRMUserById(item.id);
      const user = response.data;
      
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email,
        mobile: user.mobile,
        password: "",
        userType: user.user_type === "cs" ? "cs" : "rm",
      });
      setIsAddModalOpen(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setTimeout(() => {
        toast.error("Failed to load user details");
      }, 0);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.mobile ||
      (!isEditMode && !formData.password) ||
      !formData.userType
    ) {
      setTimeout(() => {
        toast.error("Please fill all required fields");
      }, 0);
      return;
    }

    try {
      if (isEditMode && selectedId) {
        await updateRMUser(selectedId, {
          rm_user: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            mobile: formData.mobile,
            user_type: formData.userType,
            section: "",
          },
        });
        setTimeout(() => {
          toast.success("User updated successfully!");
        }, 0);
      } else {
        const response = await createRMUser({
          rm_user: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            mobile: formData.mobile,
            password: formData.password,
            user_type: formData.userType,
            section: "", // Default empty as it's removed from UI
          },
        });
        setTimeout(() => {
          toast.success(response.message || "User added successfully!");
        }, 0);
      }
      // Refresh the list
      await fetchRMUsers();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      setTimeout(() => {
        toast.error("Failed to save user");
      }, 0);
    }
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
              {isEditMode ? `Edit - ${editingUserName}` : "Add New User"}
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
