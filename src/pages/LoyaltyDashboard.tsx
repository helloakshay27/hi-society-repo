import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ChevronDown, Download, Search, X, ArrowLeft, Calendar, Sparkles, Settings, LayoutDashboard, Sliders, Users, Gift, Wallet, ShoppingBag, Store, Coins, TrendingUp, AlertTriangle, UserCheck, Award, Clock, Tag, Package, ShieldCheck, Timer, RefreshCw } from 'lucide-react';
import { Briefing, ChartCard, KpiStripCard } from './LoyaltyDashboardComponents';
import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../config/apiConfig';
import {
  CHART_COLORS,
  DATE_PRESETS,
  DatePreset,
  fetchLoyalty,
  fmtNum,
  formatMonth,
  getDateRange,
  getLoyaltyBaseUrl,
  getLoyaltyErrorMessage,
  getUserInitials,
  toIsoDate,
} from './LoyaltyDashboardApi';
import { API_CONFIG } from '../config/apiConfig';
import '@/styles/theme.css';

const DrillStat = ({ value, label }: { value: React.ReactNode; label: string }) => (
  <div className="bg-[var(--loyalty-bg)] rounded-[8px] p-2.5 flex-1 text-center min-w-[80px]">
    <div className="text-[18px] font-bold text-[var(--loyalty-text)]">{value}</div>
    <div className="text-[9px] text-[var(--loyalty-green)] mt-0.5">{label}</div>
  </div>
);

const DrillRow = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div className="flex justify-between items-center gap-3 py-1.5 border-b border-[var(--loyalty-divider)] last:border-b-0 text-[11px]">
    <span>{label}</span>
    <span className="font-semibold text-right">{value}</span>
  </div>
);

const DrillSection = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--loyalty-green)] mt-4 mb-1">{children}</div>
);

const DrillEmpty = () => <div className="py-3 text-[11px] text-[var(--loyalty-subtle)]">No data returned for this period.</div>;

export function LoyaltyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [drillData, setDrillData] = useState<{ title: string; body: React.ReactNode } | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DatePreset>('This Month');
  const [customRange, setCustomRange] = useState(() => {
    const today = new Date();
    return { from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: toIsoDate(today) };
  });
  const [draftRange, setDraftRange] = useState(customRange);
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState('All Categories');
  const [ruleStatusFilter, setRuleStatusFilter] = useState('All Statuses');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  const dateParams = getDateRange(dateFilter, customRange);
  const dateKey = `${dateParams.from ?? ''}_${dateParams.to ?? ''}`;
  const dateLabel = dateFilter === 'Custom' ? `${dateParams.from} → ${dateParams.to}` : dateFilter;

  const [aiMsgs, setAiMsgs] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: 'Hi! Ask me about members, points, redemptions, orders, the store or rules — I answer from the data loaded on this dashboard.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  const tabs = ['Overview', 'Rules Engine', 'Members', 'Redemption', 'Wallet', 'Orders', 'Store & Inventory'];

  /* close the date dropdown on outside click */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const useLoyaltyQuery = (name: string, endpoint: string, dated = true) =>
    useQuery({
      queryKey: ['loyalty-dashboard', name, dated ? dateKey : 'all-time'],
      queryFn: () => fetchLoyalty(endpoint, dated ? dateParams : {}),
      retry: 1,
      staleTime: 60_000,
    });

  const overviewQuery = useLoyaltyQuery('overview', ENDPOINTS.LOYALTY_DASHBOARD_OVERVIEW);
  const membersQuery = useLoyaltyQuery('members', ENDPOINTS.LOYALTY_DASHBOARD_MEMBERS);
  const walletQuery = useLoyaltyQuery('wallet', ENDPOINTS.LOYALTY_DASHBOARD_WALLET);
  const ordersQuery = useLoyaltyQuery('orders', ENDPOINTS.LOYALTY_DASHBOARD_ORDERS, false);
  const storeQuery = useLoyaltyQuery('store', ENDPOINTS.LOYALTY_DASHBOARD_STORE, false);
  const redemptionQuery = useLoyaltyQuery('redemption', ENDPOINTS.LOYALTY_DASHBOARD_REDEMPTION);
  const ruleSummaryQuery = useLoyaltyQuery('rule-summary', ENDPOINTS.LOYALTY_DASHBOARD_RULE_SUMMARY);
  const rulesQuery = useLoyaltyQuery('rules', ENDPOINTS.LOYALTY_DASHBOARD_RULES);
  const firesByCategoryQuery = useLoyaltyQuery('fires-by-category', ENDPOINTS.LOYALTY_DASHBOARD_FIRES_BY_CATEGORY);
  const dailyFiresQuery = useLoyaltyQuery('daily-fires', ENDPOINTS.LOYALTY_DASHBOARD_DAILY_FIRES);

  const dashboardData = overviewQuery.data;
  const membersData = membersQuery.data;
  const walletData = walletQuery.data;
  const ordersData = ordersQuery.data;
  const storeData = storeQuery.data;
  const redemptionData = redemptionQuery.data;
  const ruleSummaryData = ruleSummaryQuery.data;
  const activeRulesData = rulesQuery.data;
  const firesByCategoryData = firesByCategoryQuery.data;
  const dailyFiresData = dailyFiresQuery.data;

  /* queries backing the tab currently on screen — drives the loading / error banner */
  const tabQueries: Record<string, any[]> = {
    'Overview': [overviewQuery],
    'Rules Engine': [ruleSummaryQuery, rulesQuery, firesByCategoryQuery, dailyFiresQuery],
    'Members': [membersQuery],
    'Redemption': [redemptionQuery],
    'Wallet': [walletQuery],
    'Orders': [ordersQuery],
    'Store & Inventory': [storeQuery],
  };
  const activeQueries = tabQueries[activeTab] || [];
  const isTabLoading = activeQueries.some((q) => q.isLoading);
  const tabError = activeQueries.find((q) => q.isError)?.error;
  const retryTab = () => activeQueries.forEach((q) => q.refetch());

  const tierDistribution = dashboardData?.tier_distribution || [];
  const tiersChartData = tierDistribution.length > 0 ? {
    labels: tierDistribution.map((t: any) => t.name || 'Unknown'),
    values: tierDistribution.map((t: any) => t.member_count || 0),
    colors: CHART_COLORS.slice(0, tierDistribution.length),
    h: false,
    def: 'doughnut'
  } : undefined;

  const overviewFlow = dashboardData?.points_flow_by_month || [];
  const overviewFlowChartData = overviewFlow.length > 0 ? {
    labels: overviewFlow.map((f: any) => formatMonth(f.month)),
    datasets: [
      { label: 'Issued', data: overviewFlow.map((f: any) => f.issued), bg: CHART_COLORS[1], bc: CHART_COLORS[1] },
      { label: 'Redeemed', data: overviewFlow.map((f: any) => f.redeemed), bg: CHART_COLORS[0], bc: CHART_COLORS[0] }
    ],
    h: false,
    def: 'bar',
    multi: true
  } : undefined;

  /* ── Drill panels, built from the loaded API data ── */
  const openDrill = (id: string, title: string, row?: any) => {
    let body: React.ReactNode = <DrillEmpty />;
    if (id === 'members-kpi') {
      const tiers = membersData?.tier_distribution || tierDistribution;
      body = (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={fmtNum(dashboardData?.active_members ?? membersData?.total_members)} label="Active Members" />
            <DrillStat value={fmtNum(membersData?.new_members_this_month)} label="New (MTD)" />
            <DrillStat value={fmtNum(membersData?.lapsed_members)} label="Lapsed (>60d)" />
          </div>
          <DrillSection>By Tier</DrillSection>
          {tiers.length ? tiers.map((t: any) => <DrillRow key={t.id ?? t.name} label={t.name} value={`${fmtNum(t.member_count)} members`} />) : <DrillEmpty />}
        </>
      );
    } else if (id === 'walletflow') {
      body = overviewFlow.length ? (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={fmtNum(dashboardData?.points_issued_this_month)} label="Issued (MTD)" />
            <DrillStat value={fmtNum(dashboardData?.points_redeemed_this_month)} label="Redeemed (MTD)" />
          </div>
          <DrillSection>By Month (issued / redeemed)</DrillSection>
          {overviewFlow.map((f: any) => <DrillRow key={f.month} label={formatMonth(f.month)} value={`${fmtNum(f.issued)} / ${fmtNum(f.redeemed)}`} />)}
        </>
      ) : <DrillEmpty />;
    } else if (id === 'redtrend') {
      const trend = redemptionData?.redemption_rate_trend_by_month || [];
      body = (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={`${dashboardData?.redemption_rate_this_month ?? redemptionData?.redemption_rate_mtd ?? 0}%`} label="Rate (MTD)" />
            <DrillStat value={fmtNum(redemptionData?.total_redemptions_mtd)} label="Redemptions (MTD)" />
          </div>
          <DrillSection>Redemption Rate by Month</DrillSection>
          {trend.length ? trend.map((r: any) => <DrillRow key={r.month} label={formatMonth(r.month)} value={`${r.redemption_rate_pct ?? 0}%`} />) : <DrillEmpty />}
        </>
      );
    } else if (id === 'lapsed') {
      const lapsed = (membersData?.members || []).filter((m: any) => m.lapsed);
      body = (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={fmtNum(membersData?.lapsed_members)} label="Lapsed Members" />
            <DrillStat value={fmtNum(membersData?.total_members)} label="Total Members" />
          </div>
          <DrillSection>Lapsed Members</DrillSection>
          {lapsed.length ? lapsed.map((m: any, i: number) => <DrillRow key={i} label={m.name} value={`${fmtNum(m.points_balance)} pts`} />) : <DrillEmpty />}
        </>
      );
    } else if (id === 'redemption-kpi') {
      const byType = redemptionData?.redemption_by_type || [];
      body = (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={fmtNum(redemptionData?.total_redemptions_mtd)} label="Redemptions" />
            <DrillStat value={`${redemptionData?.redemption_rate_mtd ?? 0}%`} label="Rate" />
            <DrillStat value={fmtNum(redemptionData?.pending_encashments?.count)} label="Pending Encashments" />
          </div>
          <DrillSection>By Type</DrillSection>
          {byType.length ? byType.map((r: any) => <DrillRow key={r.type} label={r.type} value={fmtNum(r.count)} />) : <DrillEmpty />}
        </>
      );
    } else if (id === 'orders-total') {
      const ages = ordersData?.order_age_distribution || [];
      body = (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={fmtNum(ordersData?.total_orders)} label="Total" />
            <DrillStat value={fmtNum(ordersData?.fulfilled_vs_stuck?.fulfilled)} label="Fulfilled" />
            <DrillStat value={fmtNum(ordersData?.stuck_orders)} label="Stuck" />
          </div>
          <DrillSection>Order Age</DrillSection>
          {ages.length ? ages.map((a: any) => <DrillRow key={a.bucket} label={a.bucket} value={fmtNum(a.count)} />) : <DrillEmpty />}
        </>
      );
    } else if (id === 'orders-stuck' || id === 'orders-customer') {
      const list = ordersData?.stuck_orders_list || [];
      const customer = ordersData?.stuck_customer_concentration;
      body = (
        <>
          <div className="flex gap-2 mb-2 flex-wrap">
            <DrillStat value={fmtNum(ordersData?.stuck_orders)} label="Stuck Orders" />
            <DrillStat value={`${ordersData?.stuck_percentage ?? 0}%`} label="Of All Orders" />
            {customer?.oldest_days != null && <DrillStat value={fmtNum(customer.oldest_days)} label="Oldest (days)" />}
          </div>
          {customer?.name && <DrillRow label="Most affected customer" value={customer.name} />}
          <DrillSection>Stuck Orders</DrillSection>
          {list.length ? list.map((o: any, i: number) => <DrillRow key={o.id ?? i} label={`${o.id} · ${o.customer_name || o.customer || 'N/A'}`} value={`₹${fmtNum(o.amount)}`} />) : <DrillEmpty />}
        </>
      );
    } else if (id === 'order' && row) {
      body = (
        <>
          <DrillRow label="Order ID" value={row.id} />
          <DrillRow label="Customer" value={row.customer_name || row.customer || 'N/A'} />
          <DrillRow label="Amount" value={`₹${fmtNum(row.amount)}`} />
          <DrillRow label="Created" value={row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'} />
          <DrillRow label="Status" value={row.status || 'Pending'} />
        </>
      );
    }
    setDrillData({ title, body });
  };

  /* ── Assistant: short answers computed from the loaded data ── */
  const answerFromData = (q: string): string => {
    const l = q.toLowerCase();
    if (l.includes('rule') || l.includes('fire')) {
      const cats = ruleSummaryData?.categories || [];
      if (!cats.length) return 'No rule summary is available for this period yet.';
      const total = cats.reduce((s: number, c: any) => s + Number(c.rule_count || 0), 0);
      const fires = cats.reduce((s: number, c: any) => s + Number(c.fires_this_month || 0), 0);
      return `There are ${fmtNum(total)} rules across ${cats.length} categories (${cats.map((c: any) => `${c.category}: ${c.rule_count}`).join(', ')}), with ${fmtNum(fires)} fires this month.`;
    }
    if (l.includes('redeem') || l.includes('redemption') || l.includes('encash')) {
      if (!redemptionData) return 'Redemption data has not loaded yet — open the Redemption tab and try again.';
      return `${fmtNum(redemptionData.total_redemptions_mtd)} redemptions this period at a ${redemptionData.redemption_rate_mtd ?? 0}% redemption rate. ${fmtNum(redemptionData.pending_encashments?.count)} encashments are pending (₹${fmtNum(redemptionData.pending_encashments?.amount_total_inr)}).`;
    }
    if (l.includes('order') || l.includes('stuck')) {
      if (!ordersData) return 'Order data has not loaded yet.';
      return `${fmtNum(ordersData.total_orders)} orders in total, ${fmtNum(ordersData.stuck_orders)} stuck (paid but not fulfilled, ${ordersData.stuck_percentage ?? 0}%).`;
    }
    if (l.includes('store') || l.includes('inventory') || l.includes('item')) {
      if (!storeData) return 'Store data has not loaded yet.';
      return `${fmtNum(storeData.live_in_store)} items are live in the store and ${fmtNum(storeData.sitting_in_aggregator)} are available in the aggregator.`;
    }
    if (l.includes('wallet') || l.includes('liability') || l.includes('outstanding') || l.includes('expir')) {
      if (!walletData) return 'Wallet data has not loaded yet.';
      return `${fmtNum(walletData.total_outstanding)} points are outstanding (₹${fmtNum(walletData.total_outstanding)} liability at ₹1/pt). ${fmtNum(walletData.all_time_issued)} issued and ${fmtNum(walletData.total_redeemed)} redeemed all-time; ${fmtNum(walletData.expired_points)} expired.`;
    }
    if (l.includes('member') || l.includes('tier') || l.includes('lapse')) {
      if (!membersData && !dashboardData) return 'Member data has not loaded yet.';
      return `${fmtNum(dashboardData?.active_members ?? membersData?.total_members)} active members, ${fmtNum(membersData?.new_members_this_month)} new this period and ${fmtNum(membersData?.lapsed_members)} lapsed (>60 days).`;
    }
    if (!dashboardData) return 'The overview has not loaded yet. Try again in a moment.';
    return `This period: ${fmtNum(dashboardData.points_issued_this_month)} points issued, ${fmtNum(dashboardData.points_redeemed_this_month)} redeemed (${dashboardData.redemption_rate_this_month ?? 0}%), ${fmtNum(dashboardData.active_members)} active members. Ask about rules, members, redemptions, wallet, orders or the store.`;
  };

  const handleAiSend = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const q = aiInput.trim();
    setAiMsgs(prev => [...prev, { sender: 'user', text: q }, { sender: 'bot', text: answerFromData(q) }]);
    setAiInput('');
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
        const alertMsg = String(dashboardData?.lapsed_members_alert?.message || 'No new alerts.')
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const briefingText = `Today: <strong>${fmtNum(todayAct.new_member_registrations)} new members</strong>, <strong>${fmtNum(todayAct.points_awarded)} pts awarded</strong>, <strong>${fmtNum(todayAct.encashments_pending)} pending encashments</strong>.<br/>Alert: ${alertMsg}`;

        return (
          <>
            <Briefing label="Today's Briefing" text={briefingText} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px] mb-[14px]">
              <KpiStripCard title="Points Issued (MTD)" value={dashboardData?.points_issued_this_month?.toLocaleString() || "0"} sub="Based on actuals" onClick={() => openDrill('walletflow', 'Points Issuance Flow')} icon={<Coins className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-accent)]/10" iconColor="text-[var(--loyalty-accent)]" />
              <KpiStripCard title="Points Redeemed (MTD)" value={dashboardData?.points_redeemed_this_month?.toLocaleString() || "0"} sub="Based on actuals" onClick={() => openDrill('redtrend', 'Redemption Velocity')} icon={<Gift className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-success)]/10" iconColor="text-[var(--loyalty-success)]" />
              <KpiStripCard title="Redemption Rate (MTD)" value={`${dashboardData?.redemption_rate_this_month || 0}%`} sub="Issued vs Redeemed" onClick={() => openDrill('redtrend', 'Redemption Rate')} icon={<TrendingUp className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-info)]/15" iconColor="text-[var(--loyalty-info)]" />
              <KpiStripCard title="Active Members" value={dashboardData?.active_members?.toLocaleString() || "0"} sub="Total active accounts" onClick={() => openDrill('members-kpi', 'Active Member Status')} icon={<Users className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-green)]/10" iconColor="text-[var(--loyalty-green)]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-[14px] mb-[14px]">
              <ChartCard 
                id="trend" title="Points Issued vs Redeemed" 
                acts={[{type:'bar',label:'Bar'},{type:'line',label:'Line'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[var(--loyalty-warning-bg-soft)]',borderClass:'border-[var(--loyalty-accent)]',textClass:'text-[var(--loyalty-accent)]',label:'Opportunity',text:'Review the issuance and redemption trends to optimize point liability.'}}
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
      case 'Rules Engine': {
        const ruleSummaryCards = [
          { key: 'collection', title: 'COLLECTIONS', borderClass: 'border-t-[var(--loyalty-accent)]', badgeClass: 'bg-[var(--loyalty-success-light)] text-[var(--loyalty-success)] border-[var(--loyalty-success)]/20' },
          { key: 'engagement', title: 'MARKETING ENGAGEMENT', borderClass: 'border-t-[var(--loyalty-info)]', badgeClass: 'bg-[var(--loyalty-info-light)] text-[var(--loyalty-info)] border-[var(--loyalty-info)]/20' },
          { key: 'possession', title: 'POSSESSION', borderClass: 'border-t-[var(--loyalty-success)]', badgeClass: 'bg-[var(--loyalty-success-light)] text-[var(--loyalty-success)] border-[var(--loyalty-success)]/20' },
          { key: 'sales', title: 'SALES & BOOKING', borderClass: 'border-t-[var(--loyalty-success)]', badgeClass: 'bg-[var(--loyalty-info-light)] text-[var(--loyalty-info)] border-[var(--loyalty-info)]/20' },
          { key: 'referral', title: 'REFERRALS', borderClass: 'border-t-[var(--loyalty-warning)]', badgeClass: 'bg-[var(--loyalty-warning-bg-soft)] text-[var(--loyalty-accent)] border-[var(--loyalty-accent)]/20' },
          { key: 'app', title: 'APP ADOPTION', borderClass: 'border-t-[var(--loyalty-danger)]', badgeClass: 'bg-[var(--loyalty-success-light)] text-[var(--loyalty-success)] border-[var(--loyalty-success)]/20' },
        ];

        const summaryCategories = Array.isArray(ruleSummaryData?.categories) ? ruleSummaryData.categories : [];

        const renderedRuleCards = ruleSummaryCards.map((card) => {
          const match = summaryCategories.find((item: any) => {
            const categoryName = String(item?.category || '').toLowerCase();
            return categoryName.includes(card.key) || categoryName.includes(card.title.toLowerCase().replace(/[^a-z ]/g, '').split(' ')[0]);
          });

          const ruleCount = Number(match?.rule_count ?? 0);
          const fires = Number(match?.fires_this_month ?? 0);

          return {
            ...card,
            ruleCount,
            fires,
            statusLabel: ruleCount > 0 ? 'Active' : 'No rules',
            subtitle: fires > 0 ? `${fires.toLocaleString()} fires this month` : 'No recent activity',
          };
        });

        const firesByCategory = (firesByCategoryData?.fires_by_category && firesByCategoryData.fires_by_category.length > 0)
          ? firesByCategoryData.fires_by_category
          : (summaryCategories.length > 0 ? summaryCategories.map((c: any) => ({ category: c.category, fires_mtd: c.fires_this_month || 0 })) : []);

        const ruleCatChartData = firesByCategory.length > 0 ? {
          labels: firesByCategory.map((c: any) => c.category || c.name || 'Unknown'),
          values: firesByCategory.map((c: any) => c.fires_mtd || c.count || c.fires || 0),
          colors: CHART_COLORS.slice(0, firesByCategory.length),
          h: false,
          def: 'bar'
        } : undefined;

        const dailyFires = dailyFiresData?.daily_fires || [];
        const dailyFiresChartData = dailyFires.length > 0 ? {
          labels: dailyFires.map((d: any) => {
            if (!d.date) return '';
            const dt = new Date(d.date);
            return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          }),
          values: dailyFires.map((d: any) => d.fires || 0),
          colors: [CHART_COLORS[0]],
          h: false,
          def: 'line'
        } : undefined;

        const rawRules = Array.isArray(activeRulesData?.rules) ? activeRulesData.rules : [];
        const filteredRules = rawRules.filter((rule: any) => {
          const name = String(rule.rule_name || '').toLowerCase();
          const cat = String(rule.category || '').toLowerCase();
          const id = String(rule.n8n_rule_id || '').toLowerCase();
          const q = ruleSearch.toLowerCase().trim();
          if (q && !name.includes(q) && !cat.includes(q) && !id.includes(q)) return false;

          if (ruleCategoryFilter !== 'All Categories') {
            const selectedCat = ruleCategoryFilter.toLowerCase();
            if (!cat.includes(selectedCat.replace(/s$/, '')) && !selectedCat.includes(cat)) return false;
          }

          if (ruleStatusFilter !== 'All Statuses') {
            const status = String(rule.status || 'active').toLowerCase();
            if (status !== ruleStatusFilter.toLowerCase()) return false;
          }

          return true;
        });

        return (
          <>
            {/* Top Control Bar */}
            <div className="flex flex-wrap gap-3 items-center mb-[20px]">
              <div className="relative">
                <select
                  value={ruleCategoryFilter}
                  onChange={(e) => setRuleCategoryFilter(e.target.value)}
                  className="appearance-none bg-white border border-[var(--loyalty-divider)] rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-[var(--loyalty-text)] focus:outline-none focus:border-[var(--loyalty-accent)] cursor-pointer min-w-[140px]"
                >
                  <option>All Categories</option>
                  <option>Collections</option>
                  <option>Marketing Engagement</option>
                  <option>Possession</option>
                  <option>Sales & Booking</option>
                  <option>Referrals</option>
                  <option>App Adoption</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--loyalty-text)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  value={ruleStatusFilter}
                  onChange={(e) => setRuleStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-[var(--loyalty-divider)] rounded-full px-4 py-2 pr-8 text-[11px] font-semibold text-[var(--loyalty-text)] focus:outline-none focus:border-[var(--loyalty-accent)] cursor-pointer min-w-[120px]"
                >
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Draft</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--loyalty-text)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="w-3.5 h-3.5 text-[var(--loyalty-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="w-full bg-white border border-[var(--loyalty-divider)] rounded-full pl-9 pr-4 py-2 text-[11px] font-medium text-[var(--loyalty-text)] focus:outline-none focus:border-[var(--loyalty-accent)] placeholder:text-[var(--loyalty-subtle)]"
                />
              </div>

              <button onClick={() => navigate('/rule-engine/rule-list')} className="flex items-center gap-2 bg-[var(--loyalty-accent)] text-white rounded-full px-4 py-2 text-[11px] font-bold shadow-[0_2px_8px_rgba(var(--loyalty-accent-rgb),.3)] hover:opacity-90 transition-opacity ml-auto cursor-pointer">
                <Settings className="w-3.5 h-3.5" /> + New Rule
              </button>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[20px]">
              {renderedRuleCards.map((card) => (
                <div key={card.title} className={`bg-white border border-[var(--loyalty-divider)] border-t-4 rounded-[10px] p-[16px] shadow-sm ${card.borderClass}`}>
                  <div className="text-[9px] font-bold text-[var(--loyalty-subtle)] uppercase tracking-wider mb-1">{card.title}</div>
                  <div className="text-[20px] font-bold text-[var(--loyalty-text)] mb-1">{card.ruleCount} rules</div>
                  <div className="text-[11px] text-[var(--loyalty-green)] mb-4">{card.subtitle} · {card.statusLabel}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`border px-2 py-0.5 rounded-full text-[10px] font-semibold ${card.badgeClass}`}>{card.statusLabel}</span>
                    <span className="bg-[var(--loyalty-info-light)] text-[var(--loyalty-info)] border border-[var(--loyalty-info)]/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">{card.fires.toLocaleString()} fires</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Area */}
            <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px] mb-[14px]">
              <div className="mb-4">
                <div className="text-[14px] font-bold text-[var(--loyalty-text)] mb-1">All Active Rules</div>
                <div className="text-[11px] text-[var(--loyalty-subtle)]">{filteredRules.length} rules · click any row to inspect</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Rule Name</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Category</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Type</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Trigger</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Points</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Fires (MTD)</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Last Fired</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule: any, i: number) => {
                      let catBg = 'bg-[var(--loyalty-warning-bg-soft)]';
                      let catText = 'text-[var(--loyalty-accent)]';
                      if (rule.category === 'Engagement') {
                        catBg = 'bg-[var(--loyalty-purple-light)]';
                        catText = 'text-[var(--loyalty-purple)]';
                      } else if (rule.category === 'Referral') {
                        catBg = 'bg-[var(--loyalty-info-light)]';
                        catText = 'text-[var(--loyalty-info)]';
                      }

                      return (
                      <tr key={rule.n8n_rule_id || i} className="hover:bg-[var(--loyalty-bg)]/50 transition-colors cursor-pointer border-b border-[var(--loyalty-divider)] last:border-0">
                        <td className="p-[12px_8px] font-semibold text-[var(--loyalty-text)]">{rule.rule_name || '-'}</td>
                        <td className="p-[12px_8px]">
                          {rule.category ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${catBg} ${catText}`}>{rule.category}</span>
                          ) : (
                            <span className="text-[var(--loyalty-subtle)]">-</span>
                          )}
                        </td>
                        <td className="p-[12px_8px] text-[var(--loyalty-text)]">{rule.rule_type || rule.type || '-'}</td>
                        <td className="p-[12px_8px] text-[var(--loyalty-text)]">{rule.trigger || '-'}</td>
                        <td className="p-[12px_8px] font-bold text-[var(--loyalty-text)]">{rule.points ? parseFloat(rule.points).toLocaleString() : '0'}</td>
                        <td className={`p-[12px_8px] font-bold text-[var(--loyalty-info)]`}>{rule.fires_mtd?.toLocaleString() || '0'}</td>
                        <td className="p-[12px_8px] text-[var(--loyalty-green)]">{rule.last_fired_at ? new Date(rule.last_fired_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}</td>
                        <td className={`p-[12px_8px] font-semibold text-[var(--loyalty-success)]`}>
                          <span className="text-[12px] mr-1">•</span>{rule.status || 'Active'}
                        </td>
                      </tr>
                      );
                    })}
                    {filteredRules.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[var(--loyalty-green)]">
                          No active rules found matching filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px] relative">
              <ChartCard 
                id="rulecat" title="Rules Fired by Category — This Month" 
                acts={[{type:'bar',label:'Bar'},{type:'doughnut',label:'Donut'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[var(--loyalty-warning-bg-soft)]',borderClass:'border-[var(--loyalty-accent)]',textClass:'text-[var(--loyalty-accent)]',label:'RULE PERFORMANCE INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={ruleCatChartData}
              />
              <ChartCard 
                id="dailyfires" title="Daily Rule Fires — Last 7 Days" 
                acts={[{type:'line',label:'Line'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                chartDataOverride={dailyFiresChartData}
              />
            </div>
          </>
        );
      }
      case 'Members': {
        const topEarner = membersData?.top_earners?.[0];
        const topEarnerName = typeof topEarner === 'object' && topEarner !== null
          ? (topEarner.name || 'N/A')
          : (typeof topEarner === 'string' && topEarner ? topEarner : 'N/A');
        const topEarnerSub = typeof topEarner === 'object' && topEarner !== null && topEarner.points_earned_this_month != null
          ? `${fmtNum(topEarner.points_earned_this_month)} pts earned`
          : 'No activity';

        const memTierDist = membersData?.tier_distribution || dashboardData?.tier_distribution || [];
        const memTiersChartData = memTierDist.length > 0 ? {
          labels: memTierDist.map((t: any) => t.name || 'Unknown'),
          values: memTierDist.map((t: any) => t.member_count || 0),
          colors: CHART_COLORS.slice(0, memTierDist.length),
          h: false,
          def: 'doughnut'
        } : undefined;

        const newMemData = membersData?.new_members_by_month || [];
        const newMemChartData = newMemData.length > 0 ? {
          labels: newMemData.map((d: any) => formatMonth(d.month)),
          values: newMemData.map((d: any) => d.count),
          colors: [CHART_COLORS[0]],
          label: 'New Members',
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
              <KpiStripCard title="Active Members" value={membersData?.total_members?.toLocaleString() ?? "0"} sub="Total enrolled residents" onClick={() => openDrill('members-kpi', 'Active Member Status')} icon={<UserCheck className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-success)]/10" iconColor="text-[var(--loyalty-success)]" />
              <KpiStripCard title="Lapsed (>60 days)" value={membersData?.lapsed_members?.toLocaleString() ?? "0"} sub={`<span class='text-[var(--loyalty-danger-text)] font-semibold'>${lapseRate}%</span> churn risk`} onClick={() => openDrill('lapsed', 'Lapsed Member Analysis')} icon={<AlertTriangle className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-danger)]/15" iconColor="text-[var(--loyalty-danger-text)]" />
              <KpiStripCard title="New Members (MTD)" value={membersData?.new_members_this_month?.toLocaleString() ?? "0"} sub="Enrolled this month" icon={<Users className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-info)]/15" iconColor="text-[var(--loyalty-info)]" />
              <KpiStripCard title="Top Earner (MTD)" value={topEarnerName} sub={topEarnerSub} icon={<Award className="w-3.5 h-3.5" />} iconBg="bg-[var(--loyalty-warning)]/20" iconColor="text-[var(--loyalty-warning)]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
              <ChartCard 
                id="tierdist" title="Tier Distribution" 
                acts={[{type:'doughnut',label:'Donut'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[var(--loyalty-warning-bg-soft)]',borderClass:'border-[var(--loyalty-accent)]',textClass:'text-[var(--loyalty-accent)]',label:'Tier Insight',text:`You have ${memTierDist.find((t:any) => t.name === 'No Tier Assigned')?.member_count || 0} members without a tier... click to read more.`}}
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
            <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px] mb-[14px]">
              <div className="mb-4">
                <div className="text-[14px] font-bold text-[var(--loyalty-text)] mb-1">Members List</div>
                <div className="text-[11px] text-[var(--loyalty-subtle)]">{membersData?.members?.length || 0} members · click any row to inspect</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Name</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Society</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Tier</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Balance</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Earned</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Redeemed</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Joined</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Last Activity</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersData?.members?.map((member: any, i: number) => (
                      <tr key={i} className="hover:bg-[var(--loyalty-bg)]/50 transition-colors cursor-pointer border-b border-[var(--loyalty-divider)] last:border-0">
                        <td className="p-[12px_8px] font-semibold text-[var(--loyalty-text)]">{member.name}</td>
                        <td className="p-[12px_8px] text-[var(--loyalty-text)]">{member.society}</td>
                        <td className="p-[12px_8px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${member.tier === 'No Tier Assigned' ? 'bg-[var(--loyalty-bg)] text-[var(--loyalty-subtle)]' : 'bg-[var(--loyalty-warning-bg-soft)] text-[var(--loyalty-warning)]'}`}>{member.tier}</span>
                        </td>
                        <td className="p-[12px_8px] font-bold text-[var(--loyalty-text)]">{member.points_balance}</td>
                        <td className="p-[12px_8px] font-bold text-[var(--loyalty-success)]">{member.points_earned}</td>
                        <td className="p-[12px_8px] font-bold text-[var(--loyalty-danger-text)]">{member.points_redeemed}</td>
                        <td className="p-[12px_8px] text-[var(--loyalty-green)]">{member.joining_date}</td>
                        <td className="p-[12px_8px] text-[var(--loyalty-green)]">{formatLastActivity(member.last_activity)}</td>
                        <td className="p-[12px_8px]">
                          {member.lapsed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--loyalty-warning-bg-soft)] text-[var(--loyalty-accent)]">Lapsed</span>
                          ) : member.active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--loyalty-success-light)] text-[var(--loyalty-success)]">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--loyalty-bg)] text-[var(--loyalty-subtle)]">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!membersData?.members || membersData.members.length === 0) && (
                      <tr>
                        <td colSpan={9} className="p-[20px] text-center text-[var(--loyalty-subtle)]">No members found.</td>
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
        
        // Handle both string and object shapes ({ name, share_pct }) from backend
        const rawTopCat = redemptionData?.top_category;
        const topCategoryName = typeof rawTopCat === 'object' && rawTopCat !== null
          ? (rawTopCat.name || 'N/A')
          : (typeof rawTopCat === 'string' && rawTopCat ? rawTopCat : 'N/A');
        const topCategorySub = typeof rawTopCat === 'object' && rawTopCat !== null && rawTopCat.share_pct != null
          ? `${rawTopCat.share_pct}% of all redemptions`
          : 'Most popular redemption type';

        const redByType = redemptionData?.redemption_by_type || [];
        const redTypeChartData = redByType.length > 0 ? {
          labels: redByType.map((r: any) => r.type),
          values: redByType.map((r: any) => r.count),
          colors: CHART_COLORS.slice(0, redByType.length),
          h: false,
          def: 'doughnut'
        } : undefined;

        const redTrend = redemptionData?.redemption_rate_trend_by_month || [];
        const redTrendChartData = redTrend.length > 0 ? {
          labels: redTrend.map((r: any) => {
            if (!r?.month) return '';
            return formatMonth(r.month);
          }),
          values: redTrend.map((r: any) => r.redemption_rate_pct ?? 0),
          colors: [CHART_COLORS[0]],
          label: 'Redemption Rate (%)',
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
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[var(--loyalty-accent)] transition-colors" onClick={() => openDrill('redemption-kpi', 'Redemption Overview')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Total Redemptions (MTD)</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-accent)]/10 text-[var(--loyalty-accent)] shrink-0"><Gift className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-text)] leading-none mb-2">{totalRedemptions.toLocaleString()}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">Total actions this month</div>
                </div>
                <div className="h-[3px] bg-[var(--loyalty-divider)] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[var(--loyalty-accent)]" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[var(--loyalty-success)] transition-colors" onClick={() => openDrill('redemption-kpi', 'Redemption Overview')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Redemption Rate</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-success)]/10 text-[var(--loyalty-success)] shrink-0"><TrendingUp className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-success)] leading-none mb-2">{redemptionRate}%</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">MTD points redeemed vs issued</div>
                </div>
                <div className="h-[3px] bg-[var(--loyalty-divider)] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[var(--loyalty-success)]" style={{ width: `${Math.min(redemptionRate, 100)}%` }}></div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[var(--loyalty-accent)] rounded-[10px] p-[16px] flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDrill('redemption-kpi', 'Redemption Overview')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-accent)] uppercase tracking-wider">Pending Encashments</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-warning)]/20 text-[var(--loyalty-warning)] shrink-0"><Clock className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-accent)] leading-none mb-2">{pending.count}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">₹{fmtNum(pending.amount_total_inr)} outstanding</div>
                </div>
                <div className="h-[3px] bg-[var(--loyalty-divider)] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[var(--loyalty-warning)]" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[var(--loyalty-accent)] transition-colors" onClick={() => openDrill('redemption-kpi', 'Redemption Overview')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Top Category</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-info)]/15 text-[var(--loyalty-info)] shrink-0"><Tag className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-text)] leading-none mb-2 capitalize">{topCategoryName}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">{topCategorySub}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-[14px] mb-[14px]">
              <ChartCard 
                id="redtype" title="Redemption by Type — This Month" 
                acts={[{type:'doughnut',label:'Donut'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[var(--loyalty-success-light)]',borderClass:'border-[var(--loyalty-success)]',textClass:'text-[var(--loyalty-success)]',label:'REDEMPTION INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={redTypeChartData}
              />
              <ChartCard 
                id="redtrend" title="Redemption Rate Trend — 6 Months" 
                acts={[{type:'line',label:'Line'},{type:'bar',label:'Bar'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[var(--loyalty-warning-bg-soft)]',borderClass:'border-[var(--loyalty-accent)]',textClass:'text-[var(--loyalty-accent)]',label:'TREND INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={redTrendChartData}
              />
            </div>

            {/* Pending Encashments Table */}
            <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px] mb-[14px]">
              <div className="mb-4">
                <div className="text-[14px] font-bold text-[var(--loyalty-text)] mb-1">Pending Encashments</div>
                <div className="text-[11px] text-[var(--loyalty-subtle)]">{pending.count} requests · ₹{fmtNum(pending.amount_total_inr)} total</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Member</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Points</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">₹ Value</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Requested</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Bank</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptionData?.pending_encashments_list?.map((row: any, i: number) => {
                      const isPending = row.status?.toLowerCase() === 'pending';
                      const statusColor = isPending ? 'bg-[var(--loyalty-warning-bg-soft)] text-[var(--loyalty-accent)]' : 'bg-[var(--loyalty-info-light)] text-[var(--loyalty-info)]';
                      return (
                        <tr key={i} className="hover:bg-[var(--loyalty-bg)]/50 transition-colors cursor-pointer border-b border-[var(--loyalty-divider)] last:border-0">
                          <td className="p-[12px_8px] font-semibold text-[var(--loyalty-text)]">{row.member_name || row.member || 'N/A'}</td>
                          <td className="p-[12px_8px] text-[var(--loyalty-text)]">{row.points?.toLocaleString()}</td>
                          <td className="p-[12px_8px] font-bold text-[var(--loyalty-text)]">₹{row.amount_inr?.toLocaleString()}</td>
                          <td className="p-[12px_8px] text-[var(--loyalty-green)]">{formatReqDate(row.requested_at)}</td>
                          <td className="p-[12px_8px] text-[var(--loyalty-text)]">{row.bank_details || 'N/A'}</td>
                          <td className="p-[12px_8px]">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>{row.status || 'Pending'}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!redemptionData?.pending_encashments_list || redemptionData.pending_encashments_list.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-[20px] text-center text-[var(--loyalty-subtle)]">No pending encashments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
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
          labels: flowData.map((d: any) => formatMonth(d.month)),
          def: 'bar',
          h: false,
          datasets: [
            { label: 'Issued', data: flowData.map((d: any) => d.issued), bg: CHART_COLORS[1], bc: CHART_COLORS[1] },
            { label: 'Redeemed', data: flowData.map((d: any) => d.redeemed), bg: CHART_COLORS[0], bc: CHART_COLORS[0] },
            { label: 'Balance', data: flowData.map((d: any) => d.balance), bg: CHART_COLORS[2], bc: CHART_COLORS[2] }
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

        const ledgerRows = (walletData?.transaction_ledger || []).filter((row: any) => !ledgerSearch.trim() || String(row.member || '').toLowerCase().includes(ledgerSearch.trim().toLowerCase()));

        const handleExportLedger = () => {
          const exportUrl = `${getLoyaltyBaseUrl()}${ENDPOINTS.LOYALTY_DASHBOARD_WALLET}?export=xlsx&token=${encodeURIComponent(API_CONFIG.TOKEN || '')}`;
          window.open(exportUrl, '_blank');
        };

        return (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
              {/* Card 1: Expired Points */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px] flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--loyalty-warning)]/20 text-[var(--loyalty-warning)] mb-3">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="text-[11px] font-bold tracking-wider text-[var(--loyalty-green)] uppercase mb-4">Expired Points</div>
                <div className="text-[48px] font-bold text-[var(--loyalty-warning)] leading-none mb-4">{expiredPoints.toLocaleString()}</div>
                <div className="w-[120px] h-[3px] bg-[var(--loyalty-divider)] rounded-full mb-4"></div>
                <div className="text-[11px] text-[var(--loyalty-green)]">
                  {totalOutstanding.toLocaleString()} pts still outstanding
                </div>
              </div>

              {/* Card 2: Wallet Summary */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--loyalty-info)]/15 text-[var(--loyalty-info)] shrink-0"><Wallet className="w-4 h-4" /></div>
                  <div className="text-[14px] font-bold text-[var(--loyalty-text)]">Wallet Summary</div>
                </div>
                <div className="text-[11px] text-[var(--loyalty-subtle)] mb-5">Overall points distribution</div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-semibold text-[var(--loyalty-text)]">All-time Issued</span>
                  <span className="text-[12px] font-bold text-[var(--loyalty-info)]">{allTimeIssued.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[12px] font-semibold text-[var(--loyalty-text)]">Total Redeemed</span>
                  <span className="text-[12px] font-bold text-[var(--loyalty-success)]">{totalRedeemed.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-[var(--loyalty-divider)] w-full mb-4"></div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[13px] font-bold text-[var(--loyalty-text)]">Total Outstanding</span>
                  <span className="text-[13px] font-bold text-[var(--loyalty-text)]">{totalOutstanding.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-[var(--loyalty-green)]">Expired</span>
                  <span className="text-[12px] font-semibold text-[var(--loyalty-text)]">{expiredPoints.toLocaleString()}</span>
                </div>
              </div>

              {/* Card 3: Liability Health */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--loyalty-accent)]/10 text-[var(--loyalty-accent)] shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                  <div className="text-[14px] font-bold text-[var(--loyalty-text)]">Liability Health</div>
                </div>
                <div className="text-[11px] text-[var(--loyalty-subtle)] mb-5">Points cost - ₹1 per point</div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[13px] font-bold text-[var(--loyalty-text)]">Total Liability</span>
                  <span className="text-[13px] font-bold text-[var(--loyalty-accent)]">₹{totalLiability.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-[var(--loyalty-divider)] w-full mb-4"></div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-medium text-[var(--loyalty-green)]">Points cost (MTD)</span>
                  <span className="text-[12px] font-semibold text-[var(--loyalty-text)]">₹{mtdCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-5">
                  <span className="text-[12px] font-medium text-[var(--loyalty-green)]">Redemption outflow (MTD)</span>
                  <span className="text-[12px] font-semibold text-[var(--loyalty-accent)]">₹{mtdOutflow.toLocaleString()}</span>
                </div>
                
                <div className="bg-[var(--loyalty-success-light)] border border-[var(--loyalty-success)]/20 rounded-[8px] p-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--loyalty-success)] mb-1">Summary</div>
                  <div className="text-[11px] text-[var(--loyalty-text)] leading-snug">
                    {allTimeIssued > 0
                      ? <>{Math.round((totalRedeemed / allTimeIssued) * 100)}% of all points ever issued have been redeemed; ₹{totalLiability.toLocaleString()} remains as liability.</>
                      : <>No points have been issued yet.</>}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[20px] mb-[14px]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[14px] font-bold text-[var(--loyalty-text)] mb-1">Transaction Ledger — Recent</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">{ledgerRows.length} point movements · full audit trail</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[var(--loyalty-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Search member..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} className="pl-9 pr-3 py-1.5 border border-[var(--loyalty-divider)] rounded-full text-[11px] w-[200px] focus:outline-none focus:border-[var(--loyalty-accent)] text-[var(--loyalty-text)] placeholder:text-[var(--loyalty-subtle)]" />
                  </div>
                  <button onClick={handleExportLedger} className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--loyalty-divider)] rounded-full text-[11px] font-semibold text-[var(--loyalty-text)] hover:bg-[var(--loyalty-bg)] transition-colors cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Timestamp</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Member</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Event Type</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Remarks</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Points</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Direction</th>
                      <th className="p-[10px_8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider text-[9px]">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.map((row: any, i: number) => {
                      const isCredit = row.direction === 'credit';
                      return (
                        <tr key={i} className="hover:bg-[var(--loyalty-bg)]/50 transition-colors cursor-pointer border-b border-[var(--loyalty-divider)] last:border-0">
                          <td className="p-[12px_8px] text-[var(--loyalty-green)]">{formatTs(row.timestamp)}</td>
                          <td className="p-[12px_8px] font-semibold text-[var(--loyalty-text)]">{row.member}</td>
                          <td className="p-[12px_8px] text-[var(--loyalty-text)]">{row.point_type}</td>
                          <td className="p-[12px_8px] text-[var(--loyalty-text)]">{row.remarks}</td>
                          <td className={`p-[12px_8px] font-bold ${isCredit ? 'text-[var(--loyalty-success)]' : 'text-[var(--loyalty-danger-text)]'}`}>{isCredit ? '+' : '-'}{row.amount}</td>
                          <td className="p-[12px_8px]">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isCredit ? 'bg-[var(--loyalty-success-light)] text-[var(--loyalty-success)]' : 'bg-[var(--loyalty-danger-bg)] text-[var(--loyalty-danger-text)]'}`}>{isCredit ? 'Credit' : 'Debit'}</span>
                          </td>
                          <td className="p-[12px_8px] font-semibold text-[var(--loyalty-text)]">{row.balance_after}</td>
                        </tr>
                      );
                    })}
                    {ledgerRows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-[20px] text-center text-[var(--loyalty-subtle)]">No transactions found.</td>
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
                insight={{bgClass:'bg-[var(--loyalty-info-light)]',borderClass:'border-[var(--loyalty-info)]',textClass:'text-[var(--loyalty-info)]',label:'WALLET HEALTH INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={walletFlowChartData}
              />
            </div>

          </div>
        );
      }
      case 'Orders': {
        const totalOrders = ordersData?.total_orders ?? 0;
        const stuckOrders = ordersData?.stuck_orders ?? 0;
        const stuckPercent = ordersData?.stuck_percentage ?? 0;
        const rawStuckCustomer = ordersData?.stuck_customer_concentration;
        const stuckCustomerName = typeof rawStuckCustomer === 'object' && rawStuckCustomer !== null
          ? (rawStuckCustomer.name || 'N/A')
          : (typeof rawStuckCustomer === 'string' && rawStuckCustomer ? rawStuckCustomer : 'N/A');
        const stuckCustomerSub = typeof rawStuckCustomer === 'object' && rawStuckCustomer !== null && rawStuckCustomer.oldest_days != null
          ? `Oldest: ${rawStuckCustomer.oldest_days} days`
          : 'No stuck concentration data';

        const orderAgeDist = ordersData?.order_age_distribution || [];
        const orderAgeChartData = orderAgeDist.length > 0 ? {
          labels: orderAgeDist.map((d: any) => d.bucket),
          values: orderAgeDist.map((d: any) => d.count),
          colors: CHART_COLORS.slice(0, orderAgeDist.length),
          h: false,
          def: 'bar'
        } : undefined;

        const fVsS = ordersData?.fulfilled_vs_stuck || { fulfilled: 0, stuck: 0 };
        const fVsSChartData = {
          labels: ['Fulfilled', 'Stuck'],
          values: [fVsS.fulfilled, fVsS.stuck],
          colors: [CHART_COLORS[1], CHART_COLORS[0]],
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
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[var(--loyalty-accent)] transition-colors" onClick={() => openDrill('orders-total', 'Order Pipeline')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Total Orders</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-info)]/15 text-[var(--loyalty-info)] shrink-0"><ShoppingBag className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-text)] leading-none mb-2">{totalOrders}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">All time</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[var(--loyalty-danger)] transition-colors" onClick={() => openDrill('orders-stuck', 'Stuck Orders Analysis')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Stuck — Paid, Not Fulfilled</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-danger)]/15 text-[var(--loyalty-danger-text)] shrink-0"><AlertTriangle className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-danger)] leading-none mb-2">{stuckOrders}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">{stuckPercent}% of all orders</div>
                </div>
                <div className="h-[3px] bg-[var(--loyalty-divider)] rounded-full overflow-hidden mt-4">
                  <div className="h-full rounded-full bg-[var(--loyalty-danger)]" style={{ width: `${stuckPercent}%` }}></div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between cursor-pointer hover:border-[var(--loyalty-accent)] transition-colors" onClick={() => openDrill('orders-customer', 'Impacted Customer')}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Most Affected Customer</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-accent)]/10 text-[var(--loyalty-accent)] shrink-0"><Users className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-text)] leading-none mb-2">{stuckCustomerName}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">{stuckCustomerSub}</div>
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
            <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[14px] mb-[14px]">
              <div className="text-[12px] font-semibold text-[var(--loyalty-text)] mb-2.5">Stuck Orders — Paid, Not Fulfilled</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)]">Order ID</th>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)]">Customer</th>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)]">Amount</th>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)]">Created</th>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersData?.stuck_orders_list?.map((o: any, i: number) => (
                      <tr key={i} className="hover:bg-[var(--loyalty-bg)]/50 transition-colors cursor-pointer" onClick={() => openDrill('order', `Order ${o.id}`, o)}>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)] font-semibold">{o.id}</td>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)]">{o.customer_name || o.customer || 'N/A'}</td>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)]">₹{o.amount}</td>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)] text-[var(--loyalty-green)]">{formatDt(o.created_at)}</td>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)]">
                          <span className="bg-[var(--loyalty-warning)]/25 text-[var(--loyalty-warning-text)] border border-[var(--loyalty-warning)]/50 text-[9px] font-semibold px-[7px] py-[2px] rounded-full">{o.status || 'Pending'}</span>
                        </td>
                      </tr>
                    ))}
                    {(!ordersData?.stuck_orders_list || ordersData.stuck_orders_list.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-[20px] text-center text-[var(--loyalty-subtle)]">No stuck orders found.</td>
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
        const topColors = ['var(--loyalty-success)', 'var(--loyalty-warning)', 'var(--loyalty-info)'];

        const funnelLabels = (storeData?.catalog_by_category || []).map((c: any) => c.category);
        const funnelCatalog = (storeData?.catalog_by_category || []).map((c: any) => c.count);
        const funnelAdded = funnelLabels.map((label: string) => {
          const found = (storeData?.added_by_category || []).find((a: any) => a.category === label);
          return found ? found.count : 0;
        });

        const funnelChartData = funnelLabels.length > 0 ? {
          labels: funnelLabels,
          datasets: [
            { label: 'Catalog', data: funnelCatalog, bg: CHART_COLORS[0], bc: CHART_COLORS[0] },
            { label: 'Added to Store', data: funnelAdded, bg: CHART_COLORS[1], bc: CHART_COLORS[1] }
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
          colors: CHART_COLORS.slice(0, catMixLabels.length),
          h: false,
          def: 'doughnut'
        } : undefined;

        return (
          <div className="relative">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
              {/* Card 1 */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Live In Store</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-danger)]/15 text-[var(--loyalty-danger-text)] shrink-0"><Store className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-danger)] leading-none mb-2">{liveInStore}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">Every category, {liveInStoreTotal} items published</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-[var(--loyalty-accent)] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Sitting In Aggregator</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-success)]/10 text-[var(--loyalty-success)] shrink-0"><Package className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-success)] leading-none mb-2">{sittingInAggregator.toLocaleString()}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">Ready to publish today</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider">Days Programme Live</div>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--loyalty-warning)]/20 text-[var(--loyalty-warning)] shrink-0"><Calendar className="w-3.5 h-3.5" /></div>
                  </div>
                  <div className="text-[26px] font-bold text-[var(--loyalty-warning)] leading-none mb-2">{daysLive}</div>
                  <div className="text-[11px] text-[var(--loyalty-subtle)]">Since programme went live</div>
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
                    <div key={i} className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[16px] flex flex-col justify-between" style={{ borderTop: `3px solid ${topColors[i % topColors.length]}` }}>
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--loyalty-green)] uppercase tracking-wider mb-2">{cat.category}</div>
                        <div className="text-[26px] font-bold text-[var(--loyalty-text)] leading-none mb-2">{cat.count.toLocaleString()}</div>
                        <div className="text-[11px] text-[var(--loyalty-subtle)]">{pct}% of available inventory</div>
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
                insight={{bgClass:'bg-[var(--loyalty-warning-bg-soft)]',borderClass:'border-[var(--loyalty-accent)]',textClass:'text-[var(--loyalty-accent)]',label:'STORE PIPELINE INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={funnelChartData}
              />
              <ChartCard 
                id="catmix" title="Category Composition" 
                acts={[{type:'doughnut',label:'Donut'},{type:'tbl',label:'Table'}]} 
                insight={{bgClass:'bg-[var(--loyalty-info-light)]',borderClass:'border-[var(--loyalty-info)]',textClass:'text-[var(--loyalty-info)]',label:'CATEGORY PRIORITY INSIGHT',text:'Click Generate Insight for AI analysis.', btnText: '+ Generate Insight'}}
                onAiOpen={() => setIsAiOpen(true)}
                chartDataOverride={catMixChartData}
              />
            </div>

            {/* How To Fix Table */}
            <div className="bg-white border border-[var(--loyalty-divider)] rounded-[10px] p-[14px] mb-[14px]">
              <div className="text-[12px] font-semibold text-[var(--loyalty-text)] mb-2.5">AI Recommended Steps to Fix Pipeline</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] w-[60px]">Step</th>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)]">Action</th>
                      <th className="p-[8px] border-b border-[var(--loyalty-divider)] bg-[var(--loyalty-bg)] font-semibold text-[var(--loyalty-green)] w-[150px]">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeData?.how_to_fix?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-[var(--loyalty-bg)]/50 transition-colors">
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)] font-semibold text-[var(--loyalty-accent)]">Step {row.step}</td>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)] text-[var(--loyalty-text)]">{row.action}</td>
                        <td className="p-[8px] border-b border-[var(--loyalty-divider)] text-[var(--loyalty-green)] font-medium">{row.owner}</td>
                      </tr>
                    ))}
                    {(!storeData?.how_to_fix || storeData.how_to_fix.length === 0) && (
                      <tr>
                        <td colSpan={3} className="p-[20px] text-center text-[var(--loyalty-subtle)]">No recommendations available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="loyalty-dashboard-theme min-h-screen bg-[var(--loyalty-bg)] font-[Poppins] text-[var(--loyalty-text)]">
      {/* Topbar */}
      <div className="loyalty-detail-header flex flex-wrap items-center justify-between gap-y-2 bg-white border-b border-[var(--loyalty-border)] px-4 md:px-5 py-2.5 min-h-[60px] sticky top-0 z-[300] shadow-[0_1px_6px_rgba(var(--color-text-rgb),.08)]">

        {/* ── LEFT GROUP ── */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/loyalty/home-dashboard')}
            title="Back to Loyalty home"
            className="loyalty-detail-header-control flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--loyalty-border)] !text-[#1a1a18] bg-white cursor-pointer transition-colors hover:border-[var(--loyalty-accent)] shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="loyalty-detail-header-title text-[13.5px] font-bold !text-[#1a1a18] leading-tight truncate">Loyalty Programme Detail</div>
            <div className="loyalty-detail-header-subtitle text-[10px] !text-[#666666] font-medium truncate">Rules, members, redemption, wallet, orders &amp; store</div>
          </div>
        </div>

        {/* ── RIGHT GROUP ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Date range */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => { setDraftRange(customRange); setIsFilterOpen((o) => !o); }}
              className="loyalty-detail-header-control flex items-center gap-1.5 border border-[var(--loyalty-border)] rounded-[7px] px-2.5 py-[6px] text-[11px] font-semibold !text-[#1a1a18] bg-white cursor-pointer hover:border-[var(--loyalty-accent)] transition-colors whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" />
              {dateLabel}
              <ChevronDown className="w-3 h-3 text-[var(--loyalty-subtle)]" />
            </button>
            {isFilterOpen && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-[var(--loyalty-border)] rounded-[10px] shadow-[0_8px_24px_rgba(var(--color-text-rgb),.12)] p-2.5 w-[260px] z-[301]">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--loyalty-green)] px-2 mb-1.5">Date Range</div>
                <div className="flex flex-col gap-0.5">
                  {DATE_PRESETS.filter((p) => p !== 'Custom').map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setDateFilter(opt); setIsFilterOpen(false); }}
                      className={`text-left px-2 py-[6px] text-[11px] font-medium rounded-[6px] cursor-pointer ${opt === dateFilter ? 'bg-[var(--loyalty-surface)] text-[var(--loyalty-text)] font-semibold' : 'text-[var(--loyalty-text)] hover:bg-[var(--loyalty-bg)]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-[var(--loyalty-divider)] pt-2 px-1">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--loyalty-green)] mb-1.5">Custom</div>
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={draftRange.from} max={draftRange.to} onChange={(e) => setDraftRange((r) => ({ ...r, from: e.target.value }))} className="min-w-0 flex-1 border border-[var(--loyalty-border)] rounded-[6px] px-1.5 py-1 text-[10.5px] outline-none focus:border-[var(--loyalty-accent)]" />
                    <span className="text-[10px] text-[var(--loyalty-subtle)]">→</span>
                    <input type="date" value={draftRange.to} min={draftRange.from} onChange={(e) => setDraftRange((r) => ({ ...r, to: e.target.value }))} className="min-w-0 flex-1 border border-[var(--loyalty-border)] rounded-[6px] px-1.5 py-1 text-[10.5px] outline-none focus:border-[var(--loyalty-accent)]" />
                  </div>
                  <button
                    disabled={!draftRange.from || !draftRange.to || draftRange.from > draftRange.to}
                    onClick={() => { setCustomRange(draftRange); setDateFilter('Custom'); setIsFilterOpen(false); }}
                    className="mt-2 w-full rounded-[6px] bg-[var(--loyalty-accent)] text-white py-1.5 text-[11px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply range
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-1.5 bg-[var(--loyalty-accent)] text-white border-none rounded-[7px] px-3 py-[6px] text-[11px] font-semibold cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
            onClick={() => setIsAiOpen(true)}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Assistant</span>
          </button>

          {getUserInitials() && (
            <div className="w-8 h-8 rounded-full bg-[var(--loyalty-text)] text-white flex items-center justify-center text-[10.5px] font-bold shrink-0">
              {getUserInitials()}
            </div>
          )}
        </div>
      </div>

      {/* TabNav */}
      <div className="loyalty-detail-tabs flex gap-0 px-4 md:px-5 bg-white border-b border-[var(--loyalty-border)] md:sticky md:top-[60px] z-[299] overflow-x-auto overflow-y-hidden scrollbar-hide">
        {tabs.map(tab => (
          <div 
            key={tab}
            className={`loyalty-detail-tab flex items-center gap-[5px] px-[14px] py-[10px] border-b-2 text-[10.5px] !text-[#1a1a18] cursor-pointer whitespace-nowrap transition-all duration-150 mb-[-1px] ${activeTab === tab ? 'border-[var(--loyalty-accent)] font-semibold' : 'border-transparent font-medium'}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className="flex items-center gap-[5px]">
              {tab === 'Overview' && <LayoutDashboard className="w-3.5 h-3.5" />}
              {tab === 'Rules Engine' && <Sliders className="w-3.5 h-3.5" />}
              {tab === 'Members' && <Users className="w-3.5 h-3.5" />}
              {tab === 'Redemption' && <Gift className="w-3.5 h-3.5" />}
              {tab === 'Wallet' && <Wallet className="w-3.5 h-3.5" />}
              {tab === 'Orders' && <ShoppingBag className="w-3.5 h-3.5" />}
              {tab === 'Store & Inventory' && <Store className="w-3.5 h-3.5" />}
              {tab}
            </span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-5 max-w-[1400px] mx-auto pb-20">
        {tabError ? (
          <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)]/40 px-4 py-3 text-[11px] text-[var(--loyalty-text)]">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" /> Couldn't load {activeTab} data. {getLoyaltyErrorMessage(tabError)}</span>
            <button onClick={retryTab} className="flex items-center gap-1 rounded-full border border-[var(--loyalty-border)] bg-white px-3 py-1 text-[10.5px] font-semibold cursor-pointer hover:border-[var(--loyalty-accent)]">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : isTabLoading ? (
          <div className="mb-[14px] flex items-center gap-2 rounded-[10px] border border-[var(--loyalty-divider)] bg-white px-4 py-3 text-[11px] text-[var(--loyalty-subtle)]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading {activeTab.toLowerCase()} data…
          </div>
        ) : null}
        {renderTabContent()}
      </div>

      {!isAiOpen && (
        <button
          onClick={() => setIsAiOpen(true)}
          title="Ask the assistant"
          className="fixed bottom-5 right-5 z-[7000] w-12 h-12 bg-[var(--loyalty-accent)] rounded-full flex items-center justify-center text-white shadow-[0_4px_12px_rgba(var(--loyalty-accent-rgb),.35)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Drill Panel Overlay */}
      {drillData && (
        <div className="fixed inset-0 bg-[var(--loyalty-text)]/40 backdrop-blur-sm z-[9000] flex justify-end">
          <div className="w-full max-w-[420px] bg-white h-full shadow-[-4px_0_24px_rgba(var(--color-text-rgb),.1)] flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-[14px_20px] border-b-2 border-[var(--loyalty-border)] bg-[var(--loyalty-bg)]">
              <div className="text-[14px] font-bold text-[var(--loyalty-text)]">{drillData.title}</div>
              <button className="bg-transparent border-none text-[var(--loyalty-green)] cursor-pointer p-1 rounded-full hover:bg-white transition-colors" onClick={() => setDrillData(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-[20px] pb-[80px]">{drillData.body}</div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      {isAiOpen && (
        <div className="fixed bottom-[20px] right-[20px] w-[340px] h-[520px] bg-white rounded-[12px] shadow-[0_8px_32px_rgba(var(--color-text-rgb),.15)] border border-[var(--loyalty-border)] flex flex-col z-[8000] overflow-hidden">
          <div className="flex items-center justify-between p-[14px] bg-[var(--loyalty-text)] text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[var(--loyalty-accent)]" />
              <span className="font-bold text-[12px]">Programme Assistant</span>
            </div>
            <button className="bg-transparent border-none text-white/70 cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors" onClick={() => setIsAiOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-[14px] bg-[var(--loyalty-bg)] flex flex-col gap-3">
            {aiMsgs.map((msg, i) => (
              <div key={i} className={`max-w-[85%] p-[10px_12px] text-[11px] leading-relaxed ${msg.sender === 'user' ? 'bg-[var(--loyalty-accent)] text-white rounded-[12px_12px_0_12px] self-end' : 'bg-white text-[var(--loyalty-text)] border border-[var(--loyalty-divider)] rounded-[12px_12px_12px_0] self-start shadow-sm'}`}>
                {msg.text}
              </div>
            ))}
            <div ref={aiChatEndRef} />
          </div>
          <div className="p-3 border-t border-[var(--loyalty-divider)] bg-white">
            <form onSubmit={handleAiSend} className="relative">
              <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask about rules, redemptions, etc..." className="w-full bg-[var(--loyalty-bg)] border border-[var(--loyalty-border)] rounded-full px-[14px] py-[8px] pr-10 text-[11px] font-[Poppins] outline-none transition-colors focus:border-[var(--loyalty-accent)] focus:bg-white" />
              <button type="submit" className="absolute right-1 top-1 bottom-1 w-7 flex items-center justify-center bg-[var(--loyalty-accent)] text-white rounded-full border-none cursor-pointer shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50" disabled={!aiInput.trim()}>
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

export default LoyaltyDashboard;
