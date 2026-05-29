import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Switch,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Input } from "@/components/ui/input";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<
    Record<number, boolean>
  >({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rmUsers, setRmUsers] = useState<{ id: number; name: string }[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Form Data State
  const [formData, setFormData] = useState({
    rmUser: "",
    rmUserId: 0,
    blockDate: "",
  });

  // Fetch block days and RM users on component mount
  const fetchBlockDays = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await getBlockDays(page);

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
      setTotalPages(response.pagination.total_pages);
      setTotalCount(response.pagination.total_count);
    } catch (error) {
      console.error("Error fetching block days:", error);
      setTimeout(() => {
        toast.error("Failed to fetch block days");
      }, 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchRMUsers = useCallback(async () => {
    try {
      const response = await getRMUsers();
      const users = response.data.map((user) => ({
        id: user.id,
        name: user.full_name || `User ID: ${user.user_id}`,
      }));
      setRmUsers(users);
    } catch (error) {
      console.error("Error fetching RM users:", error);
    }
  }, []);

  useEffect(() => {
    fetchBlockDays(currentPage);
    fetchRMUsers();
  }, [fetchBlockDays, fetchRMUsers, currentPage]);

  const columns = [
    { key: "srNo", label: "Sr. No.", sortable: false },
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

  const handleOpenEdit = (item: BlockDayConfig) => {
    setIsEditMode(true);
    setSelectedId(item.id);

    // Format date from DD/MM/YYYY to YYYY-MM-DD if needed
    // Usually input type="date" expects YYYY-MM-DD
    let formattedDate = item.blockedDate;
    if (formattedDate.includes("/")) {
      const [day, month, year] = formattedDate.split("/");
      formattedDate = `${year}-${month}-${day}`;
    }

    setFormData({
      rmUser: item.rmUser,
      rmUserId: item.rmUserId,
      blockDate: formattedDate,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setFormData({ rmUser: "", rmUserId: 0, blockDate: "" });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Basic validation
    if (!formData.rmUserId || !formData.blockDate) {
      setTimeout(() => {
        toast.error("Please fill all required fields");
      }, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && selectedId) {
        const item = data.find((d) => d.id === selectedId);
        const response = await updateBlockDay(selectedId, {
          blocked_date: formData.blockDate,
          block_day: {
            resource_id: formData.rmUserId,
            resource_type: "RmUser",
            active: item ? item.status : true,
          },
        });
        setData((prev) =>
          prev.map((blockDay) =>
            blockDay.id === selectedId
              ? {
                  ...blockDay,
                  rmUser: formData.rmUser,
                  rmUserId: formData.rmUserId,
                  blockedDate: formData.blockDate,
                }
              : blockDay
          )
        );
        setTimeout(() => {
          toast.success(response.message || "Block Day updated successfully!");
        }, 0);
      } else {
        const response = await createBlockDay({
          blocked_dates: formData.blockDate,
          block_day: {
            resource_id: formData.rmUserId,
            resource_type: "RmUser",
            active: true,
          },
        });
        setTimeout(() => {
          toast.success(response.message || "Block Day added successfully!");
        }, 0);
      }

      // Refresh the list
      await fetchBlockDays(currentPage);
      setIsAddModalOpen(false);
      setFormData({ rmUser: "", rmUserId: 0, blockDate: "" });
    } catch (error) {
      console.error("Error saving block day:", error);
      setTimeout(() => {
        toast.error("Failed to save block day");
      }, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (updatingStatus[id]) return;

    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      const item = data.find((d) => d.id === id);
      const response = await updateBlockDay(id, {
        block_day: {
          resource_id: item?.rmUserId,
          resource_type: "RmUser",
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
    } finally {
      setUpdatingStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const renderCell = (item: BlockDayConfig, columnKey: string, index: number) => {
    switch (columnKey) {
      case "srNo":
        return (currentPage - 1) * 10 + index + 1;
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
          <div className="flex items-center gap-2">
            <Switch
              checked={item.status}
              disabled={!!updatingStatus[item.id]}
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
            {updatingStatus[item.id] && (
              <Loader2 className="w-4 h-4 animate-spin text-[#C72030]" />
            )}
          </div>
        );
      default:
        // @ts-expect-error: Accessing key by string
        return item[columnKey as keyof BlockDayConfig];
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <EnhancedTable
        data={data}
        columns={columns}
        renderCell={renderCell}
        pagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
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
        emptyMessage="No Matching Records Found"
      />

      <Dialog
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2, overflow: "visible" } }}
      >
        <DialogTitle
          sx={{
            p: 2,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 18,
            backgroundColor: "#F6F4EE",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {isEditMode ? "Edit" : "Add"}
          <IconButton
            aria-label="close"
            onClick={() => setIsAddModalOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "#6b7280",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4, backgroundColor: "#fff" }}>
          <div className="grid grid-cols-2 gap-8 pt-4">
            <FormControl
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  backgroundColor: "#fff",
                  "& fieldset": { borderColor: "#d1d5db" },
                  "&:hover fieldset": { borderColor: "#C72030" },
                  "&.Mui-focused fieldset": { borderColor: "#C72030" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#C72030" },
              }}
            >
              <InputLabel id="rm-user-label" shrink required>
                Rm User
              </InputLabel>
              <MuiSelect
                labelId="rm-user-label"
                label="Rm User *"
                notched
                displayEmpty
                value={
                  formData.rmUserId ? formData.rmUserId.toString() : ""
                }
                onChange={(event: SelectChangeEvent<string>) =>
                  handleSelectChange("rmUser", event.target.value)
                }
                MenuProps={{
                  PaperProps: { sx: { maxHeight: 300, mt: 0.5 } },
                }}
              >
                <MenuItem value="" disabled>
                  Select Rm User
                </MenuItem>
                {rmUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>

            <div className="space-y-2">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Block Dates <span className="text-[#C72030]">*</span>
                </label>
                <Input
                  type="date"
                  name="blockDate"
                  value={formData.blockDate}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 text-gray-500 focus:border-[#C72030] focus:ring-0 h-10"
                />
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            borderTop: "1px solid #e5e7eb",
            justifyContent: "center",
            backgroundColor: "#fff",
          }}
        >
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#00A651] hover:bg-[#008f45] text-white min-w-[100px]"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AppointmentzBlockDaysConfig;
