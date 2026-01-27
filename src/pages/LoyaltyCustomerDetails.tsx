 import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Settings, User, CreditCard } from "lucide-react";

export const LoyaltyCustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("membership");
    const [loading, setLoading] = useState(false);

    // Mock customer data
    const customerData = {
        id: id,
        fullName: "Sanjay Singhaniya",
        email: "sanjaysingh@tochhu.com",
        phoneNo: "9871098090",
        address: "-",
        startingLoyaltyPoints: "12500",
        tierProgress: "0%",
        membershipStatus: "N/A",
        interestStatus: "Active",
        totalPointsEarned: "1920",
        totalPointsRedeemed: "760",
        currentPoints: "240",
    };

    // Mock transaction data
    const transactionData = [
        {
            id: 1,
            date: "10/02/2024",
            transactionDate: "08/12/21",
            transactionType: "Credit",
            transactionMode: "Credit",
            earnedPoints: "-",
            balancePoints: "-",
        },
        {
            id: 2,
            date: "10/02/2024",
            transactionDate: "08/12/21",
            transactionType: "Credit",
            transactionMode: "Credit",
            earnedPoints: "-",
            balancePoints: "-",
        },
        {
            id: 3,
            date: "10/02/2024",
            transactionDate: "08/12/21",
            transactionType: "Credit",
            transactionMode: "Credit",
            earnedPoints: "-",
            balancePoints: "-",
        },
        {
            id: 4,
            date: "10/02/2024",
            transactionDate: "08/12/21",
            transactionType: "Credit",
            transactionMode: "Credit",
            earnedPoints: "-",
            balancePoints: "-",
        },
    ];

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

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#f6f4ee] p-1 h-auto w-full justify-start">
                    <TabsTrigger 
                        value="membership"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Membership
                    </TabsTrigger>
                    <TabsTrigger 
                        value="maintenance"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Maintenance
                    </TabsTrigger>
                    <TabsTrigger 
                        value="finance"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Finance
                    </TabsTrigger>
                    <TabsTrigger 
                        value="crm"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        CRM
                    </TabsTrigger>
                    <TabsTrigger 
                        value="utility"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Utility
                    </TabsTrigger>
                    <TabsTrigger 
                        value="visitors"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Visitors
                    </TabsTrigger>
                    <TabsTrigger 
                        value="experience"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Experience
                    </TabsTrigger>
                    <TabsTrigger 
                        value="property"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] px-6 py-2"
                    >
                        Property
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="membership" className="space-y-6 mt-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatsCard
                            title="Total Points Earned"
                            value={customerData.totalPointsEarned}
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
                        />
                        <StatsCard
                            title="Total Points Redeemed"
                            value={customerData.totalPointsRedeemed}
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
                        />
                        <StatsCard
                            title="Current Points"
                            value={customerData.currentPoints}
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
                                        {customerData.fullName}
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                        Email
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                        {customerData.email}
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                        Phone No
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                        {customerData.phoneNo}
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                        Address
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                        {customerData.address}
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
                                        {customerData.startingLoyaltyPoints}
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                        Tier Progress
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                        {customerData.tierProgress}
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                        Membership Status
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                        {customerData.membershipStatus}
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="w-[140px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0">
                                        Interest Status
                                    </div>
                                    <div className="text-[14px] font-semibold text-gray-900 flex-1">
                                        {customerData.interestStatus}
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
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Maintenance information coming soon...</p>
                    </div>
                </TabsContent>

                <TabsContent value="finance" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Finance information coming soon...</p>
                    </div>
                </TabsContent>

                <TabsContent value="crm" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">CRM information coming soon...</p>
                    </div>
                </TabsContent>

                <TabsContent value="utility" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Utility information coming soon...</p>
                    </div>
                </TabsContent>

                <TabsContent value="visitors" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Visitors information coming soon...</p>
                    </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Experience information coming soon...</p>
                    </div>
                </TabsContent>

                <TabsContent value="property" className="space-y-6 mt-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Property information coming soon...</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LoyaltyCustomerDetails;
