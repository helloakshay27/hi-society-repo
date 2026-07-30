import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Heading } from "@/components/ui/heading";
import { Search, Edit } from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { format } from "date-fns";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
interface ApprovalData {
  id: number;
  approval_function_name: string;
  created_at: string;
  created_by: string;
}

const ApprovalMatrixSetupPage = () => {
  const { shouldShow } = useDynamicPermissions();
  const navigate = useNavigate();
  const [approvalData, setApprovalData] = useState<ApprovalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchApprovalData = async () => {
      try {
        setLoading(true);

        // Get dynamic society_id from localStorage
        const societyId = localStorage.getItem('selectedSocietyId');

        if (!societyId) {
          console.error('No society selected');
          setLoading(false);
          return;
        }

        const response = await apiClient.get(`/pms/admin/invoice_approvals.json?society_id=${societyId}`);
        setApprovalData(response.data);
      } catch (error) {
        console.error('Error fetching approval data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalData();
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return <div className="p-8 min-h-screen bg-transparent">
    {/* Breadcrumbs */}
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="text-[#1a1a1a]">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/settings" className="text-[#1a1a1a]">
            Settings
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/settings/approval-matrix" className="text-[#1a1a1a]">
            Approval Matrix
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-[#C72030]">Setup</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    {/* Title */}
    <Heading level="h1" className="text-[#1a1a1a] mb-6">
      APPROVAL MATRIX SETUP
    </Heading>

    {/* Action Bar */}
    <div className="flex justify-between items-center mb-6">
      {shouldShow("ApprovalMatrix", "create") && (
        <Button
          onClick={() => navigate('/settings/approval-matrix/setup/add')}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
        >
          + Add
        </Button>
      )}

      <div className="relative">
        {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /> */}
        {/* <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#C72030] w-64"
        /> */}
      </div>
    </div>

    {/* Table */}
    <EnhancedTable
      data={approvalData}
      columns={[
        { key: 'edit', label: 'Edit' },
        { key: 'id', label: 'Id' },
        { key: 'approval_function_name', label: 'Function' },
        { key: 'created_at', label: 'Created On' },
        { key: 'created_by', label: 'Created by' },
      ]}
      renderCell={(item, column) => {
        if (column.key === 'edit') {
          return shouldShow("ApprovalMatrix", "update") ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 bg-[#C72030] text-white hover:bg-[#C72030]/90"
              onClick={() => navigate(`/settings/approval-matrix/setup/edit/${item.id}`)}
            >
              <Edit className="w-4 h-4 text-[#1a1a1a]" />
            </Button>
          ) : null;
        }
        if (column.key === 'created_at') {
          return formatDate(item.created_at);
        }
        return item[column.key];
      }}
      loading={loading}
      pagination={false}
      emptyMessage="No approval matrix data found"
    />
  </div>;
};
export default ApprovalMatrixSetupPage;