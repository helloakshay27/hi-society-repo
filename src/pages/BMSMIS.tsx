import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Download, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface MISRecord {
  id: string;
  section: string;
  items: string;
}

const BMSMIS: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: misData } = useQuery({
    queryKey: ["mis-records"],
    queryFn: async () => {
      // TODO: Replace with actual API endpoint
      const mockData: MISRecord[] = [];
      return mockData;
    },
  });

  const records: MISRecord[] = misData || [];

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "section", label: "Section", sortable: true },
    { key: "items", label: "Items", sortable: true },
  ];

  const handleAdd = () => {
    navigate("/mis/add");
  };

  const handleExport = () => {
    toast.success("Exporting MIS data...");
  };

  const handleEdit = (item: MISRecord) => {
    toast.info(`Edit: ${item.section}`);
  };

  const handleDelete = (item: MISRecord) => {
    toast.success(`Deleted: ${item.section}`);
  };

  const renderCell = (item: MISRecord, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(item)}
            className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(item)}
            className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return item[columnKey as keyof MISRecord];
  };

  const renderLeftActions = () => (
    <div className="flex gap-2">
      <Button
        onClick={handleAdd}
        className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <EnhancedTable
        data={records}
        columns={columns}
        renderCell={renderCell}
        enableExport={true}
        onSearchChange={(query) => setSearchQuery(query)}
        searchPlaceholder="Search"
        enableSearch={true}
        leftActions={renderLeftActions()}
        emptyMessage="No Matching Records Found"
        pagination={false}
        storageKey="mis-table"
      />
    </div>
  );
};

export default BMSMIS;
