import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from "@/components/ui/pagination";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

interface SmtpSetting {
  id: number;
  address: string;
  port: number;
  user_name: string;
  email: string;
  company_name: string;
}

const SMTPSettingsList = () => {
  const navigate = useNavigate();
  const [smtpSettings, setSmtpSettings] = useState<SmtpSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchSMTPSettings = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/smtp_settings.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SMTP settings: ${response.statusText}`);
      }

      const data = await response.json();
      let settingsData = data.smtp_setting || data.smtp_settings || data.setting || data;

      // Ensure we have an array
      if (!Array.isArray(settingsData)) {
        settingsData = settingsData && typeof settingsData === 'object' ? [settingsData] : [];
      }
      
      // Client-side search filtering
      let filteredSettings = settingsData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredSettings = settingsData.filter((setting: SmtpSetting) =>
          setting.address?.toLowerCase().includes(searchLower) ||
          setting.email?.toLowerCase().includes(searchLower) ||
          setting.company_name?.toLowerCase().includes(searchLower) ||
          setting.user_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by ID descending
      filteredSettings.sort((a: SmtpSetting, b: SmtpSetting) => (b.id || 0) - (a.id || 0));
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSettings = filteredSettings.slice(startIndex, endIndex);
      
      setSmtpSettings(paginatedSettings);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredSettings.length / itemsPerPage));
      setTotalCount(filteredSettings.length);
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
      toast.error('Failed to fetch SMTP settings');
      setSmtpSettings([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchSMTPSettings(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSMTPSettings]);

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (id: number) => navigate(`/setup-member/smtp-settings-edit/${id}`);
  const handleCreate = () => navigate("/setup-member/smtp-settings-create");

  const columns = [
    { key: 'actions', label: 'Action', sortable: false },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'port', label: 'Port', sortable: true },
    { key: 'user_name', label: 'User Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'company_name', label: 'Company Name', sortable: true },
  ];

  const renderCell = (item: SmtpSetting, columnKey: string) => {
    switch (columnKey) {
      case 'actions':
        return (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item.id)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
        );
      case 'address':
        return item.address || '-';
      case 'port':
        return item.port || '-';
      case 'user_name':
        return item.user_name || '-';
      case 'email':
        return item.email || '-';
      case 'company_name':
        return item.company_name || '-';
      default:
        return item[columnKey as keyof SmtpSetting] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      {/* {totalCount === 0 && (
        <Button 
          onClick={handleCreate}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          Create SMTP Settings
        </Button>
      )} */}
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={smtpSettings}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="smtp-settings"
        storageKey="smtp-settings-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search SMTP settings (address, email, company, username)..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching SMTP settings..." : "Loading SMTP settings..."}
      />
      {!searchTerm && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      <div className="w-full">
        {renderListTab()}
      </div>
    </div>
  );
};

export default SMTPSettingsList;
