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
// import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { getAuthHeader } from "@/config/apiConfig";
import { toast } from "sonner";

interface WalletTransaction {
  id: number;
  transaction_type?: string;
  amount?: number;
  remarks?: string;
  created_at?: string;
}

const WalletManagement: React.FC = () => {
  const [timeRange, setTimeRange] = useState("10");
  const [loading, setLoading] = useState(false);
  const [cardsData, setCardsData] = useState<any>([]);
  const [activeTab, setActiveTab] = useState("wallet-management");

  // Auto Top-Up states
  const [autoTopUpActive, setAutoTopUpActive] = useState(true);
  const [triggerBalance, setTriggerBalance] = useState("40000");
  const [topUpAmount, setTopUpAmount] = useState("25000");
  const [paymentMethod, setPaymentMethod] = useState("bank-1234");

  // Alerts states
  const [alertsActive, setAlertsActive] = useState(true);
  const [minBalanceThreshold, setMinBalanceThreshold] = useState("50000");
  const [alertRecipients, setAlertRecipients] = useState("admin@company.com, finance@company.com");

  // Stats mock data (replace with API if needed)
  const stats = {
    openingBalance: "3,36,450.00",
    totalRecharges: "46,200.00",
    emails: "38,750.00",
    closingBalance: "1,21,800.00",
  };

  // Wallet transactions from API
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  useEffect(() => {
    if (activeTab !== "wallet-management") return;
    setLoading(true);
    const fetchTransactions = async () => {
    try {
      // const token = API_CONFIG.TOKEN || "";
      // const url = getFullUrl(`/organization_wallet/transactions.json?token=${token}`);
      const url = "https://runwal-api.lockated.com/organization_wallet/transactions.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
      const response = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setCardsData(data.wallet)
      setTransactions(data.transactions || []);
    } catch (error) {
      toast.error("Failed to load wallet transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
    };
    fetchTransactions();
  }, [activeTab]);

  // Table columns for API data
  const apiColumns = [
    { key: "id", label: "Transaction ID" },
    { key: "transaction_type", label: "Type" },
    { key: "amount", label: "Amount" },
    { key: "remarks", label: "Remarks" },
    { key: "created_at", label: "Date" },
  ];

  const renderApiCell = (item: WalletTransaction, columnKey: string) => {
    switch (columnKey) {
    case "created_at":
      return item.created_at ? new Date(item.created_at).toLocaleString() : "";
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
        <TabsList className="bg-[#f6f4ee] p-1 h-auto">
          <TabsTrigger
            value="wallet-management"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Wallet Management
          </TabsTrigger>
          {/* <TabsTrigger
            value="auto-top-up"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Auto Top Up
          </TabsTrigger> */}
          <TabsTrigger
            value="alerts"
            className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
          >
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet-management" className="space-y-6 mt-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-[#1A1A1A]">
                WALLET MANAGEMENT
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Last Updated: 15/01/2025 - 10:04
              </p>
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
              value={cardsData.credited_amount}
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
              value={cardsData.debited_amount}
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
              value={cardsData.available_amount}
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
              <Select value={timeRange} onValueChange={setTimeRange}>
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
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Auto Top-Up</h2>
                  <p className="text-sm text-gray-500">Automatically recharge wallet</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#10b981]">Active</span>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
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
                      When balance drops below <span className="font-semibold">Rs.{triggerBalance || '40,000'}</span>, automatically add <span className="font-semibold">Rs.{topUpAmount || '25,000'}</span>
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
            {/* Header with Toggle */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#f1c7cb] rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#c72030]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#1A1A1A]">Threshold Alerts</h2>
                  <p className="text-sm text-gray-500">Get notified when balance is low</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#10b981]">Active</span>
                <Switch
                  checked={alertsActive}
                  onCheckedChange={setAlertsActive}
                  className="data-[state=checked]:bg-[#10b981]"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Minimum Balance Threshold */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1">
                  Minimum Balance Threshold
                  <Info className="w-3 h-3 text-gray-400" />
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <Input
                    type="text"
                    value={minBalanceThreshold}
                    onChange={(e) => setMinBalanceThreshold(e.target.value)}
                    className="pl-7 bg-gray-50 border-[#e5e1d8]"
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Alert Recipients */}
              <div className="space-y-2 bg-[#eae6dd] p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-[#c72030] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#c72030] mb-1">
                      Alert Recipients
                    </p>
                    <p className="text-sm text-[#1A1A1A]">
                      {alertRecipients}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
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
      </Tabs>
    </div>
  );
};

export default WalletManagement;
