import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';

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
      const response = await axios.get(`https://runwal-api.lockated.com/lock_account_bills/${id}/lock_account_bill_detail.json?token=00f7c12e459b75225a07519c088edae3e9612e59d80111bb&society_id=9`)
      const invoice = response.data.bill

      // Map items from API
      const items = invoice.charges.map((charge: any) => ({
        id: charge?.id || Math.random(),
        name: charge?.name || "-",
        description: charge?.name || "-",
        hsnSac: charge?.hsn_sac || "-",
        qty: parseFloat(charge?.qty) || 0,
        rate: parseFloat(charge?.rate) || 0,
        percentage: parseFloat(charge?.percentage) || 0,
        amount: parseFloat(charge?.amount) || 0,
        cgstPercent: parseFloat(charge?.cgst_rate) || 0,
        cgstAmount: parseFloat(charge?.cgst_amount) || 0,
        sgstPercent: parseFloat(charge?.sgst_rate) || 0,
        sgstAmount: parseFloat(charge?.sgst_amount) || 0,
        totalAmount: parseFloat(charge?.total_amount) || 0,
      }));

      // Calculate totals from items
      const subTotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      const cgstTotal = items.reduce((sum: number, item: any) => sum + item.cgstAmount, 0);
      const sgstTotal = items.reduce((sum: number, item: any) => sum + item.sgstAmount, 0);
      const total = subTotal + cgstTotal + sgstTotal;
      const balanceDue = total; // Assuming balance due equals total for now

      // Convert total to words
      const numberToWords = (num: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';

        const convertHundreds = (n: number): string => {
          let str = '';
          if (n >= 100) {
            str += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
          }
          if (n >= 20) {
            str += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
          } else if (n >= 10) {
            str += teens[n - 10] + ' ';
            return str;
          }
          if (n > 0) {
            str += ones[n] + ' ';
          }
          return str;
        };

        const crore = Math.floor(num / 10000000);
        num %= 10000000;
        const lakh = Math.floor(num / 100000);
        num %= 100000;
        const thousand = Math.floor(num / 1000);
        num %= 1000;
        const hundred = num;

        let result = '';
        if (crore > 0) result += convertHundreds(crore) + 'Crore ';
        if (lakh > 0) result += convertHundreds(lakh) + 'Lakh ';
        if (thousand > 0) result += convertHundreds(thousand) + 'Thousand ';
        if (hundred > 0) result += convertHundreds(hundred);

        return result.trim();
      };

      const totalInWords = `Indian Rupee ${numberToWords(Math.floor(total))} Only`;

      setInvoice({
        invoiceNumber: invoice.bill_number || "-",
        invoiceDate: invoice?.invoice_date || "-",
        dueDate: invoice?.due_date || "-",
        placeOfSupply: "Maharashtra",
        po: invoice?.po || "-",
        accountName: invoice?.account_name || "-",
        status: invoice?.status,
        billTo: {
          name: "RUNWAL DEVELOPERS PVT. LTD.",
          address: "Runwal & Omkar Esquire, 5th floor",
          city: "Mumbai",
          state: "400072 Maharashtra",
          country: "India",
          gstin: "27AGCR3850590",
        },
        shipTo: {
          name: invoice.ship_to?.name,
          address: invoice.ship_to?.address,
          city: invoice.ship_to?.city,
          state: invoice.ship_to?.state,
          country: invoice.ship_to?.country,
        },
        subject: invoice.subject,
        items: items,
        subTotal: subTotal,
        cgstTotal: cgstTotal,
        sgstTotal: sgstTotal,
        total: total,
        balanceDue: balanceDue,
        totalInWords: totalInWords,
      });
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
    return `₹${amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
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
      <div className="max-w-5xl mx-auto bg-white border border-gray-200 shadow-sm ">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-6 px-0 py-0 border-none shadow-none p-5 sm:p-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-0">INVOICE</h1>
            <p className="text-sm text-gray-500 mt-1">#{id}</p>
          </div>
          <div>
            <span
              className={`text-sm font-medium ${
                invoice.status === 'Paid'
                  ? 'text-red-600'
                  : invoice.status === 'Overdue'
                    ? 'text-red-600'
                    : 'text-yellow-600'
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="mb-5 p-5 border-t border-gray-200">
          <div className="grid grid-cols-3">
            <div className="flex items-center py-1.5">
              <span className="text-[13px] text-gray-500 w-[115px]">Invoice Number</span>
              <span className="text-[13px] text-gray-900 font-semibold pl-2">: {invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center py-1.5">
              <span className="text-[13px] text-gray-500 w-[115px]">Due Date</span>
              <span className="text-[13px] text-gray-900 font-semibold pl-2">: {invoice.dueDate}</span>
            </div>
            <div className="flex items-center py-1.5">
              <span className="text-[13px] text-gray-500 w-[115px]">Place Of Supply</span>
              <span className="text-[13px] text-gray-900 font-semibold pl-2">: {invoice.placeOfSupply}</span>
            </div>
          </div>
          <div className="grid grid-cols-3">
            <div className="flex items-center py-1.5">
              <span className="text-[13px] text-gray-500 w-[115px]">Invoice Date</span>
              <span className="text-[13px] text-gray-900 font-semibold pl-2">: {invoice.invoiceDate}</span>
            </div>
            <div className="flex items-center py-1.5">
              <span className="text-[13px] text-gray-500 w-[115px]">P.O.#</span>
              <span className="text-[13px] text-gray-900 font-semibold pl-2">: {invoice.po}</span>
            </div>
            <div className="flex items-center py-1.5">
              <span className="text-[13px] text-gray-500 w-[115px]">Account Name</span>
              <span className="text-[13px] text-gray-900 font-semibold pl-2">: {invoice.accountName}</span>
            </div>
          </div>
        </div>

        {/* Bill To, Ship To, Subject, Items, and Totals in a single table */}
        <div className="mb-6">
          <table className="w-full border-l-0 border-r-0 border border-gray-300">
            <thead>
              <tr>
                <th className="text-[13px] text-left font-semibold text-gray-900 border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 w-1/2">Bill To</th>
                <th className="text-[13px] text-left font-semibold text-gray-900 border-b border-gray-300 px-3 py-2.5 w-1/2">
                  Ship To
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-top border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 leading-relaxed">
                  <div className="font-medium">{invoice.billTo.name}</div>
                  <div>{invoice.billTo.address}</div>
                  <div>{invoice.billTo.city},</div>
                  <div>{invoice.billTo.state}</div>
                  <div>{invoice.billTo.country}</div>
                  <div className="mt-1">GSTIN {invoice.billTo.gstin}</div>
                </td>
                <td className="align-top px-3 py-2.5 text-[13px] text-gray-700 leading-relaxed">
                  <div className="font-medium">{invoice.shipTo.name}</div>
                  <div>{invoice.shipTo.address}</div>
                  <div>{invoice.shipTo.city},</div>
                  <div>{invoice.shipTo.state}</div>
                  <div>{invoice.shipTo.country}</div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border-t border-gray-300 px-3 py-2.5 text-[13px] text-gray-700">
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
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-left align-bottom" rowSpan={2}>#</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-left align-bottom" rowSpan={2}>Item & Description</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-left align-bottom" rowSpan={2}>HSN/SAC</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-left align-bottom" rowSpan={2}>QTY</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-left align-bottom" rowSpan={2}>Rate</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center" colSpan={2}>CSGT</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center" colSpan={2}>SGST</th>
                        <th className="border-b border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-right align-bottom" rowSpan={2}>Amount</th>
                      </tr>
                      <tr>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">%</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">Amt</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">%</th>
                        <th className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700">{idx + 1}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700">{item.description}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700">{item.hsnSac}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700">{String(item.qty).padStart(2, '0')}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700">{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">{item.cgstPercent}%</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">{item.cgstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">{item.sgstPercent}%</td>
                          <td className="border-b border-gray-300 border-r border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-center">{item.sgstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border-b border-gray-300 px-3 py-2.5 text-[13px] text-gray-700 text-right">{item.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
              {/* Total in Words and Calculations */}
              <tr>
                <td className="border-t border-gray-300 border-r border-gray-300 px-3 py-4 align-top" style={{ verticalAlign: 'top' }}>
                  <div className="text-[13px] font-semibold text-gray-900 mb-2">Total In Words</div>
                  <div className="text-[13px] italic text-gray-700">{invoice.totalInWords}</div>
                </td>
                <td className="border-t border-gray-300 px-4 py-4 align-top" style={{ verticalAlign: 'top' }}>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center justify-between w-full text-[13px]">
                      <div className="text-gray-500 text-right" style={{ minWidth: '100px' }}>Sub Total</div>
                      <div className="text-gray-900 font-medium text-right" style={{ minWidth: '120px' }}>{formatCurrency(invoice.subTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[13px]">
                      <div className="text-gray-500 text-right" style={{ minWidth: '100px' }}>CGST (9%)</div>
                      <div className="text-gray-900 font-medium text-right" style={{ minWidth: '120px' }}>{formatCurrency(invoice.cgstTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[13px]">
                      <div className="text-gray-500 text-right" style={{ minWidth: '100px' }}>SGST (9%)</div>
                      <div className="text-gray-900 font-medium text-right" style={{ minWidth: '120px' }}>{formatCurrency(invoice.sgstTotal)}</div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[13px] font-semibold pt-2 border-t border-gray-200">
                      <div className="text-gray-900 text-right" style={{ minWidth: '100px' }}>Total</div>
                      <div className="text-gray-900 text-right" style={{ minWidth: '120px' }}>{formatCurrency(invoice.total)}</div>
                    </div>
                    <div className="flex items-center justify-between w-full text-[13px] font-bold pt-2 border-t border-gray-200">
                      <div className="text-gray-900 text-right" style={{ minWidth: '100px' }}>Balance Due</div>
                      <div className="text-gray-900 text-right" style={{ minWidth: '120px' }}>{formatCurrency(invoice.balanceDue)}</div>
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
