import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });
  // Mock data (replace with API call)
  const templates: CommunicationTemplate[] = [];
  const totalCount = templates.length;

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
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to save the template
    toast.success("Communication template created successfully!");
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ title: "", description: "" });
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

  // Add Template Form
  const renderAddTemplateForm = () => (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Communication Template</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="relative border border-gray-300 rounded-md mt-6">
            <div className="absolute -top-3 left-3 bg-white px-1">
              <label 
                htmlFor="title" 
                className="text-xs text-gray-500 bg-white px-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
            </div>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              className="w-full border-0 focus:ring-0 focus:ring-offset-0 h-12 px-3"
              required
            />
          </div>
          
          {/* Description Field */}
          <div className="relative border border-gray-300 rounded-md mt-6">
            <div className="absolute -top-3 left-3 bg-white px-1">
              <label 
                htmlFor="description" 
                className="text-xs text-gray-500 bg-white px-1"
              >
                Description <span className="text-red-500">*</span>
              </label>
            </div>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="min-h-[120px] w-full border-0 focus:ring-0 focus:ring-offset-0 pt-3 pb-2 px-3"
              required
            />
          </div>
        </form>
      </div>
      
      {/* Buttons - Moved outside the form div */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          type="button"
          
          onClick={handleCancel}
          className="px-6"
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit}
          className="bg-[#2e7d32] hover:bg-[#1b5e20] px-6"
        >
          Submit
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Communication Template</h1>
        {!showForm && (
          <Button 
            onClick={handleAddTemplate} 
            className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        )}
      </div>
      
      {showForm ? (
        renderAddTemplateForm()
      ) : (
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
          totalPages={Math.ceil(totalCount / pageSize)}
          onPageChange={handlePageChange}
          totalCount={totalCount}
        />
      )}
    </div>
  );
};

export default BMSCommunicationTemplate;
