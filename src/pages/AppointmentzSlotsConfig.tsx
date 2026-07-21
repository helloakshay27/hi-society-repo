import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Autocomplete,
  TextField,
} from "@mui/material";
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
import {
  getSiteSchedules,
  createSiteSchedule,
  updateSiteSchedule,
  getAllRMUsers,
} from "@/services/appointmentzService";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";

interface SlotConfig {
  id: number;
  rmUser: string;
  rmUserId: number;
  startDate?: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
}

const AppointmentzSlotsConfig = () => {
  const [data, setData] = useState<SlotConfig[]>([]);
  const { shouldShow } = useDynamicPermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rmUsers, setRmUsers] = useState<{ id: number; name: string }[]>([]);
  const [isRmDropdownOpen, setIsRmDropdownOpen] = useState(false);

  const formatTimePart = (value: string | number | null | undefined) =>
    String(value ?? 0).padStart(2, "0");

  const normalizeDateForInput = (date?: string) => {
    if (!date) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
    if (date.includes("/")) {
      const [day, month, year] = date.split("/");
      return `${year}-${month}-${day}`;
    }
    return date;
  };

  // Form Data State
  const [formData, setFormData] = useState({
    rmUser: "",
    rmUserId: 0,
    startDate: "",
    endDate: "",
    startHour: "00",
    startMinute: "00",
    endHour: "00",
    endMinute: "00",
    days: {
      mon: 1,
      tue: 1,
      wed: 1,
      thu: 1,
      fri: 1,
      sat: 1,
      sun: 0,
    },
  });

  // Fetch site schedules and RM users on component mount
  const fetchSiteSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getSiteSchedules();

      // Fetch users once to map names
      const users = await getAllRMUsers();

      // Transform API data to component format
      const transformedData: SlotConfig[] = response.data.map((schedule) => {
        const user = users.find((u) => u.id === schedule.rm_user_id);
        const [startTime, endTime] = (schedule.ampm_timing || "").split(" to ");

        return {
          id: schedule.id,
          rmUser: user
            ? user.full_name || `User ID: ${user.user_id}`
            : `User ID: ${schedule.rm_user_id}`,
          rmUserId: schedule.rm_user_id,
          startDate: schedule.start_date,
          endDate: schedule.end_date,
          startTime: startTime || "",
          endTime: endTime || "",
          startHour: formatTimePart(schedule.start_hour),
          startMinute: formatTimePart(schedule.start_minute),
          endHour: formatTimePart(schedule.end_hour),
          endMinute: formatTimePart(schedule.end_minute),
          mon: schedule.mon,
          tue: schedule.tue,
          wed: schedule.wed,
          thu: schedule.thu,
          fri: schedule.fri,
          sat: schedule.sat,
          sun: schedule.sun,
        };
      });
      setData(transformedData);
    } catch (error) {
      console.error("Error fetching site schedules:", error);
      setTimeout(() => {
        toast.error("Failed to fetch site schedules");
      }, 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRMUsers = useCallback(async () => {
    try {
      const users = (await getAllRMUsers()).map((user) => ({
        id: user.id,
        name:
          user.full_name ||
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          `User ID: ${user.user_id}`,
      }));
      const uniqueUsers = Array.from(
        new Map(users.map((user) => [user.id, user])).values()
      ).sort((a, b) => a.name.localeCompare(b.name));
      setRmUsers(uniqueUsers);
    } catch (error) {
      console.error("Error fetching RM users:", error);
    }
  }, []);

  useEffect(() => {
    fetchSiteSchedules();
    fetchRMUsers();
  }, [fetchSiteSchedules, fetchRMUsers]);

  useEffect(() => {
    if (!isAddModalOpen) {
      setIsRmDropdownOpen(false);
    }
  }, [isAddModalOpen]);

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "rmUser", label: "RM User", sortable: true },
    { key: "startDate", label: "Start Date", sortable: true },
    { key: "endDate", label: "End Date", sortable: true },
    { key: "startTime", label: "Start Time", sortable: true },
    { key: "endTime", label: "End Time", sortable: true },
    { key: "mon", label: "MON", sortable: false },
    { key: "tue", label: "TUE", sortable: false },
    { key: "wed", label: "WED", sortable: false },
    { key: "thu", label: "THU", sortable: false },
    { key: "fri", label: "FRI", sortable: false },
    { key: "sat", label: "SAT", sortable: false },
    { key: "sun", label: "SUN", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    // Search is handled by the table or can be implemented as a filter on 'data'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayChange = (day: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      days: { ...prev.days, [day]: parseInt(value) || 0 },
    }));
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

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormData({
      rmUser: "",
      rmUserId: 0,
      startDate: "",
      endDate: "",
      startHour: "00",
      startMinute: "00",
      endHour: "00",
      endMinute: "00",
      days: {
        mon: 1,
        tue: 1,
        wed: 1,
        thu: 1,
        fri: 1,
        sat: 1,
        sun: 0,
      },
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: SlotConfig) => {
    setIsEditMode(true);
    setSelectedId(item.id);

    setFormData({
      rmUser: item.rmUser,
      rmUserId: item.rmUserId,
      startDate: normalizeDateForInput(item.startDate),
      endDate: normalizeDateForInput(item.endDate),
      startHour: item.startHour,
      startMinute: item.startMinute,
      endHour: item.endHour,
      endMinute: item.endMinute,
      days: {
        mon: item.mon,
        tue: item.tue,
        wed: item.wed,
        thu: item.thu,
        fri: item.fri,
        sat: item.sat,
        sun: item.sun,
      },
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formData.rmUserId) {
      setTimeout(() => {
        toast.error("Please select an RM User");
      }, 0);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setTimeout(() => {
        toast.error("Please select start and end dates");
      }, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      const schedulePayload = {
        rm_user_id: formData.rmUserId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_hour: formData.startHour,
        start_minute: formData.startMinute,
        end_hour: formData.endHour,
        end_minute: formData.endMinute,
        mon: formData.days.mon,
        tue: formData.days.tue,
        wed: formData.days.wed,
        thu: formData.days.thu,
        fri: formData.days.fri,
        sat: formData.days.sat,
        sun: formData.days.sun,
      };

      const createPayload = {
        site_schedule: {
          rm_user_id: formData.rmUserId,
          rm_user_ids: [formData.rmUserId],
          start_date: formData.startDate,
          end_date: formData.endDate,
          start_hour: formData.startHour,
          start_minute: formData.startMinute,
          end_hour: formData.endHour,
          end_minute: formData.endMinute,
          mon: formData.days.mon,
          tue: formData.days.tue,
          wed: formData.days.wed,
          thu: formData.days.thu,
          fri: formData.days.fri,
          sat: formData.days.sat,
          sun: formData.days.sun,
        },
      };

      const updatePayload = {
        site_schedule: schedulePayload,
      };

      if (isEditMode && selectedId) {
        await updateSiteSchedule(selectedId, updatePayload);
        setTimeout(() => {
          toast.success("Slot updated successfully!");
        }, 0);
      } else {
        await createSiteSchedule(createPayload);
        setTimeout(() => {
          toast.success("Slot added successfully!");
        }, 0);
      }

      // Refresh the list
      await fetchSiteSchedules();
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error("Error saving slot:", error);
      const errorData = error?.response?.data;
      let errorMessage = "Failed to save slot";

      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : JSON.stringify(errorData.error);
      } else if (Array.isArray(errorData?.errors)) {
        errorMessage = errorData.errors.join(", ");
      } else if (errorData?.errors) {
        errorMessage = Object.entries(errorData.errors)
          .map(([key, value]) => {
            const text = Array.isArray(value) ? value.join(", ") : String(value);
            return `${key}: ${text}`;
          })
          .join(", ");
      }

      setTimeout(() => {
        toast.error(errorMessage);
      }, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCell = (item: SlotConfig, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          shouldShow("Slots Configuration","update")&&(
          <Button
            variant="ghost"
            size="sm"
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
            onClick={() => handleOpenEditModal(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          )
        );
      case "mon":
      case "tue":
      case "wed":
      case "thu":
      case "fri":
      case "sat":
      case "sun": {
        const isActive = item[columnKey as keyof SlotConfig] === 1;
        return (
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isActive
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-400 border border-gray-200"
            }`}
          >
            {columnKey.toUpperCase().substring(0, 1)}
          </div>
        );
      }
      default:
        return item[columnKey as keyof SlotConfig] || "N/A";
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
          shouldShow("Slots Configuration","create")&&(
          <Button
            onClick={handleOpenAddModal}
            className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
          )
        }
        loading={loading}
      />

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsRmDropdownOpen(false);
          setIsAddModalOpen(open);
        }}
      >
        <DialogContent
          className="sm:max-w-[700px] bg-white p-0"
          onMouseDownCapture={(event) => {
            const target = event.target as HTMLElement;
            const isRmDropdownTarget =
              target.closest(".rm-user-autocomplete") ||
              target.closest(".rm-user-autocomplete-popper");

            if (!isRmDropdownTarget) {
              setIsRmDropdownOpen(false);
            }
          }}
          onEscapeKeyDown={(event) => {
            if (isRmDropdownOpen) {
              event.preventDefault();
              setIsRmDropdownOpen(false);
            }
          }}
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest(".rm-user-autocomplete-popper")) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-center font-bold">
              {isEditMode ? "Edit" : "Add"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Row 1: RM User and Start Date */}
            <div className="grid grid-cols-2 gap-8">
              <div className="relative">
                <Autocomplete
                  className="rm-user-autocomplete"
                  disablePortal
                  open={isRmDropdownOpen}
                  onOpen={() => setIsRmDropdownOpen(true)}
                  onClose={(_, reason) => {
                    if (reason !== "blur") {
                      setIsRmDropdownOpen(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Tab") {
                      setIsRmDropdownOpen(false);
                    }
                  }}
                  options={rmUsers}
                  value={
                    rmUsers.find((user) => user.id === formData.rmUserId) ||
                    null
                  }
                  onChange={(_, selectedUser) => {
                    setFormData((prev) => ({
                      ...prev,
                      rmUser: selectedUser?.name || "",
                      rmUserId: selectedUser?.id || 0,
                    }));
                    setIsRmDropdownOpen(false);
                  }}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  noOptionsText="No RM users found"
                  ListboxProps={{
                    className: "rm-user-autocomplete-listbox",
                    onMouseDown: (event) => {
                      event.stopPropagation();
                    },
                    onWheel: (event) => {
                      event.stopPropagation();
                    },
                    style: {
                      maxHeight: 220,
                      overflow: "auto",
                      overscrollBehavior: "contain",
                    },
                  }}
                  slotProps={{
                    popper: {
                      className: "rm-user-autocomplete-popper",
                      sx: {
                        zIndex: 1300,
                      },
                    },
                    paper: {
                      onMouseDown: (event) => {
                        event.stopPropagation();
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Rm User"
                      placeholder="Select Rm User"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: 32,
                      padding: "0 34px 0 8px !important",
                      backgroundColor: "#fff",
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover fieldset": {
                        borderColor: "#C72030",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#C72030",
                        borderWidth: "1px",
                      },
                    },
                    "& .MuiInputBase-input": {
                      padding: "0 !important",
                      fontSize: "0.875rem",
                      color: "#374151",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.75rem",
                    },
                    "& .MuiAutocomplete-endAdornment": {
                      right: 8,
                    },
                  }}
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Start Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="bg-white border-gray-300 px-2 focus:border-[#C72030] focus:ring-0 h-8 text-gray-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: End Date and Start Time */}
            <div className="grid grid-cols-2 gap-8">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  End Date
                </label>
                <Input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="bg-white border-gray-300 px-2 focus:border-[#C72030] focus:ring-0 h-8 text-gray-500 text-sm"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Start Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    onValueChange={(val) =>
                      handleSelectChange("startHour", val)
                    }
                    defaultValue={formData.startHour}
                    value={formData.startHour}
                  >
                                      <SelectTrigger className="w-full bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-8 py-0 px-2 text-sm">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i).map(
                        (num) => (
                          <SelectItem
                            key={num}
                            value={num.toString().padStart(2, "0")}
                          >
                            {num.toString().padStart(2, "0")}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(val) =>
                      handleSelectChange("startMinute", val)
                    }
                    defaultValue={formData.startMinute}
                    value={formData.startMinute}
                  >
                                      <SelectTrigger className="w-full bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-8 py-0 px-2 text-sm">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="45">45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Row 3: End Time (Half width, left aligned) */}
            <div className="grid grid-cols-2 gap-8">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  End Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    onValueChange={(val) => handleSelectChange("endHour", val)}
                    defaultValue={formData.endHour}
                    value={formData.endHour}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-8 py-0 px-2 text-sm">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i).map(
                        (num) => (
                          <SelectItem
                            key={num}
                            value={num.toString().padStart(2, "0")}
                          >
                            {num.toString().padStart(2, "0")}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(val) =>
                      handleSelectChange("endMinute", val)
                    }
                    defaultValue={formData.endMinute}
                    value={formData.endMinute}
                  >
                                        <SelectTrigger className="w-full bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-8 py-0 px-2 text-sm">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="45">45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div></div> {/* Empty column filler */}
            </div>

            {/* Row 4: Days of Week */}
            <div className="space-y-2">
              <div className="flex justify-between max-w-[500px]">
                {["M", "T", "W", "T", "F", "S"].map((day, idx) => {
                  const dayKey = ["mon", "tue", "wed", "thu", "fri", "sat"][
                    idx
                  ] as keyof typeof formData.days;
                  return (
                    <div key={idx} className="flex flex-col gap-1 w-[60px]">
                      <span className="text-sm text-gray-600 font-medium">
                        {day}
                      </span>
                      <Input
                        className="h-8 px-2 text-center border-gray-300 text-sm"
                        value={formData.days[dayKey]}
                        onChange={(e) =>
                          handleDayChange(dayKey, e.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1 w-[60px] mt-4">
                <span className="text-sm text-[#C72030] font-medium">S</span>
                <Input
                  className="h-8 px-2 text-center border-gray-300 text-sm"
                  value={formData.days.sun}
                  onChange={(e) => handleDayChange("sun", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[100px] bg-[#C72030] text-white hover:bg-[#C72030]/90"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzSlotsConfig;
