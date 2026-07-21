import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const FONT = { fontFamily: "'Poppins', sans-serif" };

// Color tokens
const COLORS = {
  terra: "#DA7756",
  terraDk: "#B8694A",
  bg: "#F6F4EE",
  white: "#fff",
  dark: "#2C2C2C",
  sage: "#798C5E",
  teal: "#9EC8BA",
  lav: "#CECBF6",
  blue: "#6B9BCC",
  ok: "#108C72",
  warn: "#EDC488",
  err: "#E7848E",
  border: "#C4B89D",
  div: "#E0D8CC",
};

// Mock data
const trendData = [
  { month: "Jan", issued: 98000, redeemed: 72000 },
  { month: "Feb", issued: 105000, redeemed: 81000 },
  { month: "Mar", issued: 112000, redeemed: 89000 },
  { month: "Apr", issued: 118000, redeemed: 95000 },
  { month: "May", issued: 121000, redeemed: 102000 },
  { month: "Jun", issued: 124500, redeemed: 98000 },
];

const tierData = [
  { name: "Diamond", value: 45, color: "#B0B0B0" },
  { name: "Titanium", value: 120, color: "#9BA8B5" },
  { name: "Gold", value: 385, color: "#EDC488" },
  { name: "Silver", value: 1567, color: "#798C5E" },
  { name: "Bronze", value: 730, color: "#C4B89D" },
];

const ruleCatData = [
  { name: "Collections", value: 4120, color: COLORS.terra },
  { name: "Marketing", value: 3200, color: COLORS.blue },
  { name: "Possession", value: 2340, color: "#6B9BCC" },
  { name: "Sales", value: 1650, color: COLORS.ok },
  { name: "Referrals", value: 890, color: COLORS.warn },
  { name: "App Adoption", value: 780, color: COLORS.sage },
];

const dailyFiresData = [
  { day: "Mon", fires: 380 },
  { day: "Tue", fires: 420 },
  { day: "Wed", fires: 390 },
  { day: "Thu", fires: 450 },
  { day: "Fri", fires: 410 },
  { day: "Sat", fires: 280 },
  { day: "Sun", fires: 220 },
];

const AI_SUGGESTIONS = [
  "What needs attention today?",
  "Show me rule performance",
  "Analyze redemption trends",
  "Member engagement insights",
];

export const LoyaltyRuleEngine = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterLabel, setFilterLabel] = useState("This Month");
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillKey, setDrillKey] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm your Loyalty AI assistant. Ask me anything about your programme." },
  ]);
  const [typing, setTyping] = useState(false);
  const [showSugs, setShowSugs] = useState(true);
  const [liveDate, setLiveDate] = useState("");

  const filterWrapRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setLiveDate(
        now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
          " · " +
          now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateDate();
    const interval = setInterval(updateDate, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    // Simple toast implementation
    alert(msg);
  };

  const openDrill = (key: string) => {
    setDrillKey(key);
    setDrillOpen(true);
  };

  const closeDrill = () => {
    setDrillOpen(false);
    setDrillKey(null);
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleAI = () => {
    setAiOpen(!aiOpen);
    setShowSugs(!aiOpen);
  };

  const sendAI = (text?: string) => {
    const userText = text || "";
    if (!userText.trim()) return;
    setMessages([...messages, { role: "user", text: userText }]);
    setShowSugs(false);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Based on your programme data, I can provide insights on rule performance, member engagement, and redemption trends. What specific area would you like to explore?" },
      ]);
    }, 1500);
  };

  const drillTitles: Record<string, string> = {
    "members-kpi": "Active Members",
    "points-kpi": "Points Issued This Month",
    "redemption-kpi": "Redemption Rate",
    "rules-kpi": "Active Rules",
    "expired-points": "Expired Points",
    "rules-collections": "Collections Rules",
    "rules-marketing": "Marketing Engagement Rules",
    "rules-possession": "Possession Rules",
    "rules-sales": "Sales & Booking Rules",
    "rules-referrals": "Referral Rules",
    "rules-app": "App Adoption Rules",
  };

  const renderDrillBody = (key: string | null) => {
    if (!key) return <div className="p-4 text-sm text-gray-500">No detail available.</div>;
    return (
      <div className="p-4">
        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-xs font-semibold text-orange-800 mb-1">Detail View</div>
          <div className="text-sm text-gray-700">Detailed information for {drillTitles[key] || key}</div>
        </div>
        <button
          className="w-full py-2 px-4 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors"
          onClick={() => showToast("Action completed")}
        >
          Take Action
        </button>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Briefing */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 flex gap-3 items-start">
        <div className="text-2xl">✦</div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Programme Briefing — 19 Jun 2026
          </div>
          <div className="text-sm text-gray-200 leading-relaxed">
            <strong>Programme healthy.</strong> <strong>34 rules active</strong> across 6 categories; Collections
            rules fired 4,120 times this month. <strong>Redemption rate 23.4%</strong> — driven by encashment
            (42.5%). <strong>318 members lapsed</strong> (60+ days inactive) — a win-back campaign would recover
            this cohort before month-end.
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Active Members", value: "2,847", sub: "↑ 124 new this month" },
          { label: "Points Issued", value: "1,24,500", sub: "62% of monthly cap", bar: 62 },
          { label: "Redemption Rate", value: "23.4%", sub: "2,912 of 12,450 eligible", color: COLORS.ok },
          { label: "Active Rules", value: "34", sub: "Across 6 categories" },
          { label: "Expired Points", value: "0", sub: "Confirm expiry config", bar: 0, barColor: COLORS.warn },
        ].map((kpi, i) => (
          <div
            key={i}
            className="bg-orange-50 border border-orange-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openDrill(`kpi-${i}`)}
          >
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              {kpi.label}
            </div>
            <div className="text-2xl font-bold text-gray-800" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
            {kpi.bar !== undefined && (
              <div className="mt-2 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${kpi.bar}%`, background: kpi.barColor || COLORS.terra }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alert */}
      <div
        className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-500 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition-colors"
        onClick={() => openDrill("lapsed")}
      >
        <div className="text-xl">⚠️</div>
        <div className="flex-1 text-sm text-gray-800">
          <strong>318 members inactive 60+ days</strong> — no rule has fired for them. A time-based
          re-engagement rule would recover this cohort automatically.
        </div>
        <div className="text-sm font-semibold text-orange-600">Set up rule →</div>
      </div>

      {/* Today's Activity + Rule Categories */}
      <div className="grid grid-cols-[2fr_3fr] gap-2">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-gray-800">Today's Activity</div>
            <div className="text-xs text-gray-500">19 Jun 2026 · Live</div>
          </div>
          {[
            { label: "Rules fired today", value: "412", color: COLORS.terra },
            { label: "New member registrations", value: "7" },
            { label: "Redemptions processed", value: "84" },
            { label: "Points awarded", value: "4,180", color: COLORS.blue },
            { label: "Encashments pending", value: "12", color: COLORS.warn },
            { label: "Tier upgrades triggered", value: "3", color: COLORS.ok },
          ].map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 cursor-pointer hover:text-orange-600 transition-colors"
              onClick={() => openDrill(`activity-${i}`)}
            >
              <span className="text-sm">{item.label}</span>
              <span className="font-semibold" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-gray-800">Rule Categories — This Month</div>
            <div className="text-xs text-gray-500">34 active rules · 12,980 total fires</div>
          </div>
          {[
            { label: "Collections", value: "4,120", width: 85, color: COLORS.terra },
            { label: "Marketing Engagement", value: "3,200", width: 66, color: COLORS.blue },
            { label: "Possession", value: "2,340", width: 48, color: "#6B9BCC" },
            { label: "Sales & Booking", value: "1,650", width: 34, color: COLORS.ok },
            { label: "Referrals", value: "890", width: 18, color: COLORS.warn },
            { label: "App Adoption", value: "780", width: 16, color: COLORS.sage },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1 cursor-pointer"
              onClick={() => openDrill(`category-${i}`)}
            >
              <span className="text-xs text-gray-600 w-32">{item.label}</span>
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.width}%`, background: item.color }} />
              </div>
              <span className="text-xs font-semibold w-10 text-right" style={{ color: item.color }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">Points Issued vs Redeemed — 6 Months</div>
            </div>
            <div className="flex gap-1">
              {["Bar", "Line", "Table"].map((btn) => (
                <button
                  key={btn}
                  className={`px-2 py-1 text-xs rounded border ${
                    btn === "Bar" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="issued" fill={COLORS.terra} radius={[4, 4, 0, 0]} />
                <Bar dataKey="redeemed" fill={COLORS.ok} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">Member Tier Distribution</div>
            </div>
            <div className="flex gap-1">
              {["Donut", "Bar", "Table"].map((btn) => (
                <button
                  key={btn}
                  className={`px-2 py-1 text-xs rounded border ${
                    btn === "Donut" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRulesTab = () => (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 items-center flex-wrap">
        <select className="px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-white outline-none focus:border-orange-500">
          <option>All Categories</option>
          <option>Collections</option>
          <option>Marketing Engagement</option>
          <option>Possession</option>
          <option>Sales & Booking</option>
          <option>Referrals</option>
          <option>App Adoption</option>
        </select>
        <select className="px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-white outline-none focus:border-orange-500">
          <option>All Statuses</option>
          <option>Active</option>
          <option>Paused</option>
          <option>Draft</option>
        </select>
        <select className="px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-white outline-none focus:border-orange-500">
          <option>All Rule Types</option>
          <option>Transaction Events</option>
          <option>Time-Based</option>
          <option>User Actions</option>
          <option>Milestones</option>
          <option>Tier-Based</option>
        </select>
        <input
          className="flex-1 min-w-[140px] max-w-[240px] px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-white outline-none focus:border-orange-500"
          placeholder="🔍 Search rules…"
        />
        <button
          className="px-3 py-1.5 text-xs font-semibold bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
          onClick={() => showToast("Rule builder opened")}
        >
          ⚙️ + New Rule
        </button>
      </div>

      {/* Rule Modules */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Collections", value: "8 rules", sub: "4,120 fires this month · 100% active", color: COLORS.terra },
          { label: "Marketing Engagement", value: "5 rules", sub: "3,200 fires this month · 4 active", color: COLORS.blue },
          { label: "Possession", value: "5 rules", sub: "2,340 fires this month · All active", color: "#6B9BCC" },
          { label: "Sales & Booking", value: "7 rules", sub: "1,650 fires this month · 6 active", color: COLORS.ok },
          { label: "Referrals", value: "6 rules", sub: "890 fires this month · 5 active", color: COLORS.warn },
          { label: "App Adoption", value: "3 rules", sub: "780 fires this month · All active", color: COLORS.sage },
        ].map((module, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-orange-500 transition-all relative overflow-hidden"
            onClick={() => openDrill(`rules-${i}`)}
            style={{ borderTop: `3px solid ${module.color}` }}
          >
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              {module.label}
            </div>
            <div className="text-lg font-bold text-gray-800">{module.value}</div>
            <div className="text-xs text-gray-500 mt-1">{module.sub}</div>
          </div>
        ))}
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-800">All Active Rules</div>
          <div className="text-xs text-gray-500">34 rules · click any row to inspect</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                {["Rule Name", "Category", "Type", "Trigger", "Points", "Fires (MTD)", "Last Fired", "Status"].map(
                  (h) => (
                    <th key={h} className="px-2 py-2 font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Early Demand Note Payment", cat: "Collections", type: "Transaction", trigger: "Paid ≤ 5 days", points: "6,000", fires: "824", last: "Today 11:42", status: "Active" },
                { name: "App Login Streak — 3 days", cat: "App Adoption", type: "Engagement", trigger: "3 consecutive logins", points: "250", fires: "412", last: "Today 09:15", status: "Active" },
                { name: "Possession On-Time Incentive", cat: "Possession", type: "Milestone", trigger: "Docs uploaded 7d before", points: "3,500", fires: "312", last: "Today 08:30", status: "Active" },
                { name: "Referral Conversion Bonus", cat: "Referrals", type: "User Action", trigger: "Referral converts", points: "10,000", fires: "48", last: "Yesterday", status: "Active" },
                { name: "Birthday Bonus", cat: "Marketing", type: "Time-Based", trigger: "Member birthday", points: "500", fires: "38", last: "17 Jun 2026", status: "Paused" },
              ].map((rule, i) => (
                <tr
                  key={i}
                  className="cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => openDrill(`rule-${i}`)}
                >
                  <td className="px-2 py-2 font-semibold">{rule.name}</td>
                  <td className="px-2 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                      {rule.cat}
                    </span>
                  </td>
                  <td className="px-2 py-2">{rule.type}</td>
                  <td className="px-2 py-2">{rule.trigger}</td>
                  <td className="px-2 py-2 font-bold">{rule.points}</td>
                  <td className="px-2 py-2 font-bold text-orange-600">{rule.fires}</td>
                  <td className="px-2 py-2">{rule.last}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        rule.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {rule.status === "Active" ? "● Active" : "⏸ Paused"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">Rules Fired by Category — This Month</div>
            </div>
            <div className="flex gap-1">
              {["Bar", "Donut", "Table"].map((btn) => (
                <button
                  key={btn}
                  className={`px-2 py-1 text-xs rounded border ${
                    btn === "Bar" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ruleCatData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ruleCatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-800">Daily Rule Fires — Last 7 Days</div>
            </div>
            <div className="flex gap-1">
              {["Line", "Bar", "Table"].map((btn) => (
                <button
                  key={btn}
                  className={`px-2 py-1 text-xs rounded border ${
                    btn === "Line" ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyFiresData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="fires" stroke={COLORS.terra} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">👥</div>
        <div className="text-sm">Members tab content</div>
      </div>
    </div>
  );

  const renderRedemptionTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🎁</div>
        <div className="text-sm">Redemption tab content</div>
      </div>
    </div>
  );

  const renderWalletTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">💰</div>
        <div className="text-sm">Wallet tab content</div>
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🧾</div>
        <div className="text-sm">Orders tab content</div>
      </div>
    </div>
  );

  const renderStoreTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🏪</div>
        <div className="text-sm">Store & Inventory tab content</div>
      </div>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "rules", label: "Rules Engine", icon: "⚙️" },
    { id: "members", label: "Members", icon: "👥" },
    { id: "redemption", label: "Redemption", icon: "🎁" },
    { id: "wallet", label: "Wallet", icon: "💰" },
    { id: "orders", label: "Orders", icon: "🧾" },
    { id: "store", label: "Store & Inventory", icon: "🏪" },
  ];

  return (
    <div className="min-h-screen bg-[#F6F4EE]" style={FONT}>
      {/* Topbar */}
      <div className="sticky top-0 z-300 flex h-[52px] items-center justify-between bg-white border-b-2 border-gray-300 px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-600">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-white" strokeWidth="2.2">
                <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.8L19.2 8.5v7L12 19.2 4.8 15.5v-7L12 4.8z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">Loyalty Rule Engine</div>
              <div className="text-[9px] text-gray-600 font-medium tracking-wider uppercase">
                Lockated · GoPhygital.work
              </div>
            </div>
          </div>
          <div className="w-px h-6 bg-gray-300" />
          <button
            className="flex items-center gap-1 px-2.5 py-1 bg-orange-600 text-white rounded-full text-xs font-semibold hover:bg-orange-700 transition-colors"
            onClick={() => navigate("/loyalty-rule-engine")}
          >
            <span>←</span>
            <span>Home</span>
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded-full px-3 py-1">
            <span className="text-xs">🏢</span>
            <select className="text-xs font-medium text-gray-800 bg-transparent outline-none cursor-pointer">
              <option>Prestige Realty — Main Programme</option>
              <option>Phase 2 Pilot</option>
              <option>Broker Programme</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[9px] font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-full px-2.5 py-1">
            Review Build · Jun 2026
          </div>
          <div className="relative" ref={filterWrapRef}>
            <button
              className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs hover:border-orange-500 transition-colors"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <span>📅</span>
              <span className="font-semibold text-gray-800">{filterLabel}</span>
              <span className="text-gray-500">▾</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-400 min-w-[260px] rounded-xl border border-gray-300 bg-white p-2.5 shadow-lg">
                <div className="flex gap-1 mb-2">
                  {["Day", "Month", "Range"].map((mode) => (
                    <button
                      key={mode}
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        mode === "Month" ? "bg-orange-600 text-white" : "bg-white text-gray-600"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 mb-2">
                  <button className="px-3 py-1 text-xs font-semibold bg-orange-600 text-white rounded-full">
                    Apply
                  </button>
                  <button className="px-2 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-full">
                    Reset
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap pt-2 border-t border-gray-200">
                  {["Today", "Last 7 Days", "Last 30 Days", "This Month", "Last Month", "This Quarter"].map(
                    (preset) => (
                      <button
                        key={preset}
                        className={`px-2 py-1 text-xs rounded-full border ${
                          preset === "This Month"
                            ? "bg-orange-50 border-orange-500 text-orange-600 font-semibold"
                            : "bg-transparent border-gray-300 text-gray-600"
                        }`}
                      >
                        {preset}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-600">{liveDate}</div>
          <div className="text-[9px] font-bold bg-orange-600 text-white rounded-full px-2.5 py-1 tracking-wider">
            Programme Admin
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
            PA
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="sticky top-[52px] z-299 flex gap-0.5 bg-white border-b border-gray-300 px-5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-1 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "text-orange-600 border-orange-600 font-semibold"
                : "text-gray-600 border-transparent hover:text-orange-600 hover:bg-gray-50"
            }`}
            onClick={() => switchTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-w-[1400px]">
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "rules" && renderRulesTab()}
        {activeTab === "members" && renderMembersTab()}
        {activeTab === "redemption" && renderRedemptionTab()}
        {activeTab === "wallet" && renderWalletTab()}
        {activeTab === "orders" && renderOrdersTab()}
        {activeTab === "store" && renderStoreTab()}
      </div>

      {/* Drill Panel */}
      <div
        className={`fixed inset-0 z-500 bg-black/30 backdrop-blur-sm ${drillOpen ? "block" : "hidden"}`}
        onClick={closeDrill}
      />
      <div
        className={`fixed top-0 z-501 flex h-screen w-[500px] flex-col border-l border-gray-300 bg-white shadow-xl transition-all duration-250 ${
          drillOpen ? "right-0" : "right-[-500px]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
          <div className="text-sm font-semibold">{drillKey && drillTitles[drillKey] ? drillTitles[drillKey] : "Detail"}</div>
          <button
            className="text-lg text-gray-600 hover:text-orange-600 bg-transparent border-none cursor-pointer"
            onClick={closeDrill}
          >
            ×
          </button>
        </div>
        <div className="flex min-h-[30px] items-center border-b border-gray-200 px-4 py-2 text-xs text-gray-600">
          {drillKey && drillTitles[drillKey] ? drillTitles[drillKey] : ""}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3.5">{renderDrillBody(drillKey)}</div>
      </div>

      {/* AI Chat */}
      <div
        className={`fixed bottom-6 right-6 z-401 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl transition-all duration-200 ${
          aiOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2.5 bg-gradient-to-br from-orange-600 to-orange-700 px-4 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-base">
            ✦
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Loyalty AI</div>
            <div className="text-xs text-white/70">● Online · Rule Engine context loaded</div>
          </div>
          <button
            className="text-lg text-white/80 bg-transparent border-none cursor-pointer"
            onClick={toggleAI}
          >
            ×
          </button>
        </div>
        <div ref={msgsRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-gray-50 p-3.5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] break-words rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "self-end rounded-br-sm bg-orange-600 text-white"
                  : "self-start rounded-bl-sm border border-gray-200 bg-white text-gray-800"
              }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: "0.2s" }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" style={{ animationDelay: "0.4s" }} />
            </div>
          )}
        </div>
        {showSugs && (
          <div className="flex flex-wrap gap-1 border-t border-gray-200 px-3 py-2 bg-white">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="px-2 py-1 text-xs rounded-full border border-gray-300 bg-gray-50 text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-colors"
                onClick={() => sendAI(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 border-t border-gray-200 px-3 py-2.5 bg-white">
          <input
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-orange-500"
            placeholder="Ask anything about your programme…"
            onKeyDown={(e) => e.key === "Enter" && sendAI((e.target as HTMLInputElement).value)}
          />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            onClick={() => {
              const input = document.querySelector("input[placeholder*='programme']") as HTMLInputElement;
              if (input) sendAI(input.value);
            }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* AI FAB */}
      <button
        className={`fixed bottom-6 right-6 z-400 h-13 w-13 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 text-white text-2xl shadow-lg transition-all hover:scale-110 ${
          aiOpen ? "hidden" : "flex"
        } items-center justify-center border-none cursor-pointer`}
        onClick={toggleAI}
      >
        ✦
      </button>
    </div>
  );
};
