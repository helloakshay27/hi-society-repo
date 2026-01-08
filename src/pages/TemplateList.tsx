import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import axios from 'axios';
import { toast } from 'sonner';

interface Template {
  id: number;
  title: string;
  description: string;
  active: boolean | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
  url: string;
}

export default function TemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Template[]>(
        'https://uat-hi-society.lockated.com/offer_templates.json',
        {
          params: {
            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
          }
        }
      );
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const columns = [
    { key: 'srNo', label: 'Sr. No.', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'created_at', label: 'Created On', sortable: true },
    { key: 'updated_at', label: 'Last Updated Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true }
  ];

  const renderCell = (item: Template, columnKey: string, index?: number) => {
    switch (columnKey) {
      case 'srNo':
        const itemIndex = index !== undefined ? index : templates.findIndex(t => t.id === item.id);
        return itemIndex !== -1 ? itemIndex + 1 : '-';
      
      case 'title':
        return item.title;
      
      case 'created_at':
        return formatDate(item.created_at);
      
      case 'updated_at':
        return formatDate(item.updated_at);
      
      case 'status':
        return (
          <div className="flex justify-center">
            <div 
              className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${
                item.active ? 'bg-green-500' : 'bg-red-500'
              }`}
              onClick={() => handleToggleStatus(item.id, !item.active)}
            >
              <div 
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${
                  item.active ? 'translate-x-5 mt-0.5' : 'translate-x-0.5 mt-0.5'
                }`}
              />
            </div>
          </div>
        );
      
      case 'actions':
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/settings/template/view/${item.id}`)}
              title="View"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/settings/template/edit/${item.id}`)}
              title="Edit"
            >
              <Pencil className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
        );
      
      default:
        return String(item[columnKey as keyof Template] ?? "-");
    }
  };

  const handleToggleStatus = async (id: number, newStatus: boolean) => {
    try {
      // TODO: Implement actual API call to update status
      console.log('Toggle status for template:', id, newStatus);
      toast.success('Status updated successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleTemplateSelection = (itemId: string) => {
    const id = parseInt(itemId);
    setSelectedTemplates(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTemplates(templates.map(t => t.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const renderCustomActions = () => {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={() => navigate('/settings/template/add')}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add
        </Button>
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Template</h1>
      </div>

      <div className="overflow-x-auto animate-fade-in">
        <EnhancedTable
          data={templates}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="templates"
          storageKey="templates-table"
          enableSelection={true}
          selectedItems={selectedTemplates.map(id => id.toString())}
          onSelectItem={handleTemplateSelection}
          onSelectAll={handleSelectAll}
          getItemId={template => template.id.toString()}
          leftActions={renderCustomActions()}
          rightActions={null}
          searchPlaceholder="Search Templates"
          hideTableExport={false}
          hideColumnsButton={false}
          className="transition-all duration-500 ease-in-out"
          loading={loading}
          loadingMessage="Loading templates..."
        />
      </div>
    </div>
  );
}
