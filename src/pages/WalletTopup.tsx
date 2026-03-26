import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wallet, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import axios from "axios";
import { toast } from "sonner";

interface WalletData {
  id: number;
  credited_amount: number;
  debited_amount: number;
  available_amount: number;
}

interface Transaction {
  customer_name: string;
  customer_code: string;
  order_id: string;
  base_price: string;
  customer_price: string;
  resource_type: string;
  redirect_url: any;
  id: number;
  transaction_type: string;
  amount: number;
  remarks: string;
  created_at: string;
}

const TX_RANGE_PARAM_MAP: Record<string, string> = {
  "7": "last_7_days",
  "10": "last_10_days",
  "30": "last_30_days",
  "90": "last_90_days",
};

const WalletTopup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTotalCount, setTxTotalCount] = useState(0);
  const [txTimeRange, setTxTimeRange] = useState("10");
  const [formData, setFormData] = useState({
    amount: "",
    remarks: "",
  });
  const [organizations, setOrganizations] = useState<
    { id: number; name: string }[]
  >([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // token helper from storage
  const token = API_CONFIG.TOKEN || "";

  useEffect(() => {
    // Fetch organizations
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const url = getFullUrl(`/organizations.json?token=${token}`);
        const response = await fetch(url, {
          headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch organizations");
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setOrganizations([]);
        setError("Failed to load organizations");
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  // range → API query param map is defined at module level (TX_RANGE_PARAM_MAP)

  // Fetch wallet data and transactions when organization is selected
  const fetchWalletData = useCallback(async (orgId: string, page: number = 1, range: string = "10") => {
    if (!orgId) {
      setWalletData(null);
      setTransactions([]);
      return;
    }
    setLoadingTransactions(true);
    try {
      const rangeParam = TX_RANGE_PARAM_MAP[range] || "last_10_days";
      const url = getFullUrl(`/organization_wallet/transactions?organization_id=${orgId}&token=${token}&page=${page}&range=${rangeParam}`);
      const response = await fetch(url, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch wallet data");
      const data = await response.json();
      setWalletData(data.wallet || null);
      setTransactions(data.transactions || []);
      if (data.meta) {
        setTxCurrentPage(data.meta.page || 1);
        setTxTotalPages(data.meta.total_pages || 1);
        setTxTotalCount(data.meta.total_count || 0);
      }
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      setWalletData(null);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [token]);

  useEffect(() => {
    if (!selectedOrgId) {
      setWalletData(null);
      setTransactions([]);
      setTxCurrentPage(1);
      setTxTotalPages(1);
      setTxTotalCount(0);
      return;
    }
    setTxCurrentPage(1);
    fetchWalletData(selectedOrgId, 1, txTimeRange);
  }, [selectedOrgId, txTimeRange, fetchWalletData]);

  const handleTxPageChange = (page: number) => {
    if (page < 1 || page > txTotalPages || page === txCurrentPage) return;
    fetchWalletData(selectedOrgId, page, txTimeRange);
  };

  const renderTxPaginationItems = () => {
    if (!txTotalPages || txTotalPages <= 0) return null;
    const items = [];
    const showEllipsis = txTotalPages > 7;
    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => !loadingTransactions && handleTxPageChange(1)} isActive={txCurrentPage === 1} className={loadingTransactions ? "pointer-events-none opacity-50" : ""}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (txCurrentPage > 4) {
        items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = 2; i <= Math.min(3, txTotalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => !loadingTransactions && handleTxPageChange(i)} isActive={txCurrentPage === i} className={loadingTransactions ? "pointer-events-none opacity-50" : ""}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (txCurrentPage > 3 && txCurrentPage < txTotalPages - 2) {
        for (let i = txCurrentPage - 1; i <= txCurrentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => !loadingTransactions && handleTxPageChange(i)} isActive={txCurrentPage === i} className={loadingTransactions ? "pointer-events-none opacity-50" : ""}>
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (txCurrentPage < txTotalPages - 3) {
        items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = Math.max(txTotalPages - 2, 2); i < txTotalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => !loadingTransactions && handleTxPageChange(i)} isActive={txCurrentPage === i} className={loadingTransactions ? "pointer-events-none opacity-50" : ""}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            );
          }
        }
      }
      if (txTotalPages > 1) {
        items.push(
          <PaginationItem key={txTotalPages} className="cursor-pointer">
            <PaginationLink onClick={() => !loadingTransactions && handleTxPageChange(txTotalPages)} isActive={txCurrentPage === txTotalPages} className={loadingTransactions ? "pointer-events-none opacity-50" : ""}>
              {txTotalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= txTotalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => !loadingTransactions && handleTxPageChange(i)} isActive={txCurrentPage === i} className={loadingTransactions ? "pointer-events-none opacity-50" : ""}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedOrgId || !formData.amount || !formData.remarks) {
        throw new Error("All fields are required");
      }

      const organizationId = parseInt(selectedOrgId);
      const amount = parseFloat(formData.amount);

      if (isNaN(organizationId) || organizationId <= 0) {
        throw new Error("Please select a valid organization");
      }

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount greater than 0");
      }

      const url = getFullUrl(`/organization_wallet/credit?token=${token}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuthHeader(),
        },
        body: JSON.stringify({
          organization_id: organizationId,
          amount: amount,
          remarks: formData.remarks.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to process top-up (${response.status})`
        );
      }

      setSuccess(`Successfully credited ₹${amount} to organization`);

      // Reset form
      setFormData({
        amount: "",
        remarks: "",
      });

      // Refresh wallet data (go back to page 1)
      await fetchWalletData(selectedOrgId, 1, txTimeRange);
    } catch (err: any) {
      setError(err.message || "Failed to process top-up");
      console.error("Top-up error:", err);
    } finally {
      setLoading(false);
    }
  };

  const transactionColumns = [
    { key: "id", label: "ID", sortable: true },
    { key: "transaction_type", label: "Type", sortable: true },
    { key: "amount", label: "Amount", sortable: true },
    { key: "customer_name", label: "Customer", sortable: true },
    { key: "customer_code", label: "Customer Code", sortable: true },
    { key: "order_id", label: "Order ID", sortable: true },
    { key: "base_price", label: "Base Price", sortable: true },
    { key: "customer_price", label: "Customer Price", sortable: true },
    { key: "resource_type", label: "Resource", sortable: true },
    { key: "redirect_ur", label: "Link", sortable: false },
    { key: "remarks", label: "Remarks", sortable: false },
    { key: "created_at", label: "Date", sortable: true },
  ];

  const renderTransactionCell = (item: Transaction, columnKey: string) => {
    switch (columnKey) {
      case "id":
        return <span className="font-medium">#{item.id}</span>;
      case "transaction_type":
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${item.transaction_type === "credit"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
              }`}
          >
            {item.transaction_type?.toUpperCase() || "-"}
          </span>
        );
      case "amount":
        return (
          <span
            className={`font-semibold ${item.transaction_type === "credit"
              ? "text-green-600"
              : "text-red-600"
              }`}
          >
            {item.transaction_type === "credit" ? "+" : "-"}₹
            {(item.amount || 0).toFixed(2)}
          </span>
        );
      case "remarks":
        return <span className="text-gray-600">{item.remarks || "-"}</span>;
      case "customer_name":
        return <span className="text-gray-700">{item.customer_name || "-"}</span>;
      case "customer_code":
        return <span className="text-gray-700">{item.customer_code || "-"}</span>;
      case "order_id":
        return <span className="text-gray-700">{item.order_id || "-"}</span>;
      case "base_price":
        return <span className="text-gray-700">₹{item.base_price || "0"}</span>;
      case "customer_price":
        return <span className="text-gray-700">₹{item.customer_price || "0"}</span>;
      case "resource_type":
        return <span className="text-gray-700">{item.resource_type || "-"}</span>;
      case "redirect_ur":
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
      case "created_at":
        return (
          <span className="text-gray-500">
            {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
          </span>
        );
      default:
        return null;
    }
  };

  // --- ThresholdAlertCard Component ---
  interface ThresholdAlertCardProps {
    organizationId: string;
    token: string;
  }

  const ThresholdAlertCard: React.FC<ThresholdAlertCardProps> = ({ organizationId, token }) => {
    const [threshold, setThreshold] = useState<number>(50000);
    const [emails, setEmails] = useState<string>("ops@system.com,finance@system.com");
    const [alertEnabled, setAlertEnabled] = useState<boolean>(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Optionally, fetch current settings from API on mount or org change
    useEffect(() => {
      const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
          const url = getFullUrl(`/admin/wallet_alert_settings?organization_id=${organizationId}&token=${token}`);
          const response = await fetch(url, {
            headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
          });
          if (response.ok) {
            const data = await response.json();
            if (data) {
              setThreshold(Number(data.super_admin_threshold) || 50000);
              setEmails(data.super_admin_emails || "");
              setAlertEnabled(data.alert_enabled === "true" || data.alert_enabled === true);
            }
          }
        } catch (err) {
          // ignore fetch error, use defaults
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }, [organizationId, token]);

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setThreshold(Number(e.target.value));
      setSuccess(null);
      setError(null);
    };

    const handleSubmit = async () => {
      setLoading(true);
      setSuccess(null);
      setError(null);
      try {
        if (!threshold || threshold <= 0) throw new Error("Please enter a valid threshold amount");
        const url = getFullUrl(`/admin/wallet_alert_settings?organization_id=${organizationId}&token=${token}`);
        const payload = {
          organization_id: Number(organizationId),
          alert_enabled: alertEnabled ? "true" : "false",
          super_admin_threshold: threshold,
          super_admin_emails: emails,
        };
        const response = await fetch(url, {
          method: "PATCH",
          mode: "cors",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthHeader(),
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to update alert settings (${response.status})`);
        }
        setSuccess("Alert settings updated successfully");
      } catch (err: any) {
        setError(err.message || "Failed to update alert settings");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="mb-6">
        {/* <Card className="border-[#e5e1d8] shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-[#C72030]">Threshold Alerts</span>
                  <span className="text-xs text-gray-500">Get notified when balance is low</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">{alertEnabled ? "Active" : "Inactive"}</span>
                <div className="relative inline-block w-10 align-middle select-none">
                  <input
                    type="checkbox"
                    checked={alertEnabled}
                    onChange={() => { setAlertEnabled((v) => !v); setSuccess(null); setError(null); }}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    style={{ right: 0, top: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                  />
                  <span className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" />
                </div>
              </div>
            </div>
            {success && (
              <Alert className="bg-green-50 border-green-200 my-2">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert className="bg-red-50 border-red-200 my-2">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            <div className="mb-4">
              <Label htmlFor="threshold" className="text-[#1a1a1a] flex items-center gap-1">
                Minimum Balance Threshold
                <span className="text-gray-400 cursor-pointer" title="Get notified when balance is low">&#9432;</span>
              </Label>
              <div className="mt-2">
                <div className="flex items-center border border-[#e5e1d8] rounded bg-white">
                  <span className="px-3 text-gray-500 text-lg">₹</span>
                  <input
                    type="number"
                    id="threshold"
                    name="threshold"
                    className="flex-1 py-2 px-2 text-lg outline-none bg-transparent border-0 focus:ring-0"
                    value={threshold}
                    min={1}
                    onChange={handleThresholdChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="bg-[#ede8df] rounded p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#C72030] mr-2" />
                <div>
                  <span className="font-semibold text-[#C72030]">Alert Recipients</span>
                  <div className="text-sm text-[#1a1a1a] mt-1">{emails}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-[#C72030] hover:bg-[#A01828] text-white px-8 py-2 text-base font-semibold rounded shadow-none"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Submit"}
              </Button>
            </div>
          </CardContent>
        </Card> */}
      </div>
    );
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://${localStorage.getItem('baseUrl')}/organization_wallet/export_transactions.json?organization_id=${selectedOrgId}&range=${txTimeRange}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "orders_transactions.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
      toast.error("Failed to export users")
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-[#DBC2A9]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              Wallet Management
            </h1>
            <p className="text-sm text-[#666666]">
              View wallet balance and manage top-ups
            </p>
          </div>
        </div>

        {/* Organization Selection */}
        <Card className="border-[#e5e1d8] mb-6">
          <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8]">
            <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
              <Wallet className="h-5 w-5" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label htmlFor="organization_select" className="text-[#1a1a1a]">
                Organization <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedOrgId}
                onValueChange={(value) => {
                  setSelectedOrgId(value);
                  setError(null);
                  setSuccess(null);
                }}
                disabled={loadingOrgs}
              >
                <SelectTrigger className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030]">
                  <SelectValue
                    placeholder={
                      loadingOrgs ? "Loading..." : "Select organization"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingOrgs ? (
                    <SelectItem value="loading" disabled>
                      Loading organizations...
                    </SelectItem>
                  ) : organizations.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No organizations found
                    </SelectItem>
                  ) : (
                    organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Threshold Alert Card - only show if org selected */}
        {selectedOrgId && (
          <ThresholdAlertCard
            organizationId={selectedOrgId}
            token={token}
          />
        )}

        {selectedOrgId && walletData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* ...existing code... */}
            <Card className="border-[#e5e1d8] bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Credited</p>
                    <p className="text-2xl font-bold text-green-700">
                      ₹{new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(walletData.credited_amount || 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e1d8] bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Debited</p>
                    <p className="text-2xl font-bold text-red-700">
                      ₹{new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(walletData.debited_amount || 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#e5e1d8] bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ₹{new Intl.NumberFormat("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(walletData.available_amount || 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions Table */}
        {selectedOrgId && (
          <Card className="border-[#e5e1d8] mb-6">
            <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8] pb-0">
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
                  Transaction History
                </CardTitle>
                <Select
                  value={txTimeRange}
                  onValueChange={(val) => {
                    setTxTimeRange(val);
                    setTxCurrentPage(1);
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
            </CardHeader>
            <CardContent className="p-6">
              <EnhancedTable
                data={transactions}
                columns={transactionColumns}
                renderCell={renderTransactionCell}
                loading={loadingTransactions}
                loadingMessage="Loading transactions..."
                emptyMessage="No transactions found"
                enableExport={true}
                handleExport={handleExport}
                enableGlobalSearch={true}
                hideTableSearch={false}
                hideTableExport={false}
                hideColumnsButton={false}
              />
              {txTotalPages > 1 && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handleTxPageChange(Math.max(1, txCurrentPage - 1))}
                          className={txCurrentPage === 1 || loadingTransactions ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {renderTxPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handleTxPageChange(Math.min(txTotalPages, txCurrentPage + 1))}
                          className={txCurrentPage === txTotalPages || loadingTransactions ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-sm text-gray-600">
                    Showing page {txCurrentPage} of {txTotalPages} ({txTotalCount} total transactions)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top-up Form */}
        {selectedOrgId && (
          <Card className="border-[#e5e1d8]">
            <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8]">
              <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
                <Wallet className="h-5 w-5" />
                Add Wallet Credit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Alert */}
                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[#1a1a1a]">
                      Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      min="0.01"
                      step="0.01"
                      className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030]"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="space-y-2">
                    <Label htmlFor="remarks" className="text-[#1a1a1a]">
                      Remarks <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="remarks"
                      name="remarks"
                      placeholder="Enter remarks for this transaction"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      required
                      rows={1}
                      className="border-[#e5e1d8] focus:border-[#C72030] focus:ring-[#C72030] resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#C72030] hover:bg-[#A01828] text-white"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing...
                      </>
                    ) : (
                      "Top Up"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WalletTopup;