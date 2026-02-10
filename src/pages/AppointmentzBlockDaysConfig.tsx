import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBlockDays,
  createBlockDay,
  updateBlockDay,
  BlockDay as APIBlockDay,
  getRMUsers,
} from "@/services/appointmentzService";

interface BlockDayConfig {
  id: number;
  rmUser: string;
  rmUserId: number;
  blockedDate: string;
  createdOn: string;
  status: boolean;
}

const AppointmentzBlockDaysConfig = () => {
  const [data, setData] = useState<BlockDayConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rmUsers, setRmUsers] = useState<{ id: number; name: string }[]>([]);

  // Form Data State
  const [formData, setFormData] = useState({
    rmUser: "",
    rmUserId: 0,
    blockDate: "",
  });

  // Fetch block days and RM users on component mount
  const fetchBlockDays = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBlockDays();

      // Transform API data to component format
      const transformedData: BlockDayConfig[] = response.data.map(
        (blockDay) => ({
          id: blockDay.id,
          rmUser: blockDay.rm_user.name,
          rmUserId: blockDay.rm_user.id,
          blockedDate: blockDay.blocked_date,
          createdOn: blockDay.created_on,
          status: blockDay.active,
        })
      );
      setData(transformedData);
    } catch (error) {
      console.error("Error fetching block days:", error);
      setTimeout(() => {
        toast.error("Failed to fetch block days");
      }, 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRMUsers = useCallback(async () => {
    try {
      const response = await getRMUsers();
      const users = response.data.map((user) => ({
        id: user.id,
        name: `User ID: ${user.user_id}`,
      }));
      setRmUsers(users);
    } catch (error) {
      console.error("Error fetching RM users:", error);
    }
  }, []);

  useEffect(() => {
    fetchBlockDays();
    fetchRMUsers();
  }, [fetchBlockDays, fetchRMUsers]);

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "rmUser", label: "RM User", sortable: true },
    { key: "blockedDate", label: "Blocked Date", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    // Search is handled by filtering the already-fetched data
    // For server-side search, you would call the API with search params
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "rmUser") {
      const selectedUser = rmUsers.find((u) => u.id.toString() === value);
      setFormData((prev) => ({
        ...prev,
        rmUser: selectedUser?.name || "",
        rmUserId: selectedUser?.id || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.rmUserId || !formData.blockDate) {
      setTimeout(() => {
        toast.error("Please fill all required fields");
      }, 0);
      return;
    }

    try {
      const response = await createBlockDay({
        block_day: {
          rm_user_id: formData.rmUserId,
          blocked_date: formData.blockDate,
        },
      });

      // Refresh the list
      await fetchBlockDays();
      setIsAddModalOpen(false);
      setFormData({ rmUser: "", rmUserId: 0, blockDate: "" });
      setTimeout(() => {
        toast.success(response.message || "Block Day added successfully!");
      }, 0);
    } catch (error) {
      console.error("Error creating block day:", error);
      setTimeout(() => {
        toast.error("Failed to create block day");
      }, 0);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await updateBlockDay(id, {
        block_day: {
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
        toast.success(response.message || "Status updated successfully!");
      }, 0);
    } catch (error) {
      console.error("Error updating status:", error);
      setTimeout(() => {
        toast.error("Failed to update status");
      }, 0);
    }
  };

  const renderCell = (item: BlockDayConfig, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-600"
            onClick={() => toast.info(`Edit block day for ${item.rmUser}`)}
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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#1C2434] hover:bg-[#2c3a52] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
        loading={loading}
        emptyMessage="No Matching Records Found"
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white p-0">
          <DialogHeader className="p-4 border-b bg-[#F6F4EE]">
            <DialogTitle className="text-center font-bold text-lg">
              Add
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 grid grid-cols-2 gap-8 bg-white">
            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Rm User <span className="text-[#C72030]">*</span>
                </label>
                <Select
                  onValueChange={(val) => handleSelectChange("rmUser", val)}
                  value={formData.rmUserId.toString()}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select Rm User" />
                  </SelectTrigger>
                  <SelectContent>
                    {rmUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Block Dates <span className="text-[#C72030]">*</span>
                </label>
                <Input
                  type="date"
                  name="blockDate"
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 text-gray-500 focus:border-[#C72030] focus:ring-0 h-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleSubmit}
              className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzBlockDaysConfig;
