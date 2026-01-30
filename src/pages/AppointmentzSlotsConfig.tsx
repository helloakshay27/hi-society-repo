import React, { useState } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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

interface SlotConfig {
  id: number;
  rmUser: string;
  startDate?: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  mon: number;
  tue: number;
  wed: number;
  thur: number;
  fri: number;
  sat: number;
  sun: number;
}

const MOCK_DATA: SlotConfig[] = [
  {
    id: 1,
    rmUser: "Sudhakar Nair",
    startDate: "10/01/2023",
    endDate: "20/12/2024",
    startTime: "02:00 PM",
    endTime: "03:00 PM",
    mon: 1,
    tue: 1,
    wed: 1,
    thur: 1,
    fri: 1,
    sat: 1,
    sun: 1,
  },
  {
    id: 2,
    rmUser: "Sudhakar Nair",
    startDate: "10/01/2023",
    endDate: "20/12/2024",
    startTime: "04:00 PM",
    endTime: "05:00 PM",
    mon: 1,
    tue: 1,
    wed: 1,
    thur: 1,
    fri: 1,
    sat: 1,
    sun: 1,
  },
  {
    id: 3,
    rmUser: "Sudhakar Nair",
    startDate: "10/01/2023",
    endDate: "20/12/2024",
    startTime: "03:00 PM",
    endTime: "04:00 PM",
    mon: 1,
    tue: 1,
    wed: 1,
    thur: 1,
    fri: 1,
    sat: 1,
    sun: 1,
  },
  {
    id: 4,
    rmUser: "Sudhakar Nair",
    startTime: "01:00 PM",
    endTime: "02:00 PM",
    mon: 1,
    tue: 1,
    wed: 1,
    thur: 1,
    fri: 1,
    sat: 1,
    sun: 1,
  },
  {
    id: 5,
    rmUser: "Sudhakar Nair",
    startTime: "12:00 PM",
    endTime: "01:00 PM",
    mon: 1,
    tue: 1,
    wed: 1,
    thur: 1,
    fri: 1,
    sat: 1,
    sun: 1,
  },
  {
    id: 6,
    rmUser: "Vishwas Prathamm",
    startDate: "19/12/2022",
    endDate: "31/12/2023",
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    mon: 10,
    tue: 0,
    wed: 0,
    thur: 0,
    fri: 0,
    sat: 0,
    sun: 0,
  },
  {
    id: 7,
    rmUser: "Sudhakar Nair",
    startDate: "19/12/2022",
    endDate: "31/12/2022",
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    mon: 20,
    tue: 20,
    wed: 20,
    thur: 20,
    fri: 20,
    sat: 20,
    sun: 20,
  },
];

const AppointmentzSlotsConfig = () => {
  const [data, setData] = useState<SlotConfig[]>(MOCK_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    rmUser: "",
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
      thur: 1,
      fri: 1,
      sat: 1,
      sun: 0,
    },
  });

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
    { key: "thur", label: "THUR", sortable: false },
    { key: "fri", label: "FRI", sortable: false },
    { key: "sat", label: "SAT", sortable: false },
    { key: "sun", label: "SUN", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setData(MOCK_DATA);
      return;
    }
    const lowerTerm = term.toLowerCase();
    const filtered = MOCK_DATA.filter((item) =>
      item.rmUser.toLowerCase().includes(lowerTerm)
    );
    setData(filtered);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormData({
      rmUser: "",
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
        thur: 1,
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
        thur: item.thur,
        fri: item.fri,
        sat: item.sat,
        sun: item.sun,
      },
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = () => {
    const newSlot: SlotConfig = {
      id:
        isEditMode && selectedId
          ? selectedId
          : Math.floor(Math.random() * 1000),
      rmUser: formData.rmUser || "Sudhakar Nair",
      startDate: formData.startDate
        ? new Date(formData.startDate).toLocaleDateString("en-GB")
        : "10/01/2023",
      endDate: formData.endDate
        ? new Date(formData.endDate).toLocaleDateString("en-GB")
        : "20/12/2024",
      startTime: `${formData.startHour}:${formData.startMinute} PM`,
      endTime: `${formData.endHour}:${formData.endMinute} PM`,
      mon: formData.days.mon,
      tue: formData.days.tue,
      wed: formData.days.wed,
      thur: formData.days.thur,
      fri: formData.days.fri,
      sat: formData.days.sat,
      sun: formData.days.sun,
    };

    if (isEditMode) {
      setData((prev) =>
        prev.map((item) => (item.id === selectedId ? newSlot : item))
      );
      toast.success("Slot updated successfully!");
    } else {
      setData([newSlot, ...data]);
      toast.success("Slot added successfully!");
    }

    setIsAddModalOpen(false);
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
      default:
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
                  defaultValue={formData.rmUser}
                  value={formData.rmUser}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#C72030] focus:ring-0 h-10">
                    <SelectValue placeholder="Select Rm User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sudhakar Nair">Sudhakar Nair</SelectItem>
                    <SelectItem value="Vishwas Pratham">
                      Vishwas Pratham
                    </SelectItem>
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
