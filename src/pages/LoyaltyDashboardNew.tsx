import { InfoIcon } from '@/components/ui/info-icon';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_CONFIG } from "@/config/apiConfig";
import {
  DATE_PRESETS,
  DatePreset,
  fetchLoyalty,
  fmtNum,
  getDateRange,
  getLoyaltyErrorMessage,
  getUserInitials,
  toIsoDate,
} from "./LoyaltyDashboardApi";

/* ── Types for API ────────────────────────────────────────────── */
type TierDistribution = {
  id: number | null;
  name: string;
  exit_points: number | null;
  member_count: number;
};

type HomeData = {
  active_members: number;
  points_outstanding: number;
  tier_distribution: TierDistribution[];
  orders: {
    total_orders: number;
    stuck_orders: number;
    oldest_stuck_days: number | null;
    status_breakdown: { status: string; count: number }[];
  };
};

type Member = {
  name: string;
  society?: string;
  tier?: string;
  points_balance?: number | string;
  points_earned?: number | string;
  points_redeemed?: number | string;
  last_activity?: string | null;
  lapsed?: boolean;
  active?: boolean;
};

type StuckOrder = { id: string | number; customer_name?: string; customer?: string; amount?: number | string; created_at?: string; status?: string };

/* ── Palette ──────────────────────────────────────────────────────
   terra:#DA7756 · bg:#F6F4EE · dark:#2C2C2C · sage:#798C5E
   ok:#108C72 · warn:#EDC488 · err:#E7848E · border:#C4B89D · div:#E0D8CC */
const FONT = { fontFamily: "'Poppins', sans-serif" };
const STATUS_COLORS = ["#DA7756", "#108C72", "#EDC488", "#6B9BCC", "#E7848E", "#798C5E", "#2C2C2C"];
const AV_COLORS = ["#DA7756", "#798C5E", "#108C72", "#6B9BCC", "#B8694A"];

const tierColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("diamond")) return "#6B9BCC";
  if (n.includes("titanium")) return "#9BA8B5";
  if (n.includes("gold")) return "#D9A441";
  if (n.includes("silver")) return "#798C5E";
  if (n.includes("bronze")) return "#B8694A";
  return "#C4B89D";
};

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

/* ── Small building blocks ── */
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[10px] border border-[#E0D8CC] bg-white p-3 ${className}`}>{children}</div>
);

const CardHead = ({ title, info, sub, action }: { title: string; info: string; sub?: React.ReactNode; action?: React.ReactNode }) => (
  <div className="mb-2 flex items-start justify-between gap-2">
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2C2C2C]">
        {title} <InfoIcon details={info} />
      </div>
      {sub && <div className="mt-0.5 text-[9px] text-[#798C5E]">{sub}</div>}
    </div>
    {action}
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full min-h-[80px] items-center justify-center rounded-md bg-[#F6F4EE] px-3 py-4 text-center text-[11px] text-[#798C5E]">
    {children}
  </div>
);

const Dk = ({ val, lbl, color }: { val: React.ReactNode; lbl: string; color?: string }) => (
  <div className="min-w-[72px] flex-1 rounded-lg bg-[#F6F4EE] p-2.5 text-center">
    <div className="text-[18px] font-bold text-[#2C2C2C]" style={color ? { color } : undefined}>{val}</div>
    <div className="mt-0.5 text-[9px] text-[#798C5E]">{lbl}</div>
  </div>
);

const DSec = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-[5px] mt-3 text-[9px] font-bold uppercase tracking-[.07em] text-[#798C5E]">{children}</div>
);

const DSl = ({ l, r }: { l: React.ReactNode; r: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[#E0D8CC] py-1.5 text-[11px] last:border-b-0">
    <span>{l}</span>
    <span className="text-right font-semibold">{r}</span>
  </div>
);

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-[#2C2C2C] px-2.5 py-1.5 text-white shadow-md" style={FONT}>
      <div className="text-[10px] font-semibold">{label}</div>
      <div className="text-[10px]">{fmtNum(payload[0].value)} orders</div>
    </div>
  );
};

type ChatMsg = { role: "user" | "bot"; text: string };
const AI_SUGGESTIONS = ["What needs attention?", "How many members are active?", "Which orders are stuck?", "Is the store stocked?"];

export const LoyaltyDashboardNew = () => {
  const navigate = useNavigate();
  const [drill, setDrill] = useState<{ title: string; body: React.ReactNode } | null>(null);
  const [liveDate, setLiveDate] = useState("");

  /* date filter */
  const [preset, setPreset] = useState<DatePreset>("This Month");
  const [customRange, setCustomRange] = useState(() => {
    const t = new Date();
    return { from: toIsoDate(new Date(t.getFullYear(), t.getMonth(), 1)), to: toIsoDate(t) };
  });
  const [draftRange, setDraftRange] = useState(customRange);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const dateParams = getDateRange(preset, customRange);
  const dateKey = `${dateParams.from ?? ""}_${dateParams.to ?? ""}`;
  const filterLabel = preset === "Custom" ? `${dateParams.from} → ${dateParams.to}` : preset;

  /* AI chat */
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "bot", text: "Hi! Ask me about members, points, orders or the store — I answer from the data on this dashboard." },
  ]);
  const [showSugs, setShowSugs] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);

  /* ── API ── */
  const homeQuery = useQuery({
    queryKey: ["loyalty-dashboard", "home", dateKey],
    queryFn: () => fetchLoyalty<HomeData>(API_CONFIG.ENDPOINTS.LOYALTY_DASHBOARD_HOME, dateParams),
    retry: 1,
    staleTime: 60_000,
  });
  const membersQuery = useQuery({
    queryKey: ["loyalty-dashboard", "members", dateKey],
    queryFn: () => fetchLoyalty<any>(API_CONFIG.ENDPOINTS.LOYALTY_DASHBOARD_MEMBERS, dateParams),
    retry: 1,
    staleTime: 60_000,
  });
  const storeQuery = useQuery({
    queryKey: ["loyalty-dashboard", "store", "all-time"],
    queryFn: () => fetchLoyalty<any>(API_CONFIG.ENDPOINTS.LOYALTY_DASHBOARD_STORE),
    retry: 1,
    staleTime: 60_000,
  });
  const ordersQuery = useQuery({
    queryKey: ["loyalty-dashboard", "orders", "all-time"],
    queryFn: () => fetchLoyalty<any>(API_CONFIG.ENDPOINTS.LOYALTY_DASHBOARD_ORDERS),
    retry: 1,
    staleTime: 60_000,
  });

  const home = homeQuery.data;
  const membersData = membersQuery.data;
  const store = storeQuery.data;
  const ordersData = ordersQuery.data;

  const tiers = home?.tier_distribution ?? [];
  const orders = home?.orders;
  const statusData = (orders?.status_breakdown ?? []).map((s) => ({ label: s.status, value: s.count }));
  const members: Member[] = [...(membersData?.members ?? [])].sort(
    (a: Member, b: Member) => Number(b.points_balance ?? 0) - Number(a.points_balance ?? 0)
  );
  const stuckList: StuckOrder[] = ordersData?.stuck_orders_list ?? [];
  const maxTier = Math.max(1, ...tiers.map((t) => t.member_count || 0));
  const liveInStore = Number(store?.live_in_store ?? 0);
  const inAggregator = Number(store?.sitting_in_aggregator ?? 0);

  /* ── effects ── */
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setLiveDate(
        n.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
          " · " +
          n.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  /* ── alerts derived from data ── */
  type Alert = { key: string; icon: string; title: string; sub: string; tone: "err" | "warn"; onClick: () => void };
  const alerts: Alert[] = [];
  if (store && liveInStore === 0 && inAggregator > 0) {
    alerts.push({
      key: "store", icon: "🏪", tone: "err",
      title: "Redemption store is empty",
      sub: `${fmtNum(inAggregator)} items ready in aggregator`,
      onClick: () => openDrill("store"),
    });
  }
  if (orders && orders.stuck_orders > 0) {
    alerts.push({
      key: "orders", icon: "🧾", tone: "err",
      title: `${fmtNum(orders.stuck_orders)} orders stuck — paid, not fulfilled`,
      sub: orders.oldest_stuck_days != null ? `Oldest ${fmtNum(orders.oldest_stuck_days)} days` : "Needs fulfilment",
      onClick: () => openDrill("stuck"),
    });
  }
  if (Number(membersData?.lapsed_members ?? 0) > 0) {
    alerts.push({
      key: "lapsed", icon: "⏳", tone: "warn",
      title: `${fmtNum(membersData.lapsed_members)} members lapsed`,
      sub: "No activity in 60+ days",
      onClick: () => openDrill("lapsed"),
    });
  }
  if (Number(membersData?.new_members_this_month ?? 0) > 0) {
    alerts.push({
      key: "new", icon: "🎉", tone: "warn",
      title: `${fmtNum(membersData.new_members_this_month)} new members`,
      sub: "Joined in the selected period",
      onClick: () => openDrill("members"),
    });
  }

  /* ── drill panels ── */
  function openDrill(key: string, payload?: any) {
    let title = "Detail";
    let body: React.ReactNode = <Empty>No data returned for this view.</Empty>;

    if (key === "members") {
      title = "Active Members";
      body = (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Dk val={fmtNum(home?.active_members)} lbl="Active" />
            <Dk val={fmtNum(membersData?.new_members_this_month)} lbl="New (period)" color="#108C72" />
            <Dk val={fmtNum(membersData?.lapsed_members)} lbl="Lapsed" color="#E7848E" />
          </div>
          <DSec>By Tier</DSec>
          {tiers.length ? tiers.map((t) => <DSl key={t.id ?? t.name} l={t.name} r={`${fmtNum(t.member_count)} members`} />) : <Empty>No tiers configured.</Empty>}
        </>
      );
    } else if (key === "points") {
      title = "Points Outstanding";
      body = (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Dk val={fmtNum(home?.points_outstanding)} lbl="Outstanding" color="#B8694A" />
            <Dk val={fmtNum(liveInStore)} lbl="Items live in store" color={liveInStore ? "#108C72" : "#E7848E"} />
          </div>
          <DSec>Top Balances</DSec>
          {members.length ? members.slice(0, 8).map((m, i) => <DSl key={i} l={m.name} r={`${fmtNum(m.points_balance)} pts`} />) : <Empty>No member balances returned.</Empty>}
        </>
      );
    } else if (key === "orders" || key === "stuck") {
      title = key === "orders" ? "Orders" : "Stuck Orders — Paid, Not Fulfilled";
      body = (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Dk val={fmtNum(orders?.total_orders)} lbl="Total" />
            <Dk val={fmtNum(orders?.stuck_orders)} lbl="Stuck" color="#E7848E" />
            <Dk val={orders?.oldest_stuck_days != null ? fmtNum(orders.oldest_stuck_days) : "—"} lbl="Oldest stuck (days)" />
          </div>
          {key === "orders" && (
            <>
              <DSec>By Status</DSec>
              {statusData.length ? statusData.map((s) => <DSl key={s.label} l={s.label} r={fmtNum(s.value)} />) : <Empty>{homeQuery.isError ? "Order data unavailable." : "No orders yet."}</Empty>}
            </>
          )}
          <DSec>Stuck Orders</DSec>
          {stuckList.length ? stuckList.map((o, i) => <DSl key={o.id ?? i} l={`${o.id} · ${o.customer_name || o.customer || "N/A"}`} r={`₹${fmtNum(o.amount)}`} />) : <Empty>No stuck orders.</Empty>}
        </>
      );
    } else if (key === "store") {
      title = "Redemption Store";
      const byCat: { category: string; count: number }[] = store?.available_by_category ?? [];
      body = (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Dk val={fmtNum(liveInStore)} lbl="Live in store" color={liveInStore ? "#108C72" : "#E7848E"} />
            <Dk val={fmtNum(inAggregator)} lbl="In aggregator" color="#108C72" />
          </div>
          <DSec>Available by Category</DSec>
          {byCat.length ? byCat.map((c) => <DSl key={c.category} l={c.category} r={`${fmtNum(c.count)} items`} />) : <Empty>No category data.</Empty>}
          {(store?.how_to_fix ?? []).length > 0 && (
            <>
              <DSec>How to Fix</DSec>
              {store.how_to_fix.map((s: any) => <DSl key={s.step} l={`${s.step}. ${s.action}`} r={s.owner} />)}
            </>
          )}
        </>
      );
    } else if (key === "lapsed") {
      title = "Lapsed Members";
      const lapsed = members.filter((m) => m.lapsed);
      body = lapsed.length
        ? <>{lapsed.map((m, i) => <DSl key={i} l={m.name} r={`${fmtNum(m.points_balance)} pts`} />)}</>
        : <Empty>{fmtNum(membersData?.lapsed_members)} members lapsed; the list was not returned.</Empty>;
    } else if (key === "tier" && payload) {
      const t = payload as TierDistribution;
      title = `${t.name} Tier`;
      body = (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Dk val={fmtNum(t.member_count)} lbl="Members" color={tierColor(t.name)} />
            <Dk val={t.exit_points != null ? fmtNum(t.exit_points) : "—"} lbl="Exit points" />
          </div>
          <DSec>Members in this tier</DSec>
          {members.filter((m) => m.tier === t.name).length
            ? members.filter((m) => m.tier === t.name).map((m, i) => <DSl key={i} l={m.name} r={`${fmtNum(m.points_balance)} pts`} />)
            : <Empty>No member list returned for this tier.</Empty>}
        </>
      );
    } else if (key === "member" && payload) {
      const m = payload as Member;
      title = m.name;
      body = (
        <>
          <DSl l="Tier" r={m.tier || "—"} />
          <DSl l="Society" r={m.society || "—"} />
          <DSl l="Points balance" r={fmtNum(m.points_balance)} />
          <DSl l="Points earned" r={fmtNum(m.points_earned)} />
          <DSl l="Points redeemed" r={fmtNum(m.points_redeemed)} />
          <DSl l="Last activity" r={m.last_activity ? new Date(m.last_activity).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
          <DSl l="Status" r={m.lapsed ? "Lapsed" : m.active ? "Active" : "Inactive"} />
        </>
      );
    } else if (key === "order" && payload) {
      const o = payload as StuckOrder;
      title = `Order ${o.id}`;
      body = (
        <>
          <DSl l="Customer" r={o.customer_name || o.customer || "N/A"} />
          <DSl l="Amount" r={`₹${fmtNum(o.amount)}`} />
          <DSl l="Created" r={o.created_at ? new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
          <DSl l="Status" r={o.status || "Pending"} />
        </>
      );
    }
    setDrill({ title, body });
  }

  /* ── AI chat: answers computed from the loaded data ── */
  const answer = (q: string): string => {
    const l = q.toLowerCase();
    if (!home) return "The dashboard data hasn't loaded yet — try again in a moment.";
    if (l.includes("attention") || l.includes("today") || l.includes("urgent")) {
      return alerts.length
        ? `${alerts.length} thing${alerts.length > 1 ? "s" : ""} need attention: ${alerts.map((a) => `${a.title} (${a.sub})`).join("; ")}.`
        : "Nothing needs urgent attention right now.";
    }
    if (l.includes("order") || l.includes("stuck")) {
      return `${fmtNum(home.orders.total_orders)} orders in total, ${fmtNum(home.orders.stuck_orders)} stuck (paid, not fulfilled)${home.orders.oldest_stuck_days != null ? `, oldest ${home.orders.oldest_stuck_days} days` : ""}.`;
    }
    if (l.includes("store") || l.includes("item") || l.includes("redeem")) {
      if (!store) return "Store data hasn't loaded yet.";
      return `${fmtNum(liveInStore)} items are live in the store and ${fmtNum(inAggregator)} are available in the aggregator. ${fmtNum(home.points_outstanding)} points are outstanding.`;
    }
    if (l.includes("point")) return `${fmtNum(home.points_outstanding)} points are outstanding across members.`;
    return `${fmtNum(home.active_members)} active members across ${tiers.length} tiers (${tiers.map((t) => `${t.name}: ${t.member_count}`).join(", ") || "none configured"}).`;
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    setShowSugs(false);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: answer(q) }]);
  };

  /* ── loading / error ── */
  const loadError = homeQuery.error || membersQuery.error || storeQuery.error || ordersQuery.error;
  const retryAll = () => [homeQuery, membersQuery, storeQuery, ordersQuery].forEach((q) => q.isError && q.refetch());
  const loading = homeQuery.isLoading;
  const val = (v: React.ReactNode) => (loading ? <span className="inline-block h-[20px] w-14 animate-pulse rounded bg-[#F0D9B0]" /> : v);

  const kpis = [
    { key: "members", label: "Active Members", info: "Members with an active loyalty account.", value: fmtNum(home?.active_members), sub: `${tiers.length} tiers configured`, color: "#2C2C2C" },
    { key: "points", label: "Points Outstanding", info: "Points currently held by members and not yet redeemed.", value: fmtNum(home?.points_outstanding), sub: "Unredeemed member balances", color: "#B8694A" },
    { key: "orders", label: "Total Orders", info: "All redemption orders placed through the store.", value: fmtNum(orders?.total_orders), sub: `${statusData.length} statuses`, color: "#2C2C2C" },
    { key: "stuck", label: "Stuck Orders", info: "Orders that are paid but not yet fulfilled.", value: fmtNum(orders?.stuck_orders), sub: orders?.oldest_stuck_days != null ? `Oldest ${fmtNum(orders.oldest_stuck_days)} days` : "None waiting", color: orders?.stuck_orders ? "#E7848E" : "#108C72" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F4EE] text-[12px] text-[#2C2C2C]" style={FONT}>
      {/* ── TOPBAR ── */}
      <div className="sticky top-0 z-[300] flex min-h-[50px] flex-wrap items-center justify-between gap-2 bg-[#2C2C2C] px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)] md:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-[#DA7756]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-white" strokeWidth="2.2">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.8L19.2 8.5v7L12 19.2 4.8 15.5v-7L12 4.8z" />
            </svg>
          </div>
          <div className="text-[13px] font-bold text-white">Loyalty Dashboard</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date filter */}
          <div className="relative shrink-0" ref={filterWrapRef}>
            <button
              className="flex items-center gap-[5px] rounded-full border border-white/[.15] bg-white/[.08] px-2.5 py-1 transition-all hover:bg-white/[.14]"
              style={FONT}
              onClick={() => { setDraftRange(customRange); setFilterOpen((o) => !o); }}
            >
              <span className="text-[11px]">📅</span>
              <span className="text-[10px] font-semibold text-white/[.85]">{filterLabel}</span>
              <span className="text-[8px] text-white/40">▾</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[400] w-[260px] rounded-[10px] border border-[#C4B89D] bg-white p-2.5 shadow-[0_6px_24px_rgba(44,44,44,0.16)]">
                <div className="mb-2 flex flex-wrap gap-1">
                  {DATE_PRESETS.filter((p) => p !== "Custom").map((p) => (
                    <button
                      key={p}
                      style={FONT}
                      onClick={() => { setPreset(p); setFilterOpen(false); }}
                      className={`whitespace-nowrap rounded-full border px-[9px] py-[3px] text-[10px] transition-all ${
                        preset === p
                          ? "border-[#DA7756] bg-[#FFF7EB] font-semibold text-[#DA7756]"
                          : "border-[#C4B89D] font-medium text-[#798C5E] hover:border-[#DA7756] hover:text-[#DA7756]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#E0D8CC] pt-2">
                  <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[.07em] text-[#798C5E]">Custom range</div>
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={draftRange.from} max={draftRange.to} onChange={(e) => setDraftRange((r) => ({ ...r, from: e.target.value }))} className="h-[26px] min-w-0 flex-1 rounded-full border border-[#C4B89D] px-2 text-[10px] outline-none focus:border-[#DA7756]" style={FONT} />
                    <span className="text-[10px] text-[#798C5E]">→</span>
                    <input type="date" value={draftRange.to} min={draftRange.from} onChange={(e) => setDraftRange((r) => ({ ...r, to: e.target.value }))} className="h-[26px] min-w-0 flex-1 rounded-full border border-[#C4B89D] px-2 text-[10px] outline-none focus:border-[#DA7756]" style={FONT} />
                  </div>
                  <button
                    style={FONT}
                    disabled={!draftRange.from || !draftRange.to || draftRange.from > draftRange.to}
                    onClick={() => { setCustomRange(draftRange); setPreset("Custom"); setFilterOpen(false); }}
                    className="mt-2 h-[26px] w-full rounded-full bg-[#DA7756] text-[10px] font-semibold text-white disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            className="flex items-center gap-[5px] rounded-full bg-[#DA7756] px-2.5 py-1 transition-opacity hover:opacity-[.85]"
            style={{ ...FONT, background: "#DA7756" }}
            onClick={() => navigate("/loyalty/dashboard-new")}
          >
            <span className="whitespace-nowrap text-[10px] font-semibold text-white">Programme Detail →</span>
          </button>
          <div className="hidden text-[10px] text-white/40 md:block">{liveDate}</div>
          {getUserInitials() && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DA7756] text-[10px] font-bold text-white">
              {getUserInitials()}
            </div>
          )}
        </div>
      </div>

      {/* ── PAGE ── */}
      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-3 md:px-5">
        {loadError && (
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E7848E50] bg-[#FFF3F3] px-3 py-2 text-[11px]">
            <span>⚠️ Some dashboard data couldn't be loaded. {getLoyaltyErrorMessage(loadError)}</span>
            <button onClick={retryAll} className="rounded-full border border-[#DA7756] px-3 py-0.5 text-[10px] font-semibold text-[#DA7756] hover:bg-[#DA775610]" style={FONT}>
              Retry
            </button>
          </div>
        )}

        {/* KPI STRIP */}
        <div className="mb-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <button
              key={k.key}
              onClick={() => openDrill(k.key)}
              className="rounded-[10px] border border-[#F0D9B0] bg-[#FFF7EB] px-3.5 py-[11px] text-left transition-shadow hover:shadow-[0_3px_10px_rgba(218,119,86,0.18)]"
              style={FONT}
            >
              <div className="mb-[5px] flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[.06em] text-[#798C5E]">
                {k.label} <InfoIcon details={k.info} />
              </div>
              <div className="text-[22px] font-bold leading-none" style={{ color: k.color }}>{val(k.value)}</div>
              <div className="mt-[5px] text-[10px] text-[#798C5E]">{loading ? " " : k.sub}</div>
            </button>
          ))}
        </div>

        {/* STORE PIPELINE */}
        <button
          className="mb-2.5 flex w-full flex-wrap items-center gap-2.5 rounded-[10px] border border-[#E0D8CC] bg-white px-4 py-3 text-left transition-shadow hover:shadow-[0_2px_8px_rgba(44,44,44,0.07)]"
          onClick={() => openDrill("store")}
          style={FONT}
        >
          <div className="min-w-[110px] border-l-[3px] border-[#108C72] px-3.5 py-1 text-center">
            <div className="text-[20px] font-bold leading-none text-[#2C2C2C]">{storeQuery.isLoading ? "…" : fmtNum(inAggregator)}</div>
            <div className="mt-[3px] whitespace-nowrap text-[9px] text-[#798C5E]">Items in aggregator</div>
          </div>
          <div className="shrink-0 text-base text-[#C4B89D]">→</div>
          <div className={`min-w-[110px] border-l-[3px] px-3.5 py-1 text-center ${liveInStore ? "border-[#108C72]" : "border-[#E7848E]"}`}>
            <div className="text-[20px] font-bold leading-none" style={{ color: liveInStore ? "#2C2C2C" : "#E7848E" }}>{storeQuery.isLoading ? "…" : fmtNum(liveInStore)}</div>
            <div className="mt-[3px] whitespace-nowrap text-[9px] text-[#798C5E]">Items live in store</div>
          </div>
          <div className="shrink-0 text-base text-[#C4B89D]">→</div>
          <div className="min-w-[110px] border-l-[3px] border-[#EDC488] px-3.5 py-1 text-center">
            <div className="text-[20px] font-bold leading-none text-[#B8694A]">{loading ? "…" : fmtNum(home?.points_outstanding)}</div>
            <div className="mt-[3px] whitespace-nowrap text-[9px] text-[#798C5E]">Points waiting to be spent</div>
          </div>
          {store && (
            <div className={`ml-auto min-w-[180px] flex-1 text-right text-[10px] font-semibold ${liveInStore ? "text-[#108C72]" : "text-[#E7848E]"}`}>
              {liveInStore
                ? `${fmtNum(liveInStore)} items available for members to redeem`
                : inAggregator
                ? "Store is empty — add aggregator items so members can redeem points"
                : "No items available yet"}
            </div>
          )}
        </button>

        {/* ALERTS */}
        {!loading && (
          alerts.length ? (
            <div className="mb-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {alerts.map((a) => (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  style={FONT}
                  className={`flex items-center gap-2 rounded-lg border border-l-[3px] px-2.5 py-[9px] text-left transition-opacity hover:opacity-[.88] ${
                    a.tone === "err" ? "border-[#E7848E30] border-l-[#E7848E] bg-[#FFF3F3]" : "border-[#EDC48840] border-l-[#EDC488] bg-[#FFFAF0]"
                  }`}
                >
                  <div className="shrink-0 text-[17px]">{a.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold text-[#2C2C2C]">{a.title}</div>
                    <div className="mt-px truncate text-[10px] text-[#798C5E]">{a.sub}</div>
                  </div>
                  <div className="shrink-0 whitespace-nowrap text-[9px] font-bold text-[#DA7756]">View →</div>
                </button>
              ))}
            </div>
          ) : !loadError && (
            <div className="mb-2.5 rounded-lg border border-[#108C7230] bg-[#108C720D] px-3 py-2 text-[11px] font-medium text-[#108C72]">
              ✓ Nothing needs attention right now.
            </div>
          )
        )}

        {/* CHARTS ROW */}
        <div className="mb-2 grid grid-cols-1 gap-2 lg:grid-cols-[60fr_40fr]">
          <Card>
            <CardHead
              title="Orders by Status"
              info="Count of redemption orders in each fulfilment status."
              sub={orders ? `${fmtNum(orders.total_orders)} orders · ${fmtNum(orders.stuck_orders)} stuck` : undefined}
              action={<button onClick={() => openDrill("orders")} className="text-[10px] text-[#DA7756]" style={FONT}>Details →</button>}
            />
            <div className="h-[190px]">
              {loading ? (
                <div className="h-full animate-pulse rounded-md bg-[#F6F4EE]" />
              ) : statusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} barSize={28} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="rgba(224,216,204,0.5)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 9, fontWeight: 600, fill: "#2C2C2C", ...FONT }} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 9, fill: "#798C5E", ...FONT }} />
                    <Tooltip cursor={{ fill: "rgba(218,119,86,0.06)" }} content={<ChartTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                      {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty>{homeQuery.isError ? "Order data unavailable." : "No orders yet."}</Empty>
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              title="Member Tier Distribution"
              info="Members in each tier; exit points are the threshold to move up."
              sub={home ? `${fmtNum(home.active_members)} active members across ${tiers.length} tiers` : undefined}
            />
            {loading ? (
              <div className="h-[150px] animate-pulse rounded-md bg-[#F6F4EE]" />
            ) : tiers.length ? (
              <div className="pt-1">
                {tiers.map((t) => (
                  <button key={t.id ?? t.name} onClick={() => openDrill("tier", t)} className="group flex w-full items-center gap-2 py-1 text-left" style={FONT}>
                    <div className="w-20 shrink-0 truncate text-[10px] font-medium text-[#798C5E] group-hover:text-[#DA7756]">{t.name}</div>
                    <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-[#F6F4EE]">
                      <div
                        className="h-[18px] rounded transition-[width] duration-[400ms]"
                        style={{ width: `${t.member_count ? Math.max(4, (t.member_count / maxTier) * 100) : 0}%`, background: tierColor(t.name) }}
                      />
                    </div>
                    <div className="w-8 shrink-0 text-right text-[10px] font-bold text-[#2C2C2C]">{fmtNum(t.member_count)}</div>
                  </button>
                ))}
                {tiers.some((t) => t.exit_points != null) && (
                  <div className="mt-2.5 rounded-md bg-[#F6F4EE] p-2 text-[10px] leading-[1.6] text-[#798C5E]">
                    Exit points: {tiers.filter((t) => t.exit_points != null).map((t) => `${t.name} ${fmtNum(t.exit_points)}`).join(" · ")}
                  </div>
                )}
              </div>
            ) : (
              <Empty>{homeQuery.isError ? "Tier data unavailable." : "No tiers configured."}</Empty>
            )}
          </Card>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[40fr_60fr]">
          <Card>
            <CardHead
              title="Top Members"
              info="Members with the highest points balance."
              sub={membersData ? `${fmtNum(members.length)} members · sorted by balance` : undefined}
            />
            {membersQuery.isLoading ? (
              <div className="h-[150px] animate-pulse rounded-md bg-[#F6F4EE]" />
            ) : members.length ? (
              members.slice(0, 6).map((m, i) => (
                <button
                  key={`${m.name}-${i}`}
                  className="group flex w-full items-center gap-2.5 border-b border-[#E0D8CC] py-[7px] text-left last:border-b-0"
                  onClick={() => openDrill("member", m)}
                  style={FONT}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: AV_COLORS[i % AV_COLORS.length] }}>
                    {initialsOf(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-semibold text-[#2C2C2C] group-hover:text-[#DA7756]">{m.name}</div>
                    <div className="mt-px truncate text-[9px] text-[#798C5E]">{[m.tier, m.society].filter(Boolean).join(" · ") || "—"}</div>
                  </div>
                  <div>
                    <div className="text-right text-[11px] font-bold text-[#2C2C2C]">{fmtNum(m.points_balance)}</div>
                    <div className="text-right text-[8px] text-[#798C5E]">pts balance</div>
                  </div>
                </button>
              ))
            ) : (
              <Empty>{membersQuery.isError ? "Member data unavailable." : "No members found."}</Empty>
            )}
          </Card>

          <Card>
            <CardHead
              title="Stuck Orders"
              info="Orders that are paid but not yet fulfilled, oldest first."
              sub={ordersData ? `${fmtNum(stuckList.length)} orders waiting for fulfilment` : undefined}
            />
            {ordersQuery.isLoading ? (
              <div className="h-[150px] animate-pulse rounded-md bg-[#F6F4EE]" />
            ) : stuckList.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[10.5px]">
                  <thead>
                    <tr>
                      {["Order", "Customer", "Amount", "Created", "Status"].map((h) => (
                        <th key={h} className="whitespace-nowrap border-b border-[#E0D8CC] bg-[#F6F4EE] px-2 py-[5px] text-left text-[9px] font-semibold uppercase tracking-[.05em] text-[#798C5E]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stuckList.slice(0, 6).map((o, i) => (
                      <tr key={o.id ?? i} className="cursor-pointer transition-colors hover:bg-[#DA775608]" onClick={() => openDrill("order", o)}>
                        <td className="border-b border-[#E0D8CC] px-2 py-1.5 font-semibold">{o.id}</td>
                        <td className="border-b border-[#E0D8CC] px-2 py-1.5">{o.customer_name || o.customer || "N/A"}</td>
                        <td className="border-b border-[#E0D8CC] px-2 py-1.5">₹{fmtNum(o.amount)}</td>
                        <td className="whitespace-nowrap border-b border-[#E0D8CC] px-2 py-1.5 text-[#798C5E]">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="border-b border-[#E0D8CC] px-2 py-1.5">
                          <span className="inline-flex items-center rounded-[20px] bg-[#EDC48825] px-1.5 py-0.5 text-[9px] font-semibold text-[#8A5A00]">{o.status || "Pending"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>{ordersQuery.isError ? "Order data unavailable." : "✓ No stuck orders."}</Empty>
            )}
            <button className="mt-2 w-full text-right text-[10px] text-[#DA7756]" onClick={() => navigate("/loyalty/dashboard-new")} style={FONT}>
              Open Programme Detail →
            </button>
          </Card>
        </div>
      </div>

      {/* ── DRILL PANEL ── */}
      {drill && <div className="fixed inset-0 z-[500] bg-[#2C2C2C4D] backdrop-blur-[2px]" onClick={() => setDrill(null)} />}
      <div
        className={`fixed top-0 z-[501] flex h-screen w-full max-w-[460px] flex-col border-l border-[#C4B89D] bg-white shadow-[-4px_0_20px_rgba(44,44,44,0.12)] transition-[right] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] ${
          drill ? "right-0" : "right-[-480px]"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E0D8CC] px-4 py-3.5">
          <div className="text-[13px] font-semibold">{drill?.title}</div>
          <button className="px-1 text-[20px] leading-none text-[#798C5E] hover:text-[#DA7756]" onClick={() => setDrill(null)}>×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3.5 [scrollbar-width:thin]">{drill?.body}</div>
      </div>

      {/* ── AI CHAT ── */}
      <div
        className={`fixed bottom-[84px] right-4 z-[401] flex h-[min(500px,70vh)] w-[min(370px,calc(100vw-32px))] origin-bottom-right flex-col overflow-hidden rounded-[14px] border border-[#C4B89D] bg-white shadow-[0_8px_36px_rgba(44,44,44,0.18)] transition-all duration-200 ${
          aiOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2.5 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center gap-2.5 bg-gradient-to-br from-[#DA7756] to-[#B8694A] px-4 py-3">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-[14px] text-white">✦</div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-white">Loyalty Assistant</div>
            <div className="text-[9px] text-white/70">Answers from the data on this page</div>
          </div>
          <button className="px-1 py-0.5 text-[18px] text-white/80" onClick={() => setAiOpen(false)}>×</button>
        </div>
        <div ref={msgsRef} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#F6F4EE] p-3 [scrollbar-width:thin]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] break-words rounded-[11px] px-[11px] py-2 text-[11px] leading-[1.6] ${
                m.role === "user" ? "self-end rounded-br-[3px] bg-[#DA7756] text-white" : "self-start rounded-bl-[3px] border border-[#E0D8CC] bg-white text-[#2C2C2C]"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        {showSugs && (
          <div className="flex shrink-0 flex-wrap gap-1 border-t border-[#E0D8CC] px-2.5 py-[7px]">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="whitespace-nowrap rounded-full border border-[#C4B89D] bg-[#F6F4EE] px-[9px] py-[3px] text-[10px] text-[#798C5E] transition-all hover:border-[#DA7756] hover:text-[#DA7756]"
                style={FONT}
                onClick={() => ask(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex shrink-0 items-center gap-[7px] border-t border-[#E0D8CC] px-2.5 py-2"
          onSubmit={(e) => { e.preventDefault(); ask(aiInput.trim()); setAiInput(""); }}
        >
          <input
            className="flex-1 rounded-lg border border-[#C4B89D] bg-[#F6F4EE] px-2.5 py-[7px] text-[11px] text-[#2C2C2C] outline-none focus:border-[#DA7756]"
            style={FONT}
            placeholder="Ask about your loyalty programme…"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
          <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DA7756] text-[13px] text-white">→</button>
        </form>
      </div>
      <button
        className="fixed bottom-[22px] right-[22px] z-[400] flex h-[50px] w-[50px] items-center justify-center rounded-full bg-gradient-to-br from-[#DA7756] to-[#B8694A] text-[20px] text-white shadow-[0_4px_16px_rgba(218,119,86,0.45)] transition-transform hover:scale-[1.08]"
        onClick={() => setAiOpen((o) => !o)}
        title="Ask the assistant"
      >
        {aiOpen ? "×" : "✦"}
      </button>
    </div>
  );
};

export default LoyaltyDashboardNew;
