import React, { useState, useEffect, useCallback } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
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
  SiteSchedule as APISiteSchedule,
  getRMUsers,
} from "@/services/appointmentzService";

interface SlotConfig {
  id: number;
  rmUser: string;
  rmUserId: number;
  startDate?: string;
  endDate?: string;
  startTime: string;
  endTime: string;
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
      const rmResponse = await getRMUsers();
      const users = rmResponse.data;

      // Transform API data to component format
      const transformedData: SlotConfig[] = response.data.map((schedule) => {
        const user = users.find((u) => u.id === schedule.rm_user_id);
        const [startTime, endTime] = (schedule.ampm_timing || "").split(" to ");

        return {
          id: schedule.id,
          rmUser: user
            ? `User ID: ${user.user_id}`
            : `User ID: ${schedule.rm_user_id}`,
          rmUserId: schedule.rm_user_id,
          startDate: schedule.start_date,
          endDate: schedule.end_date,
          startTime: startTime || "",
          endTime: endTime || "",
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
    fetchSiteSchedules();
    fetchRMUsers();
  }, [fetchSiteSchedules, fetchRMUsers]);

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

    // Parse time
    const startParts = item.startTime.split(/[: ]/);
    const endParts = item.endTime.split(/[: ]/);

    setFormData({
      rmUser: item.rmUser,
      rmUserId: item.rmUserId,
      startDate: item.startDate
        ? item.startDate.split("/").reverse().join("-")
        : "",
      endDate: item.endDate ? item.endDate.split("/").reverse().join("-") : "",
      startHour: startParts[0] || "00",
      startMinute: startParts[1] || "00",
      endHour: endParts[0] || "00",
      endMinute: endParts[1] || "00",
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
    if (!formData.rmUserId) {
      setTimeout(() => {
        toast.error("Please select an RM User");
      }, 0);
      return;
    }

    try {
      const payload = {
        site_schedule: {
          rm_user_ids: [formData.rmUserId],
          start_date: formData.startDate || undefined,
          end_date: formData.endDate || undefined,
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

      if (isEditMode && selectedId) {
        await updateSiteSchedule(selectedId, payload);
        setTimeout(() => {
          toast.success("Slot updated successfully!");
        }, 0);
      } else {
        await createSiteSchedule(payload);
        setTimeout(() => {
          toast.success("Slot added successfully!");
        }, 0);
      }

      // Refresh the list
      await fetchSiteSchedules();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error saving slot:", error);
      setTimeout(() => {
        toast.error("Failed to save slot");
      }, 0);
    }
  };

  const renderCell = (item: SlotConfig, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-blue-600"
            onClick={() => handleOpenEditModal(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
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
        // @ts-expect-error: accessing property by string key
        return item[columnKey] || "N/A";
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
            onClick={handleOpenAddModal}
            className="bg-[#1C2434] hover:bg-[#2c3a52] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
        loading={loading}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-center font-bold">
              {isEditMode ? "Edit" : "Add"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Row 1: RM User and Start Date */}
            <div className="grid grid-cols-2 gap-8">
              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Rm User
                </label>
                <Select
                  onValueChange={(val) => handleSelectChange("rmUser", val)}
                  value={formData.rmUserId ? formData.rmUserId.toString() : ""}
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
                    className="bg-white border-gray-300 pl-4 focus:border-[#C72030] focus:ring-0 h-10 text-gray-500"
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
                  className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10 text-gray-500"
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs font-semibold text-gray-600 z-10">
                  Start Time
                </label>
                <div className="flex gap-4">
                  <Select
                    onValueChange={(val) =>
                      handleSelectChange("startHour", val)
                    }
                    defaultValue={formData.startHour}
                    value={formData.startHour}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
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
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
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
                <div className="flex gap-4">
                  <Select
                    onValueChange={(val) => handleSelectChange("endHour", val)}
                    defaultValue={formData.endHour}
                    value={formData.endHour}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
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
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                      <SelectValue placeholder="00" />
                    </SelectTrigger>
                    <SelectContent>
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
                  const dayKey = ["mon", "tue", "wed", "thur", "fri", "sat"][
                    idx
                  ] as keyof typeof formData.days;
                  return (
                    <div key={idx} className="flex flex-col gap-1 w-[60px]">
                      <span className="text-sm text-gray-600 font-medium">
                        {day}
                      </span>
                      <Input
                        className="h-9 px-2 text-center border-gray-300"
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
                  className="h-9 px-2 text-center border-gray-300"
                  value={formData.days.sun}
                  onChange={(e) => handleDayChange("sun", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t flex justify-center bg-white">
            <Button
              onClick={handleSubmit}
              className="bg-[#00B4D8] hover:bg-[#009bb8] text-white min-w-[100px]"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentzSlotsConfig;
