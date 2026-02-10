import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface InvoiceItem {
  id: number;
  description: string;
  hsnSac: string;
  qty: number;
  rate: number;
  percentage: number;
  amount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  totalAmount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupply: string;
  po: string;
  accountName: string;
  status: 'Paid' | 'Overdue' | 'Pending';
  billTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    gstin: string;
  };
  shipTo: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  subject: string;
  items: InvoiceItem[];
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  total: number;
  balanceDue: number;
  totalInWords: string;
}

export default function BillingInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  const fetchInvoiceDetail = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockInvoice: InvoiceData = {
        invoiceNumber: 'LMQ/25-26/0988',
        invoiceDate: '12/01/2026',
        dueDate: '12/01/2026',
        placeOfSupply: 'Maharashtra',
        po: '1700090077',
        accountName: 'Runwal Thane',
        status: 'Paid',
        billTo: {
          name: 'RUNWAL DEVELOPERS PVT. LTD.',
          address: 'Runwal & Omkar Esquire, 5th floor',
          city: 'Mumbai',
          state: '400072 Maharashtra',
          country: 'India',
          gstin: 'GSTIN: 27AGCR3850590',
        },
        shipTo: {
          name: 'SKULL TEXTILE PVT. LTD.',
          address: 'Runwal & Omkar Esquire, 5th floor',
          city: 'Mumbai',
          state: '400072 Maharashtra',
          country: 'India',
        },
        subject: 'Invoice for services rendered',
        items: [
          {
            id: 1,
            description: 'Software charges',
            hsnSac: '998700',
            qty: 2,
            rate: 12000.00,
            percentage: 0,
            amount: 2188.80,
            cgstPercent: 9,
            cgstAmount: 2188.80,
            sgstPercent: 9,
            sgstAmount: 2188.80,
            totalAmount: 24000.00,
          },
        ],
        subTotal: 2300000.00,
        cgstTotal: 210000.00,
        sgstTotal: 210000.00,
        total: 26088.00,
        balanceDue: 26088.00,
        totalInWords: 'Indian Rupee Twenty Six Thousand Nine Hundred Eighty Eight Only',
      };

      setInvoice(mockInvoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    toast.success('Downloading PDF...');
    // Implement PDF download logic
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    toast.success('Email sent successfully!');
    // Implement email sending logic
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Invoice not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Back Button and Actions */}
      <div className="max-w-5xl mx-auto mb-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/loyalty/billing-invoices')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Invoices
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-white border-gray-300"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white border-gray-300"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              onClick={handleSendEmail}
              className="flex items-center gap-2 bg-[#C72030] hover:bg-[#A01828] text-white"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Container */}
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-sm p-8 sm:p-10">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
            <p className="text-sm text-gray-600">#20260988</p>
          </div>
          <div>
            <span
              className={`inline-block px-4 py-1.5 text-sm font-semibold ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-500 text-white'
                  : invoice.status === 'Overdue'
                  ? 'bg-red-500 text-white'
                  : 'bg-yellow-500 text-white'
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
            <p className="text-sm text-gray-900">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Due Date</p>
            <p className="text-sm text-gray-900">{invoice.dueDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Place Of Supply</p>
            <p className="text-sm text-gray-900">{invoice.placeOfSupply}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Invoice Date</p>
            <p className="text-sm text-gray-900">{invoice.invoiceDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">P.O.#</p>
            <p className="text-sm text-gray-900">{invoice.po}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Account Name</p>
            <p className="text-sm text-gray-900">{invoice.accountName}</p>
          </div>
        </div>

        {/* Bill To and Ship To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Bill To</h3>
            <div className="text-xs text-gray-700 leading-relaxed">
              <p className="font-medium">{invoice.billTo.name}</p>
              <p>{invoice.billTo.address}</p>
              <p>{invoice.billTo.city},</p>
              <p>{invoice.billTo.state}</p>
              <p>{invoice.billTo.country}</p>
              <p className="mt-1">{invoice.billTo.gstin}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-2">Ship To</h3>
            <div className="text-xs text-gray-700 leading-relaxed">
              <p className="font-medium">{invoice.shipTo.name}</p>
              <p>{invoice.shipTo.address}</p>
              <p>{invoice.shipTo.city},</p>
              <p>{invoice.shipTo.state}</p>
              <p>{invoice.shipTo.country}</p>
            </div>
          </div>
        </div>

        {/* Subject */}
        <div className="mb-5">
          <p className="text-xs text-gray-700">
            <span className="font-medium">Subject :</span> {invoice.subject}
          </p>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-6 border border-gray-300">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  Item & Description
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  HSN/SAC
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  QTY
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  Rate
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  %
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">
                  Amt
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50" colSpan={2}>
                  CGST
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50" colSpan={2}>
                  SGST
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 bg-gray-50">
                  Amount
                </th>
              </tr>
              <tr className="border-b border-gray-300">
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="border-r border-gray-300 bg-gray-50"></th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">%</th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">Amt</th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">%</th>
                <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 bg-gray-50">Amt</th>
                <th className="bg-gray-50"></th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.description}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.hsnSac}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {String(item.qty).padStart(2, '0')}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.percentage}%
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-700 text-center border-r border-gray-200">
                    {item.cgstPercent}%
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-700 text-center border-r border-gray-200">
                    {item.sgstPercent}%
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-700 border-r border-gray-200">
                    {item.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total in Words and Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1.5">Total in Words</p>
            <p className="text-xs italic text-gray-700">{invoice.totalInWords}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-700">Sub Total</span>
              <span className="text-xs text-gray-900">
                {formatCurrency(invoice.subTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-700">CGST (9%)</span>
              <span className="text-xs text-gray-900">
                {formatCurrency(invoice.cgstTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-700">SGST (9%)</span>
              <span className="text-xs text-gray-900">
                {formatCurrency(invoice.sgstTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-xs font-semibold text-gray-900">Total</span>
              <span className="text-xs font-semibold text-gray-900">
                {formatCurrency(invoice.total)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-gray-300">
              <span className="text-xs font-bold text-gray-900">Balance Due</span>
              <span className="text-xs font-bold text-gray-900">
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
