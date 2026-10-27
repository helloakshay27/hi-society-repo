import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Heading } from "@/components/ui/heading";
import { Edit } from "lucide-react";
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
        const payload = response.data;
        const approvals = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.invoice_approvals)
            ? payload.invoice_approvals
            : [];
        setApprovalData(approvals);
      } catch (error) {
        console.error('Error fetching approval data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalData();
  }, []);

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

    {/* Table */}
    <EnhancedTable
      storageKey="approval-matrix-setup-page-table"
      data={approvalData}
      leftActions={
        shouldShow("ApprovalMatrix", "create") ? (
          <Button
            onClick={() => navigate('/settings/approval-matrix/setup/add')}
            variant="ghost"
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            + Add
          </Button>
        ) : null
      }
      columns={[
        { key: 'edit', label: 'Edit' },
        { key: 'id', label: 'Id' },
        { key: 'approval_function_name', label: 'Function' },
        { key: 'created_at', label: 'Created On' },
        { key: 'created_by', label: 'Created by' },
      ]}
      renderCell={(item, columnKey) => {
        if (columnKey === 'edit') {
          return shouldShow("ApprovalMatrix", "update") ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 text-white"
              onClick={() => navigate(`/settings/approval-matrix/setup/edit/${item.id}`)}
            >
              <Edit className="w-4 h-4 text-[#1a1a1a]" />
            </Button>
          ) : null;
        }
        if (columnKey === 'created_at') {
          return formatDate(item.created_at);
        }
        return item[columnKey];
      }}
      loading={loading}
      pagination={false}
      emptyMessage="No approval matrix data found"
    />
  </div>;
};
export default ApprovalMatrixSetupPage;
