import React, { useState, useEffect } from 'react';
import { Eye, Calendar, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Toaster } from '@/components/ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BillingInvoice {
  id: number;
  billingPeriod: string;
  dateOfInvoice: string;
  invoiceNumber: string;
  invoiceAmount: number;
  totalDebits: number;
  invoiceStatus: 'Paid' | 'Overdue' | 'Pending';
}

export default function BillingInvoices() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [totalInvoices, setTotalInvoices] = useState(300);
  const [overdueInvoices, setOverdueInvoices] = useState(24);
  const [paidInvoices, setPaidInvoices] = useState(240);

  // Cleanup body overflow styles when component mounts
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: BillingInvoice[] = [
        {
          id: 1,
          billingPeriod: 'January 2026',
          dateOfInvoice: '14/01/2026',
          invoiceNumber: '20260988',
          invoiceAmount: 304680.00,
          totalDebits: 40125300.00,
          invoiceStatus: 'Paid',
        },
        {
          id: 2,
          billingPeriod: 'December 2025',
          dateOfInvoice: '25/12/2025',
          invoiceNumber: '20260778',
          invoiceAmount: 254680.00,
          totalDebits: 33125300.00,
          invoiceStatus: 'Overdue',
        },
        {
          id: 3,
          billingPeriod: 'November 2025',
          dateOfInvoice: '18/11/2025',
          invoiceNumber: '20260344',
          invoiceAmount: 100680.00,
          totalDebits: 2125300.00,
          invoiceStatus: 'Paid',
        },
        {
          id: 4,
          billingPeriod: 'October 2025',
          dateOfInvoice: '02/10/2025',
          invoiceNumber: '20250667',
          invoiceAmount: 44680.00,
          totalDebits: 25300.00,
          invoiceStatus: 'Paid',
        },
      ];

      setInvoices(mockData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (id: number) => {
    console.log('View invoice:', id);
    // Navigate to invoice details page
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const columns = [
    { key: 'action', label: 'Action', sortable: false },
    { key: 'billingPeriod', label: 'Billing Period', sortable: true },
    { key: 'dateOfInvoice', label: 'Date Of Invoice', sortable: true },
    { key: 'invoiceNumber', label: 'Invoice Number', sortable: true },
    { key: 'invoiceAmount', label: 'Invoice Amount', sortable: true },
    { key: 'totalDebits', label: 'Total Debits', sortable: true },
    { key: 'invoiceStatus', label: 'Invoice Status', sortable: true },
  ];

  const renderCell = (item: BillingInvoice, columnKey: string) => {
    switch (columnKey) {
      case 'action':
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewInvoice(item.id)}
            title="View Invoice"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </Button>
        );
      
      case 'billingPeriod':
        return <span className="text-sm text-gray-700">{item.billingPeriod}</span>;
      
      case 'dateOfInvoice':
        return <span className="text-sm text-gray-700">{item.dateOfInvoice}</span>;
      
      case 'invoiceNumber':
        return <span className="text-sm text-gray-700">{item.invoiceNumber}</span>;
      
      case 'invoiceAmount':
        return <span className="text-sm text-gray-700">{formatCurrency(item.invoiceAmount)}</span>;
      
      case 'totalDebits':
        return <span className="text-sm text-gray-700">{formatCurrency(item.totalDebits)}</span>;
      
      case 'invoiceStatus':
        return (
          <div className="inline-flex" style={{ width: 200, maxWidth: 200 }}>
            <div className={`py-2.5 w-full text-center ${
              item.invoiceStatus === 'Paid'
                ? 'bg-[#d5dbdb]'
                : item.invoiceStatus === 'Overdue'
                ? 'bg-[#e4626f]'
                : 'bg-[#f0ad4e]'
            }`}>
              <p className="text-center text-xs font-medium">
                {item.invoiceStatus}
              </p>
            </div>
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
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] bg-white border-gray-300">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          data={invoices}
          columns={columns}
          renderCell={renderCell}
          pagination={false}
          enableExport={true}
          exportFileName="billing-invoices"
          storageKey="billing-invoices-table"
          enableGlobalSearch={true}
          searchPlaceholder="Search invoices..."
          loading={loading}
          loadingMessage="Loading invoices..."
          hideTableExport={false}
          hideColumnsButton={false}
        />
      </div>
    </div>
  );
}
