import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Plus, Eye, Edit, Trash2, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";

interface CommunicationTemplate {
  id: number;
  identifier: string;
  identifier_action: string;
  body: string;
  created_by_id: number;
  created_by: {
    id: number;
    email: string;
  };
  resource: {
    id: number;
  };
  created_at: string;
  updated_at: string;
}

const BMSCommunicationTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    identifier: "helpdesk",
    identifier_action: "",
    body: ""
  });

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/crm/admin/communication_templates.json');
      setTemplates(response.data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load communication templates', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    // { key: "identifier", label: "Identifier", sortable: true },
    { key: "identifier_action", label: "Title", sortable: true },
    { key: "body", label: "Description", sortable: true },
    { key: "created_by_email", label: "Created By", sortable: true },
    { key: "created_at", label: "Created On", sortable: true },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier_action || !formData.body) {
      toast.error('Please fill all required fields', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        communication_template: {
          identifier: "helpdesk",
          identifier_action: formData.identifier_action,
          body: formData.body
        }
      };

      if (isEditMode && editingId) {
        // Update existing template
        await apiClient.put(`/crm/admin/communication_templates/${editingId}.json`, payload);
        toast.success('Communication template updated successfully!', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
      } else {
        // Create new template
        await apiClient.post('/crm/admin/communication_templates.json', payload);
        toast.success('Communication template created successfully!', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#fff',
            color: 'black',
            border: 'none',
          },
        });
      }
      
      setShowForm(false);
      setIsEditMode(false);
      setEditingId(null);
      setFormData({ identifier: "", identifier_action: "", body: "" });
      fetchTemplates(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.response?.data?.message || error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ identifier: "helpdesk", identifier_action: "", body: "" });
  };
  
  const handleViewTemplate = (item: CommunicationTemplate) => {
    navigate(`/communication/template/view/${item.id}`);
  };
  
  const handleEditTemplate = async (item: CommunicationTemplate) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setShowForm(true);
    
    // Fetch the full template data by ID
    try {
      const response = await apiClient.get(`/crm/admin/communication_templates/${item.id}.json`);
      const template = response.data;
      
      setFormData({
        identifier: template.identifier || "helpdesk",
        identifier_action: template.identifier_action || "",
        body: template.body || ""
      });
    } catch (error: any) {
      console.error('Error fetching template:', error);
      toast.error(`Failed to load template: ${error.response?.data?.message || error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      // If fetch fails, use the data we have from the list
      setFormData({
        identifier: item.identifier || "helpdesk",
        identifier_action: item.identifier_action || "",
        body: item.body || ""
      });
    }
  };
  
  const handleDeleteTemplate = async (item: CommunicationTemplate) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await apiClient.delete(`/crm/admin/communication_templates/${item.id}.json`);
      
      toast.success('Template deleted successfully', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
      
      fetchTemplates(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template: ${error.response?.data?.message || error.message || 'Unknown error'}`, {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#fff',
          color: 'black',
          border: 'none',
        },
      });
    }
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
          {/* <Button size="sm" variant="ghost" onClick={() => handleViewTemplate(item)} className="h-8 w-8 p-0 hover:bg-[#DBC2A9]">
            <Eye className="h-4 w-4" />
          </Button> */}
          <Button size="sm" variant="ghost" onClick={() => handleEditTemplate(item)} className="h-8 w-8 p-0 hover:bg-[#DBC2A9]">
            <Edit className="h-4 w-4" />
          </Button>
          {/* <Button size="sm" variant="ghost" onClick={() => handleDeleteTemplate(item)} className="h-8 w-8 p-0 hover:bg-red-100 text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button> */}
        </div>
      );
    }
    
    if (columnKey === "created_by_email") {
      return item.created_by?.email || '—';
    }
    
    if (columnKey === "created_at") {
      return new Date(item.created_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (columnKey === "body") {
      return (
        <div className="max-w-md truncate" title={item.body}>
          {item.body}
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
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? 'Edit Communication Template' : 'Add Communication Template'}
          </h2>
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
          {/* Identifier Field - Hidden, set to 'helpdesk' by default */}
          <input type="hidden" name="identifier" value="helpdesk" />
          
          {/* Title Field (previously Identifier Action) */}
          <div className="relative border border-gray-300 rounded-md mt-6">
            <div className="absolute -top-3 left-3 bg-white px-1">
              <label 
                htmlFor="identifier_action" 
                className="text-xs text-gray-500 bg-white px-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
            </div>
            <Input
              id="identifier_action"
              name="identifier_action"
              value={formData.identifier_action}
              onChange={handleFormChange}
              placeholder="Enter title here..."
              className="w-full border-0 focus:ring-0 focus:ring-offset-0 h-12 px-3"
              required
            />
          </div>
          
          {/* Body Field */}
          <div className="relative border border-gray-300 rounded-md mt-6">
            <div className="absolute -top-3 left-3 bg-white px-1">
              <label 
                htmlFor="body" 
                className="text-xs text-gray-500 bg-white px-1"
              >
                Description <span className="text-red-500">*</span>
              </label>
            </div>
            <Textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleFormChange}
              placeholder="Enter description here..."
              className="min-h-[120px] w-full border-0 focus:ring-0 focus:ring-offset-0 pt-3 pb-2 px-3"
              required
            />
            {/* <p className="text-xs text-gray-500 mt-2 px-3 pb-2">
              Use {'{{variable}}'} for dynamic values (e.g., {'{{name}}'}, {'{{email}}'})
            </p> */}
          </div>
        </form>
      </div>
      
      {/* Buttons - Moved outside the form div */}
      <div className="flex justify-center space-x-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-6"
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#2e7d32] hover:bg-[#1b5e20] px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Communication Template</h1>
        {/* {!showForm && (
          <Button 
            onClick={handleAddTemplate} 
            className="bg-[#1A3765] text-white hover:bg-[#1A3765]/90 h-9 px-4 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        )} */}
      </div>
      
      {showForm ? (
        renderAddTemplateForm()
      ) : (
        <EnhancedTable
          data={templates}
          columns={columns}
          renderCell={renderCell}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search templates"
          leftActions={renderCustomActions()}
          emptyMessage="No Communication Templates Found"
          isLoading={isLoading}
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
