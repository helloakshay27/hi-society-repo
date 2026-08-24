import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Loader2, Calendar } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
  getScheduleSetup,
  updateScheduleSetup,
  ScheduleSetupData,
} from "@/services/appointmentzService";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 10;

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
  const navigate = useNavigate();
  const [data, setData] = useState<SlotConfig[]>([]);
  const { shouldShow } = useDynamicPermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

  const fetchRMUsersList = useCallback(async () => {
    try {
      const users = await getAllRMUsers();
      setRmUsers(
        users.map((user) => ({
          id: user.id,
          name: user.full_name || `User ID: ${user.user_id}`,
        }))
      );
    } catch (error) {
      console.error("Error fetching RM users:", error);
    }
  }, []);

  useEffect(() => {
    fetchSiteSchedules();
    fetchRMUsersList();
  }, [fetchSiteSchedules, fetchRMUsersList]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedId(null);
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

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDayChange = (day: keyof typeof formData.days, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: numValue,
      },
    }));
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.rmUserId) {
      toast.error("Please select an RM User");
      return;
    }

    if (!formData.startDate) {
      toast.error("Please select a Start Date");
      return;
    }

    if (!formData.endDate) {
      toast.error("Please select an End Date");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("Start Date must be before End Date");
      return;
    }

    const payload = {
      site_schedule: {
        rm_user_id: formData.rmUserId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_hour: parseInt(formData.startHour),
        start_minute: parseInt(formData.startMinute),
        end_hour: parseInt(formData.endHour),
        end_minute: parseInt(formData.endMinute),
        mon: formData.days.mon,
        tue: formData.days.tue,
        wed: formData.days.wed,
        thu: formData.days.thu,
        fri: formData.days.fri,
        sat: formData.days.sat,
        sun: formData.days.sun,
      },
    };

    setIsSubmitting(true);
    try {
      if (isEditMode && selectedId) {
        await updateSiteSchedule(selectedId, payload);
        toast.success("Schedule updated successfully");
      } else {
        await createSiteSchedule(payload);
        toast.success("Schedule created successfully");
      }
      setIsAddModalOpen(false);
      await fetchSiteSchedules();
    } catch (error) {
      console.error("Error submitting schedule:", error);
      toast.error(
        isEditMode ? "Failed to update schedule" : "Failed to create schedule"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 5;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "rmUser", label: "Rm User", sortable: true },
    { key: "startDate", label: "Start Date", sortable: true },
    { key: "endDate", label: "End Date", sortable: true },
    { key: "startTime", label: "Start Time", sortable: true },
    { key: "endTime", label: "End Time", sortable: true },
    { key: "mon", label: "M", sortable: false },
    { key: "tue", label: "T", sortable: false },
    { key: "wed", label: "W", sortable: false },
    { key: "thu", label: "T", sortable: false },
    { key: "fri", label: "F", sortable: false },
    { key: "sat", label: "S", sortable: false },
    { key: "sun", label: "S", sortable: false },
  ];

  const renderCell = (item: SlotConfig, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          shouldShow("Slots Configuration", "update") && (
            <Button
              variant="ghost"
              size="sm"
              className="bg-transparent text-[#C72030] hover:bg-transparent"
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
        data={paginatedData}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search"
        leftActions={
          <div className="flex items-center gap-2">
            {shouldShow("Slots Configuration", "create") && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="bg-[#C72030] text-white font-semibold h-9 px-4 text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/appointmentz/schedule-setup")}
              className="bg-[#C72030] text-white font-semibold h-9 px-4 text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-white" />
              <span>Schedule Setup</span>
            </button>
          </div>
        }
        loading={loading}
      />

      {data.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add / Edit Slot Modal */}
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
        >
          <DialogHeader className="bg-[#f6f4ee] p-4 border-b border-[#D5DbDB]">
            <DialogTitle className="text-center w-full font-bold text-lg text-[#1A1A1A]">
              {isEditMode ? "Edit Schedule" : "Add Schedule"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-6 bg-white">
            {/* Row 1: RM User & Start Date & End Date */}
            <div className="grid grid-cols-3 gap-6">
              <div className="relative">
                <Autocomplete
                  open={isRmDropdownOpen}
                  onOpen={() => setIsRmDropdownOpen(true)}
                  onClose={() => setIsRmDropdownOpen(false)}
                  options={rmUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={
                    rmUsers.find((user) => user.id === formData.rmUserId) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      rmUser: newValue ? newValue.name : "",
                      rmUserId: newValue ? newValue.id : 0,
                    }));
                  }}
                  className="rm-user-autocomplete"
                  slotProps={{
                    popper: {
                      className: "rm-user-autocomplete-popper z-[100000]",
                      sx: { zIndex: 100000 },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="RM User"
                      variant="outlined"
                      size="small"
                      required
                      placeholder="Select RM"
                      onClick={() => setIsRmDropdownOpen((prev) => !prev)}
                      InputLabelProps={{
                        shrink: true,
                        sx: {
                          "& .MuiFormLabel-asterisk": { color: "#C72030" },
                        },
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "36px",
                          fontSize: "13px",
                        },
                      }}
                    />
                  )}
                />
              </div>

              <div>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                  fullWidth
                  size="small"
                  required
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      "& .MuiFormLabel-asterisk": { color: "#C72030" },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "36px",
                      fontSize: "13px",
                    },
                  }}
                />
              </div>

              <div>
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  fullWidth
                  size="small"
                  required
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      "& .MuiFormLabel-asterisk": { color: "#C72030" },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      height: "36px",
                      fontSize: "13px",
                    },
                  }}
                />
              </div>
            </div>

            {/* Row 2: Start Time & End Time */}
            <div className="grid grid-cols-2 gap-8">
              <div className="relative">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Start Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    onValueChange={(val) => handleSelectChange("startHour", val)}
                    defaultValue={formData.startHour}
                    value={formData.startHour}
                  >
                    <SelectTrigger className="w-full bg-white border-[#D5DbDB] focus:border-[#C72030] h-9 text-xs">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString().padStart(2, "0")} className="text-xs">
                          {num.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(val) => handleSelectChange("startMinute", val)}
                    defaultValue={formData.startMinute}
                    value={formData.startMinute}
                  >
                    <SelectTrigger className="w-full bg-white border-[#D5DbDB] focus:border-[#C72030] h-9 text-xs">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      <SelectItem value="00" className="text-xs">00</SelectItem>
                      <SelectItem value="15" className="text-xs">15</SelectItem>
                      <SelectItem value="30" className="text-xs">30</SelectItem>
                      <SelectItem value="45" className="text-xs">45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  End Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    onValueChange={(val) => handleSelectChange("endHour", val)}
                    defaultValue={formData.endHour}
                    value={formData.endHour}
                  >
                    <SelectTrigger className="w-full bg-white border-[#D5DbDB] focus:border-[#C72030] h-9 text-xs">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      {Array.from({ length: 24 }, (_, i) => i).map((num) => (
                        <SelectItem key={num} value={num.toString().padStart(2, "0")} className="text-xs">
                          {num.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(val) => handleSelectChange("endMinute", val)}
                    defaultValue={formData.endMinute}
                    value={formData.endMinute}
                  >
                    <SelectTrigger className="w-full bg-white border-[#D5DbDB] focus:border-[#C72030] h-9 text-xs">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[200px]">
                      <SelectItem value="00" className="text-xs">00</SelectItem>
                      <SelectItem value="15" className="text-xs">15</SelectItem>
                      <SelectItem value="30" className="text-xs">30</SelectItem>
                      <SelectItem value="45" className="text-xs">45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Row 3: Days of Week */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">
                Slots Count per Day
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((dayKey) => {
                  const label = dayKey.toUpperCase().substring(0, 1);
                  return (
                    <div key={dayKey} className="flex flex-col items-center gap-1 w-12">
                      <span className={`text-xs font-bold ${dayKey === "sun" ? "text-[#C72030]" : "text-gray-700"}`}>
                        {label}
                      </span>
                      <Input
                        className="h-8 px-1 text-center border-[#D5DbDB] text-xs font-semibold"
                        value={formData.days[dayKey as keyof typeof formData.days]}
                        onChange={(e) =>
                          handleDayChange(dayKey as keyof typeof formData.days, e.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-[#D5DbDB] flex justify-end gap-2 bg-[#f6f4ee]">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="border-[#D5DbDB] text-gray-700 hover:bg-white text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#C72030] hover:bg-[#a81a28] text-white text-xs h-9 px-5 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              <span>{isEditMode ? "Update" : "Submit"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzSlotsConfig;
