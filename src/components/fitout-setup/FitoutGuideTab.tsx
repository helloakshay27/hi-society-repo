import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedTable } from '../enhanced-table/EnhancedTable';
import { apiClient } from '@/utils/apiClient';

interface FitoutGuide {
  id: number;
  name: string;
  url: string;
  file_size: number;
  created_at: string;
}

export const FitoutGuideTab: React.FC = () => {
  const [guides, setGuides] = useState<FitoutGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/fitout_guide/index.json');
      const guidesData = response.data?.fitout_guides || [];
      setGuides(Array.isArray(guidesData) ? guidesData : []);
    } catch (error) {
      console.error('Error fetching guides:', error);
      toast.error('Failed to load fitout guides');
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF)
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should not exceed 10MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('attachfile[documents][]', file);

      const response = await apiClient.post('/fitout_guide/documents.json', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Fitout guide uploaded successfully');
      fetchGuides(); // Refresh the list
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading guide:', error);
      toast.error('Failed to upload fitout guide');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (guide: FitoutGuide) => {
    try {
      // Open the PDF URL in a new tab
      window.open(guide.url, '_blank');
      toast.success('Opening file in new tab');
    } catch (error) {
      console.error('Error opening guide:', error);
      toast.error('Failed to open file');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fitout guide?')) return;

    try {
      await apiClient.delete(`/attachfiles/${id}.json`);
      toast.success('Fitout guide deleted successfully');
      setGuides(Array.isArray(guides) ? guides.filter(guide => guide.id !== id) : []);
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast.error('Failed to delete fitout guide');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        draggable: false,
        defaultVisible: true,
      },
      {
        key: 'sr_no',
        label: 'SR No.',
        sortable: false,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'file_name',
        label: 'File Name',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'file_size',
        label: 'File Size',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
      {
        key: 'created_at',
        label: 'Uploaded At',
        sortable: true,
        draggable: true,
        defaultVisible: true,
      },
    ],
    []
  );

  const renderCell = useCallback((item: FitoutGuide, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload(item)}
              className="text-blue-600 hover:text-blue-800"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      case 'sr_no':
        const index = guides.findIndex(g => g.id === item.id);
        return <div>{index + 1}</div>;
      case 'file_name':
        return <span>{item.name}</span>;
      case 'file_size':
        const sizeInKB = (item.file_size / 1024).toFixed(2);
        const sizeInMB = (item.file_size / (1024 * 1024)).toFixed(2);
        return <span>{item.file_size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`}</span>;
      case 'created_at':
        return <span>{new Date(item.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>;
      default:
        return <span>{String(item[columnKey as keyof FitoutGuide] || '-')}</span>;
    }
  }, [guides]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={handleFileSelect}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 flex items-center justify-center border-2 border-gray-300 rounded">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600">Click to upload PDF file</p>
            <p className="text-xs text-gray-400">Maximum file size: 10MB</p>
          </div>
        </div>
      </div>

      <EnhancedTable
        data={guides}
        columns={columns}
        selectable={false}
        getItemId={(item) => item.id.toString()}
        renderCell={renderCell}
        storageKey="fitout-guides-table"
        enableExport={true}
        exportFileName="fitout-guides"
        searchTerm=""
        onSearchChange={() => {}}
        searchPlaceholder="Search fitout guides..."
        pagination={true}
        pageSize={10}
        leftActions={
          <Button
            onClick={handleFileSelect}
            disabled={uploading}
            className="bg-[#2C3F87] hover:bg-[#1e2a5e] text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
        }
      />
    </div>
  );
};
