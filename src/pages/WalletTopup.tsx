import React, { useState, useEffect } from "react";
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

interface WalletData {
  id: number;
  credited_amount: number;
  debited_amount: number;
  available_amount: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  remarks: string;
  created_at: string;
}

const WalletTopup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    remarks: "",
  });
  const [organizations, setOrganizations] = useState<
    { id: number; name: string }[]
  >([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  const API_TOKEN = "QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ";
  const BASE_URL = "https://runwal-api.lockated.com";

  useEffect(() => {
    // Fetch organizations
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const response = await fetch(
          `${BASE_URL}/organizations.json?token=${API_TOKEN}`
        );
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

  // Fetch wallet data and transactions when organization is selected
  useEffect(() => {
    if (!selectedOrgId) {
      setWalletData(null);
      setTransactions([]);
      return;
    }

    const fetchWalletData = async () => {
      setLoadingTransactions(true);
      try {
        const response = await fetch(
          `${BASE_URL}/organization_wallet/transactions?organization_id=${selectedOrgId}&token=${API_TOKEN}`
        );
        if (!response.ok) throw new Error("Failed to fetch wallet data");
        const data = await response.json();
        setWalletData(data.wallet || null);
        setTransactions(data.transactions || []);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
        setWalletData(null);
        setTransactions([]);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchWalletData();
  }, [selectedOrgId]);

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

      const response = await fetch(
        `${BASE_URL}/organization_wallet/credit?token=${API_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organization_id: organizationId,
            amount: amount,
            remarks: formData.remarks.trim(),
          }),
        }
      );

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

      // Refresh wallet data
      const walletResponse = await fetch(
        `${BASE_URL}/organization_wallet/transactions?organization_id=${selectedOrgId}&token=${API_TOKEN}`
      );
      const walletData = await walletResponse.json();
      setWalletData(walletData.wallet || null);
      setTransactions(walletData.transactions || []);
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
            className={`px-2 py-1 rounded text-xs font-medium ${
              item.transaction_type === "credit"
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
            className={`font-semibold ${
              item.transaction_type === "credit"
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

        {/* Wallet Balance Cards */}
        {selectedOrgId && walletData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-[#e5e1d8] bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Credited</p>
                    <p className="text-2xl font-bold text-green-700">
                      ₹{(walletData.credited_amount || 0).toFixed(2)}
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
                      ₹{(walletData.debited_amount || 0).toFixed(2)}
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
                      ₹{(walletData.available_amount || 0).toFixed(2)}
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
            <CardHeader className="bg-gradient-to-r from-[#f6f4ee] to-[#e5e1d8]">
              <CardTitle className="flex items-center gap-2 text-[#1a1a1a]">
                Transaction History
              </CardTitle>
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
                enableGlobalSearch={true}
                hideTableSearch={false}
                hideTableExport={false}
                hideColumnsButton={false}
              />
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
