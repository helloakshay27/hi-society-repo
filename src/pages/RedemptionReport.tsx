import React, { useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Eye, Filter, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Total Points Distributed",
    value: "678,098",
    icon: (
      <svg className="w-6 h-6 text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
  },
  {
    title: "Total Points Redeemed",
    value: "2,34,600",
    icon: (
      <svg className="w-6 h-6 text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
    ),
  },
  {
    title: "Total Floating Points",
    value: "3,55,600",
    icon: (
      <svg className="w-6 h-6 text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
    ),
  },
];

const columns = [
  { key: "action", label: "Action", sortable: false },
  { key: "date", label: "Date", sortable: true },
  { key: "customerId", label: "Customer ID", sortable: true },
  { key: "customerName", label: "Customer Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "clientPrice", label: "Client Price", sortable: true },
  { key: "pointsBurned", label: "Points Burned", sortable: true },
  { key: "walletDebited", label: "Wallet Debited", sortable: true },
  { key: "status", label: "Status", sortable: true },
];

const data = [
  {
    id: 1,
    date: "26/07/2025",
    customerId: "GC-AMZ-100",
    customerName: "Sanjay Singhania",
    category: "Gift Card",
    clientPrice: "₹1200",
    pointsBurned: 2300,
    walletDebited: "₹1800",
    status: "Credit",
  },
  {
    id: 2,
    date: "27/07/2025",
    customerId: "GC-UDR-112",
    customerName: "Sachin Tilchkule",
    category: "Vouchers",
    clientPrice: "₹6500",
    pointsBurned: 8000,
    walletDebited: "₹9000",
    status: "Pending",
  },
  {
    id: 3,
    date: "28/07/2025",
    customerId: "RT-GHT-019",
    customerName: "Martand Dhamdhere",
    category: "Products",
    clientPrice: "₹800",
    pointsBurned: 1200,
    walletDebited: "₹5400",
    status: "Failed",
  },
  {
    id: 4,
    date: "29/07/2025",
    customerId: "AV-SVR-345",
    customerName: "Pushpa",
    category: "Gift Card",
    clientPrice: "₹1500",
    pointsBurned: 2000,
    walletDebited: "₹4000",
    status: "Credit",
  },
];

const statusColor = {
  Credit: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Failed: "bg-red-100 text-red-800",
};

const renderCell = (item: any, columnKey: string) => {
  switch (columnKey) {
    case "action":
      return (
        <button
          className="inline-flex items-center justify-center w-8 h-8 text-gray-600 hover:text-[#C72030] hover:bg-gray-100 rounded-lg transition-colors"
          title="View"
        >
          <Eye className="w-5 h-5" />
        </button>
      );
    case "status":
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status] || "bg-gray-100 text-gray-800"}`}>
          {item.status}
        </span>
      );
    default:
      return <span>{item[columnKey]}</span>;
  }
};

const RedemptionReport = () => {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Custom filter/search bar UI matching the screenshot
  const renderCustomActions = () => (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <input
        className="border px-2 py-1 rounded text-xs min-w-[120px]"
        placeholder="Start Date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        type="text"
      />
      <input
        className="border px-2 py-1 rounded text-xs min-w-[120px]"
        placeholder="End Date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        type="text"
      />
      <Button
        className="bg-[#C72030] text-white px-3 py-1 rounded text-xs h-8"
        onClick={() => {/* handle filter */}}
      >
        Go!
      </Button>
      <Button
        variant="outline"
        className="border-[#C72030] text-[#C72030] px-3 py-1 rounded text-xs h-8 ml-2"
        onClick={() => {/* handle report download */}}
      >
        Report
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
      <div className="text-sm text-gray-600 mb-4">Redemption &gt; Report</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconRounded={true}
            valueColor="text-[#C72030]"
          />
        ))}
      </div>
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <EnhancedTable
          data={data}
          columns={columns}
          renderCell={renderCell}
          enableExport={true}
          exportFileName="redemption-report"
          storageKey="redemption-report-table"
          loading={false}
          loadingMessage="Loading report..."
          emptyMessage="No records found"
          leftActions={renderCustomActions()}
          searchPlaceholder="Search"
          enableGlobalSearch={true}
          onGlobalSearch={setSearch}
          rightActions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10 flex items-center gap-2"
                title="Filter"
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                title="Grid"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default RedemptionReport;
