import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CommunicationTemplate {
  id: string;
  title: string;
  content: string;
  createdOn: string;
  createdBy: string;
}

const BMSCommunicationTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Mock data (replace with API call)
  const templates: CommunicationTemplate[] = [];
  const totalCount = templates.length;
  const totalPages = 1;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const columns = [
    { key: "actions", label: "Actions", sortable: false },
    { key: "title", label: "Title", sortable: true },
    { key: "content", label: "Content", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
  ];

  const handleAddTemplate = () => {
    navigate("/communication/template/add");
  };
  const handleViewTemplate = (item: CommunicationTemplate) => {
    navigate(`/communication/template/view/${item.id}`);
  };
  const handleEditTemplate = (item: CommunicationTemplate) => {
    navigate(`/communication/template/edit/${item.id}`);
  };
  const handleDeleteTemplate = (item: CommunicationTemplate) => {
    // TODO: Implement delete
    alert("Template deleted");
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const renderCell = (item: CommunicationTemplate, columnKey: string) => {
    if (columnKey === "actions") {
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleViewTemplate(item)} className="h-8 w-8 p-0 hover:bg-[#DBC2A9]">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEditTemplate(item)} className="h-8 w-8 p-0 hover:bg-[#DBC2A9]">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(item)} className="h-8 w-8 p-0 hover:bg-red-100 text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return item[columnKey as keyof CommunicationTemplate];
  };


  // Render custom actions (Add button) for EnhancedTable leftActions
  const renderCustomActions = () => (
    <Button onClick={handleAddTemplate} className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium">
      <Plus className="w-4 h-4 mr-2" /> Add
    </Button>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Communication Template</h1>
      </div>
      <EnhancedTable
        data={templates}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search"
        leftActions={renderCustomActions()}
        emptyMessage="No Matching Records Found"
        isLoading={false}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalCount={totalCount}
      />
    </div>
  );
};

export default BMSCommunicationTemplate;
