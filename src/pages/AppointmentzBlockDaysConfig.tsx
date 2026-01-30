import React, { useState } from "react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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

interface BlockDayConfig {
  id: number;
  rmUser: string;
  blockedDate: string;
  createdOn: string;
  status: boolean;
}

// Empty initial data to match image
const MOCK_DATA: BlockDayConfig[] = [];

const AppointmentzBlockDaysConfig = () => {
  const [data, setData] = useState<BlockDayConfig[]>(MOCK_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    rmUser: "",
    blockDate: "",
  });

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "rmUser", label: "RM User", sortable: true },
    { key: "blockedDate", label: "Blocked Date", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "status", label: "Status", sortable: false },
  ];

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    // Simple client-side search mock
    if (term) {
      const lowerTerm = term.toLowerCase();
      // Since data is empty initially, this won't show much, but logic stands
      const filtered = MOCK_DATA.filter((item) =>
        item.rmUser.toLowerCase().includes(lowerTerm)
      );
      setData(filtered);
    } else {
      setData(MOCK_DATA);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.rmUser || !formData.blockDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const newBlockDay: BlockDayConfig = {
      id: Math.floor(Math.random() * 1000),
      rmUser: formData.rmUser,
      blockedDate: new Date(formData.blockDate).toLocaleDateString("en-GB"),
      createdOn: new Date().toLocaleDateString("en-GB"),
      status: true,
    };

    setData([newBlockDay, ...data]);
    setIsAddModalOpen(false);
    setFormData({ rmUser: "", blockDate: "" });
    toast.success("Block Day added successfully!");
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
            onChange={() => {
              const updatedData = data.map((d) =>
                d.id === item.id ? { ...d, status: !d.status } : d
              );
              setData(updatedData);
              toast.success("Status updated");
            }}
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
