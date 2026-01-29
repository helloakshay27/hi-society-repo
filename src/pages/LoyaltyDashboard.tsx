import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Gift,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  Percent,
  Users,
  Settings,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { getFullUrl } from "@/config/apiConfig";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const LoyaltyDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30");

  // State for API data
  const [stats, setStats] = useState({
    walletBalance: "-",
    pointsDistributed: "-",
    pointsRedeemed: "-",
    pointsExpiring: "-",
    totalRedemptionValue: "-",
    avgCostPerRedemption: "-",
    discountEarned: "-",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = getFullUrl("/organizations/loyalty_dashboard?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ");
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data) {
          setStats({
            walletBalance: Number(json.data.wallet_balance).toLocaleString(),
            pointsDistributed: Number(json.data.points_distributed).toLocaleString(),
            pointsRedeemed: Number(json.data.points_redeemed).toLocaleString(),
            pointsExpiring: Number(json.data.points_expiring).toLocaleString(),
            totalRedemptionValue: Number(json.data.total_redemption_value).toLocaleString(),
            avgCostPerRedemption: Number(json.data.avg_cost_per_redemption).toLocaleString(),
            discountEarned: Number(json.data.discount_earned).toLocaleString(),
          });
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchStats();
  }, []);

  // Burn Trend Chart Data
  const burnTrendData = [
    { month: "Jan", lastQuarter: 12500, currentQuarter: 12500 },
    { month: "Feb", lastQuarter: 16400, currentQuarter: 16400 },
    { month: "Mar", lastQuarter: 15200, currentQuarter: 13670 },
    { month: "Apr", lastQuarter: 21700, currentQuarter: 21700 },
    { month: "May", lastQuarter: 18400, currentQuarter: 21800 },
    { month: "Jun", lastQuarter: 23200, currentQuarter: 23200 },
    { month: "Jul", lastQuarter: 22600, currentQuarter: 22600 },
    { month: "Aug", lastQuarter: 21860, currentQuarter: 21860 },
    { month: "Sep", lastQuarter: 23400, currentQuarter: 23400 },
    { month: "Oct", lastQuarter: 21900, currentQuarter: 21900 },
    { month: "Nov", lastQuarter: 26400, currentQuarter: 26400 },
    { month: "Dec", lastQuarter: 27500, currentQuarter: 27500 },
  ];

  // Member Tier Distribution Data
  const tierDistributionData = [
    { name: "Platinum", value: 6, color: "#C72030" },
    { name: "Gold", value: 23, color: "#e84855" },
    { name: "Silver", value: 40, color: "#dbc2a9" },
    { name: "Bronze", value: 31, color: "#f5f2eb" },
  ];

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">
            LOYALTY DASHBOARD
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] border-[#e5e1d8] bg-white">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Stats Cards - 4 Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Wallet Balance"
          value={stats.walletBalance}
          icon={<Wallet className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Points Distributed"
          value={stats.pointsDistributed}
          icon={<Gift className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Points Redeemed"
          value={stats.pointsRedeemed}
          icon={<TrendingUp className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Points Expiring"
          value={stats.pointsExpiring}
          icon={<Clock className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
      </div>

      {/* Secondary Stats Cards - 4 Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Redemption Value"
          value={stats.totalRedemptionValue}
          icon={<DollarSign className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Avg. Cost Per Redemption"
          value={stats.avgCostPerRedemption}
          icon={<Award className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Discount Earned"
          value={stats.discountEarned}
          icon={<Percent className="w-6 h-6 text-[#C72030]" />}
          className="cursor-pointer hover:shadow-md transition-shadow"
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burn Trend Chart */}
        <Card className="border-[#e5e1d8] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#C72030]">
              Burn Trend
            </CardTitle>
            <CardDescription className="text-sm text-[#666666]">
              Monthly redemption trend comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#DBC2A9]"></div>
                <span className="text-xs text-[#666666]">Last Quarter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#C72030]"></div>
                <span className="text-xs text-[#666666]">Current Quarter</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burnTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" />
                <XAxis
                  dataKey="month"
                  stroke="#666666"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#666666"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f6f4ee",
                    border: "1px solid #e5e1d8",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number | null, name: string) => {
                    if (value === null) return ["-", name];
                    const label = name === "lastQuarter" ? "Last Quarter" : "Current Quarter";
                    return [`${value.toLocaleString()}`, label];
                  }}
                />
                <Line
                  type="linear"
                  dataKey="lastQuarter"
                  stroke="#DBC2A9"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  dot={{ fill: "#DBC2A9", r: 4, fillOpacity: 0.5 }}
                  activeDot={{ r: 6, fillOpacity: 0.5 }}
                  connectNulls={true}
                />
                <Line
                  type="linear"
                  dataKey="currentQuarter"
                  stroke="#C72030"
                  strokeWidth={2}
                  strokeOpacity={1}
                  dot={{ fill: "#C72030", r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Tier Distribution Chart */}
        <Card className="border-[#e5e1d8] shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-[#1A1A1A]">
              Member Tier Distribution
            </CardTitle>
            <CardDescription className="text-sm text-[#666666]">
              Distribution of members across loyalty tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name}: ${value}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f6f4ee",
                    border: "1px solid #e5e1d8",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-sm text-[#666666]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoyaltyDashboard;
