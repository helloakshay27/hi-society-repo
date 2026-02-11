import { useState, useEffect } from "react";
import TextField from "@mui/material/TextField";
import { StatsCard } from "@/components/StatsCard";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { Eye } from "lucide-react";

// Use MUI TextField for date pickers
const fieldStyles = {
  minWidth: 180,
  marginRight: 2,
  background: 'transparent',
  borderRadius: 0,
  fontSize: 14,
  height: 44,
  '& .MuiInputBase-root': {
    height: 44,
    fontSize: 14,
  },
  '& .MuiOutlinedInput-input': {
    padding: '10.5px 14px',
  },
  '& .MuiInputLabel-root': {
    fontSize: 13,
  },
};

// Define transaction type
interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  remarks: string;
  created_at: string;
  customer_name: string | null;
  customer_code: string | null;
  resource_id: number | null;
  resource_type: string | null;
  redirect_ur: string | null;
}

// Define wallet data type
interface WalletData {
  id: number;
  credited_amount: number;
  debited_amount: number;
  available_amount: number;
}

const columns = [
  { key: "created_at", label: "Date", sortable: true },
  { key: "customer_code", label: "Customer Id", sortable: true },
  { key: "customer_name", label: "Customer Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "amount", label: "Point Burned", sortable: true },
  { key: "transaction_type", label: "Status", sortable: true },
  { key: "resource_type", label: "Resource Type", sortable: true },
];

const RedemptionReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactionType, setTransactionType] = useState("credit");

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // Get dynamic base URL and token from localStorage
      const baseUrl = localStorage.getItem("baseUrl") || "runwal-api.lockated.com";
      const token = localStorage.getItem("token") || "";

      // const url = `https://${baseUrl}/organization_wallet/transactions?transaction_type=${transactionType}&token=${token}`;
      const url = `https://runwal-api.lockated.com/organization_wallet/transactions.json?transaction_type=credit&token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`
      const response = await axios.get(url);

      setWalletData(response.data.wallet);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load wallet data");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [transactionType]);

  const renderCell = (item: Transaction, columnKey: string) => {
    switch (columnKey) {
      case "transaction_type": {
        const type = item.transaction_type || "";
        let bgColor = "";
        let textColor = "text-black";

        if (type === "DR" || type === "debit" || type.toLowerCase() === "failed") {
          bgColor = "bg-[#F8B4B4]";
        } else if (type === "CR" || type === "credit") {
          bgColor = "bg-[#B4E4CE]";
        } else if (type.toLowerCase() === "pending") {
          bgColor = "bg-[#F5E6B3]";
        }

        const displayText = type === "CR" ? "Credit" : type === "DR" ? "Debit" : type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

        return (
          <Badge className={`${bgColor} ${textColor} px-2 rounded-none border-0 min-w-[100px] !justify-center !text-center hover:${bgColor}`}>
            {displayText}
          </Badge>
        );
      }
      case "created_at":
        return item.created_at.split("T")[0] || "-";
      case "amount":
        return item.amount !== undefined ? `₹${item.amount.toLocaleString()}` : "-";
      case "customer_name":
        return item.customer_name || "-";
      case "customer_code":
        return item.customer_code || "-";
      case "resource_type":
        return <a className="text-blue-600 underline" target="_blank" href={item.redirect_ur}>{item.resource_type}</a>;
      default:
        return <span>{item[columnKey as keyof Transaction] || "-"}</span>;
    }
  };

  const renderCustomActions = (
    <div className="flex items-center justify-start w-full py-2">
      <TextField
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        variant="outlined"
        size="small"
        sx={fieldStyles}
        placeholder="DD/MM/YYYY"
        inputProps={{ placeholder: 'DD/MM/YYYY' }}
      />
      <TextField
        label="End Date"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        variant="outlined"
        size="small"
        sx={fieldStyles}
        placeholder="DD/MM/YYYY"
        inputProps={{ placeholder: 'DD/MM/YYYY' }}
      />
      <Button
        className="bg-[#C72030] text-white px-5 text-xs h-11 font-medium"
        style={{ minWidth: 60 }}
        onClick={() => fetchWalletData()}
      >
        Go!
      </Button>
    </div>
  );

  // Stats for wallet cards
  const stats = [
    {
      title: "Total Points Distributed",
      value: walletData ? `${walletData.credited_amount.toLocaleString()}` : "0.00",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.3337 30.6668C12.9368 30.6775 14.526 30.3683 16.0083 29.7575C17.2736 30.361 18.6585 30.6718 20.0603 30.6667C21.4621 30.6617 22.8447 30.3409 24.1055 29.7283C25.3664 29.1157 26.473 28.2269 27.3433 27.128C28.2136 26.0291 28.8252 24.7482 29.1327 23.3806C29.4402 22.0129 29.4356 20.5936 29.1194 19.2279C28.8031 17.8622 28.1833 16.5854 27.306 15.492C26.4286 14.3987 25.3163 13.5171 24.0515 12.9126C22.7868 12.3081 21.4021 11.9962 20.0003 12.0002V7.11083C20.0003 3.86683 16.1937 1.3335 11.3337 1.3335C6.47366 1.3335 2.66699 3.86683 2.66699 7.11083V24.8895C2.66699 28.1335 6.47366 30.6668 11.3337 30.6668ZM20.0003 14.6668C21.3189 14.6668 22.6078 15.0578 23.7041 15.7904C24.8005 16.5229 25.6549 17.5641 26.1595 18.7823C26.6641 20.0004 26.7961 21.3409 26.5389 22.6341C26.2817 23.9273 25.6467 25.1152 24.7144 26.0475C23.782 26.9799 22.5941 27.6148 21.3009 27.8721C20.0077 28.1293 18.6673 27.9973 17.4491 27.4927C16.2309 26.9881 15.1897 26.1336 14.4572 25.0373C13.7247 23.941 13.3337 22.652 13.3337 21.3335C13.3358 19.566 14.0388 17.8716 15.2886 16.6218C16.5384 15.372 18.2329 14.6689 20.0003 14.6668ZM11.3337 4.00016C14.8697 4.00016 17.3337 5.64016 17.3337 7.11083C17.3337 8.5815 14.8697 10.2228 11.3337 10.2228C7.79766 10.2228 5.33366 8.58283 5.33366 7.11083C5.33366 5.63883 7.79766 4.00016 11.3337 4.00016ZM5.33366 11.3095C7.14681 12.3863 9.22534 12.9336 11.3337 12.8895C13.442 12.9336 15.5205 12.3863 17.3337 11.3095V12.4002C15.2819 13.0143 13.5026 14.3131 12.2923 16.0802C11.9737 16.1082 11.6577 16.1482 11.3337 16.1482C7.79766 16.1482 5.33366 14.5082 5.33366 13.0375V11.3095ZM5.33366 17.2362C7.05617 18.2579 9.02157 18.7981 11.0243 18.8002C10.7892 19.6241 10.6689 20.4766 10.667 21.3335C10.667 21.5708 10.6857 21.8042 10.703 22.0375C7.51499 21.8535 5.33366 20.3428 5.33366 18.9628V17.2362ZM5.33366 23.1615C7.14297 24.2357 9.2166 24.7825 11.3203 24.7402C11.77 25.8819 12.4401 26.924 13.2923 27.8068C12.647 27.9328 11.9912 27.9975 11.3337 28.0002C7.79766 28.0002 5.33366 26.3602 5.33366 24.8895V23.1615Z" fill="#C72030" />
        </svg>
      ),
    },
    {
      title: "Total Points Redeemed",
      value: walletData ? `${walletData.debited_amount.toLocaleString()}` : "0.00",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
          <mask id="mask0_388_6606" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
            <rect width="32" height="32" fill="url(#pattern0_388_6606)" />
          </mask>
          <g mask="url(#mask0_388_6606)">
            <rect x="-2.66699" y="-8" width="38.6667" height="46.6667" fill="#C72030" />
          </g>
          <defs>
            <pattern id="pattern0_388_6606" patternContentUnits="objectBoundingBox" width="1" height="1">
              <use xlinkHref="#image0_388_6606" transform="scale(0.00195312)" />
            </pattern>
            <image id="image0_388_6606" width="512" height="512" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
          </defs>
        </svg>
      ),
    },
    {
      title: "Total Floating Points",
      value: walletData ? `${walletData.available_amount.toLocaleString()}` : "0.00",
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.3337 30.6668C12.9368 30.6775 14.526 30.3683 16.0083 29.7575C17.2736 30.361 18.6585 30.6718 20.0603 30.6667C21.4621 30.6617 22.8447 30.3409 24.1055 29.7283C25.3664 29.1157 26.473 28.2269 27.3433 27.128C28.2136 26.0291 28.8252 24.7482 29.1327 23.3806C29.4402 22.0129 29.4356 20.5936 29.1194 19.2279C28.8031 17.8622 28.1833 16.5854 27.306 15.492C26.4286 14.3987 25.3163 13.5171 24.0515 12.9126C22.7868 12.3081 21.4021 11.9962 20.0003 12.0002V7.11083C20.0003 3.86683 16.1937 1.3335 11.3337 1.3335C6.47366 1.3335 2.66699 3.86683 2.66699 7.11083V24.8895C2.66699 28.1335 6.47366 30.6668 11.3337 30.6668ZM20.0003 14.6668C21.3189 14.6668 22.6078 15.0578 23.7041 15.7904C24.8005 16.5229 25.6549 17.5641 26.1595 18.7823C26.6641 20.0004 26.7961 21.3409 26.5389 22.6341C26.2817 23.9273 25.6467 25.1152 24.7144 26.0475C23.782 26.9799 22.5941 27.6148 21.3009 27.8721C20.0077 28.1293 18.6673 27.9973 17.4491 27.4927C16.2309 26.9881 15.1897 26.1336 14.4572 25.0373C13.7247 23.941 13.3337 22.652 13.3337 21.3335C13.3358 19.566 14.0388 17.8716 15.2886 16.6218C16.5384 15.372 18.2329 14.6689 20.0003 14.6668ZM11.3337 4.00016C14.8697 4.00016 17.3337 5.64016 17.3337 7.11083C17.3337 8.5815 14.8697 10.2228 11.3337 10.2228C7.79766 10.2228 5.33366 8.58283 5.33366 7.11083C5.33366 5.63883 7.79766 4.00016 11.3337 4.00016ZM5.33366 11.3095C7.14681 12.3863 9.22534 12.9336 11.3337 12.8895C13.442 12.9336 15.5205 12.3863 17.3337 11.3095V12.4002C15.2819 13.0143 13.5026 14.3131 12.2923 16.0802C11.9737 16.1082 11.6577 16.1482 11.3337 16.1482C7.79766 16.1482 5.33366 14.5082 5.33366 13.0375V11.3095ZM5.33366 17.2362C7.05617 18.2579 9.02157 18.7981 11.0243 18.8002C10.7892 19.6241 10.6689 20.4766 10.667 21.3335C10.667 21.5708 10.6857 21.8042 10.703 22.0375C7.51499 21.8535 5.33366 20.3428 5.33366 18.9628V17.2362ZM5.33366 23.1615C7.14297 24.2357 9.2166 24.7825 11.3203 24.7402C11.77 25.8819 12.4401 26.924 13.2923 27.8068C12.647 27.9328 11.9912 27.9975 11.3337 28.0002C7.79766 28.0002 5.33366 26.3602 5.33366 24.8895V23.1615Z" fill="#C72030" />
        </svg>
      ),
    },
  ];

  const renderActions = (item: any) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Handle download logic here
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
      <div className="text-sm text-gray-600 mb-4">Organization Wallet &gt; Transactions</div>

      {/* Wallet Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconRounded={false}
            valueColor="text-[#C72030]"
          />
        ))}
      </div>

      {/* Transactions Table */}
      <div className="w-full">
        <EnhancedTable
          data={transactions}
          columns={columns}
          renderCell={renderCell}
          // renderActions={renderActions}
          loading={loading}
          loadingMessage="Loading transactions..."
          emptyMessage="No transactions found"
          leftActions={renderCustomActions}
          searchPlaceholder="Search transactions"
          enableGlobalSearch={true}
          onGlobalSearch={setSearch}
          onFilterClick={() => { }}
        />
      </div>
    </div>
  );
};

export default RedemptionReport;
