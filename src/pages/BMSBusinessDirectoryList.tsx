import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Switch from "@mui/material/Switch";
import axios from "axios";

interface BusinessDirectory {
  id: string;
  company_name: string;
  category: string;
  sub_category: string;
  contact_name: string;
  mobile: string;
  key_offering: string;
  active: boolean;
}

const columns = [
  { key: "company_name", label: "Company Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "sub_category", label: "Sub Category", sortable: true },
  { key: "contact_name", label: "Contact Person", sortable: true },
  { key: "mobile", label: "Mobile", sortable: false },
  { key: "key_offering", label: "Key Offerings", sortable: false },
  { key: "active", label: "Status", sortable: false },
];

const BMSBusinessDirectoryList: React.FC = () => {
  const baseUrl = localStorage.getItem("baseUrl")
  const token = localStorage.getItem("token")

  const navigate = useNavigate();
  const [directories, setDirectories] = useState<BusinessDirectory[]>([]);
  const [loading, setLoading] = useState(false)

  const fetchDirectories = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`https://${baseUrl}/crm/admin/business_directories.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setDirectories(response.data.business_directories)
    } catch (error) {
      console.log(error)
      toast.error("Failed to fetch directories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDirectories()
  }, [])

  const handleAdd = () => {
    navigate("/business-directory/add");
  };

  const handleFilters = () => {
    toast.info("Filters coming soon");
  };

  const handleView = (item: BusinessDirectory) => {
    navigate(`/business-directory/view/${item.id}`);
  };

  const handleToggleStatus = async (item: BusinessDirectory, checked: boolean) => {
    try {
      const payload = {
        business_directory: {
          active: checked
        }
      }
      await axios.put(`https://${baseUrl}/crm/admin/business_directories/${item.id}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setDirectories(prev => prev.map(d => d.id === item.id ? { ...d, active: checked } : d));
      toast.success(
        `${item.company_name} status ${checked ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const renderActions = (item: BusinessDirectory) => {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleView(item)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
    )
  }

  const renderCell = (item: BusinessDirectory, columnKey: string) => {
    switch (columnKey) {
      case "key_offering":
        return (
          <div className="text-sm text-gray-600 max-w-[200px] truncate">{item.key_offering}</div>
        );
      case "active":
        return (
          <Switch
            checked={item.active}
            onChange={(e) => handleToggleStatus(item, e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#04A231',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#04A231',
              },
              '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                color: '#C72030',
              },
              '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                backgroundColor: 'rgba(199, 32, 48, 0.5)',
              },
            }}
          />
        );
      default:
        return item[columnKey as keyof BusinessDirectory];
    }
  };

  const renderLeftActions = (
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
        data={directories}
        columns={columns}
        renderActions={renderActions}
        renderCell={renderCell}
        searchPlaceholder="Search"
        enableSearch={true}
        onFilterClick={handleFilters}
        leftActions={renderLeftActions}
        loading={loading}
        emptyMessage="No businesses found"
        pagination={true}
        pageSize={10}
      />
    </div>
  );
};

export default BMSBusinessDirectoryList;
