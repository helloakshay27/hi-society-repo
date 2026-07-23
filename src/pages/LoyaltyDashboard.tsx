import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ChevronDown, Download, Search, X, MessageSquare, Menu, FileText, Activity, ArrowLeft, Calendar, Building2, User, Sparkles, Settings } from 'lucide-react';
import { Briefing, ChartCard, KpiCard, KpiStripCard, ModuleCard } from './LoyaltyDashboardComponents';
import { DRILLS, getBotFallback } from './LoyaltyDashboardData';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getHiSocietyBaseUrl, API_CONFIG, ENDPOINTS } from '../config/apiConfig';

export function LoyaltyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [drillData, setDrillData] = useState<{ title: string; content: string } | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('This Month');
  
  const getDateRangeParams = () => {
    const today = new Date();
    // Use local date string instead of toISOString() to avoid UTC shift
    const f = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (dateFilter === 'Today') {
      return { from: f(today), to: f(today) };
    }
    if (dateFilter === 'Last 7 Days') {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      return { from: f(past), to: f(today) };
    }
    if (dateFilter === 'This Month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: f(first), to: f(last) };
    }
    if (dateFilter === 'Last Month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: f(first), to: f(last) };
    }
    return {};
  };

  const dateParams = getDateRangeParams();

  const [aiMsgs, setAiMsgs] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: 'Hi! I can generate insights across your programme data. What would you like to know?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  const tabs = ['Overview', 'Rules Engine', 'Members', 'Redemption', 'Wallet', 'Orders', 'Store & Inventory'];

  const handleDrill = (id: string, title: string) => {
    if (DRILLS[id]) {
      setDrillData({ title, content: DRILLS[id] });
    }
  };

  const { data: dashboardData } = useQuery({
    queryKey: ['loyalty-dashboard-overview', dateFilter],
    queryFn: async () => {
      const url = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_OVERVIEW}`;
      const response = await axios.get(url, {
        params: { token: API_CONFIG.TOKEN, ...dateParams }
      });
      return response.data;
    }
  });

  const { data: membersData } = useQuery({
    queryKey: ['loyalty-dashboard-members', dateFilter],
    queryFn: async () => {
      const url = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_MEMBERS}`;
      const response = await axios.get(url, {
        params: { token: API_CONFIG.TOKEN, ...dateParams }
      });
      return response.data;
    }
  });

  const { data: walletData } = useQuery({
    queryKey: ['loyalty-dashboard-wallet', dateFilter],
    queryFn: async () => {
      const url = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_WALLET}`;
      const response = await axios.get(url, {
        params: { token: API_CONFIG.TOKEN, ...dateParams }
      });
      return response.data;
    }
  });

  const { data: ordersData } = useQuery({
    queryKey: ['loyalty-dashboard-orders'],
    queryFn: async () => {
      const url = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_ORDERS}`;
      const response = await axios.get(url, {
        params: { token: API_CONFIG.TOKEN }
      });
      return response.data;
    }
  });

  const { data: storeData } = useQuery({
    queryKey: ['loyalty-dashboard-store'],
    queryFn: async () => {
      const url = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_STORE}`;
      const response = await axios.get(url, {
        params: { token: API_CONFIG.TOKEN }
      });
      return response.data;
    }
  });

  const { data: redemptionData } = useQuery({
    queryKey: ['loyalty-dashboard-redemption', dateFilter],
    queryFn: async () => {
      const url = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_REDEMPTION}`;
      const response = await axios.get(url, {
        params: { token: API_CONFIG.TOKEN, ...dateParams }
      });
      return response.data;
    }
  });

  const tierDistribution = dashboardData?.tier_distribution || [];
  const tiersChartData = tierDistribution.length > 0 ? {
    labels: tierDistribution.map((t: any) => t.name || 'Unknown'),
    values: tierDistribution.map((t: any) => t.member_count || 0),
    colors: ['#C4B89D','#888780','#BA7517', '#6B9BCC', '#E7848E', '#2C2C2C'].slice(0, tierDistribution.length),
    h: false,
    def: 'doughnut'
  } : undefined;

  const overviewFlow = dashboardData?.points_flow_by_month || [];
  const overviewFlowChartData = overviewFlow.length > 0 ? {
    labels: overviewFlow.map((f: any) => f.month),
    datasets: [
      { label: 'Issued', data: overviewFlow.map((f: any) => f.issued), bg: '#E0D8CC', bc: '#C4B89D' },
      { label: 'Redeemed', data: overviewFlow.map((f: any) => f.redeemed), bg: '#DA7756', bc: '#C26547' }
    ],
    h: false,
    def: 'bar',
    multi: true
  } : undefined;

  const handleAiSend = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const q = aiInput.trim();
    setAiMsgs(prev => [...prev, { sender: 'user', text: q }]);
    setAiInput('');
    setTimeout(() => {
      setAiMsgs(prev => [...prev, { sender: 'bot', text: getBotFallback(q) }]);
    }, 600);
  };

  useEffect(() => {
    if (isAiOpen && aiChatEndRef.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMsgs, isAiOpen]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview': {
        const todayAct = dashboardData?.today_activity || { new_member_registrations: 0, points_awarded: 0, encashments_pending: 0 };
        const alertMsg = dashboardData?.lapsed_members_alert?.message || "No new alerts.";
        const briefingText = `Today's Activity: <strong>${todayAct.new_member_registrations} new members</strong>, <strong>${todayAct.points_awarded} pts awarded</strong>, <strong>${todayAct.encashments_pending} pending encashments</strong>.<br/>Alert: ${alertMsg}`;

        return (
          <>
            <Briefing label="Morning Briefing" text={briefingText} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] mb-[14px]">
              <KpiStripCard title="Points Issued (MTD)" value={dashboardData?.points_issued_this_month?.toLocaleString() || "0"} sub="Based on actuals" onClick={() => handleDrill('walletflow', 'Points Issuance Flow')} />
              <KpiStripCard title="Points Redeemed (MTD)" value={dashboardData?.points_redeemed_this_month?.toLocaleString() || "0"} sub="Based on actuals" onClick={() => handleDrill('redtrend', 'Redemption Velocity')} />
              <KpiStripCard title="Redemption Rate (MTD)" value={`${dashboardData?.redemption_rate_this_month || 0}%`} sub="Issued vs Redeemed" onClick={() => handleDrill('dailyfires', 'Redemption Rate')} />
              <KpiStripCard title="Active Members" value={dashboardData?.active_members?.toLocaleString() || "0"} sub="Total active accounts" onClick={() => handleDrill('members-kpi', 'Active Member Status')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-[14px] mb-[14px]">
              <ChartCard 
                id="trend" title="Points Issued vs Redeemed" 
                acts={[{type:'bar',label:'Bar'},{type:'line',label:'Line'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#FFF7EB]',borderClass:'border-[#DA7756]',textClass:'text-[#DA7756]',label:'Opportunity',text:'Review the issuance and redemption trends to optimize point liability.'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={overviewFlowChartData}
              />
              <ChartCard 
                id="tiers" title="Members by Tier" 
                acts={[{type:'doughnut',label:'Donut'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                chartDataOverride={tiersChartData}
              />
            </div>
          </>
        );
      }
      case 'Rules Engine':
        return (
          <>
            {/* Top Control Bar */}
            <div className="flex flex-wrap gap-3 items-center mb-[20px]">
              <div className="relative">
                <select className="appearance-none bg-white border border-[#E0D8CC] rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#DA7756] cursor-pointer min-w-[140px]">
                  <option>All Categories</option>
                  <option>Collections</option>
                  <option>Marketing Engagement</option>
                  <option>Possession</option>
                  <option>Sales & Booking</option>
                  <option>Referrals</option>
                  <option>App Adoption</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#2C2C2C] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select className="appearance-none bg-white border border-[#E0D8CC] rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#DA7756] cursor-pointer min-w-[120px]">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Draft</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#2C2C2C] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <select className="appearance-none bg-white border border-[#E0D8CC] rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-[#2C2C2C] focus:outline-none focus:border-[#DA7756] cursor-pointer min-w-[140px]">
                  <option>All Rule Types</option>
                  <option>Transaction Events</option>
                  <option>Time-Based</option>
                  <option>User Actions</option>
                  <option>Milestones</option>
                  <option>Tier-Based</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#2C2C2C] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-3.5 h-3.5 text-[#A89F8E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search rules..." className="w-full bg-white border border-[#E0D8CC] rounded-full pl-9 pr-4 py-2 text-[11px] font-medium text-[#2C2C2C] focus:outline-none focus:border-[#DA7756] placeholder:text-[#A89F8E]" />
              </div>

              <button className="flex items-center gap-2 bg-[#DA7756] text-white rounded-full px-4 py-2 text-[11px] font-bold shadow-[0_2px_8px_rgba(218,119,86,.3)] hover:opacity-90 transition-opacity ml-auto cursor-pointer">
                <Settings className="w-3.5 h-3.5" /> + New Rule
              </button>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[20px]">
              {/* Card 1 */}
              <div className="bg-white border border-[#E0D8CC] border-t-4 border-t-[#DA7756] rounded-[10px] p-[16px] shadow-sm">
                <div className="text-[9px] font-bold text-[#A89F8E] uppercase tracking-wider mb-1">COLLECTIONS</div>
                <div className="text-[20px] font-bold text-[#2C2C2C] mb-1">8 rules</div>
                <div className="text-[11px] text-[#798C5E] mb-4">4,120 fires this month · 100% active</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#E2F0EC] text-[#108C72] border border-[#108C72]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">All Active</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Demand Note</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Early Payment</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[#E0D8CC] border-t-4 border-t-[#6B9BCC] rounded-[10px] p-[16px] shadow-sm">
                <div className="text-[9px] font-bold text-[#A89F8E] uppercase tracking-wider mb-1">MARKETING ENGAGEMENT</div>
                <div className="text-[20px] font-bold text-[#2C2C2C] mb-1">5 rules</div>
                <div className="text-[11px] text-[#798C5E] mb-4">3,200 fires this month · 4 active</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#FFF7EB] text-[#DA7756] border border-[#DA7756]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">1 Paused</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Email Open</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">App Login</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[#E0D8CC] border-t-4 border-t-[#8FA8A1] rounded-[10px] p-[16px] shadow-sm">
                <div className="text-[9px] font-bold text-[#A89F8E] uppercase tracking-wider mb-1">POSSESSION</div>
                <div className="text-[20px] font-bold text-[#2C2C2C] mb-1">5 rules</div>
                <div className="text-[11px] text-[#798C5E] mb-4">2,340 fires this month · All active</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#E2F0EC] text-[#108C72] border border-[#108C72]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">All Active</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Early Payment</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Docs Upload</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-[#E0D8CC] border-t-4 border-t-[#108C72] rounded-[10px] p-[16px] shadow-sm">
                <div className="text-[9px] font-bold text-[#A89F8E] uppercase tracking-wider mb-1">SALES & BOOKING</div>
                <div className="text-[20px] font-bold text-[#2C2C2C] mb-1">7 rules</div>
                <div className="text-[11px] text-[#798C5E] mb-4">1,650 fires this month · 6 active</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#FFF7EB] text-[#DA7756] border border-[#DA7756]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">1 Draft</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Token Payment</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Site Visit</span>
                </div>
              </div>

              {/* Card 5 */}
              <div className="bg-white border border-[#E0D8CC] border-t-4 border-t-[#EDC488] rounded-[10px] p-[16px] shadow-sm">
                <div className="text-[9px] font-bold text-[#A89F8E] uppercase tracking-wider mb-1">REFERRALS</div>
                <div className="text-[20px] font-bold text-[#2C2C2C] mb-1">6 rules</div>
                <div className="text-[11px] text-[#798C5E] mb-4">890 fires this month · 5 active</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#FFF7EB] text-[#DA7756] border border-[#DA7756]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">1 Paused</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Friend Referral</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Conversion</span>
                </div>
              </div>

              {/* Card 6 */}
              <div className="bg-white border border-[#E0D8CC] border-t-4 border-t-[#E7848E] rounded-[10px] p-[16px] shadow-sm">
                <div className="text-[9px] font-bold text-[#A89F8E] uppercase tracking-wider mb-1">APP ADOPTION</div>
                <div className="text-[20px] font-bold text-[#2C2C2C] mb-1">3 rules</div>
                <div className="text-[11px] text-[#798C5E] mb-4">780 fires this month · All active</div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#E2F0EC] text-[#108C72] border border-[#108C72]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">All Active</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">First Login</span>
                  <span className="bg-[#E6F0F9] text-[#2C6299] border border-[#2C6299]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">Profile Complete</span>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px] mb-[14px]">
              <div className="mb-4">
                <div className="text-[14px] font-bold text-[#2C2C2C] mb-1">All Active Rules</div>
                <div className="text-[11px] text-[#A89F8E]">34 rules · click any row to inspect</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Rule Name</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Category</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Type</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Trigger</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Points</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Fires (MTD)</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Last Fired</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { 
                        name: 'Early Demand Note Payment', 
                        category: 'Collections', catBg: 'bg-[#FFF7EB]', catText: 'text-[#DA7756]',
                        type: 'Transaction', 
                        trigger: 'Paid ≤ 5 days of demand', 
                        pts: '6,000', 
                        fires: '824', fireColor: 'text-[#DA7756]',
                        last: 'Today 11:42', 
                        status: 'Active', statusColor: 'text-[#108C72]'
                      },
                      { 
                        name: 'App Login Streak - 3 days', 
                        category: 'App Adoption', catBg: 'bg-[#F3E8FF]', catText: 'text-[#7E22CE]',
                        type: 'Engagement', 
                        trigger: '3 consecutive logins', 
                        pts: '250', 
                        fires: '412', fireColor: 'text-[#2C6299]',
                        last: 'Today 09:15', 
                        status: 'Active', statusColor: 'text-[#108C72]'
                      }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#F6F4EE]/50 transition-colors cursor-pointer border-b border-[#E0D8CC] last:border-0">
                        <td className="p-[12px_8px] font-semibold text-[#2C2C2C]">{row.name}</td>
                        <td className="p-[12px_8px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${row.catBg} ${row.catText}`}>{row.category}</span>
                        </td>
                        <td className="p-[12px_8px] text-[#2C2C2C]">{row.type}</td>
                        <td className="p-[12px_8px] text-[#2C2C2C]">{row.trigger}</td>
                        <td className="p-[12px_8px] font-bold text-[#2C2C2C]">{row.pts}</td>
                        <td className={`p-[12px_8px] font-bold ${row.fireColor}`}>{row.fires}</td>
                        <td className="p-[12px_8px] text-[#798C5E]">{row.last}</td>
                        <td className={`p-[12px_8px] font-semibold ${row.statusColor}`}>
                          <span className="text-[12px] mr-1">•</span>{row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px] relative">
              <ChartCard 
                id="rulecat" title="Rules Fired by Category — This Month" 
                acts={[{type:'bar',label:'Bar'},{type:'doughnut',label:'Donut'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#FFF7EB]',borderClass:'border-[#DA7756]',textClass:'text-[#DA7756]',label:'RULE PERFORMANCE INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
              />
              <ChartCard 
                id="dailyfires" title="Daily Rule Fires — Last 7 Days" 
                acts={[{type:'line',label:'Line'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
              />
              <button className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-[#DA7756] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(218,119,86,.4)] hover:bg-[#C26547] transition-colors cursor-pointer z-10">
                <Sparkles className="w-5 h-5 text-white" />
              </button>
            </div>
          </>
        );
      case 'Members': {
        const topEarner = membersData?.top_earners?.[0];
        const memTierDist = membersData?.tier_distribution || dashboardData?.tier_distribution || [];
        const memTiersChartData = memTierDist.length > 0 ? {
          labels: memTierDist.map((t: any) => t.name || 'Unknown'),
          values: memTierDist.map((t: any) => t.member_count || 0),
          colors: ['#C4B89D','#888780','#BA7517', '#6B9BCC', '#E7848E', '#2C2C2C'].slice(0, memTierDist.length),
          h: false,
          def: 'doughnut'
        } : undefined;

        const newMemData = membersData?.new_members_by_month || [];
        const newMemChartData = newMemData.length > 0 ? {
          labels: newMemData.map((d: any) => {
            const [y, m] = d.month.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
          }),
          values: newMemData.map((d: any) => d.count),
          colors: ['#6B9BCC'],
          h: false,
          def: 'bar'
        } : undefined;

        const formatLastActivity = (dateStr: string | null) => {
          if (!dateStr) return 'N/A';
          const d = new Date(dateStr);
          return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        };

        const lapseRate = membersData?.total_members ? ((membersData.lapsed_members / membersData.total_members) * 100).toFixed(1) : "0";

        return (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] mb-[14px]">
              <KpiStripCard title="Active Members" value={membersData?.total_members?.toLocaleString() ?? "0"} sub="Total enrolled residents" onClick={() => handleDrill('members-kpi', 'Active Member Status')} />
              <KpiStripCard title="Lapsed (>60 days)" value={membersData?.lapsed_members?.toLocaleString() ?? "0"} sub={`<span class='text-[#A32D2D] font-semibold'>${lapseRate}%</span> churn risk`} onClick={() => handleDrill('lapsed', 'Lapsed Member Analysis')} />
              <KpiStripCard title="New Members (MTD)" value={membersData?.new_members_this_month?.toLocaleString() ?? "0"} sub="Enrolled this month" />
              <KpiStripCard title="Top Earner (MTD)" value={topEarner ? topEarner.name : "N/A"} sub={topEarner ? `${topEarner.points_earned_this_month} pts earned` : "No activity"} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
              <ChartCard 
                id="tierdist" title="Tier Distribution" 
                acts={[{type:'doughnut',label:'Donut'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#FFF7EB]',borderClass:'border-[#DA7756]',textClass:'text-[#DA7756]',label:'Tier Insight',text:`You have ${memTierDist.find((t:any) => t.name === 'No Tier Assigned')?.member_count || 0} members without a tier... click to read more.`}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={memTiersChartData}
              />
              <ChartCard 
                id="newmem" title="New Member Enrollment" 
                acts={[{type:'bar',label:'Bar'},{type:'line',label:'Line'},{type:'tbl',label:'Table'}]} 
                chartDataOverride={newMemChartData}
              />
            </div>

            {/* Members List Table */}
            <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px] mb-[14px]">
              <div className="mb-4">
                <div className="text-[14px] font-bold text-[#2C2C2C] mb-1">Members List</div>
                <div className="text-[11px] text-[#A89F8E]">{membersData?.members?.length || 0} members · click any row to inspect</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Name</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Society</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Tier</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Balance</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Earned</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Redeemed</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Joined</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Last Activity</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersData?.members?.map((member: any, i: number) => (
                      <tr key={i} className="hover:bg-[#F6F4EE]/50 transition-colors cursor-pointer border-b border-[#E0D8CC] last:border-0">
                        <td className="p-[12px_8px] font-semibold text-[#2C2C2C]">{member.name}</td>
                        <td className="p-[12px_8px] text-[#2C2C2C]">{member.society}</td>
                        <td className="p-[12px_8px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${member.tier === 'No Tier Assigned' ? 'bg-[#F6F4EE] text-[#888780]' : 'bg-[#FFF7EB] text-[#BA7517]'}`}>{member.tier}</span>
                        </td>
                        <td className="p-[12px_8px] font-bold text-[#2C2C2C]">{member.points_balance}</td>
                        <td className="p-[12px_8px] font-bold text-[#108C72]">{member.points_earned}</td>
                        <td className="p-[12px_8px] font-bold text-[#A32D2D]">{member.points_redeemed}</td>
                        <td className="p-[12px_8px] text-[#798C5E]">{member.joining_date}</td>
                        <td className="p-[12px_8px] text-[#798C5E]">{formatLastActivity(member.last_activity)}</td>
                        <td className="p-[12px_8px]">
                          {member.lapsed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFF7EB] text-[#DA7756]">Lapsed</span>
                          ) : member.active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E2F0EC] text-[#108C72]">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F6F4EE] text-[#A89F8E]">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!membersData?.members || membersData.members.length === 0) && (
                      <tr>
                        <td colSpan={9} className="p-[20px] text-center text-[#A89F8E]">No members found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      }
      case 'Redemption': {
        const totalRedemptions = redemptionData?.total_redemptions_mtd ?? 0;
        const redemptionRate = redemptionData?.redemption_rate_mtd ?? 0;
        const pending = redemptionData?.pending_encashments || { count: 0, points_total: 0, amount_total_inr: 0 };
        const topCategory = redemptionData?.top_category ?? 'N/A';

        const redByType = redemptionData?.redemption_by_type || [];
        const redTypeChartData = redByType.length > 0 ? {
          labels: redByType.map((r: any) => r.type),
          values: redByType.map((r: any) => r.count),
          colors: ['#DA7756', '#108C72', '#EDC488', '#6B9BCC'],
          h: false,
          def: 'doughnut'
        } : undefined;

        const redTrend = redemptionData?.redemption_rate_trend_by_month || [];
        const redTrendChartData = redTrend.length > 0 ? {
          labels: redTrend.map((r: any) => {
            const [y, m] = r.month.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleDateString('en-GB', { month: 'short' });
          }),
          values: redTrend.map((r: any) => r.redemption_rate_pct),
          colors: ['#DA7756'],
          h: false,
          def: 'line'
        } : undefined;

        const formatReqDate = (dateStr: string) => {
          if (!dateStr) return 'N/A';
          const d = new Date(dateStr);
          return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        };

        return (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[14px] mb-[14px]">
              {/* Card 1 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between" onClick={() => handleDrill('redemption-kpi', 'Redemption Overview')}>
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Total Redemptions (MTD)</div>
                  <div className="text-[26px] font-bold text-[#2C2C2C] leading-none mb-2">{totalRedemptions.toLocaleString()}</div>
                  <div className="text-[11px] text-[#798C5E] flex items-center gap-1">
                    <span className="text-[#A89F8E]">Total actions this month</span>
                  </div>
                </div>
                <div className="h-[3px] bg-[#E0D8CC] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[#DA7756]" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between" onClick={() => handleDrill('redemption-kpi', 'Redemption Overview')}>
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Redemption Rate</div>
                  <div className="text-[26px] font-bold text-[#108C72] leading-none mb-2">{redemptionRate}%</div>
                  <div className="text-[11px] text-[#A89F8E]">MTD points redeemed vs issued</div>
                </div>
                <div className="h-[3px] bg-[#E0D8CC] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[#108C72]" style={{ width: `${Math.min(redemptionRate, 100)}%` }}></div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[#DA7756] rounded-[10px] p-[16px] flex flex-col justify-between shadow-sm">
                <div>
                  <div className="text-[10px] font-semibold text-[#DA7756] uppercase tracking-wider mb-2">Pending Encashments</div>
                  <div className="text-[26px] font-bold text-[#DA7756] leading-none mb-2">{pending.count}</div>
                  <div className="text-[11px] text-[#A89F8E]">₹{pending.amount_total_inr.toLocaleString()} outstanding</div>
                </div>
                <div className="h-[3px] bg-[#E0D8CC] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[#EDC488]" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Top Category</div>
                  <div className="text-[26px] font-bold text-[#2C2C2C] leading-none mb-2 capitalize">{topCategory}</div>
                  <div className="text-[11px] text-[#A89F8E]">Most popular redemption type</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-[14px] mb-[14px]">
              <ChartCard 
                id="redtype" title="Redemption by Type — This Month" 
                acts={[{type:'doughnut',label:'Donut'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#E2F0EC]',borderClass:'border-[#108C72]',textClass:'text-[#108C72]',label:'REDEMPTION INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={redTypeChartData}
              />
              <ChartCard 
                id="redtrend" title="Redemption Rate Trend — 6 Months" 
                acts={[{type:'line',label:'Line'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#FFF7EB]',borderClass:'border-[#DA7756]',textClass:'text-[#DA7756]',label:'TREND INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={redTrendChartData}
              />
            </div>

            {/* Pending Encashments Table */}
            <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px] mb-[14px]">
              <div className="mb-4">
                <div className="text-[14px] font-bold text-[#2C2C2C] mb-1">Pending Encashments</div>
                <div className="text-[11px] text-[#A89F8E]">{pending.count} requests · ₹{pending.amount_total_inr.toLocaleString()} total</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Member</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Points</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">₹ Value</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Requested</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Bank</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptionData?.pending_encashments_list?.map((row: any, i: number) => {
                      const isPending = row.status?.toLowerCase() === 'pending';
                      const statusColor = isPending ? 'bg-[#FFF7EB] text-[#DA7756]' : 'bg-[#E6F0F9] text-[#2C6299]';
                      return (
                        <tr key={i} className="hover:bg-[#F6F4EE]/50 transition-colors cursor-pointer border-b border-[#E0D8CC] last:border-0">
                          <td className="p-[12px_8px] font-semibold text-[#2C2C2C]">{row.member_name || row.member || 'N/A'}</td>
                          <td className="p-[12px_8px] text-[#2C2C2C]">{row.points?.toLocaleString()}</td>
                          <td className="p-[12px_8px] font-bold text-[#2C2C2C]">₹{row.amount_inr?.toLocaleString()}</td>
                          <td className="p-[12px_8px] text-[#798C5E]">{formatReqDate(row.requested_at)}</td>
                          <td className="p-[12px_8px] text-[#2C2C2C]">{row.bank_details || 'N/A'}</td>
                          <td className="p-[12px_8px]">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>{row.status || 'Pending'}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!redemptionData?.pending_encashments_list || redemptionData.pending_encashments_list.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-[20px] text-center text-[#A89F8E]">No pending encashments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <button className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-[#DA7756] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(218,119,86,.4)] hover:bg-[#C26547] transition-colors cursor-pointer z-10">
              <Sparkles className="w-5 h-5 text-white" />
            </button>
          </div>
        );
      }
      case 'Wallet': {
        const formatTs = (dateStr: string) => {
          const d = new Date(dateStr);
          return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
        };

        const flowData = walletData?.points_flow_by_month || [];
        const walletFlowChartData = flowData.length > 0 ? {
          multi: true,
          labels: flowData.map((d: any) => {
            const [y, m] = d.month.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleString('default', { month: 'short', year: 'numeric' });
          }),
          def: 'bar',
          h: false,
          datasets: [
            { label: 'Issued', data: flowData.map((d: any) => d.issued), bg: '#108C72', bc: '#108C72' },
            { label: 'Redeemed', data: flowData.map((d: any) => d.redeemed), bg: '#A32D2D', bc: '#A32D2D' },
            { label: 'Balance', data: flowData.map((d: any) => d.balance), bg: '#6B9BCC', bc: '#6B9BCC' }
          ]
        } : undefined;

        const totalOutstanding = walletData?.total_outstanding ?? 0;
        const totalRedeemed = walletData?.total_redeemed ?? 0;
        const allTimeIssued = walletData?.all_time_issued ?? 0;
        const expiredPoints = walletData?.expired_points ?? 0;
        
        // Liability based on ₹1 per point
        const totalLiability = totalOutstanding * 1;
        
        // MTD values extracted from last month in flow data
        const currentMonthData = flowData.length > 0 ? flowData[flowData.length - 1] : { issued: 0, redeemed: 0 };
        const mtdCost = currentMonthData.issued * 1;
        const mtdOutflow = currentMonthData.redeemed * 1;

        const handleExportLedger = () => {
          const exportUrl = `${getHiSocietyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_WALLET}?export=xlsx&token=${API_CONFIG.TOKEN}`;
          window.open(exportUrl, '_blank');
        };

        return (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
              {/* Card 1: Expired Points */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px] flex flex-col items-center justify-center text-center">
                <div className="text-[11px] font-bold tracking-wider text-[#798C5E] uppercase mb-4">Expired Points</div>
                <div className="text-[48px] font-bold text-[#EAB308] leading-none mb-4">{expiredPoints.toLocaleString()}</div>
                <div className="w-[120px] h-[3px] bg-[#E0D8CC] rounded-full mb-4"></div>
                <div className="text-[12px] font-medium text-[#A89F8E] mb-3">Expiry window not yet confirmed</div>
                <button className="bg-[#FFF7EB] text-[#DA7756] border border-[#DA7756]/30 px-3 py-1.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="text-[12px]">⚠️</span> CONFIRM WITH DEV TEAM
                </button>
                <div className="text-[11px] text-[#798C5E]">
                  {totalOutstanding.toLocaleString()} pts outstanding<br/>currently unaffected by expiry
                </div>
              </div>

              {/* Card 2: Wallet Summary */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px]">
                <div className="text-[14px] font-bold text-[#2C2C2C] mb-1">Wallet Summary</div>
                <div className="text-[11px] text-[#A89F8E] mb-5">Overall points distribution</div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-semibold text-[#2C2C2C]">All-time Issued</span>
                  <span className="text-[12px] font-bold text-[#6B9BCC]">{allTimeIssued.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[12px] font-semibold text-[#2C2C2C]">Total Redeemed</span>
                  <span className="text-[12px] font-bold text-[#108C72]">{totalRedeemed.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-[#E0D8CC] w-full mb-4"></div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[13px] font-bold text-[#2C2C2C]">Total Outstanding</span>
                  <span className="text-[13px] font-bold text-[#2C2C2C]">{totalOutstanding.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-[#E0D8CC] w-full mb-4"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-[#798C5E]">Cold Wallet & Active Wallet limits</span>
                  <span className="text-[12px] font-semibold text-[#A89F8E]">Unsupported</span>
                </div>
              </div>

              {/* Card 3: Liability Health */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px]">
                <div className="text-[14px] font-bold text-[#2C2C2C] mb-1">Liability Health</div>
                <div className="text-[11px] text-[#A89F8E] mb-5">Points cost - ₹1 per point</div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[13px] font-bold text-[#2C2C2C]">Total Liability</span>
                  <span className="text-[13px] font-bold text-[#DA7756]">₹{totalLiability.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-[#E0D8CC] w-full mb-4"></div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-medium text-[#798C5E]">Points cost (MTD)</span>
                  <span className="text-[12px] font-semibold text-[#2C2C2C]">₹{mtdCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[12px] font-medium text-[#798C5E]">Redemption outflow (MTD)</span>
                  <span className="text-[12px] font-semibold text-[#DA7756]">₹{mtdOutflow.toLocaleString()}</span>
                </div>
                
                <div className="bg-[#E2F0EC] border border-[#108C72]/20 rounded-[8px] p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#108C72] mb-1">CFO SUMMARY</div>
                  <div className="text-[11px] text-[#2C2C2C] leading-snug">
                    API CFO Summary is currently <span className="font-bold">Unsupported</span>. Values displayed are calculated locally based on point activity.
                  </div>
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[20px] mb-[14px]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[14px] font-bold text-[#2C2C2C] mb-1">Transaction Ledger — Recent</div>
                  <div className="text-[11px] text-[#A89F8E]">{walletData?.transaction_ledger?.length || 0} point movements · full audit trail</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#A89F8E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search member..." className="pl-9 pr-3 py-1.5 border border-[#E0D8CC] rounded-full text-[11px] w-[200px] focus:outline-none focus:border-[#DA7756] text-[#2C2C2C] placeholder:text-[#A89F8E]" />
                  </div>
                  <button onClick={handleExportLedger} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E0D8CC] rounded-full text-[11px] font-semibold text-[#2C2C2C] hover:bg-[#F6F4EE] transition-colors cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Timestamp</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Member</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Event Type</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Remarks</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Points</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Direction</th>
                      <th className="p-[10px_8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] uppercase tracking-wider text-[9px]">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletData?.transaction_ledger?.map((row: any, i: number) => {
                      const isCredit = row.direction === 'credit';
                      return (
                        <tr key={i} className="hover:bg-[#F6F4EE]/50 transition-colors cursor-pointer border-b border-[#E0D8CC] last:border-0">
                          <td className="p-[12px_8px] text-[#798C5E]">{formatTs(row.timestamp)}</td>
                          <td className="p-[12px_8px] font-semibold text-[#2C2C2C]">{row.member}</td>
                          <td className="p-[12px_8px] text-[#2C2C2C]">{row.point_type}</td>
                          <td className="p-[12px_8px] text-[#2C2C2C]">{row.remarks}</td>
                          <td className={`p-[12px_8px] font-bold ${isCredit ? 'text-[#108C72]' : 'text-[#A32D2D]'}`}>{isCredit ? '+' : '-'}{row.amount}</td>
                          <td className="p-[12px_8px]">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isCredit ? 'bg-[#E2F0EC] text-[#108C72]' : 'bg-[#F9E8E8] text-[#A32D2D]'}`}>{isCredit ? 'Credit' : 'Debit'}</span>
                          </td>
                          <td className="p-[12px_8px] font-semibold text-[#2C2C2C]">{row.balance_after}</td>
                        </tr>
                      );
                    })}
                    {(!walletData?.transaction_ledger || walletData.transaction_ledger.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-[20px] text-center text-[#A89F8E]">No transactions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Graph */}
            <div className="grid grid-cols-1 gap-[14px] mb-[14px]">
              <ChartCard 
                id="walletflow" title="Points Flow — Issued vs Redeemed vs Balance" 
                acts={[{type:'bar',label:'Bar'},{type:'line',label:'Line'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#E6F0F9]',borderClass:'border-[#6B9BCC]',textClass:'text-[#2C6299]',label:'WALLET HEALTH INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={walletFlowChartData}
              />
            </div>

            <button className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-[#DA7756] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(218,119,86,.4)] hover:bg-[#C26547] transition-colors cursor-pointer z-10">
              <Sparkles className="w-5 h-5 text-white" />
            </button>
          </div>
        );
      }
      case 'Orders': {
        const totalOrders = ordersData?.total_orders ?? 0;
        const stuckOrders = ordersData?.stuck_orders ?? 0;
        const stuckPercent = ordersData?.stuck_percentage ?? 0;
        const stuckCustomer = ordersData?.stuck_customer_concentration;

        const orderAgeDist = ordersData?.order_age_distribution || [];
        const orderAgeChartData = orderAgeDist.length > 0 ? {
          labels: orderAgeDist.map((d: any) => d.bucket),
          values: orderAgeDist.map((d: any) => d.count),
          colors: ['#6B9BCC', '#6B9BCC', '#6B9BCC', '#6B9BCC'], // Provide enough colors for the bars
          h: false,
          def: 'bar'
        } : undefined;

        const fVsS = ordersData?.fulfilled_vs_stuck || { fulfilled: 0, stuck: 0 };
        const fVsSChartData = {
          labels: ['Fulfilled', 'Stuck'],
          values: [fVsS.fulfilled, fVsS.stuck],
          colors: ['#108C72', '#E7848E'],
          h: false,
          def: 'doughnut'
        };

        const formatDt = (dateStr: string) => {
          if (!dateStr) return 'N/A';
          const d = new Date(dateStr);
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
              {/* Card 1 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[#DA7756] transition-colors" onClick={() => handleDrill('orders-total', 'Order Pipeline')}>
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Total Orders</div>
                  <div className="text-[26px] font-bold text-[#2C2C2C] leading-none mb-2">{totalOrders}</div>
                  <div className="text-[11px] text-[#A89F8E]">All time</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[#DA7756] transition-colors" onClick={() => handleDrill('orders-stuck', 'Stuck Orders Analysis')}>
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Stuck — Paid, Not Fulfilled</div>
                  <div className="text-[26px] font-bold text-[#E7848E] leading-none mb-2">{stuckOrders}</div>
                  <div className="text-[11px] text-[#A89F8E]">{stuckPercent}% of all orders</div>
                </div>
                <div className="h-[3px] bg-[#E0D8CC] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[#E7848E]" style={{ width: `${stuckPercent}%` }}></div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[#DA7756] transition-colors" onClick={() => handleDrill('orders-customer', 'Impacted Customer')}>
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">All {stuckOrders} Belong To</div>
                  <div className="text-[26px] font-bold text-[#2C2C2C] leading-none mb-2">{stuckCustomer ? stuckCustomer.name : 'N/A'}</div>
                  <div className="text-[11px] text-[#A89F8E]">{stuckCustomer ? `Oldest: ${stuckCustomer.oldest_days} days` : 'No stuck concentration data'}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
              <ChartCard 
                id="orderage" title="Order Age (Days since creation)" 
                acts={[{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                chartDataOverride={orderAgeChartData}
              />
              <ChartCard 
                id="orderstatus" title="Fulfilment Status" 
                acts={[{type:'doughnut',label:'Donut'},{type:'tbl',label:'Table'}]} 
                chartDataOverride={fVsSChartData}
              />
            </div>
            <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[14px] mb-[14px]">
              <div className="text-[12px] font-semibold text-[#2C2C2C] mb-2.5">Stuck Orders Action List (90+ Days)</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E]">Order ID</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E]">Customer</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E]">Amount</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E]">Created</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E]">Status</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData?.stuck_orders_list?.map((o: any, i: number) => (
                      <tr key={i} className="hover:bg-[#F6F4EE]/50 transition-colors cursor-pointer" onClick={() => handleDrill(i===0?'ord-1':'ord-2', `Order Details: ${o.id}`)}>
                        <td className="p-[8px] border-b border-[#E0D8CC] font-semibold">{o.id}</td>
                        <td className="p-[8px] border-b border-[#E0D8CC]">{o.customer_name || o.customer || 'N/A'}</td>
                        <td className="p-[8px] border-b border-[#E0D8CC]">₹{o.amount}</td>
                        <td className="p-[8px] border-b border-[#E0D8CC] text-[#798C5E]">{formatDt(o.created_at)}</td>
                        <td className="p-[8px] border-b border-[#E0D8CC]">
                          <span className="bg-[#EDC488]/25 text-[#8A5A00] border border-[#EDC488]/50 text-[9px] font-semibold px-[7px] py-[2px] rounded-full">{o.status || 'Pending'}</span>
                        </td>
                        <td className="p-[8px] border-b border-[#E0D8CC] text-right">
                          <button className="bg-transparent border border-[#DA7756] text-[#DA7756] rounded-[6px] px-2 py-1 text-[10px] font-semibold cursor-pointer hover:bg-[#DA7756] hover:text-white transition-colors">Force Fulfil</button>
                        </td>
                      </tr>
                    ))}
                    {(!ordersData?.stuck_orders_list || ordersData.stuck_orders_list.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-[20px] text-center text-[#A89F8E]">No stuck orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      }
      case 'Store & Inventory': {
        const liveInStore = storeData?.live_in_store ?? 0;
        const liveInStoreTotal = storeData?.live_in_store_total ?? 0;
        const sittingInAggregator = storeData?.sitting_in_aggregator ?? 0;
        const daysLive = storeData?.days_live ?? 0;
        
        const availableByCategory = storeData?.available_by_category || [];
        const sortedCategories = [...availableByCategory].sort((a, b) => b.count - a.count).filter(c => c.category !== 'Uncategorized');
        const top3 = sortedCategories.slice(0, 3);
        const topColors = ['#108C72', '#EDC488', '#6B9BCC'];

        const funnelLabels = (storeData?.catalog_by_category || []).map((c: any) => c.category);
        const funnelCatalog = (storeData?.catalog_by_category || []).map((c: any) => c.count);
        const funnelAdded = funnelLabels.map((label: string) => {
          const found = (storeData?.added_by_category || []).find((a: any) => a.category === label);
          return found ? found.count : 0;
        });

        const funnelChartData = funnelLabels.length > 0 ? {
          labels: funnelLabels,
          datasets: [
            { label: 'Catalog', data: funnelCatalog, bg: '#E0D8CC', bc: '#C4B89D' },
            { label: 'Added to Store', data: funnelAdded, bg: '#DA7756', bc: '#C26547' }
          ],
          h: false,
          def: 'bar',
          multi: true
        } : undefined;

        const catMixLabels = sortedCategories.map((c: any) => c.category);
        const catMixValues = sortedCategories.map((c: any) => c.count);
        const catMixChartData = catMixLabels.length > 0 ? {
          labels: catMixLabels,
          values: catMixValues,
          colors: ['#DA7756', '#108C72', '#EDC488', '#6B9BCC', '#BA7517', '#E7848E'],
          h: false,
          def: 'doughnut'
        } : undefined;

        return (
          <div className="relative">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
              {/* Card 1 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Live In Store</div>
                  <div className="text-[26px] font-bold text-[#E7848E] leading-none mb-2">{liveInStore}</div>
                  <div className="text-[11px] text-[#A89F8E]">Every category, {liveInStoreTotal} items published</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[#DA7756] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Sitting In Aggregator</div>
                  <div className="text-[26px] font-bold text-[#108C72] leading-none mb-2">{sittingInAggregator.toLocaleString()}</div>
                  <div className="text-[11px] text-[#A89F8E]">Ready to publish today</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">Days Programme Live</div>
                  <div className="text-[26px] font-bold text-[#BA7517] leading-none mb-2">{daysLive}</div>
                  <div className="text-[11px] text-[#A89F8E]">Since programme went live</div>
                </div>
              </div>
            </div>

            {/* Bottom Cards Row */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
                {top3.map((cat: any, i: number) => {
                  const totalAvail = availableByCategory.reduce((sum: number, c: any) => sum + c.count, 0);
                  const pct = totalAvail > 0 ? Math.round((cat.count / totalAvail) * 100) : 0;
                  return (
                    <div key={i} className="bg-white border border-[#E0D8CC] rounded-[10px] p-[16px] flex flex-col justify-between" style={{ borderTop: `3px solid ${topColors[i % topColors.length]}` }}>
                      <div>
                        <div className="text-[10px] font-semibold text-[#798C5E] uppercase tracking-wider mb-2">{cat.category}</div>
                        <div className="text-[26px] font-bold text-[#2C2C2C] leading-none mb-2">{cat.count.toLocaleString()}</div>
                        <div className="text-[11px] text-[#A89F8E]">{pct}% of available inventory</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
              <ChartCard 
                id="funnel" title="The Funnel — Where It Breaks" 
                acts={[{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#FFF7EB]',borderClass:'border-[#DA7756]',textClass:'text-[#DA7756]',label:'STORE PIPELINE INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={funnelChartData}
              />
              <ChartCard 
                id="catmix" title="Category Composition" 
                acts={[{type:'doughnut',label:'Donut'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[#E6F0F9]',borderClass:'border-[#6B9BCC]',textClass:'text-[#2C6299]',label:'CATEGORY PRIORITY INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={catMixChartData}
              />
            </div>

            {/* How To Fix Table */}
            <div className="bg-white border border-[#E0D8CC] rounded-[10px] p-[14px] mb-[14px]">
              <div className="text-[12px] font-semibold text-[#2C2C2C] mb-2.5">AI Recommended Steps to Fix Pipeline</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] w-[60px]">Step</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E]">Action</th>
                      <th className="p-[8px] border-b border-[#E0D8CC] bg-[#F6F4EE] font-semibold text-[#798C5E] w-[150px]">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeData?.how_to_fix?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-[#F6F4EE]/50 transition-colors">
                        <td className="p-[8px] border-b border-[#E0D8CC] font-semibold text-[#DA7756]">Step {row.step}</td>
                        <td className="p-[8px] border-b border-[#E0D8CC] text-[#2C2C2C]">{row.action}</td>
                        <td className="p-[8px] border-b border-[#E0D8CC] text-[#798C5E] font-medium">{row.owner}</td>
                      </tr>
                    ))}
                    {(!storeData?.how_to_fix || storeData.how_to_fix.length === 0) && (
                      <tr>
                        <td colSpan={3} className="p-[20px] text-center text-[#A89F8E]">No recommendations available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-[#DA7756] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(218,119,86,.4)] hover:bg-[#C26547] transition-colors cursor-pointer z-10">
              <Sparkles className="w-5 h-5 text-white" />
            </button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F4EE] font-[Poppins] text-[#2C2C2C]">
      {/* Topbar */}
      <div className="flex items-center justify-between bg-white border-b border-[#C4B89D] px-5 h-[60px] sticky top-0 z-[300] shadow-[0_1px_6px_rgba(44,44,44,.08)]">

        {/* ── LEFT GROUP ── */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-[#DA7756] rounded-lg flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(218,119,86,.3)]">
              <span className="text-white font-bold text-[15px] leading-none">L</span>
            </div>
            <div>
              <div className="text-[13.5px] font-bold text-[#2C2C2C] leading-tight">Loyalty Rule Engine</div>
              <div className="text-[8px] text-[#A89F8E] font-medium tracking-[0.12em] uppercase">LOCKATED · GOPHYIGITALWORK</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E0D8CC] shrink-0 mx-1"></div>

          {/* Home Button */}
          <button
            onClick={() => navigate('/loyalty/dashboard')}
            className="flex items-center gap-1.5 bg-[#DA7756] text-white border-none rounded-[7px] px-3 py-[6px] text-[11px] font-semibold cursor-pointer shadow-[0_2px_6px_rgba(218,119,86,.3)] transition-all hover:opacity-90 hover:-translate-y-px shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E0D8CC] shrink-0 mx-1"></div>

          {/* Property / Programme Selector */}
          <div className="relative shrink-0">
            <button
              className="flex items-center gap-2 bg-[#FAFAF8] border border-[#D4C9B5] rounded-[7px] px-3 py-[6px] text-[11px] font-semibold text-[#2C2C2C] cursor-pointer transition-colors hover:border-[#DA7756] hover:bg-[#FFF7EB] hover:text-[#DA7756]"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Building2 className="w-3.5 h-3.5 text-[#798C5E]" />
              <span>Prestige Realty — Main Programme</span>
              <ChevronDown className="w-3 h-3 text-[#798C5E]" />
            </button>
            {isFilterOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 bg-white border border-[#C4B89D] rounded-[10px] shadow-[0_8px_24px_rgba(44,44,44,.12)] p-2.5 w-[270px] z-[301]">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#798C5E] px-2 mb-1.5">Programme</div>
                <div className="flex flex-col gap-0.5 mb-2.5 border-b border-[#E0D8CC] pb-2.5">
                  {['Main Programme', 'Referral Programme', 'Partner Programme'].map(opt => (
                    <div key={opt} className={`flex items-center gap-2 px-2 py-[6px] text-[11px] font-medium rounded-[6px] cursor-pointer ${opt === 'Main Programme' ? 'bg-[#FFF7EB] text-[#DA7756]' : 'text-[#2C2C2C] hover:bg-[#F6F4EE]'}`}>
                      <Building2 className="w-3 h-3 shrink-0" /> Prestige Realty — {opt}
                    </div>
                  ))}
                </div>
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-[#798C5E] px-2 mb-1.5">Date Range</div>
                <div className="flex flex-col gap-0.5">
                  {['Today', 'Last 7 Days', 'This Month', 'Last Month', 'Custom Date Range'].map(opt => (
                    <div 
                      key={opt} 
                      onClick={() => { setDateFilter(opt); setIsFilterOpen(false); }}
                      className={`px-2 py-[6px] text-[11px] font-medium rounded-[6px] cursor-pointer ${opt === dateFilter ? 'bg-[#FFF7EB] text-[#DA7756]' : 'text-[#2C2C2C] hover:bg-[#F6F4EE]'}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT GROUP ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Review Build badge */}
          <div key="review-build-badge-fixed" className="!flex !visible min-w-max items-center gap-1.5 text-[10px] text-[#798C5E] font-medium border border-[#D8D0C2] rounded-[6px] px-2.5 py-1.5 bg-[#F6F4EE] whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#108C72] shrink-0"></span>
            Review Build · Jun 2026
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E0D8CC] shrink-0"></div>

          {/* Calendar Month Picker */}
          <button className="flex items-center gap-1.5 border border-[#D4C9B5] rounded-[7px] px-2.5 py-[6px] text-[11px] font-semibold text-[#2C2C2C] bg-white cursor-pointer hover:border-[#DA7756] hover:bg-[#FFF7EB] hover:text-[#DA7756] transition-colors whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-[#DA7756]" />
            {dateFilter}
            <ChevronDown className="w-3 h-3 text-[#A89F8E]" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E0D8CC] shrink-0"></div>

          {/* Datetime */}
          <div className="hidden xl:block text-[10.5px] text-[#798C5E] font-medium whitespace-nowrap tabular-nums">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[#E0D8CC] hidden xl:block shrink-0"></div>

          {/* Programme Admin button */}
          <button
            className="flex items-center gap-1.5 bg-[#DA7756] text-white border-none rounded-[7px] px-3 py-[6px] text-[11px] font-semibold cursor-pointer shadow-[0_2px_6px_rgba(218,119,86,.3)] transition-all hover:opacity-90 hover:-translate-y-px whitespace-nowrap"
            onClick={() => setIsAiOpen(true)}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Programme Admin</span>
          </button>

          {/* PA Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#2C2C2C] text-white flex items-center justify-center text-[10.5px] font-bold shrink-0 cursor-pointer hover:bg-[#DA7756] transition-colors shadow-[0_2px_4px_rgba(44,44,44,.2)]">
            PA
          </div>
        </div>
      </div>

      {/* TabNav */}
      <div className="flex gap-0 px-5 bg-white border-b border-[#C4B89D] sticky top-[60px] z-[299] overflow-x-auto">
        {tabs.map(tab => (
          <div 
            key={tab}
            className={`flex items-center gap-[5px] px-[14px] py-[10px] border-b-2 text-[10.5px] cursor-pointer whitespace-nowrap transition-all duration-150 mb-[-1px] ${activeTab === tab ? 'text-[#DA7756] border-[#DA7756] font-semibold' : 'border-transparent font-medium text-[#798C5E] hover:text-[#DA7756]'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Overview' && <Activity className="w-3.5 h-3.5" />}
            {tab === 'Rules Engine' && <FileText className="w-3.5 h-3.5" />}
            {tab === 'Members' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab === 'Redemption' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab === 'Wallet' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab === 'Orders' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab === 'Store & Inventory' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="p-5 max-w-[1400px] mx-auto pb-20">
        {renderTabContent()}
      </div>

      {/* Drill Panel Overlay */}
      {drillData && (
        <div className="fixed inset-0 bg-[#2C2C2C]/40 backdrop-blur-sm z-[9000] flex justify-end">
          <div className="w-full max-w-[420px] bg-white h-full shadow-[-4px_0_24px_rgba(44,44,44,.1)] flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-[14px_20px] border-b-2 border-[#C4B89D] bg-[#F6F4EE]">
              <div className="text-[14px] font-bold text-[#2C2C2C]">{drillData.title}</div>
              <button className="bg-transparent border-none text-[#798C5E] cursor-pointer p-1 rounded-full hover:bg-white transition-colors" onClick={() => setDrillData(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-[20px] pb-[80px]" dangerouslySetInnerHTML={{ __html: drillData.content }}></div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {isAiOpen && (
        <div className="fixed bottom-[20px] right-[20px] w-[340px] h-[520px] bg-white rounded-[12px] shadow-[0_8px_32px_rgba(44,44,44,.15)] border border-[#C4B89D] flex flex-col z-[8000] overflow-hidden">
          <div className="flex items-center justify-between p-[14px] bg-[#2C2C2C] text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#DA7756]" />
              <span className="font-bold text-[12px]">Programme Assistant</span>
            </div>
            <button className="bg-transparent border-none text-white/70 cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors" onClick={() => setIsAiOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-[14px] bg-[#F6F4EE] flex flex-col gap-3">
            {aiMsgs.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-[10px_12px] text-[11px] leading-relaxed ${msg.sender === 'user' ? 'bg-[#DA7756] text-white rounded-[12px_12px_0_12px] self-end' : 'bg-white text-[#2C2C2C] border border-[#E0D8CC] rounded-[12px_12px_12px_0] self-start shadow-sm'}`}>
                {msg.text}
              </div>
            ))}
            <div ref={aiChatEndRef} />
          </div>
          <div className="p-3 border-t border-[#E0D8CC] bg-white">
            <form onSubmit={handleAiSend} className="relative">
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask about rules, redemptions, etc..." className="w-full bg-[#F6F4EE] border border-[#C4B89D] rounded-full px-[14px] py-[8px] pr-10 text-[11px] font-[Poppins] outline-none transition-colors focus:border-[#DA7756] focus:bg-white" />
              <button type="submit" className="absolute right-1 top-1 bottom-1 w-7 flex items-center justify-center bg-[#DA7756] text-white rounded-full border-none cursor-pointer shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50" disabled={!aiInput.trim()}>
                ↑
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Required Keyframes */}
      <style dangerouslySetInnerHTML={{__html: "@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } } .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }"}} />
    </div>
  );
}
