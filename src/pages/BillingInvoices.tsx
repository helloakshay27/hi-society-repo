import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';

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
      const response = await axios.get(`https://runwal-api.lockated.com/lock_account_bills/lock_account_bill_list.json?token=00f7c12e459b75225a07519c088edae3e9612e59d80111bb&society_id=9`)
      setInvoices(response.data.bills);
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewInvoice(item.id)}
            title="View Invoice"
          >
            <Eye className="w-4 h-4 text-gray-700" />
          </Button>
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
          enableGlobalSearch={true}
          searchPlaceholder="Search invoices..."
          loading={loading}
          loadingMessage="Loading invoices..."
        />
      </div>
    </div>
  );
}
