import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Settings, User, CreditCard, IdCard, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LoyaltyCustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

    // API data for customer details and transactions
    const [customerData, setCustomerData] = useState<any | null>(null);
    const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchDetails = async () => {
            try {
                const url = `https://runwal-api.lockated.com/loyalty/members/${id}?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`;
                const res = await fetch(url);
                const data = await res.json();
                setCustomerData({
                    id: data.id,
                    fullName: `${data.firstname || ""} ${data.lasttname || ""}`.trim(),
                    email: data.email || "-",
                    phoneNo: data.mobile || "-",
                    gender: data.gender || "-",
                    address: data.address || "-",
                    joiningDate: data.joining_date || "-",
                    lastSignIn: data.last_sign_in || "-",
                    duration: data.duration || "-",
                    active: data.active ? "Active" : "Inactive",
                    currentLoyaltyPoints: data.current_loyalty_points ?? "-",
                    earnedPoints: data.earned_points ?? "-",
                    redeemedPoints: data.reedem_points ?? "-",
                    tierProgress: data.member_status?.tier_progression ?? "-",
                    tierLevel: data.member_status?.tier_level ?? "-",
                    tierValidity: data.tier_validity ?? "-",
                });
                setWalletTransactions(
                    Array.isArray(data.wallet_transactions)
                        ? data.wallet_transactions.map((t: any, idx: number) => ({
                              id: t.id || idx,
                              transactionType: t.transaction_type || "-",
                              amount: t.amount ?? "-",
                              remarks: t.remarks || "-",
                          }))
                        : []
                );
                setOrders(
                    Array.isArray(data.orders)
                        ? data.orders.map((o: any) => ({
                              id: o.id, // This is the order ID (e.g., 41)
                              orderNumber: o.order_number || "-", // This is the order number (e.g., "ORD20260202145820C526B9")
                              totalAmount: o.total_amount ?? "-",
                              status: o.status || "-",
                              createdAt: o.created_at || "-",
                          }))
                        : []
                );
            } catch (e) {
                setCustomerData(null);
                setWalletTransactions([]);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const toggleFieldExpansion = (fieldKey: string) => {
        setExpandedFields(prev => {
            const next = new Set(prev);
            if (next.has(fieldKey)) {
                next.delete(fieldKey);
            } else {
                next.add(fieldKey);
            }
            return next;
        });
    };

    const renderField = (label: string, value: string, fieldKey: string) => {
        const isExpanded = expandedFields.has(fieldKey);
        const hasLongValue = value && value.length > 20;

        return (
            <div className="flex items-start gap-2 min-w-0">
                <div className="w-[120px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                    {label}
                </div>
                <div
                    className={`text-[14px] font-semibold text-gray-900 flex-1 min-w-0 ${
                        !isExpanded && hasLongValue
                            ? 'truncate'
                            : 'break-all whitespace-normal'
                    } ${hasLongValue ? 'cursor-pointer hover:text-[#C72030] transition-colors' : ''}`}
                    onClick={() => hasLongValue && toggleFieldExpansion(fieldKey)}
                    title={hasLongValue && !isExpanded ? value : undefined}
                >
                    {value || "-"}
                    {hasLongValue && !isExpanded && (
                        <span className="text-[#C72030] ml-1">...</span>
                    )}
                </div>
            </div>
        );
    };

    // Wallet Transactions Table Columns
    const walletTransactionColumns = [
        { key: "transactionType", label: "Type", sortable: true },
        { key: "amount", label: "Amount", sortable: true },
        { key: "remarks", label: "Remarks", sortable: false },
    ];

    // Orders Table Columns
    const ordersColumns = [
        { key: "actions", label: "Actions", sortable: false },
        { key: "orderNumber", label: "Order Number", sortable: true },
        { key: "totalAmount", label: "Total Amount", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "createdAt", label: "Created At", sortable: true },
    ];

    // Renderers
    const renderWalletTransactionCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "transactionType":
                return <span>{item.transactionType}</span>;
            case "amount":
                return <span>{item.amount}</span>;
            case "remarks":
                return <span>{item.remarks}</span>;
            default:
                return null;
        }
    };

    const renderOrderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "orderNumber":
                return <span>{item.orderNumber}</span>;
            case "totalAmount":
                return <span>₹{parseFloat(item.totalAmount || 0).toFixed(2)}</span>;
            case "status":
                return <span>{item.status}</span>;
            case "createdAt":
                return <span>{item.createdAt}</span>;
            case "actions":
                return (
                    <button
                        onClick={() => navigate(`/loyalty/orders/${item.id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Order Details"
                    >
                        <Eye className="w-5 h-5" />
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-600 mb-4">
                Loyalty &gt; Customers &gt; Details
            </div>

            {/* Personal Details Card (Always visible) */}
            <div className="w-full bg-white rounded-lg shadow-sm border mb-4">
                <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                            <User className="w-5 h-5 text-[#C72030]" />
                        </div>
                        <h3 className="text-lg font-semibold uppercase text-black">
                            Personal Details
                        </h3>
                    </div>
                </div>
                <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
                        {renderField("Full Name", customerData?.fullName, "fullName")}
                        {renderField("Email", customerData?.email, "email")}
                        {renderField("Phone No", customerData?.phoneNo, "phoneNo")}
                        {renderField("Gender", customerData?.gender, "gender")}
                        {renderField("Joining Date", customerData?.joiningDate, "joiningDate")}
                        {renderField("Last Sign In", customerData?.lastSignIn, "lastSignIn")}
                        {renderField("Duration", customerData?.duration, "duration")}
                        {renderField("Status", customerData?.active, "active")}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <StatsCard
                    title="Total Points Earned"
                    value={customerData?.earnedPoints ?? "-"}
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
                    title="Total Points Redeemed"
                    value={customerData?.redeemedPoints ?? "-"}
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
                />
                <StatsCard
                    title="Current Points"
                    value={customerData?.currentLoyaltyPoints ?? "-"}
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

            {/* Tabs UI */}
            <Tabs defaultValue="tier-status" className="w-full mt-6">
                <TabsList className="bg-[#f6f4ee] p-1 h-auto w-full flex justify-between">
                    <TabsTrigger
                        value="tier-status"
                        className="flex-1 text-center data-[state=active]:bg-white data-[state=active]:text-[#C72030] px-6 py-2"
                    >
                        Tier Status
                    </TabsTrigger>
                    <TabsTrigger
                        value="transactions"
                        className="flex-1 text-center data-[state=active]:bg-white data-[state=active]:text-[#C72030] px-6 py-2"
                    >
                        Transactions
                    </TabsTrigger>
                    <TabsTrigger
                        value="orders"
                        className="flex-1 text-center data-[state=active]:bg-white data-[state=active]:text-[#C72030] px-6 py-2"
                    >
                        Orders
                    </TabsTrigger>
                </TabsList>

                {/* Tier Status Tab */}
                <TabsContent value="tier-status" className="space-y-6 mt-6">
                    <div className="w-full bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between gap-3 bg-[#FAF7F1] py-3 px-4 border border-[#ECE9E2]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F3EBDD]">
                                    <IdCard className="w-5 h-5 text-[#C72030]" />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    Tier Status
                                </h3>
                            </div>
                        </div>
                        <div className="bg-[#FBFBFA] border border-t-0 border-[#ECE9E2] px-5 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
                                {/* Currently Loyalty Points */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Currently Loyalty Points</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {customerData?.currentLoyaltyPoints ?? "-"}
                                    </span>
                                </div>
                                {/* Enrolled Date */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Enrolled Date</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {customerData?.joiningDate ?? "-"}
                                    </span>
                                </div>
                                {/* Tier Progress */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Tier Progress</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {customerData?.tierProgress ?? "-"}
                                    </span>
                                </div>
                                {/* Tier Level */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Tier Level</span>
                                    <span className="font-semibold text-[15px] text-gray-900 flex items-center gap-1">
                                        {customerData?.tierLevel ?? "-"}
                                        {customerData?.tierLevel?.toLowerCase() === "gold" && (
                                            <span title="Gold">
                                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                                    <circle cx="10" cy="10" r="10" fill="#FFD700"/>
                                                    <path d="M10 5l1.902 3.854 4.264.62-3.083 3.006.728 4.247L10 14.02l-3.811 2.007.728-4.247-3.083-3.006 4.264-.62L10 5z" fill="#FFF7B2"/>
                                                </svg>
                                            </span>
                                        )}
                                    </span>
                                </div>
                                {/* Membership Duration */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Membership Duration</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {customerData?.duration ?? "-"}
                                    </span>
                                </div>
                                {/* Expiry Points */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Expiry Points</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {customerData?.expiryPoints ?? "-"}
                                    </span>
                                </div>
                                {/* Account Status */}
                                <div className="flex flex-col">
                                    <span className="text-gray-500 text-[14px]">Account Status</span>
                                    <span className="font-semibold text-[15px] text-gray-900">
                                        {customerData?.active ?? "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-6">
                    <div className="w-full bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between gap-3 bg-[#FAF7F1] py-3 px-4 border border-[#ECE9E2]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F3EBDD]">
                                    <Settings className="w-5 h-5 text-[#C72030]" />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    Wallet Transactions
                                </h3>
                            </div>
                        </div>
                        <div className="bg-[#FBFBFA]">
                            <EnhancedTable
                                data={walletTransactions}
                                columns={walletTransactionColumns}
                                renderCell={renderWalletTransactionCell}
                                enableExport={false}
                                enableGlobalSearch={false}
                                hideTableSearch={true}
                                hideTableExport={true}
                                hideColumnsButton={true}
                                loading={loading}
                                loadingMessage="Loading transactions..."
                                emptyMessage="No transactions found"
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-6">
                    <div className="w-full bg-white rounded-lg shadow-sm border">
                        <div className="flex items-center justify-between gap-3 bg-[#FAF7F1] py-3 px-4 border border-[#ECE9E2]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F3EBDD]">
                                    <Settings className="w-5 h-5 text-[#C72030]" />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    Orders
                                </h3>
                            </div>
                        </div>
                        <div className="bg-[#FBFBFA]">
                            <EnhancedTable
                                data={orders}
                                columns={ordersColumns}
                                renderCell={renderOrderCell}
                                enableExport={false}
                                enableGlobalSearch={false}
                                hideTableSearch={true}
                                hideTableExport={true}
                                hideColumnsButton={true}
                                loading={loading}
                                loadingMessage="Loading orders..."
                                emptyMessage="No orders found"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export { LoyaltyCustomerDetails };
