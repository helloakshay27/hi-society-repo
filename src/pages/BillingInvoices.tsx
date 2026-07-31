import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Toaster } from '@/components/ui/sonner';
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import axios from 'axios';
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { useDynamicPermissions } from "@/hooks/useDynamicPermissions";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

interface BillingInvoice {
  id: number;
  billingPeriod: string;
  dateOfInvoice: string;
  invoiceNumber: string;
  invoiceAmount: number;
  totalDebits: number;
  invoiceStatus: 'Paid' | 'Overdue' | 'Pending';
  note: string;
}

export default function BillingInvoices() {
  const navigate = useNavigate();
  const { shouldShow } = useDynamicPermissions();
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [totalInvoices, setTotalInvoices] = useState(1);
  const [overdueInvoices, setOverdueInvoices] = useState(0);
  const [paidInvoices, setPaidInvoices] = useState(0);

  // Cleanup body overflow styles when component mounts
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = API_CONFIG.TOKEN || "";
      const url = getFullUrl(`/lock_account_bills/lock_account_bill_list.json?token=${token}&society_id=9`);
      const response = await axios.get(url, { headers: { Authorization: getAuthHeader() } });
      setInvoices(response.data.bills);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth]);

  const handleViewInvoice = (id: number) => {
    navigate(`/loyalty/billing-invoices/${id}`);
  };

  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 4) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }

      if (currentPage < totalPages - 3) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }

      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return items;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const columns = [
    { key: 'action', label: 'Action', sortable: false },
    { key: 'billingPeriod', label: 'Billing Period', sortable: true },
    { key: 'due_date', label: 'Date Of Invoice', sortable: true },
    { key: 'bill_number', label: 'Invoice Number', sortable: true },
    { key: 'total_amount', label: 'Invoice Amount', sortable: true },
    { key: 'total_amount', label: 'Total Debits', sortable: true },
    { key: 'status', label: 'Invoice Status', sortable: true },
    { key: 'note', label: 'Notes', sortable: true },
  ];

  const renderCell = (item: BillingInvoice, columnKey: string) => {
    switch (columnKey) {
      case 'action':
        return (
          <div className="flex gap-1">
          {shouldShow("Billing Invoices", "show") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewInvoice(item.id)}
            title="View Invoice"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </Button>
          )}
          </div>
        );
      default:
        return String(item[columnKey as keyof BillingInvoice] ?? "-");
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />

      {/* Header with Month Selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">BILLING PERIOD</h1>
        <FormControl sx={{ width: 180 }} variant="outlined">
          <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Select month</InputLabel>
          <MuiSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            displayEmpty
            label="Select month"
            sx={fieldStyles}
            MenuProps={menuProps}
            renderValue={(value: string) => (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {value || "Select month"}
              </span>
            )}
          >
            {months.map((month) => (
              <MenuItem key={month} value={month}>
                {month}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total Invoice',
            value: totalInvoices,
            icon: FileText,
            bgColor: 'bg-[#F6F4EE]',
            iconBg: 'bg-[#C4B89D54]',
          },
          {
            label: 'Overdue',
            value: overdueInvoices,
            icon: AlertCircle,
            bgColor: 'bg-[#F6F4EE]',
            iconBg: 'bg-[#C4B89D54]',
          },
          {
            label: 'Paid',
            value: paidInvoices,
            icon: TrendingUp,
            bgColor: 'bg-[#F6F4EE]',
            iconBg: 'bg-[#C4B89D54]',
          },
        ].map((item, i) => {
          const IconComponent = item.icon;
          return (
            <div
              key={i}
              className={`${item.bgColor} p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4`}
            >
              <div className={`w-14 h-14 ${item.iconBg} flex items-center justify-center rounded`}>
                <IconComponent className="w-6 h-6 text-[#C72030]" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#1A1A1A]">
                  {item.value}
                </div>
                <div className="text-sm font-medium text-[#1A1A1A]">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoices Table */}
      <div className="">
        <EnhancedTable
          data={paginatedInvoices}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="billing-invoices"
          enableGlobalSearch={true}
          searchPlaceholder="Search invoices..."
          loading={loading}
          loadingMessage="Loading invoices..."
        />
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
