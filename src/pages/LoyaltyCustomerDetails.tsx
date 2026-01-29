import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Settings, User, CreditCard } from "lucide-react";
import { getFullUrl } from "@/config/apiConfig";

const LoyaltyCustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // API data for customer details and transactions
    const [customerData, setCustomerData] = useState<any | null>(null);
    const [transactionData, setTransactionData] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        const fetchDetails = async () => {
            try {
                const url = getFullUrl(`/loyalty/members/${id}?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`);
                const res = await fetch(url);
                const data = await res.json();
                setCustomerData({
                    id: data.id,
                    fullName: `${data.firstname || ""} ${data.lasttname || ""}`.trim(),
                    email: data.email || "-",
                    phoneNo: data.mobile || "-",
                    address: data.address || "-",
                    startingLoyaltyPoints: data.starting_loyalty_points || "-",
                    tierProgress: data.member_status?.tier_progression || "-",
                    membershipStatus: data.member_status?.tier_level || "-",
                    interestStatus: data.active ? "Active" : "Inactive",
                    totalPointsEarned: data.earned_points ?? "-",
                    totalPointsRedeemed: data.reedem_points ?? "-",
                    currentPoints: data.current_loyalty_points ?? "-",
                });
                setTransactionData(
                    Array.isArray(data.member_transactions)
                        ? data.member_transactions.map((t: any, idx: number) => ({
                              id: t.id || idx,
                              date: t.date || "-",
                              transactionDate: t.transaction_date || "-",
                              transactionType: t.transaction_type || "-",
                              transactionMode: t.transaction_mode || "-",
                              earnedPoints: t.earned_points ?? "-",
                              balancePoints: t.balance_points ?? "-",
                          }))
                        : []
                );
            } catch (e) {
                setCustomerData(null);
                setTransactionData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    // Define columns for transaction table
    const transactionColumns = [
        { key: "date", label: "Date", sortable: true },
        { key: "transactionDate", label: "Transaction Date", sortable: true },
        { key: "transactionType", label: "Transaction Type", sortable: true },
        { key: "transactionMode", label: "Transaction Mode", sortable: true },
        { key: "earnedPoints", label: "Earned Points", sortable: false },
        { key: "balancePoints", label: "Balance Points", sortable: false },
    ];

    const renderTransactionCell = (item: any, columnKey: string) => {
        switch (columnKey) {
            case "date":
                return <span>{item.date || "-"}</span>;
            case "transactionDate":
                return <span>{item.transactionDate || "-"}</span>;
            case "transactionType":
                return <span>{item.transactionType || "-"}</span>;
            case "transactionMode":
                return <span>{item.transactionMode || "-"}</span>;
            case "earnedPoints":
                return <span>{item.earnedPoints || "-"}</span>;
            case "balancePoints":
                return <span>{item.balancePoints || "-"}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-white min-h-screen">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-600 mb-4">
                Loyalty &gt; Customers &gt; Details
            </div>

            {/* Membership Content (was inside membership tab) */}
            <div className="space-y-6 mt-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatsCard
                        title="Total Points Earned"
                        value={customerData?.totalPointsEarned ?? "-"}
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
                        value={customerData?.totalPointsRedeemed ?? "-"}
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
                        value={customerData?.currentPoints ?? "-"}
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

                {/* Personal Details Card */}
                <div className="w-full bg-white rounded-lg shadow-sm border">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Full Name
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.fullName || "-"}
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Email
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.email || "-"}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Phone No
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.phoneNo || "-"}
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Address
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.address || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Membership Status Card */}
                <div className="w-full bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                                <CreditCard className="w-5 h-5 text-[#C72030]" />
                            </div>
                            <h3 className="text-lg font-semibold uppercase text-black">
                                Membership Status
                            </h3>
                        </div>
                    </div>
                    
                    <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8">
                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Starting Loyalty Points
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.startingLoyaltyPoints || "-"}
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Tier Progress
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.tierProgress || "-"}
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Membership Status
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.membershipStatus || "-"}
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                    Interest Status
                                </div>
                                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                    {customerData?.interestStatus || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Status Card */}
                <div className="w-full bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                                <Settings className="w-5 h-5 text-[#C72030]" />
                            </div>
                            <h3 className="text-lg font-semibold uppercase text-black">
                                Transaction Status
                            </h3>
                        </div>
                    </div>
                    
                    <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9]">
                        <EnhancedTable
                            data={transactionData}
                            columns={transactionColumns}
                            renderCell={renderTransactionCell}
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
            </div>
        </div>
    );
};

export { LoyaltyCustomerDetails };
