import React, { useState, useEffect } from "react";
import { Download, Info, Zap, Bell } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface WalletTransaction {
  id: number;
  transaction_type?: string;
  amount?: number;
  category?: string;
  remarks?: string;
  created_at?: string;
  redirect_url?: string;
  resource_type?: string;
}

export const WalletManagement = () => {
  const ITEMS_PER_PAGE = 10; // fixed page size used only for UI

  const [timeRange, setTimeRange] = useState("10");
  const [loading, setLoading] = useState(false);
  const [cardsData, setCardsData] = useState<any>([]);
  const [activeTab, setActiveTab] = useState("wallet-management");
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Auto Top-Up states
  const [autoTopUpActive, setAutoTopUpActive] = useState(true);
  const [triggerBalance, setTriggerBalance] = useState("40000");
  const [topUpAmount, setTopUpAmount] = useState("25000");
  const [paymentMethod, setPaymentMethod] = useState("bank-1234");

  // Alerts states
  const [alertsActive, setAlertsActive] = useState(true);
  const [minBalanceThreshold, setMinBalanceThreshold] = useState("50000");
  const [alertRecipients, setAlertRecipients] = useState(
    "admin@company.com, finance@company.com"
  );

  // Stats mock data (replace with API if needed)
  const stats = {
    openingBalance: "3,36,450.00",
    totalRecharges: "46,200.00",
    emails: "38,750.00",
    closingBalance: "1,21,800.00",
  };

  // range → API query param map
  const rangeParamMap: Record<string, string> = {
    "7": "last_7_days",
    "10": "last_10_days",
    "30": "last_30_days",
    "90": "last_90_days",
  };

  // Wallet transactions from API (full list stored in allTransactions)
  const fetchTransactions = async (page: number = 1, range: string = timeRange) => {
    setLoading(true);
    try {
      const token = API_CONFIG.TOKEN || "";
      const rangeParam = rangeParamMap[range] || "last_10_days";
      // fetch all transactions regardless of page; pagination is done locally
      const url = getFullUrl(`/organization_wallet/transactions.json?token=${token}&range=${rangeParam}`);
      const response = await fetch(url, {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setCardsData(data.wallet);
      const all = data.transactions || [];
      setAllTransactions(all);

      const count = data.meta?.total_count ?? all.length;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      setCurrentPage(1);
    } catch (error) {
      toast.error("Failed to load wallet transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "wallet-management") return;
    setCurrentPage(1);
    fetchTransactions(1, timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, timeRange]);

  // whenever allTransactions or currentPage changes, update visible slice
  useEffect(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    setTransactions(allTransactions.slice(start, start + ITEMS_PER_PAGE));
  }, [allTransactions, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) return;
    // only change page locally; data already loaded
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 7;
    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => !loading && handlePageChange(1)} isActive={currentPage === 1} className={loading ? "pointer-events-none opacity-50" : ""}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 4) {
        items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => !loading && handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>
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
              <PaginationLink onClick={() => !loading && handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage < totalPages - 3) {
        items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => !loading && handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>
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
            <PaginationLink onClick={() => !loading && handlePageChange(totalPages)} isActive={currentPage === totalPages} className={loading ? "pointer-events-none opacity-50" : ""}>
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => !loading && handlePageChange(i)} isActive={currentPage === i} className={loading ? "pointer-events-none opacity-50" : ""}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  // Table columns for API data
  // Show all columns in the API transactions table
  const apiColumns = [
    { key: "id", label: "Transaction ID" },
    {
      key: "transaction_type",
      label: "Type",
      exportFormatter: (val: any) => {
        if (!val && val !== 0) return "";
        let str = String(val).trim();
        // collapse repeated words (e.g. "Debit Debit")
        const parts = str.split(/\s+/);
        if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
          str = parts[0];
        }
        // normalise casing
        str = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        // convert common abbreviations
        if (str === "Dr") return "Debit";
        if (str === "Cr") return "Credit";
        return str;
      },
    },
    {
      key: "amount",
      label: "Amount",
      exportFormatter: (val: any) => {
        if (val === null || val === undefined || val === "") return "";
        const num = Number(val);
        if (isNaN(num)) return String(val);
        // show decimals only when they exist, otherwise plain integer
        if (num % 1 === 0) {
          return num.toLocaleString();
        }
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      },
    },
    {
      key: "category",
      label: "Category",
      exportFormatter: (val: any) => {
        if (!val && val !== 0) return "";
        const s = String(val).toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1);
      },
    },
    { key: "remarks", label: "Remarks" },
    {
      key: "created_at",
      label: "Date",
      exportFormatter: (val: any) => {
        if (!val) return "";
        try {
          const d = new Date(val);
          return d.toLocaleString();
        } catch {
          return String(val);
        }
      },
    },
    { key: "resource_type", label: "Resource Type" },
    { key: "customer_code", label: "Customer ID" },
    { key: "order_id", label: "Order ID" },
    { key: "link", label: "Link", excludeFromExport: true },
  ];

  const renderApiCell = (item: WalletTransaction, columnKey: string) => {
    switch (columnKey) {
      case "transaction_type": {
        let str = item.transaction_type || "";
        str = str.trim();
        // collapse duplicate words
        const parts = str.split(/\s+/);
        if (parts.length > 1 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
          str = parts[0];
        }
        // normalise casing
        const type = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        // determine text and background colours
        let classes = "pl-4 pr-4 py-1 text-sm font-[400] rounded-[2px]"; // explicit left/right padding and 3px radius
        if (type === "Debit" || type === "Dr") {
          classes += " bg-[#efcac4]";
        } else if (type === "Credit" || type === "Cr") {
          classes += " bg-[#c6e9d7]";
        }
        return <p className={classes}>{type}</p>;
      }
      case "created_at":
        return item.created_at
          ? new Date(item.created_at).toLocaleString()
          : "";
      case "amount":
        return item.amount !== undefined ? item.amount.toLocaleString() : "";
      case "id":
        return item.id;
      case "remarks":
        return item.remarks || "";
      case "resource_type":
        // Remove hyperlink, just show plain text
        return <span>{item.resource_type}</span>;
      case "category":
        if (!item.category) return "";
        const cat = String(item.category).toLowerCase();
        return cat.charAt(0).toUpperCase() + cat.slice(1);
      case "link":
        return item.redirect_url ? (
          <a
            href={item.redirect_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View
          </a>
        ) : (
          <span className="text-gray-500">-</span>
        );
      default:
        return item[columnKey as keyof WalletTransaction] ?? "";
    }
  };

  // Mock data for recent transactions (for demo, not used in API table)
  const recentTransactions = [
    {
      id: 1,
      date: "11/10/2024",
      rechargedId: "01234",
      transactionType: "CR40",
      transactionMode: "PAYU",
      expend: "-",
      earned: "-",
      balanceStatus: "-",
    },
    {
      id: 2,
      date: "11/10/2024",
      rechargedId: "01234",
      transactionType: "CR40",
      transactionMode: "PAYU",
      expend: "-",
      earned: "-",
      balanceStatus: "-",
    },
    {
      id: 3,
      date: "11/10/2024",
      rechargedId: "01234",
      transactionType: "CR40",
      transactionMode: "PAYU",
      expend: "-",
      earned: "-",
      balanceStatus: "-",
    },
    {
      id: 4,
      date: "11/10/2024",
      rechargedId: "01234",
      transactionType: "CR40",
      transactionMode: "PAYU",
      expend: "-",
      earned: "-",
      balanceStatus: "-",
    },
  ];

  // Define columns for EnhancedTable (mock data)
  const columns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rechargedId", label: "Recharged ID", sortable: true },
    { key: "transactionType", label: "Transaction Type", sortable: true },
    { key: "transactionMode", label: "Transaction Mode", sortable: true },
    { key: "expend", label: "Expend Status", sortable: false },
    { key: "earned", label: "Earned Status", sortable: false },
    { key: "balanceStatus", label: "Balance Status", sortable: false },
  ];

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "date":
        return <span>{item.date || "-"}</span>;
      case "rechargedId":
        return <span>{item.rechargedId || "-"}</span>;
      case "transactionType":
        return <span>{item.transactionType || "-"}</span>;
      case "transactionMode":
        return <span>{item.transactionMode || "-"}</span>;
      case "expend":
        return <span>{item.expend || "-"}</span>;
      case "earned":
        return <span>{item.earned || "-"}</span>;
      case "balanceStatus":
        return <span>{item.balanceStatus || "-"}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* <TabsList className="bg-[#f6f4ee] p-1 h-auto w-full grid grid-cols-4 gap-6">
          <TabsTrigger
            value="wallet-management"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Wallet Management
          </TabsTrigger>
          <TabsTrigger
            value="auto-top-up"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Auto Top up
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Alerts
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Receipts
          </TabsTrigger>
        </TabsList> */}

        <TabsContent value="wallet-management" className="space-y-6 mt-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1A1A]">
                WALLET MANAGEMENT
              </h1>
              {/* Last Updated hidden as per request */}
            </div>
          </div>

          {/* Top Stats Cards - 4 Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* <StatsCard
              title="Opening Balance"
              value={stats.openingBalance}
              icon={
                <svg
                  className="w-6 h-6 text-[#C72030]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              }
              className="cursor-pointer hover:shadow-md transition-shadow"
              iconRounded={true}
              valueColor="text-[#C72030]"
            /> */}
            <StatsCard
              title="Total Recharges"
              value={cardsData?.credited_amount || "0.00"}
              icon={
                <svg
                  className="w-6 h-6 text-[#C72030]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              className="cursor-pointer hover:shadow-md transition-shadow"
              iconRounded={true}
              valueColor="text-[#C72030]"
            />
            <StatsCard
              title="Total Redeemed"
              value={cardsData?.debited_amount || "0.00"}
              icon={
                <svg
                  className="w-6 h-6 text-[#C72030]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              className="cursor-pointer hover:shadow-md transition-shadow"
              iconRounded={true}
              valueColor="text-[#C72030]"
            />
            <StatsCard
              title="Available Balance"
              value={cardsData?.available_amount || "0.00"}
              icon={
                <svg
                  className="w-6 h-6 text-[#C72030]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              className="cursor-pointer hover:shadow-md transition-shadow"
              iconRounded={true}
              valueColor="text-[#C72030]"
            />
          </div>

          {/* Recent Transactions Table (API) */}
          <div className="space-y-4">
            <div className="flex align-items-center justify-between w-full bg-[#f6f4ee] p-3">
              <p className="text-lg font-bold my-auto ">Recent Transactions</p>
              <Select
                value={timeRange}
                onValueChange={(val) => {
                  setTimeRange(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] border-[#e5e1d8] bg-white">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="10">Last 10 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <EnhancedTable
              data={transactions}
              columns={apiColumns}
              renderCell={renderApiCell}
              loading={loading}
              loadingMessage="Loading transactions..."
              emptyMessage="No wallet transactions found"
              enableExport={true}
              exportFileName="wallet-transactions"
              storageKey="wallet-management-table"
            />
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {renderPaginationItems()}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <p className="text-sm text-gray-600">
                  Showing page {currentPage} of {totalPages} ({totalCount} total transactions)
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="auto-top-up" className="space-y-6 mt-6">
          <div className="max-w-2xl">
            {/* Header with Toggle */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#e8f5f1] rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#10b981]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">
                    Auto Top-Up
                  </h2>
                  <p className="text-sm text-gray-500">
                    Automatically recharge wallet
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#10b981]">
                  Active
                </span>
                <Switch
                  checked={autoTopUpActive}
                  onCheckedChange={setAutoTopUpActive}
                  className="data-[state=checked]:bg-[#10b981]"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Trigger Balance */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  Trigger Balance
                  <Info className="w-3 h-3 text-gray-400" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    type="text"
                    value={triggerBalance}
                    onChange={(e) => setTriggerBalance(e.target.value)}
                    className="pl-7 bg-gray-50 border-[#e5e1d8]"
                    placeholder="40000"
                  />
                </div>
              </div>

              {/* Top-Up Amount */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  Top-Up Amount
                  <Info className="w-3 h-3 text-gray-400" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    type="text"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="pl-7 bg-gray-50 border-[#e5e1d8]"
                    placeholder="25000"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1A1A1A]">
                  Payment Method
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-gray-50 border-[#e5e1d8]">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank-1234">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 "
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Bank Account *****1234
                      </span>
                    </SelectItem>
                    <SelectItem value="bank-5678">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 "
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Bank Account *****5678
                      </span>
                    </SelectItem>
                    <SelectItem value="upi">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 "
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        UPI
                      </span>
                    </SelectItem>
                    <SelectItem value="card">
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 "
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Credit/Debit Card
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview Box */}
              <div className="bg-[#e8f5f1] border border-[#a7f3d0] rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-[#10b981] mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1A1A1A] text-sm mb-1">
                      Auto Top-Up Preview
                    </p>
                    <p className="text-sm text-gray-700">
                      When balance drops below{" "}
                      <span className="font-semibold">
                        Rs.{triggerBalance || "40,000"}
                      </span>
                      , automatically add{" "}
                      <span className="font-semibold">
                        Rs.{topUpAmount || "25,000"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-6">
                <Button
                  className="bg-[#C72030] hover:bg-[#A01828] text-white px-8"
                  onClick={() => {
                    console.log("Auto Top-Up configuration saved");
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <div className="max-w-2xl">
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#f1c7cb] rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#c72030]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">
                    Threshold Alerts
                  </h2>
                  <p className="text-sm text-gray-500">
                    Get notified when balance is low
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#10b981]">
                  Active
                </span>
                <Switch
                  checked={alertsActive}
                  onCheckedChange={setAlertsActive}
                  className="data-[state=checked]:bg-[#10b981]"
                />
              </div>
            </div>

            <div className="space-y-4">
           
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  Minimum Balance Threshold
                  <Info className="w-3 h-3 text-gray-400" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₹
                  </span>
                  <Input
                    type="text"
                    value={minBalanceThreshold}
                    onChange={(e) => setMinBalanceThreshold(e.target.value)}
                    className="pl-7 bg-gray-50 border-[#e5e1d8]"
                    placeholder="50000"
                  />
                </div>
              </div>

             
              <div className="space-y-2 bg-[#eae6dd] p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-[#c72030] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#c72030] mb-1">
                      Alert Recipients
                    </p>
                    <p className="text-sm text-[#1A1A1A]">{alertRecipients}</p>
                  </div>
                </div>
              </div>

        
              <div className="flex justify-end mt-6">
                <Button
                  className="bg-[#C72030] hover:bg-[#A01828] text-white px-8"
                  onClick={() => {
                    console.log("Alert configuration saved");
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-6 mt-6">
          <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Receipts</h2>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Download className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No receipts available</p>
                <p className="text-sm mt-1">
                  Transactions receipts will appear here
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletManagement;
