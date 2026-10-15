import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import {
    Settings,
    User,
    CreditCard,
    IdCard,
    Eye,
    Gift,
    Banknote,
    Plus,
    Download,
    ArrowLeft,
    ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFullUrl, getAuthHeader, API_CONFIG } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
import SelectBox from "@/components/ui/select-box";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";

// Section card styling, matched to the Facility Setup add / details pages
const SECTION_CARD =
    "w-full bg-white border border-[rgba(26,26,24,0.09)] rounded-2xl px-6 py-[22px] space-y-5";
const FIELD_LABEL = "text-[11px] font-medium text-[rgba(26,26,24,0.48)]";
const FIELD_VALUE = "text-[13.5px] font-medium text-[#1A1A18]";

const SectionHeader = ({
    icon,
    title,
    action,
}: {
    icon: React.ReactElement;
    title: string;
    action?: React.ReactNode;
}) => (
    <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-none rounded-full flex items-center justify-center bg-[#F5F4F0] text-[#1A1A18]">
                {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
            </div>
            <h3 className="text-sm font-semibold text-[#1A1A18]">{title}</h3>
        </div>
        {action}
    </div>
);

const renderStatusValue = (value?: string) =>
    value ? (
        <StatusBadge status={value} className="rounded-full w-fit">
            {value}
        </StatusBadge>
    ) : (
        <span className={FIELD_VALUE}>-</span>
    );

const LoyaltyCustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

    // API data for customer details and transactions
    const [customerData, setCustomerData] = useState<any | null>(null);
    const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    // Credit Wallet Dialog State
    const [creditDialogOpen, setCreditDialogOpen] = useState(false);
    const [creditAmount, setCreditAmount] = useState("");
    const [creditRemarks, setCreditRemarks] = useState("");
    const [creditPaymentMode, setCreditPaymentMode] = useState("cash");
    const [creditLoading, setCreditLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Mock data for Vouchers
    const vouchers = [
        {
            id: 1,
            date: "12/02/2025",
            voucherCode: "VCH001",
            voucherType: "Discount",
            description: "Hotel stay 20% Off",
            pointsRedeemed: "9000",
            status: "Active",
        },
        {
            id: 2,
            date: "20/02/2025",
            voucherCode: "VCH003",
            voucherType: "Cashback",
            description: "F&B Cashback",
            pointsRedeemed: "6000",
            status: "Used",
        },
        {
            id: 3,
            date: "02/05/2025",
            voucherCode: "VCH980",
            voucherType: "Discount",
            description: "Spa services 15% Off",
            pointsRedeemed: "2000",
            status: "Expired",
        },
        {
            id: 4,
            date: "30/01/2026",
            voucherCode: "VCH778",
            voucherType: "Complimentary",
            description: "Free Breakfast at Nizam Darbar",
            pointsRedeemed: "1000",
            status: "Used",
        },
    ];

    // Mock data for Encashment
    const encashments = [
        {
            id: 1,
            date: "12/02/2025",
            amount: "₹8000",
            pointsUsed: "8000",
            accountDetails: "****43215",
            status: "Completed",
        },
        {
            id: 2,
            date: "20/02/2025",
            amount: "₹4000",
            pointsUsed: "4000",
            accountDetails: "****43215",
            status: "Processing",
        },
        {
            id: 3,
            date: "02/05/2025",
            amount: "₹1000",
            pointsUsed: "1000",
            accountDetails: "****43215",
            status: "Completed",
        },
        {
            id: 4,
            date: "30/01/2026",
            amount: "₹500",
            pointsUsed: "500",
            accountDetails: "****43215",
            status: "Completed",
        },
    ];

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchDetails = async () => {
            try {
                const token = API_CONFIG.TOKEN || "";
                const url = getFullUrl(`/loyalty/members/${id}?token=${token}`);
                const res = await fetch(url, { headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" } });
                const data = await res.json();
                // Calculate dynamic duration
                let duration = "-";
                if (data.joining_date) {
                    const joinDate = new Date(data.joining_date);
                    const now = new Date();
                    const diffMs = now.getTime() - joinDate.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    duration = `${diffDays} days`;
                }
                setCustomerData({
                    id: data.id,
                    user_id: data.customer_code,
                    customer_code: data.customer_code,
                    fullName: `${data.firstname || ""} ${data.lasttname || ""}`.trim(),
                    email: data.email || "-",
                    phoneNo: data.mobile || "-",
                    gender: data.gender || "-",
                    address: data.address || "-",
                    joiningDate: data.joining_date || "-",
                    lastSignIn: data.last_sign_in || undefined,
                    duration,
                    active: data.active ? "Active" : "Inactive",
                    currentLoyaltyPoints: data.current_loyalty_points ?? "-",
                    earnedPoints: data.earned_percentage ?? "-",
                    redeemedPoints: data.reedem_percentage ?? "-",
                    earned_amount: data.earned_amount ?? "-",
                    reedem_amount: data.reedem_amount ?? "-",
                    available_balance: data.available_balance ?? "-",
                    tierProgress: data.member_status?.tier_progression ?? "-",
                    tierLevel: data.member_status?.tier_level ?? "-",
                    tierValidity: data.tier_validity ?? "-",
                    walletAvailableBalance: data.available_balance ?? "-",
                });
                setWalletTransactions(
                    Array.isArray(data.wallet_transactions)
                        ? data.wallet_transactions.map((t: any, idx: number) => ({
                            id: t.id || idx,
                            transactionType: t.transaction_type || "-",
                            resource_type: t.resource_type || "-",
                            created_at: t.created_at || "-",
                            amount: t.amount ?? "-",
                            remaining_points: t.remaining_points ?? "-",
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
                            item_name: o.item_name ?? "-",
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

    const handleCreditWallet = async () => {
        if (!creditAmount || parseFloat(creditAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (!creditRemarks.trim()) {
            toast.error("Please enter remarks");
            return;
        }
        if (!customerData?.customer_code) {
            toast.error("Customer code not available for this member");
            return;
        }

        setCreditLoading(true);
        try {
            const token = API_CONFIG.TOKEN || "";
            const url = getFullUrl(`/loyalty/members/credit_wallet.json?token=${token}`);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: getAuthHeader(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customer_code: customerData?.customer_code,
                    amount: parseFloat(creditAmount),
                    remarks: creditRemarks.trim(),
                    payment_mode: creditPaymentMode,
                    topup_by: "admin",
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Wallet credited successfully");
                setCreditDialogOpen(false);
                setCreditAmount("");
                setCreditRemarks("");
                setCreditPaymentMode("cash");
                // Refresh customer data
                window.location.reload();
            } else {
                toast.error(result.message || "Failed to credit wallet");
            }
        } catch (error) {
            console.error("Error crediting wallet:", error);
            toast.error("Failed to credit wallet. Please try again.");
        } finally {
            setCreditLoading(false);
        }
    };

    const handleExportTransactions = async () => {
        if (!id) {
            toast.error("Member ID not available");
            return;
        }

        setExportLoading(true);
        try {
            const token = API_CONFIG.TOKEN || "";
            const url = getFullUrl(`/loyalty/members/${id}/export_transactions.xlsx?token=${token}`);
            const response = await fetch(url, {
                headers: { Authorization: getAuthHeader() },
            });

            if (!response.ok) {
                throw new Error("Failed to export transactions");
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.setAttribute("download", `wallet_transactions_${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error exporting wallet transactions:", error);
            toast.error("Failed to export transactions. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const toggleFieldExpansion = (fieldKey: string) => {
        setExpandedFields((prev) => {
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
            <div className="flex flex-col gap-1 min-w-0">
                <div className={FIELD_LABEL}>{label}</div>
                <div
                    className={`${FIELD_VALUE} min-w-0 ${!isExpanded && hasLongValue
                        ? "truncate"
                        : "break-all whitespace-normal"
                        } ${hasLongValue ? "cursor-pointer hover:text-[#C72030] transition-colors" : ""}`}
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
        { key: "id", label: "Reference ID", sortable: true },
        { key: "transactionType", label: "Type", sortable: true },
        { key: "resourceType", label: "Resource Type", sortable: false },
        { key: "amount", label: "Points", sortable: true },
        { key: "remaining_points", label: "Available Points", sortable: true },
        { key: "createdAt", label: "Date", sortable: true },
        { key: "remarks", label: "Remarks", sortable: false },
    ];

    // Orders Table Columns
    const ordersColumns = [
        { key: "actions", label: "Actions", sortable: false },
        { key: "orderNumber", label: "Order Number", sortable: true },
        { key: "item_name", label: "Item Name", sortable: true },
        { key: "totalAmount", label: "Total Amount", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "createdAt", label: "Created At", sortable: true },
    ];

    // Vouchers Table Columns
    const voucherColumns = [
        { key: "date", label: "Date", sortable: true },
        { key: "voucherCode", label: "Voucher Code", sortable: true },
        { key: "voucherType", label: "Voucher Type", sortable: true },
        { key: "description", label: "Description", sortable: true },
        { key: "pointsRedeemed", label: "Points Redeemed", sortable: true },
        { key: "status", label: "Status", sortable: true },
    ];

    // Encashment Table Columns
    const encashmentColumns = [
        { key: "date", label: "Date", sortable: true },
        { key: "amount", label: "Amount (INR)", sortable: true },
        { key: "pointsUsed", label: "Points Used", sortable: true },
        { key: "accountDetails", label: "Account Details", sortable: false },
        { key: "status", label: "Status", sortable: true },
    ];

    // Renderers
    const renderWalletTransactionCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "id":
                return <span>{item.id}</span>;
            case "transactionType": {
                const type = item.transactionType?.toLowerCase();
                let color = "";
                if (type === "debit") color = "text-red-600 font-medium";
                if (type === "credit") color = "text-green-600 font-medium";
                // return <span className={color}>{item.transactionType}</span>;
                return <span className={color}>{item.transactionType?.charAt(0).toUpperCase() + item.transactionType?.slice(1).toLowerCase()}</span>;
            }
            case "resourceType":
                return <span>{item.resource_type || "-"}</span>;
            case "createdAt":
                if (!item.created_at) return "-";
                const d = new Date(item.created_at);
                return <span>{isNaN(d.getTime()) ? item.created_at : d.toLocaleString()}</span>;
            case "amount":
                return <span>{item.amount}</span>;
            case "remaining_points":
                return <span>{item.remaining_points}</span>;
            case "remarks":
                return <span>{item.remarks}</span>;
            default:
                return null;
        }
    };

    const renderEncashmentCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "status": {
                let badgeClass = "px-3 py-1 rounded-md text-xs font-medium";
                if (item.status === "Completed") {
                    badgeClass += " bg-[#D1FADF] text-[#027A48]"; // Greenish
                } else if (item.status === "Processing") {
                    badgeClass += " bg-[#FEF0C7] text-[#B54708]"; // Yellowish
                }
                return <span className={badgeClass}>{item.status}</span>;
            }
            default:
                return <span>{item[columnKey]}</span>;
        }
    };

    const renderVoucherCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "status": {
                let badgeClass = "px-3 py-1 rounded-md text-xs font-medium";
                if (item.status === "Active") {
                    badgeClass += " bg-[#D1FADF] text-[#027A48]"; // Greenish
                } else if (item.status === "Used") {
                    badgeClass += " bg-[#FECDCA] text-[#B42318]"; // Reddish/Pink
                } else if (item.status === "Expired") {
                    badgeClass += " bg-[#F2F4F7] text-[#344054]"; // Grey
                }
                return <span className={badgeClass}>{item.status}</span>;
            }
            case "pointsRedeemed":
                return (
                    <span className="font-semibold text-gray-700">
                        {item.pointsRedeemed}
                    </span>
                );
            default:
                return <span>{item[columnKey]}</span>;
        }
    };

    const renderOrderCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "orderNumber":
                return <span>{item.orderNumber}</span>;
            case "item_name":
                return <span>{item.item_name}</span>;
            case "totalAmount":
                return <span>₹{parseFloat(item.totalAmount || 0).toFixed(2)}</span>;
            case "status":
                return <span>{item.status}</span>;
            case "createdAt": {
                const dateVal = item.createdAt || item.created_at || "";
                if (!dateVal) return <span>-</span>;
                const parsed = new Date(dateVal);
                if (isNaN(parsed.getTime())) return <span>{dateVal}</span>;
                const dd = String(parsed.getDate()).padStart(2, "0");
                const mm = String(parsed.getMonth() + 1).padStart(2, "0");
                const yyyy = parsed.getFullYear();
                return <span>{`${dd}-${mm}-${yyyy}`}</span>;
            }
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
                return item[columnKey] || "-";
        }
    };

    return (
        <div className="p-6 space-y-6 bg-[#FDFDFB] min-h-screen">
            {/* Breadcrumb */}
            <div>
                <div className="flex items-center gap-2 text-[13px] font-medium mb-3 text-[rgba(26,26,24,0.48)]">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span>Customers</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-semibold text-[#1A1A18]">Details</span>
                </div>
                <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                    {customerData?.fullName || "Customer Details"}
                </h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Points Earned"
                    value={
                        customerData?.earnedPoints ?? customerData?.earnedPoints ?? "-"
                    }
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
                    value={
                        customerData?.redeemedPoints ?? customerData?.redeemedPoints ?? "-"
                    }
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
                    value={customerData?.walletAvailableBalance ?? "-"}
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
                    title="Wallet Available Balance"
                    value={customerData?.walletAvailableBalance ?? "-"}
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

            {/* Credit Wallet Button */}
            <div className="flex justify-end">
                <Button
                    onClick={() => setCreditDialogOpen(true)}
                    className="btn-primary h-9 px-4 text-sm font-medium flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Credit Wallet
                </Button>
            </div>

            {/* Personal Details Card (Always visible) */}
            <div className={SECTION_CARD}>
                <SectionHeader icon={<User />} title="Personal Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                    {renderField("Full Name", customerData?.fullName, "fullName")}
                    {renderField("Email", customerData?.email, "email")}
                    {renderField("Phone No", customerData?.phoneNo, "phoneNo")}
                    {renderField("Gender", customerData?.gender, "gender")}
                    {renderField(
                        "Joining Date",
                        customerData?.joiningDate,
                        "joiningDate"
                    )}
                    {/* Hide Last Sign In if not present */}
                    {customerData?.lastSignIn &&
                        renderField(
                            "Last Sign In",
                            customerData.lastSignIn,
                            "lastSignIn"
                        )}
                    {renderField("Duration", customerData?.duration, "duration")}
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className={FIELD_LABEL}>Status</span>
                        {renderStatusValue(customerData?.active)}
                    </div>
                </div>
            </div>

            {/* Tabs UI */}
            <Tabs defaultValue="tier-status" className="w-full">
                <TabsList className="bg-white border border-gray-200">
                    <TabsTrigger
                        value="tier-status"
                        className="font-semibold"
                    >
                        Tier Status
                    </TabsTrigger>
                    <TabsTrigger
                        value="transactions"
                        className="font-semibold"
                    >
                        Transactions
                    </TabsTrigger>
                    <TabsTrigger
                        value="orders"
                        className="font-semibold"
                    >
                        Orders
                    </TabsTrigger>
                </TabsList>

                {/* Tier Status Tab */}
                <TabsContent value="tier-status" className="mt-6">
                    <div className={SECTION_CARD}>
                        <SectionHeader icon={<IdCard />} title="Tier Status" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
                            <div className="flex flex-col gap-1">
                                <span className={FIELD_LABEL}>Enrolled Date</span>
                                <span className={FIELD_VALUE}>
                                    {customerData?.joiningDate ?? "-"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className={FIELD_LABEL}>Tier Level</span>
                                <span className={`${FIELD_VALUE} flex items-center gap-1`}>
                                    {customerData?.tierLevel ?? "-"}
                                    {customerData?.tierLevel?.toLowerCase() === "gold" && (
                                        <span title="Gold">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                            >
                                                <circle cx="10" cy="10" r="10" fill="#FFD700" />
                                                <path
                                                    d="M10 5l1.902 3.854 4.264.62-3.083 3.006.728 4.247L10 14.02l-3.811 2.007.728-4.247-3.083-3.006 4.264-.62L10 5z"
                                                    fill="#FFF7B2"
                                                />
                                            </svg>
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className={FIELD_LABEL}>Membership Duration</span>
                                <span className={FIELD_VALUE}>
                                    {customerData?.duration ?? "-"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className={FIELD_LABEL}>Account Status</span>
                                {renderStatusValue(customerData?.active)}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-6">
                    <div className={SECTION_CARD}>
                        <SectionHeader
                            icon={<Settings />}
                            title="Wallet Transactions"
                            action={
                                <button
                                    type="button"
                                    onClick={handleExportTransactions}
                                    disabled={exportLoading}
                                    className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium text-[#1A1A18] bg-white border border-[rgba(26,26,24,0.12)] rounded-[10px] hover:bg-[#F5F4F0] transition-colors disabled:opacity-60"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    {exportLoading ? "Exporting..." : "Export"}
                                </button>
                            }
                        />
                        <EnhancedTable
                            storageKey="loyalty-customer-details-table"
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
                </TabsContent>

                <TabsContent value="orders" className="mt-6">
                    <div className={SECTION_CARD}>
                        <SectionHeader icon={<Settings />} title="Orders" />
                        <EnhancedTable
                            storageKey="loyalty-customer-details-table-2"
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
                </TabsContent>

                {/* Vouchers Tab */}
                <TabsContent value="vouchers" className="mt-6">
                    <div className={SECTION_CARD}>
                        <SectionHeader icon={<Gift />} title="Vouchers" />
                        <EnhancedTable
                            storageKey="loyalty-customer-details-table-3"
                            data={vouchers}
                            columns={voucherColumns}
                            renderCell={renderVoucherCell}
                            enableExport={false}
                            enableGlobalSearch={false}
                            hideTableSearch={true}
                            hideTableExport={true}
                            hideColumnsButton={true}
                            loading={false}
                            loadingMessage="Loading vouchers..."
                            emptyMessage="No vouchers found"
                        />
                    </div>
                </TabsContent>

                {/* Encashment Tab */}
                <TabsContent value="encashment" className="mt-6">
                    <div className={SECTION_CARD}>
                        <SectionHeader icon={<Banknote />} title="Encashment Details" />
                        <EnhancedTable
                            storageKey="loyalty-customer-details-table-4"
                            data={encashments}
                            columns={encashmentColumns}
                            renderCell={renderEncashmentCell}
                            enableExport={false}
                            enableGlobalSearch={false}
                            hideTableSearch={true}
                            hideTableExport={true}
                            hideColumnsButton={true}
                            loading={false}
                            loadingMessage="Loading encashment details..."
                            emptyMessage="No encashment details found"
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Credit Wallet Dialog */}
            <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Credit Wallet
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Customer Code
                            </label>
                            <input
                                type="text"
                                value={customerData?.user_id || customerData?.id || id || ""}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                placeholder="Enter amount"
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Mode <span className="text-red-500">*</span>
                            </label>
                            <SelectBox
                                options={[
                                    { value: "cash", label: "Cash" },
                                    { value: "online", label: "Online" },
                                    { value: "bank_transfer", label: "Bank Transfer" },
                                    { value: "upi", label: "UPI" },
                                ]}
                                defaultValue={creditPaymentMode}
                                onChange={(value: string) => setCreditPaymentMode(value)}
                                menuPortalTarget={undefined}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Remarks <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={creditRemarks}
                                onChange={(e) => setCreditRemarks(e.target.value)}
                                placeholder="Enter remarks"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="btn-cancel h-9 px-4 text-sm font-medium"
                            onClick={() => {
                                setCreditDialogOpen(false);
                                setCreditAmount("");
                                setCreditRemarks("");
                                setCreditPaymentMode("cash");
                            }}
                            disabled={creditLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreditWallet}
                            disabled={creditLoading}
                            className="btn-primary h-9 px-4 text-sm font-medium"
                        >
                            {creditLoading ? "Crediting..." : "Credit Points"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export { LoyaltyCustomerDetails };
