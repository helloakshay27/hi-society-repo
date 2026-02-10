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
        <div className="flex justify-between items-center mb-2 px-0 py-0 border-none shadow-none">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-0">INVOICE</h1>
            <p className="text-xs text-gray-600 mt-1">#20260988</p>
          </div>
          <div>
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-50 text-emerald-600'
                  : invoice.status === 'Overdue'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-yellow-50 text-yellow-600'
              }`}
              style={{ fontWeight: 500 }}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="mb-2 pb-2 border-b border-gray-200">
          <div className="grid grid-cols-3">
            <div className="flex items-center py-1">
              <span className="text-xs text-gray-500 w-[100px]">Invoice Number</span>
              <span className="text-xs text-gray-900 font-semibold pl-2">: {invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-xs text-gray-500 w-[100px]">Due Date</span>
              <span className="text-xs text-gray-900 font-semibold pl-2">: {invoice.dueDate}</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-xs text-gray-500 w-[100px]">Place Of Supply</span>
              <span className="text-xs text-gray-900 font-semibold pl-2">: {invoice.placeOfSupply}</span>
            </div>
          </div>
          <div className="grid grid-cols-3">
            <div className="flex items-center py-1">
              <span className="text-xs text-gray-500 w-[100px]">Invoice Date</span>
              <span className="text-xs text-gray-900 font-semibold pl-2">: {invoice.invoiceDate}</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-xs text-gray-500 w-[100px]">P.O.#</span>
              <span className="text-xs text-gray-900 font-semibold pl-2">: {invoice.po}</span>
            </div>
            <div className="flex items-center py-1">
              <span className="text-xs text-gray-500 w-[100px]">Account Name</span>
              <span className="text-xs text-gray-900 font-semibold pl-2">: {invoice.accountName}</span>
            </div>
          </div>
        </div>

        {/* Bill To, Ship To, Subject, Items, and Totals in a single table */}
        <div className="mb-6">
          <table className="w-full border border-gray-300">
            <thead>
              <tr>
                <th className="text-xs text-left font-semibold text-gray-900 border-b border-gray-300 border-r border-gray-300 px-2 py-2 w-1/2">Bill To</th>
                <th className="text-xs text-left font-semibold text-gray-900 border-b border-gray-300 px-2 py-2 w-1/2">Ship To</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-top border-r border-gray-300 px-2 py-2 text-xs text-gray-700">
                  <div className="font-medium">{invoice.billTo.name}</div>
                  <div>{invoice.billTo.address}</div>
                  <div>{invoice.billTo.city},</div>
                  <div>{invoice.billTo.state}</div>
                  <div>{invoice.billTo.country}</div>
                  <div className="mt-1">{invoice.billTo.gstin}</div>
                </td>
                <td className="align-top px-2 py-2 text-xs text-gray-700">
                  <div className="font-medium">{invoice.shipTo.name}</div>
                  <div>{invoice.shipTo.address}</div>
                  <div>{invoice.shipTo.city},</div>
                  <div>{invoice.shipTo.state}</div>
                  <div>{invoice.shipTo.country}</div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border-t border-gray-300 px-2 py-2 text-xs text-gray-700">
                  <span className="font-medium">Subject :</span>
                  <span className="ml-2">{invoice.subject}</span>
                </td>
              </tr>
              {/* Items Table Header */}
              <tr>
                <td colSpan={2} className="p-0 border-t border-gray-300">
                  <table className="w-full border-none">
                    <thead>
                      <tr>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-left align-bottom" rowSpan={2}>#</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-left align-bottom" rowSpan={2}>Item & Description</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-left align-bottom" rowSpan={2}>HSN/SAC</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-left align-bottom" rowSpan={2}>QTY</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-left align-bottom" rowSpan={2}>Rate</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center" colSpan={2}>CGST</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center" colSpan={2}>SGST</th>
                        <th className="border-b border-gray-300 border-x  border-gray-300 px-2 py-2 text-xs text-gray-700 text-left align-bottom" rowSpan={2}>Amount</th>
                      </tr>
                      <tr>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">%</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">Amt</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">%</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">Amt</th>
                      </tr>
                    </thead>
                    <tbody>     
                      {invoice.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700">{idx + 1}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700">{item.description}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700">{item.hsnSac}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700">{String(item.qty).padStart(2, '0')}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">{item.cgstPercent}%</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">{item.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">{item.sgstPercent}%</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-2 py-2 text-xs text-gray-700 text-center">{item.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-300 px-2 py-2 text-xs text-gray-700">{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              {/* Total in Words and Calculations */}
              <tr>
                <td className="border-t border-gray-300 border-r border-gray-300 px-2 py-2 align-top" style={{verticalAlign: 'top'}}>
                  <div className="text-xs font-semibold text-gray-900 mb-1.5">Total In Words</div>
                  <div className="text-xs italic text-gray-700">{invoice.totalInWords}</div>
                </td>
                <td className="border-t border-gray-300 px-2 py-2 align-top" style={{verticalAlign: 'top'}}>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center justify-between w-[200px] text-xs">
                      <div className="text-gray-500">Sub Total</div>
                      <div className="text-gray-900 font-medium">{formatCurrency(invoice.subTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between w-[200px] text-xs">
                      <div className="text-gray-500">CGST (9%)</div>
                      <div className="text-gray-900 font-medium">{formatCurrency(invoice.cgstTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between w-[200px] text-xs">
                      <div className="text-gray-500">SGST (9%)</div>
                      <div className="text-gray-900 font-medium">{formatCurrency(invoice.sgstTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between w-[200px] text-xs font-semibold pt-2 border-t border-gray-300">
                      <div className="text-gray-900">Total</div>
                      <div className="text-gray-900">{formatCurrency(invoice.total)}</div>
                    </div>
                    <div className="flex items-center justify-between w-[200px] text-xs font-bold pt-1.5 border-t border-gray-300">
                      <div className="text-gray-900">Balance Due</div>
                      <div className="text-gray-900">{formatCurrency(invoice.balanceDue)}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
