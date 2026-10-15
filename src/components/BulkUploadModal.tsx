
import React, { useState } from 'react';
import { Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_CONFIG, getFullUrl, getAuthenticatedFetchOptions } from '@/config/apiConfig';
import { toast } from 'sonner';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onImport?: (file: File) => Promise<void>;
  onDownloadSample?: () => void;
}

export const BulkUploadModal = ({ 
  isOpen, 
  onClose, 
  title = "Bulk Upload",
  description = "Upload a file to import data",
  onImport,
  onDownloadSample
}: BulkUploadModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      
      if (onImport) {
        // Use custom import function if provided
        await onImport(selectedFile);
      } else {
        // Default import to parking bookings API
        await importParkingBookings(selectedFile);
      }
      
      // Reset file selection and close modal
      setSelectedFile(null);
      onClose();
      
    } catch (error) {
      console.error('Import failed:', error);
      // Error handling is done in the import functions
    } finally {
      setIsImporting(false);
    }
  };

  const importParkingBookings = async (file: File) => {
    // Show loading toast
    toast.info('Importing parking bookings...');
    
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    // Construct the API URL
    const url = getFullUrl('/pms/manage/parking_bookings/import.json');
    const options = getAuthenticatedFetchOptions();
    
    // Set up the request with FormData
    const requestOptions = {
      ...options,
      method: 'POST',
      body: formData,
      // Remove Content-Type header to let browser set it with boundary for FormData
      headers: {
        ...options.headers,
      }
    };
    
    // Remove Content-Type to let browser handle it for FormData
    delete requestOptions.headers['Content-Type'];
    
    console.log('🚀 Calling parking bookings import API:', url);
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Import API Error Response:', errorText);
      throw new Error(`Failed to import parking bookings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Parking bookings imported successfully:', data);
    
    // Show success toast
    toast.success('Parking bookings imported successfully!');
  };

  const resetModal = () => {
    setSelectedFile(null);
    setIsImporting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-md rounded-2xl sm:rounded-2xl border border-[rgba(26,26,24,.09)] bg-white p-0 gap-0">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 px-6 pt-[22px] pb-4 text-left">
          <div className="flex items-start">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
              style={{ backgroundColor: '#F5F4F0' }}
            >
              <Upload size={14} color="#1A1A18" />
            </span>
            <div>
              <DialogTitle className="text-sm font-semibold leading-[1.4] text-[#1A1A18] text-left">
                {title}
              </DialogTitle>
              {description && (
                <p className="text-xs text-[rgba(26,26,24,.55)] mt-1">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={resetModal}
            disabled={isImporting}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#F7F6F2] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          <div className="text-center">
            <div className="border-2 border-dashed border-[rgba(26,26,24,.15)] bg-[#F5F4F0] rounded-xl p-8">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                disabled={isImporting}
              />
              <label
                htmlFor="file-upload"
                className={`text-[#1A1A18] hover:text-black font-medium cursor-pointer ${
                  isImporting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Choose File
              </label>
              <span className="ml-2 text-[rgba(26,26,24,.55)]">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(26,26,24,.08)]">
            <button
              type="button"
              disabled={isImporting}
              onClick={onDownloadSample}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Download Sample Format
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
