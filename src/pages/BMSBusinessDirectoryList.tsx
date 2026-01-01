import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";

interface BusinessDirectory {
  id: string;
  companyName: string;
  category: string;
  subCategory: string;
  contactPerson: string;
  mobile: string;
  keyOfferings: string;
  status: boolean;
}

const BMSBusinessDirectoryList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: businessesData, refetch } = useQuery({
    queryKey: ["business-directory"],
    queryFn: async () => {
      const mockData: BusinessDirectory[] = [
        {
          id: "1",
          companyName: "Aanand Super Market",
          category: "Grocery Supplier",
          subCategory: "Grocery Store",
          contactPerson: "Rajesh Ravjiya",
          mobile: "+91-9867950922",
          keyOfferings: "NA",
          status: true,
        },
        {
          id: "2",
          companyName: "Om Sai",
          category: "Interior Painting",
          subCategory: "All Types Of Painting Work",
          contactPerson: "Mr. Rahul",
          mobile: "+91-8080271175",
          keyOfferings: "Genuine Pricing, ...",
          status: true,
        },
        {
          id: "3",
          companyName: "Suneeth Newspaper Distributor",
          category: "News Paper",
          subCategory: "Daily News Letter",
          contactPerson: "Suneeth",
          mobile: "+91-9967924445",
          keyOfferings: "NA",
          status: true,
        },
        {
          id: "4",
          companyName: "The Laundry",
          category: "Laundry Services",
          subCategory: "Laundry Services",
          contactPerson: "Kismat",
          mobile: "+91-8850289620",
          keyOfferings: "NA",
          status: true,
        },
        {
          id: "5",
          companyName: "Yadav Milk Centre",
          category: "Milk Supply",
          subCategory: "Milk Product Supplier",
          contactPerson: "Santosh Yadav",
          mobile: "+91-9619894490",
          keyOfferings: "NA",
          status: true,
        },
      ];
      return mockData;
    },
  });

  const businesses: BusinessDirectory[] = businessesData || [];

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "companyName", label: "Company Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "subCategory", label: "Sub Category", sortable: true },
    { key: "contactPerson", label: "Contact Person", sortable: true },
    { key: "mobile", label: "Mobile", sortable: false },
    { key: "keyOfferings", label: "Key Offerings", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const handleAdd = () => {
    navigate("/business-directory/add");
  };

  const handleFilters = () => {
    toast.info("Filters coming soon");
  };

  const handleView = (item: BusinessDirectory) => {
    navigate(`/business-directory/view/${item.id}`);
  };

  const handleToggleStatus = (item: BusinessDirectory, checked: boolean) => {
    toast.success(`${item.companyName} status ${checked ? "activated" : "deactivated"}`);
  };

  const renderCell = (item: BusinessDirectory, columnKey: string) => {
    switch (columnKey) {
      case "actions":
        return (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleView(item)}
            className="h-8 w-8 p-0 hover:bg-[#DBC2A9]"
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      case "companyName":
        return <span className="font-medium text-gray-900">{item.companyName}</span>;
      case "status":
        return (
          <Switch
            checked={item.status}
            onCheckedChange={(checked) => handleToggleStatus(item, checked)}
          />
        );
      case "mobile":
        return <span className="text-sm text-gray-600">{item.mobile}</span>;
      case "keyOfferings":
        return <span className="text-sm text-gray-600">{item.keyOfferings}</span>;
      default:
        return item[columnKey as keyof BusinessDirectory];
    }
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
      <Button
        onClick={handleFilters}
        variant="outline"
        className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <EnhancedTable
        data={businesses}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={(query) => setSearchQuery(query)}
        searchPlaceholder="Search"
        enableSearch={true}
        leftActions={renderLeftActions()}
        emptyMessage="No businesses found"
        pagination={false}
        storageKey="business-directory-table"
      />
      <div className="mt-4 text-sm text-gray-500">
        Showing 1 to {businesses.length} of {businesses.length} rows
      </div>
    </div>
  );
};

export default BMSBusinessDirectoryList;
