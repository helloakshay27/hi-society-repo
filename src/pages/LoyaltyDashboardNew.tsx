import React, { useState, useEffect, useRef, useCallback } from "react";
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

/* ── Palette (from HTML :root tokens) ─────────────────────────────
   terra:#DA7756 · terra-dk:#B8694A · bg:#F6F4EE · dark:#2C2C2C
   sage:#798C5E · ok:#108C72 · warn:#EDC488 · err:#E7848E
   border:#C4B89D · div:#E0D8CC · dune:#DBC2A9                     */

const FONT = { fontFamily: "'Poppins', sans-serif" };

/* ── Claims Backlog chart data ── */
const burnData = [
  { label: "0-15d", value: 0, color: "#108C72" },
  { label: "16-30d", value: 5, color: "#EDC488" },
  { label: "31-45d", value: 8, color: "#EDC488" },
  { label: "46-60d", value: 4, color: "#E7848E" },
  { label: "60d+", value: 1, color: "#E7848E" },
];

/* ── Small drill-panel building blocks ── */
const Dk = ({ val, lbl, color }: { val: React.ReactNode; lbl: string; color?: string }) => (
  <div className="flex-1 min-w-[72px] rounded-lg bg-[#F6F4EE] p-2.5 text-center">
    <div className="text-[18px] font-bold text-[#2C2C2C]" style={color ? { color } : undefined}>
      {val}
    </div>
    <div className="mt-0.5 text-[9px] text-[#798C5E]">{lbl}</div>
  </div>
);

const DkStrip = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 flex flex-wrap gap-2">{children}</div>
);

const DSec = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-[5px] mt-2.5 text-[9px] font-bold uppercase tracking-[.07em] text-[#798C5E]">
    {children}
  </div>
);

const DSl = ({ l, r }: { l: React.ReactNode; r: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-[#E0D8CC] py-1.5 text-[11px] last:border-b-0">
    <span>{l}</span>
    <span>{r}</span>
  </div>
);

const BadgeOk = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-[20px] bg-[#108C7215] px-1.5 py-0.5 text-[9px] font-semibold text-[#108C72]">
    {children}
  </span>
);

const BadgeWarn = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-[20px] bg-[#EDC48825] px-1.5 py-0.5 text-[9px] font-semibold text-[#8A5A00]">
    {children}
  </span>
);

/* ── AI chat fallback answers (from HTML getFallback) ── */
const getFallback = (q: string): string => {
  const l = q.toLowerCase();
  if (l.includes("attention") || l.includes("today") || l.includes("urgent"))
    return "5 things need attention: the redemption store has 0 live items (3,235 ready in aggregator), 12,400 distributed points are at expiry risk while the store is empty, 7 orders are stuck Paid but not fulfilled (oldest 107 days, Roshan Shetty), 18 claims are Granted awaiting physical delivery (oldest 66 days, Pravin Deshmukh), and 0 contests are running so members have no engagement reason. Start with the 7 stuck orders since money has already changed hands.";
  if (l.includes("order") || l.includes("stuck") || l.includes("pending"))
    return "7 of your 52 orders are marked Paid but stuck at Pending since 12-13 Mar 2026, oldest now 107 days. All 7 belong to Roshan Shetty. Go to Orders, filter by Status: Pending, and move them to Confirmed/Shipped or process a refund.";
  if (l.includes("redeem") || l.includes("store") || l.includes("item"))
    return "Points redeemed is 0 because the redemption store has no live items. The aggregator has 3,235 items ready: 62 lounge passes, 8 airline miles programmes, and 3,165 merchandise items. Go to Aggregator Inventory, select items, and click Add to Store.";
  if (l.includes("expir"))
    return "Points Expiring is a live KPI on the platform but the exact expiry window for this account needs confirmation from the dev team. All 12,400 distributed points are outstanding and at risk if expiry is configured — members Satish Poojary, Shivaji Mali, and Sanjay Yadav cannot redeem because the store has 0 items. Stock the store immediately to give them a chance to spend before any expiry kicks in.";
  if (l.includes("contest") || l.includes("engag"))
    return "There are 0 active contests right now, meaning your 3 members have no engagement mechanism live. The last contest was March Madness Spin 2026, which generated 18 claims. Create a new contest in the Loyalty menu to keep members active.";
  if (l.includes("member") || l.includes("customer"))
    return "You have 3 active Silver tier members: Satish Poojary, Shivaji Mali, and Sanjay Yadav, who have collectively received 12,400 distributed points this month. Note that the Customers page shows 0 due to a data sync gap — confirm this with the dev team. None of the 3 can redeem points yet because the store has 0 live items.";
  if (l.includes("claim") || l.includes("fulfil"))
    return "18 of your 52 claims are Granted — prize approved but physical delivery pending. The oldest, Pravin Deshmukh, has been waiting 66 days since 22 Apr 2026. These came from Spring Carnival Scratch (34 claims) and March Madness Spin 2026 (18 claims). Go to the Claims page and clear the oldest first.";
  if (l.includes("offer"))
    return "You have 1 active offer (OFF-0044) on the Runwal Demo site, expiring 30 Jun 2026 — 3 days from today. Review whether to extend it or create a new offer before it lapses.";
  return "Your programme has 3 active Silver tier members — Satish Poojary, Shivaji Mali, and Sanjay Yadav — who have received 12,400 distributed points, but the store has 0 live items so none can be redeemed. 7 orders are also stuck Paid but not fulfilled, oldest 107 days. Clear the 7 stuck orders first since money has already moved, then stock the store.";
};

const AI_SYS = `You are a loyalty programme assistant for the admin dashboard of Runwal Demo's loyalty programme, built on the Lockated platform (web.hisociety.lockated.com).

Current programme snapshot (27 Jun 2026):
- Active members: 3 (all Silver tier) — Satish Poojary, Shivaji Mali, Sanjay Yadav
- Tier structure: Diamond (4,00,000 pts exit, 1000 welcome bonus, 0 members), Titanium (3,00,000 pts, 1000 bonus, 0 members), Gold (2,00,000 pts, 100 bonus, 0 members), Silver (1,00,000 pts, 100 bonus, 3 members), Bronze (1,000 pts, 100 bonus, 0 members)
- Points distributed this month: 12,400. Points redeemed: 0. Points expiring: unknown — expiry config must be confirmed with dev team. All 12,400 outstanding points are at risk if expiry is enabled and store remains empty.
- Redemption store: 0 live items. Aggregator has 3,235 items ready (Lounge: 62, Miles: 8, Merchandise: 3,165). Members cannot redeem until items are added.
- Total orders: 52. CRITICAL: 7 orders stuck — marked Paid but fulfilment Pending since 12-13 Mar 2026, oldest 107 days. All 7 belong to Roshan Shetty (Order IDs around 37, 40-45).
- Total claims: 52 (18 Granted = awaiting physical fulfilment, 34 Claimed = fulfilled). Oldest Granted: Pravin Deshmukh, 22 Apr 2026 — 66 days waiting.
- Active contests: 0. No engagement mechanism is currently live. Last ran: March Madness Spin 2026.
- Active offer: 1 (OFF-0044, expires 30 Jun 2026 — 3 days away). 1 expired offer (OFF-0040, Loyalty Bonus Bonanza).
- Data sync gap: Customers page shows 0 customers but Tiers shows 3 Silver members. Dev team needs to fix.

Rules you must follow:
- Use ONLY the numbers provided above. Never invent figures.
- Respond conversationally in 2-4 sentences max.
- Every sentence must contain at least one specific number, name, or date from the data.
- End with exactly one specific, actionable recommendation.
- Plain text only. No markdown, no asterisks, no bullet points.
- Never use: appears, seems, might, could, may be.`;

const AI_SUGGESTIONS = [
  "What needs attention today?",
  "Which orders are stuck?",
  "How many claims need fulfilment?",
  "Are my members' points at expiry risk?",
  "Why are there no active contests?",
];

type ChatMsg = { role: "user" | "bot"; text: string };
type DFMode = "day" | "month" | "range";

/* ── Custom recharts tooltip ── */
const BurnTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-md bg-[#2C2C2C] px-2.5 py-1.5 text-white shadow-md"
      style={FONT}
    >
      <div className="text-[10px] font-semibold">{label}</div>
      <div className="text-[10px]">{payload[0].value} claims waiting this long</div>
    </div>
  );
};

export const LoyaltyDashboardNew = () => {
  /* ── UI state ── */
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [drillOpen, setDrillOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveDate, setLiveDate] = useState("");

  /* date filter state */
  const [filterOpen, setFilterOpen] = useState(false);
  const [dfMode, setDfMode] = useState<DFMode>("month");
  const [dfDay, setDfDay] = useState("2026-06-27");
  const [dfMonth, setDfMonth] = useState("2026-06");
  const [dfFrom, setDfFrom] = useState("2026-06-01");
  const [dfTo, setDfTo] = useState("2026-06-27");
  const [dfPreset, setDfPreset] = useState<string | null>("thismonth");
  const [filterLabel, setFilterLabel] = useState("This Month");
  const filterWrapRef = useRef<HTMLDivElement>(null);

  /* AI chat state */
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: "Hi! I'm your Loyalty assistant. Ask me anything about your programme — members, claims, the store, offers, or what needs attention today. 🎯",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [showSugs, setShowSugs] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const chatHistory = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const msgsRef = useRef<HTMLDivElement>(null);

  /* ── helpers ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const openDrill = useCallback((key: string) => {
    setDrillKey(key);
    setDrillOpen(true);
  }, []);

  const closeDrill = useCallback(() => setDrillOpen(false), []);

  /* live date ticker */
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

  /* close filter dropdown on outside click */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  /* scroll chat to bottom */
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, typing]);

  /* ── date filter logic (mirrors HTML) ── */
  const setMode = (mode: DFMode) => {
    setDfMode(mode);
    setDfPreset(null);
  };

  const applyDF = () => {
    let label = "This Month";
    if (dfMode === "day") {
      if (dfDay)
        label = new Date(dfDay + "T12:00").toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
    } else if (dfMode === "month") {
      if (dfMonth) {
        const [y, m] = dfMonth.split("-");
        label = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        });
      }
    } else {
      const s = (v: string) =>
        v
          ? new Date(v + "T12:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
          : "—";
      label = s(dfFrom) + " → " + s(dfTo);
    }
    setFilterLabel(label);
    setFilterOpen(false);
    showToast(label);
  };

  const resetDF = () => {
    setDfMode("month");
    setDfMonth("2026-06");
    setDfPreset("thismonth");
    setFilterLabel("This Month");
    showToast("Reset → This Month · Jun 2026");
  };

  const setPreset = (preset: string) => {
    setDfPreset(preset);
    const today = new Date("2026-06-27T12:00:00");
    const iso = (d: Date) => d.toISOString().split("T")[0];
    const mo = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (preset === "today") {
      setDfMode("day");
      setDfDay(iso(today));
      setFilterLabel("Today");
      showToast("Today → 27 Jun 2026");
    } else if (preset === "7d") {
      const f = new Date(today);
      f.setDate(f.getDate() - 6);
      setDfMode("range");
      setDfFrom(iso(f));
      setDfTo(iso(today));
      setFilterLabel("Last 7 Days");
      showToast("Last 7 Days");
    } else if (preset === "30d") {
      const f = new Date(today);
      f.setDate(f.getDate() - 29);
      setDfMode("range");
      setDfFrom(iso(f));
      setDfTo(iso(today));
      setFilterLabel("Last 30 Days");
      showToast("Last 30 Days");
    } else if (preset === "thismonth") {
      setDfMode("month");
      setDfMonth(mo(today));
      setFilterLabel("This Month");
      showToast("This Month → Jun 2026");
    } else if (preset === "lastmonth") {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      setDfMode("month");
      setDfMonth(mo(lm));
      setFilterLabel("Last Month");
      showToast("Last Month → May 2026");
    } else if (preset === "thisquarter") {
      const qs = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      setDfMode("range");
      setDfFrom(iso(qs));
      setDfTo(iso(today));
      setFilterLabel("This Quarter");
      showToast("This Quarter → Apr–Jun 2026");
    }
  };

  /* ── AI chat logic ── */
  const addUserMsgAndReply = async (q: string) => {
    setShowSugs(false);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setTyping(true);
    chatHistory.current.push({ role: "user", content: q });
    let reply: string;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: AI_SYS,
          messages: chatHistory.current,
        }),
      });
      const data = await res.json();
      reply =
        data.content && data.content[0] && data.content[0].text
          ? data.content[0].text.trim()
          : "Sorry, I could not process that. Please try again.";
    } catch {
      reply = getFallback(q);
    }
    chatHistory.current.push({ role: "assistant", content: reply });
    setTyping(false);
    setMessages((m) => [...m, { role: "bot", text: reply }]);
  };

  const sendAI = () => {
    const q = aiInput.trim();
    if (!q) return;
    setAiInput("");
    addUserMsgAndReply(q);
  };

  /* ── Drill content ── */
  const drillTitles: Record<string, string> = {
    "d-members": "Active Members",
    "d-points": "Points Distributed",
    "d-orders": "Total Orders",
    "d-orders-alert": "Stuck Orders — Paid, Not Fulfilled",
    "d-claims": "All Claims",
    "d-store-alert": "Redemption Store — Setup Required",
    "d-claims-alert": "Claims Awaiting Fulfilment",
    "d-offer-alert": "Active Offer Details",
    "d-tier-diamond": "Diamond Tier",
    "d-tier-titanium": "Titanium Tier",
    "d-tier-gold": "Gold Tier",
    "d-tier-silver": "Silver Tier",
    "d-tier-bronze": "Bronze Tier",
    "d-claim-1": "Claim #52 · Satish Poojary",
    "d-claim-2": "Claim #50 · Shivaji Mali",
    "d-claim-3": "Claim #42 · ASHOK YADAV",
    "d-claim-4": "Claim #39 · Roshan Shetty",
    "d-claim-5": "Claim #36 · Sanjay Yadav",
    "d-member-1": "Member · Satish Poojary",
    "d-member-2": "Member · Shivaji Mali",
    "d-member-3": "Member · Sanjay Yadav",
  };

  const drillBtn = (label: string, onClick: () => void, outline = false) => (
    <button
      onClick={onClick}
      className={
        outline
          ? "mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#DA7756] bg-transparent p-[9px] text-[11px] font-semibold text-[#DA7756] hover:bg-[#DA775610]"
          : "mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border-0 bg-[#DA7756] p-[9px] text-[11px] font-semibold text-white hover:opacity-[.88]"
      }
      style={FONT}
    >
      {label}
    </button>
  );

  const infoBox = (children: React.ReactNode, variant: "bg" | "warn" | "err" = "bg") => {
    const cls =
      variant === "warn"
        ? "rounded-md border border-[#EDC48840] bg-[#FFFAF0] p-2 text-[10.5px] leading-[1.6] text-[#2C2C2C]"
        : variant === "err"
        ? "rounded-md border border-[#E7848E30] bg-[#FFF3F3] p-2 text-[10.5px] leading-[1.6]"
        : "rounded-md bg-[#F6F4EE] p-2 text-[10.5px] leading-[1.6]";
    return <div className={cls}>{children}</div>;
  };

  const renderDrillBody = (key: string | null): React.ReactNode => {
    switch (key) {
      case "d-members":
        return (
          <>
            <DkStrip>
              <Dk val="3" lbl="Total Members" />
              <Dk val="3" lbl="Silver Tier" color="#798C5E" />
              <Dk val="0" lbl="Other Tiers" color="#888" />
            </DkStrip>
            <DSec>Tier Breakdown</DSec>
            <DSl l="Diamond (4,00,000 pts)" r="0 members" />
            <DSl l="Titanium (3,00,000 pts)" r="0 members" />
            <DSl l="Gold (2,00,000 pts)" r="0 members" />
            <DSl l="Silver (1,00,000 pts)" r={<span className="font-bold text-[#798C5E]">3 members</span>} />
            <DSl l="Bronze (1,000 pts)" r="0 members" />
            <DSec>Programme Context</DSec>
            {infoBox(
              <>
                Welcome bonus: Diamond &amp; Titanium = 1,000 pts · Gold, Silver, Bronze = 100 pts.
                Members join at Bronze and move up as they accumulate points.
              </>
            )}
          </>
        );
      case "d-points":
        return (
          <>
            <DkStrip>
              <Dk val="12,400" lbl="Outstanding" />
              <Dk val="0%" lbl="Redeemed" color="#E7848E" />
              <Dk val="27d" lbl="Unmoved" color="#EDC488" />
            </DkStrip>
            <DSec>The Chain That's Broken</DSec>
            <DSl l="1. Items in aggregator" r={<span className="font-bold text-[#108C72]">3,235</span>} />
            <DSl l="2. Items added to store" r={<span className="font-bold text-[#E7848E]">0 ← breaks here</span>} />
            <DSl l="3. Points redeemed" r={<span className="font-bold text-[#E7848E]">0</span>} />
            <DSec>Expiry Risk</DSec>
            {infoBox(
              <>
                Expiry window needs confirmation from the dev team — if configured, all 12,400
                points are at risk since members have had nothing to spend them on for 27 days.
              </>,
              "warn"
            )}
            <DSec>Member Breakdown</DSec>
            <DSl l="Satish Poojary" r={<span className="font-bold">4,200 pts</span>} />
            <DSl l="Shivaji Mali" r={<span className="font-bold">4,100 pts</span>} />
            <DSl l="Sanjay Yadav" r={<span className="font-bold">4,100 pts</span>} />
            {drillBtn("🏪 Fix Store — Add Items", () => openDrill("d-store-alert"))}
          </>
        );
      case "d-member-1":
        return (
          <>
            <DkStrip>
              <Dk val="Silver" lbl="Tier" color="#798C5E" />
              <Dk val="4,200" lbl="Pts Balance" />
            </DkStrip>
            <DSec>Satish Poojary</DSec>
            <DSl l="Claim ID" r="#52" />
            <DSl l="Contest" r="Spring Carnival Scratch" />
            <DSl l="Prize" r="XOXO Gift Box" />
            <DSl l="Claim Status" r={<BadgeOk>Claimed</BadgeOk>} />
            <DSl l="Mobile" r="9819408921" />
          </>
        );
      case "d-member-2":
        return (
          <>
            <DkStrip>
              <Dk val="Silver" lbl="Tier" color="#798C5E" />
              <Dk val="4,100" lbl="Pts Balance" />
            </DkStrip>
            <DSec>Shivaji Mali</DSec>
            <DSl l="Claim ID" r="#50" />
            <DSl l="Contest" r="Spring Carnival Scratch" />
            <DSl l="Prize" r="XOXO Gift Box" />
            <DSl l="Claim Status" r={<BadgeOk>Claimed</BadgeOk>} />
            <DSl l="Mobile" r="9428299927" />
          </>
        );
      case "d-member-3":
        return (
          <>
            <DkStrip>
              <Dk val="Silver" lbl="Tier" color="#798C5E" />
              <Dk val="4,100" lbl="Pts Balance" />
            </DkStrip>
            <DSec>Sanjay Yadav</DSec>
            <DSl l="Claim ID" r="#36" />
            <DSl l="Contest" r="March Madness Spin 2026" />
            <DSl l="Prize" r="Lounge Access" />
            <DSl l="Claim Status" r={<BadgeWarn>Granted</BadgeWarn>} />
            <DSl l="Mobile" r="7597842080" />
            <div className="mt-2">
              {infoBox("Prize approved but lounge access not yet fulfilled.", "warn")}
            </div>
            {drillBtn("📦 Go to Claims", () => showToast("Opening Claims page…"))}
          </>
        );
      case "d-orders":
        return (
          <>
            <DkStrip>
              <Dk val="52" lbl="Total Orders" />
              <Dk val="7" lbl="Stuck — Paid" color="#E7848E" />
              <Dk val="45" lbl="Fulfilled/Closed" />
            </DkStrip>
            <DSec>Why 7 are flagged</DSec>
            {infoBox(
              <>
                7 orders are marked <strong>Paid</strong> but their fulfilment status has stayed{" "}
                <strong>Pending</strong> since 12–13 Mar 2026 — the oldest is now 107 days old.
                Points were already redeemed for these orders. Recommend reviewing Order IDs 37,
                40–45 (Runwal Gardens, customer Roshan Shetty) and moving them to
                Confirmed/Shipped or Cancelling with a refund.
              </>,
              "err"
            )}
            {drillBtn("🧾 Go to Orders — Filter Pending", () =>
              showToast("Opening Orders — filtered to Pending…")
            )}
          </>
        );
      case "d-orders-alert":
        return (
          <>
            <DkStrip>
              <Dk val="7" lbl="Stuck Orders" color="#E7848E" />
              <Dk val="107" lbl="Days — Oldest" />
              <Dk val="100%" lbl="Already Paid" color="#108C72" />
            </DkStrip>
            <DSec>Stuck Orders (sample)</DSec>
            <DSl l="ORD20260312...8032B" r="₹660 · Pending" />
            <DSl l="ORD20260312...3DB" r="₹6,203 · Pending" />
            <DSl l="ORD20260312...0C51" r="₹1,771 · Pending" />
            <DSl l="ORD20260312...C093" r="₹6,203 · Pending" />
            <DSl l="+3 more, same customer" r="" />
            <DSec>Root Cause</DSec>
            {infoBox(
              "All 7 belong to customer Roshan Shetty, created 12–13 Mar 2026. Payment cleared and points were deducted, but order status was never advanced past Pending — likely a fulfilment-team follow-up gap rather than a payment issue."
            )}
            {drillBtn("🧾 Go to Orders — Filter Pending", () =>
              showToast("Opening Orders — filtered to Pending…")
            )}
          </>
        );
      case "d-claims":
        return (
          <>
            <DkStrip>
              <Dk val="52" lbl="Total Claims" />
              <Dk val="18" lbl="Granted" color="#EDC488" />
              <Dk val="34" lbl="Claimed" color="#108C72" />
            </DkStrip>
            <DSec>What does Granted mean?</DSec>
            {infoBox(
              <>
                <strong>Claimed</strong> = member has received their prize.{" "}
                <strong>Granted</strong> = prize approved but physical delivery or fulfilment is
                still pending. The 18 Granted claims need to be actioned — the oldest (Pravin
                Deshmukh, granted 22 Apr 2026) has been waiting 66 days.
              </>,
              "warn"
            )}
            <DSec>Contests</DSec>
            <DSl l="Spring Carnival Scratch" r={<span className="font-semibold">34 claims</span>} />
            <DSl l="March Madness Spin 2026" r={<span className="font-semibold">18 claims</span>} />
          </>
        );
      case "d-store-alert":
        return (
          <>
            <DkStrip>
              <Dk val="0" lbl="Live in Store" color="#E7848E" />
              <Dk val="3,235" lbl="In Aggregator" color="#108C72" />
            </DkStrip>
            <DSec>Available to Add</DSec>
            <DSl l="🛍️ Merchandise" r={<span className="font-semibold text-[#108C72]">3,165 items</span>} />
            <DSl l="✈️ Lounge Access" r={<span className="font-semibold text-[#108C72]">62 items</span>} />
            <DSl l="🎫 Airline Miles" r={<span className="font-semibold text-[#108C72]">8 items</span>} />
            <DSl l="🎁 Gift Cards" r={<span className="text-[#798C5E]">0 items</span>} />
            <DSec>How to Fix</DSec>
            {infoBox(
              <>
                1. Go to Aggregator Inventory in the Loyalty menu.
                <br />
                2. Select Lounge, Miles, or Merchandise tab.
                <br />
                3. Select items → click "Add to Store".
                <br />
                4. Items will appear in Inventory Section for members to redeem.
              </>
            )}
            {drillBtn("🏪 Go to Aggregator Inventory", () =>
              showToast("Opening Aggregator Inventory…")
            )}
          </>
        );
      case "d-claims-alert":
        return (
          <>
            <DkStrip>
              <Dk val="18" lbl="Granted" color="#EDC488" />
              <Dk val="66" lbl="Oldest (days)" color="#E7848E" />
            </DkStrip>
            <DSec>Granted Claims — Oldest First</DSec>
            <DSl l="Pravin Deshmukh" r={<span><BadgeWarn>Granted</BadgeWarn> 66d</span>} />
            <DSl l="Yogesh Kene" r={<span><BadgeWarn>Granted</BadgeWarn> 33d</span>} />
            <DSl l="Sanjay Yadav" r={<span><BadgeWarn>Granted</BadgeWarn> 32d</span>} />
            <DSl l="Roshan Shetty" r={<span><BadgeWarn>Granted</BadgeWarn> 31d</span>} />
            <DSl l="ASHOK YADAV" r={<span><BadgeWarn>Granted</BadgeWarn> 30d</span>} />
            <div className="mt-1.5 text-[10px] text-[#798C5E]">+13 more Granted claims</div>
            {drillBtn("📦 Go to Claims", () => showToast("Opening Claims page…"))}
          </>
        );
      case "d-offer-alert":
        return (
          <>
            <DkStrip>
              <Dk val="1" lbl="Active" color="#108C72" />
              <Dk val="1" lbl="Expired" color="#798C5E" />
            </DkStrip>
            <DSec>Active Offer</DSec>
            <DSl l="Offer ID" r={<span className="font-semibold">OFF-0044</span>} />
            <DSl l="Title" r={<span className="font-semibold">azsdcftv</span>} />
            <DSl l="Site" r="Runwal Demo" />
            <DSl l="Start Date" r="26 Jun 2026" />
            <DSl l="End Date" r={<span className="font-bold text-[#EDC488]">30 Jun 2026 ⚠️</span>} />
            <DSl l="Show on Home" r="No" />
            <div className="mt-2">
              {infoBox(
                "This offer expires in 3 days. Review if it should be extended or a new offer created before it expires.",
                "warn"
              )}
            </div>
            {drillBtn("🏷️ Manage Offers", () => showToast("Opening Offers page…"))}
          </>
        );
      case "d-tier-silver":
        return (
          <>
            <DkStrip>
              <Dk val="3" lbl="Members" color="#798C5E" />
              <Dk val="1,00,000" lbl="Exit Points" />
              <Dk val="100" lbl="Welcome Bonus" />
            </DkStrip>
            <DSec>Silver Tier Details</DSec>
            <DSl l="Current members" r={<span className="font-bold text-[#798C5E]">3</span>} />
            <DSl l="Points to next tier (Gold)" r="2,00,000" />
            <DSl l="Tier type" r="Life Time" />
          </>
        );
      case "d-tier-diamond":
        return (
          <>
            <DkStrip>
              <Dk val="0" lbl="Members" color="#888" />
              <Dk val="4,00,000" lbl="Exit Points" />
              <Dk val="1,000" lbl="Welcome Bonus" />
            </DkStrip>
            <DSec>Diamond Tier</DSec>
            <DSl l="Members" r="0" />
            <DSl l="Tier type" r="Life Time" />
          </>
        );
      case "d-tier-gold":
        return (
          <DkStrip>
            <Dk val="0" lbl="Members" color="#888" />
            <Dk val="2,00,000" lbl="Exit Points" />
            <Dk val="100" lbl="Welcome Bonus" />
          </DkStrip>
        );
      case "d-tier-titanium":
        return (
          <DkStrip>
            <Dk val="0" lbl="Members" color="#888" />
            <Dk val="3,00,000" lbl="Exit Points" />
            <Dk val="1,000" lbl="Welcome Bonus" />
          </DkStrip>
        );
      case "d-tier-bronze":
        return (
          <DkStrip>
            <Dk val="0" lbl="Members" color="#888" />
            <Dk val="1,000" lbl="Exit Points" />
            <Dk val="100" lbl="Welcome Bonus" />
          </DkStrip>
        );
      case "d-claim-1":
        return (
          <>
            <DkStrip>
              <Dk val="Claimed" lbl="Status" color="#108C72" />
            </DkStrip>
            <DSec>Claim #52</DSec>
            <DSl l="Member" r={<span className="font-semibold">Satish Poojary</span>} />
            <DSl l="Mobile" r="9819408921" />
            <DSl l="Contest" r="Spring Carnival Scratch" />
            <DSl l="Prize" r="XOXO" />
            <DSl l="Product" r="Hyper Foods RawFruit Gift Box" />
            <DSl l="Claim ID" r="52" />
          </>
        );
      case "d-claim-2":
        return (
          <>
            <DkStrip>
              <Dk val="Claimed" lbl="Status" color="#108C72" />
            </DkStrip>
            <DSec>Claim #50</DSec>
            <DSl l="Member" r={<span className="font-semibold">Shivaji Mali</span>} />
            <DSl l="Mobile" r="9428299927" />
            <DSl l="Contest" r="Spring Carnival Scratch" />
            <DSl l="Prize" r="XOXO" />
            <DSl l="Product" r="Hyper Foods RawFruit Gift Box" />
          </>
        );
      case "d-claim-3":
        return (
          <>
            <DkStrip>
              <Dk val="Granted" lbl="Status" color="#EDC488" />
            </DkStrip>
            <DSec>Claim #42 — Action Required</DSec>
            <DSl l="Member" r={<span className="font-semibold">ASHOK YADAV</span>} />
            <DSl l="Mobile" r="9821933673" />
            <DSl l="Contest" r="March Madness Spin 2026" />
            <DSl l="Prize" r="Thankyou" />
            <DSl l="Product" r="Amritsar T1 Airport Lounge" />
            <div className="mt-2">
              {infoBox(
                "This claim is Granted — prize approved but not yet delivered to the member.",
                "warn"
              )}
            </div>
            {drillBtn("✓ Mark as Fulfilled", () => showToast("Claim marked as fulfilled"))}
          </>
        );
      case "d-claim-4":
        return (
          <>
            <DkStrip>
              <Dk val="Granted" lbl="Status" color="#EDC488" />
            </DkStrip>
            <DSec>Claim #39 — Action Required</DSec>
            <DSl l="Member" r={<span className="font-semibold">Roshan Shetty</span>} />
            <DSl l="Contest" r="Spring Carnival Scratch" />
            <DSl l="Prize" r="XOXO Gift Box" />
            {drillBtn("✓ Mark as Fulfilled", () => showToast("Claim marked as fulfilled"))}
          </>
        );
      case "d-claim-5":
        return (
          <>
            <DkStrip>
              <Dk val="Granted" lbl="Status" color="#EDC488" />
            </DkStrip>
            <DSec>Claim #36 — Action Required</DSec>
            <DSl l="Member" r={<span className="font-semibold">Sanjay Yadav</span>} />
            <DSl l="Mobile" r="7597842080" />
            <DSl l="Contest" r="March Madness Spin 2026" />
            <DSl l="Prize" r="Amritsar T1 Airport Lounge" />
            {drillBtn("✓ Mark as Fulfilled", () => showToast("Claim marked as fulfilled"))}
          </>
        );
      default:
        return <div className="p-2.5 text-[11px] text-[#798C5E]">No detail available.</div>;
    }
  };

  /* ── shared class strings ── */
  const tfdBtn = (active: boolean) =>
    `border-0 px-2.5 py-1 text-[10px] font-semibold transition-all ${
      active ? "bg-[#DA7756] text-white" : "bg-white text-[#798C5E]"
    }`;
  const tfdPreset = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-[9px] py-[3px] text-[10px] transition-all ${
      active
        ? "border-[#DA7756] bg-[#FFF7EB] font-semibold text-[#DA7756]"
        : "border-[#C4B89D] bg-transparent font-medium text-[#798C5E] hover:border-[#DA7756] hover:text-[#DA7756]"
    }`;
  const tfdInp =
    "h-[26px] min-w-0 flex-1 rounded-full border border-[#C4B89D] bg-white px-[9px] py-1 text-[10px] text-[#2C2C2C] outline-none focus:border-[#DA7756]";

  const tierRow = (
    key: string,
    label: string,
    fillWidth: string,
    fillColor: string,
    fillLabel: string,
    cnt: string,
    cntClass: string
  ) => (
    <div
      className="group flex cursor-pointer items-center gap-2 py-1"
      onClick={() => openDrill(key)}
    >
      <div className="w-16 shrink-0 text-[10px] font-medium text-[#798C5E] group-hover:text-[#DA7756]">
        {label}
      </div>
      <div className="relative h-[18px] flex-1 overflow-hidden rounded bg-[#F6F4EE]">
        <div
          className="flex h-[18px] items-center rounded pl-[7px] transition-[width] duration-[400ms]"
          style={{ width: fillWidth, background: fillColor }}
        >
          {fillLabel && (
            <span className="text-[9px] font-bold text-white">{fillLabel}</span>
          )}
        </div>
      </div>
      <div className={`w-6 shrink-0 text-right text-[10px] font-bold ${cntClass}`}>{cnt}</div>
    </div>
  );

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#F6F4EE] text-[12px] text-[#2C2C2C]"
      style={FONT}
    >
      {/* ── TOPBAR ── */}
      <div className="sticky top-0 z-[300] flex h-[50px] items-center justify-between bg-[#2C2C2C] px-5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-[#DA7756]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-white" strokeWidth="2.2">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.8L19.2 8.5v7L12 19.2 4.8 15.5v-7L12 4.8z" />
            </svg>
          </div>
          <div className="text-[13px] font-bold text-white">Loyalty Dashboard</div>
          <div className="border-l border-white/[.12] pl-2.5 text-[10px] text-white/50">
            Runwal Demo
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-[#EDC48830] bg-[#EDC48820] px-[9px] py-[3px] text-[9px] font-semibold text-[#EDC488]">
            Review Build · Jun 2026
          </div>

          {/* Compact date filter */}
          <div className="relative shrink-0" ref={filterWrapRef}>
            <button
              className="flex items-center gap-[5px] rounded-full border border-white/[.15] bg-white/[.08] px-2.5 py-1 transition-all hover:bg-white/[.14]"
              style={FONT}
              onClick={(e) => {
                e.stopPropagation();
                setFilterOpen((o) => !o);
              }}
            >
              <span className="text-[11px]">📅</span>
              <span className="text-[10px] font-semibold text-white/[.85]">{filterLabel}</span>
              <span className="text-[8px] text-white/40">▾</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-[400] min-w-[260px] rounded-[10px] border border-[#C4B89D] bg-white p-2.5 shadow-[0_6px_24px_rgba(44,44,44,0.16)]">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <div className="flex overflow-hidden rounded-full border border-[#C4B89D]">
                    <button className={tfdBtn(dfMode === "day")} style={FONT} onClick={() => setMode("day")}>
                      Day
                    </button>
                    <button className={tfdBtn(dfMode === "month")} style={FONT} onClick={() => setMode("month")}>
                      Month
                    </button>
                    <button className={tfdBtn(dfMode === "range")} style={FONT} onClick={() => setMode("range")}>
                      Range
                    </button>
                  </div>
                </div>
                {dfMode === "day" && (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <input
                      type="date"
                      className={tfdInp}
                      style={FONT}
                      value={dfDay}
                      onChange={(e) => setDfDay(e.target.value)}
                    />
                  </div>
                )}
                {dfMode === "month" && (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <input
                      type="month"
                      className={tfdInp}
                      style={FONT}
                      value={dfMonth}
                      onChange={(e) => setDfMonth(e.target.value)}
                    />
                  </div>
                )}
                {dfMode === "range" && (
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <input
                      type="date"
                      className={tfdInp}
                      style={FONT}
                      value={dfFrom}
                      onChange={(e) => setDfFrom(e.target.value)}
                    />
                    <span className="text-[10px] text-[#798C5E]">→</span>
                    <input
                      type="date"
                      className={tfdInp}
                      style={FONT}
                      value={dfTo}
                      onChange={(e) => setDfTo(e.target.value)}
                    />
                  </div>
                )}
                <div className="mb-2 flex gap-1.5">
                  <button
                    className="h-[26px] rounded-full border-0 bg-[#DA7756] px-3 py-[3px] text-[10px] font-semibold text-white"
                    style={FONT}
                    onClick={applyDF}
                  >
                    Apply
                  </button>
                  <button
                    className="h-[26px] rounded-full border border-[#C4B89D] bg-transparent px-[9px] py-[3px] text-[10px] font-medium text-[#798C5E]"
                    style={FONT}
                    onClick={resetDF}
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 border-t border-[#E0D8CC] pt-1.5">
                  {[
                    ["today", "Today"],
                    ["7d", "Last 7 Days"],
                    ["30d", "Last 30 Days"],
                    ["thismonth", "This Month"],
                    ["lastmonth", "Last Month"],
                    ["thisquarter", "This Quarter"],
                  ].map(([key, lbl]) => (
                    <button
                      key={key}
                      className={tfdPreset(dfPreset === key)}
                      style={FONT}
                      onClick={() => setPreset(key)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detail link button */}
          <button
            className="flex items-center gap-[5px] rounded-full border-0 bg-[#DA7756] px-2.5 py-1 transition-opacity hover:opacity-[.85]"
            style={FONT}
            onClick={() => showToast("Opening Programme Detail…")}
          >
            <span className="text-[11px]">📊</span>
            <span className="whitespace-nowrap text-[10px] font-semibold text-white">
              Programme Detail →
            </span>
          </button>
          <div className="text-[10px] text-white/40">{liveDate}</div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DA7756] text-[10px] font-bold text-white">
            RD
          </div>
        </div>
      </div>

      {/* ── PAGE ── */}
      <div className="max-w-[1400px] px-5 pb-5 pt-3">
        {/* KPI STRIP */}
        <div className="mb-2.5 grid grid-cols-3 gap-2">
          <div
            className="cursor-pointer rounded-[10px] border border-[#F0D9B0] bg-[#FFF7EB] px-3.5 py-[11px] transition-shadow hover:shadow-[0_3px_10px_rgba(218,119,86,0.18)]"
            onClick={() => openDrill("d-members")}
          >
            <div className="mb-[3px] text-[9px] font-semibold uppercase tracking-[.06em] text-[#798C5E]">
              Active Members
            </div>
            <div className="text-[22px] font-bold leading-none text-[#2C2C2C]">3</div>
            <div className="mt-[3px] text-[10px] text-[#798C5E]">All Silver tier</div>
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-sm bg-[#F0D9B0]">
              <div className="h-[3px] rounded-sm bg-[#DA7756]" style={{ width: "100%" }} />
            </div>
          </div>
          <div
            className="cursor-pointer rounded-[10px] border border-[#F0D9B0] bg-[#FFF7EB] px-3.5 py-[11px] transition-shadow hover:shadow-[0_3px_10px_rgba(218,119,86,0.18)]"
            onClick={() => openDrill("d-points")}
          >
            <div className="mb-[3px] text-[9px] font-semibold uppercase tracking-[.06em] text-[#798C5E]">
              Points Outstanding
            </div>
            <div className="text-[22px] font-bold leading-none text-[#EDC488]">12,400</div>
            <div className="mt-[3px] text-[10px] text-[#E7848E]">
              0% redeemed · unmoved 27 days
            </div>
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-sm bg-[#F0D9B0]">
              <div className="h-[3px] rounded-sm bg-[#EDC488]" style={{ width: "100%" }} />
            </div>
          </div>
          <div
            className="cursor-pointer rounded-[10px] border border-[#F0D9B0] bg-[#FFF7EB] px-3.5 py-[11px] transition-shadow hover:shadow-[0_3px_10px_rgba(218,119,86,0.18)]"
            onClick={() => openDrill("d-claims")}
          >
            <div className="mb-[3px] text-[9px] font-semibold uppercase tracking-[.06em] text-[#798C5E]">
              Claims
            </div>
            <div className="text-[22px] font-bold leading-none text-[#2C2C2C]">52</div>
            <div className="mt-[3px] text-[10px] text-[#EDC488]">18 Granted · oldest 66d</div>
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-sm bg-[#F0D9B0]">
              <div className="h-[3px] rounded-sm bg-[#EDC488]" style={{ width: "80%" }} />
            </div>
          </div>
        </div>

        {/* STORE IMPACT STRIP */}
        <div
          className="mb-2.5 flex cursor-pointer flex-wrap items-center gap-2.5 rounded-[10px] border border-[#E0D8CC] bg-white px-4 py-3 transition-shadow hover:shadow-[0_2px_8px_rgba(44,44,44,0.07)]"
          onClick={() => openDrill("d-points")}
        >
          <div className="min-w-[110px] border-l-[3px] border-[#108C72] px-3.5 py-1 text-center">
            <div className="text-[20px] font-bold leading-none text-[#2C2C2C]">3,235</div>
            <div className="mt-[3px] whitespace-nowrap text-[9px] text-[#798C5E]">
              Items available in aggregator
            </div>
          </div>
          <div className="shrink-0 text-base text-[#C4B89D]">→</div>
          <div className="min-w-[110px] border-l-[3px] border-[#E7848E] px-3.5 py-1 text-center">
            <div className="text-[20px] font-bold leading-none text-[#E7848E]">0</div>
            <div className="mt-[3px] whitespace-nowrap text-[9px] text-[#798C5E]">
              Items live in store
            </div>
          </div>
          <div className="shrink-0 text-base text-[#C4B89D]">→</div>
          <div className="min-w-[110px] border-l-[3px] border-[#E7848E] px-3.5 py-1 text-center">
            <div className="text-[20px] font-bold leading-none text-[#E7848E]">0%</div>
            <div className="mt-[3px] whitespace-nowrap text-[9px] text-[#798C5E]">
              Points redeemed by members
            </div>
          </div>
          <div className="ml-auto min-w-[180px] flex-1 text-right text-[10px] font-semibold text-[#E7848E]">
            One unfinished step is blocking 12,400 points from ever being spent
          </div>
        </div>

        {/* ALERTS */}
        <div className="mb-2.5 grid grid-cols-4 gap-2">
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E7848E30] border-l-[3px] border-l-[#E7848E] bg-[#FFF3F3] px-2.5 py-[9px] transition-opacity hover:opacity-[.88]"
            onClick={() => openDrill("d-store-alert")}
          >
            <div className="shrink-0 text-[17px]">🏪</div>
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#2C2C2C]">
                Redemption store is empty
              </div>
              <div className="mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#798C5E]">
                3,235 items in aggregator · 12,400 pts at expiry risk
              </div>
            </div>
            <div className="shrink-0 whitespace-nowrap text-[9px] font-bold text-[#DA7756]">
              Fix →
            </div>
          </div>
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#EDC48840] border-l-[3px] border-l-[#EDC488] bg-[#FFFAF0] px-2.5 py-[9px] transition-opacity hover:opacity-[.88]"
            onClick={() => openDrill("d-claims-alert")}
          >
            <div className="shrink-0 text-[17px]">📦</div>
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#2C2C2C]">
                18 claims awaiting fulfilment
              </div>
              <div className="mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#798C5E]">
                Oldest pending 66 days (Pravin Deshmukh)
              </div>
            </div>
            <div className="shrink-0 whitespace-nowrap text-[9px] font-bold text-[#DA7756]">
              View →
            </div>
          </div>
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E7848E30] border-l-[3px] border-l-[#E7848E] bg-[#FFF3F3] px-2.5 py-[9px] transition-opacity hover:opacity-[.88]"
            onClick={() => openDrill("d-orders-alert")}
          >
            <div className="shrink-0 text-[17px]">🧾</div>
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#2C2C2C]">
                7 orders stuck — Paid, not fulfilled
              </div>
              <div className="mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#798C5E]">
                Oldest 107 days · Roshan Shetty
              </div>
            </div>
            <div className="shrink-0 whitespace-nowrap text-[9px] font-bold text-[#DA7756]">
              Fix →
            </div>
          </div>
          <div
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#EDC48840] border-l-[3px] border-l-[#EDC488] bg-[#FFFAF0] px-2.5 py-[9px] transition-opacity hover:opacity-[.88]"
            onClick={() => openDrill("d-offer-alert")}
          >
            <div className="shrink-0 text-[17px]">🏷️</div>
            <div className="min-w-0 flex-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#2C2C2C]">
                Active offer expires in 3 days
              </div>
              <div className="mt-px overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[#798C5E]">
                OFF-0044 · Runwal Demo · 30 Jun 2026
              </div>
            </div>
            <div className="shrink-0 whitespace-nowrap text-[9px] font-bold text-[#DA7756]">
              Review →
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="mb-2 grid grid-cols-[60fr_40fr] gap-2">
          {/* Claims Backlog Aging */}
          <div className="rounded-[10px] border border-[#E0D8CC] bg-white p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-[#2C2C2C]">
                  Claims Backlog — Is It Getting Worse?
                </div>
                <div className="mt-0.5 text-[9px] text-[#798C5E]">
                  18 stuck claims by age · none fulfilled in 30+ days
                </div>
              </div>
            </div>
            <div className="relative h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={burnData} barSize={28} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(224,216,204,0.3)" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9, fontWeight: 600, fill: "#2C2C2C", ...FONT }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 9, fill: "#798C5E", ...FONT }}
                  />
                  <Tooltip cursor={{ fill: "rgba(218,119,86,0.05)" }} content={<BurnTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {burnData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tier Snapshot */}
          <div className="rounded-[10px] border border-[#E0D8CC] bg-white p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-[#2C2C2C]">
                  Member Tier Distribution
                </div>
                <div className="mt-0.5 text-[9px] text-[#798C5E]">
                  3 active members across 5 tiers
                </div>
              </div>
            </div>
            <div className="pt-1">
              {tierRow("d-tier-diamond", "Diamond", "2%", "#B0B0B0", "", "0", "text-[#888]")}
              {tierRow("d-tier-titanium", "Titanium", "2%", "#9BA8B5", "", "0", "text-[#888]")}
              {tierRow("d-tier-gold", "Gold", "2%", "#EDC488", "", "0", "text-[#EDC488]")}
              {tierRow("d-tier-silver", "Silver", "100%", "#798C5E", "3 members", "3", "text-[#798C5E]")}
              {tierRow("d-tier-bronze", "Bronze", "2%", "#C4B89D", "", "0", "text-[#888]")}
            </div>
            <div className="mt-2.5 rounded-md bg-[#F6F4EE] p-2 text-[10px] text-[#798C5E]">
              Exit points: Diamond 4,00,000 · Titanium 3,00,000 · Gold 2,00,000 · Silver 1,00,000
              · Bronze 1,000
            </div>
            <div className="mt-1.5 flex items-center justify-between rounded-md border border-[#E7848E20] bg-[#FFF3F3] px-[9px] py-[7px]">
              <span className="text-[10px] font-semibold text-[#E7848E]">
                🎯 Active Contests: 0
              </span>
              <span className="text-[9px] text-[#798C5E]">Last ran: March Madness Spin 2026</span>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-[38fr_62fr] gap-2">
          {/* Members */}
          <div className="rounded-[10px] border border-[#E0D8CC] bg-white p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-[#2C2C2C]">Members</div>
                <div className="mt-0.5 text-[9px] text-[#798C5E]">
                  3 active · all Silver tier · pending customer-sync fix
                </div>
              </div>
              <span className="rounded-[20px] border border-[#798C5E25] bg-[#798C5E15] px-2 py-0.5 text-[9px] font-semibold text-[#798C5E]">
                Silver
              </span>
            </div>
            {[
              {
                key: "d-member-1",
                init: "SP",
                avBg: "#798C5E",
                name: "Satish Poojary",
                meta: "Silver · joined programme · last: Spring Carnival claim",
                pts: "4,200",
              },
              {
                key: "d-member-2",
                init: "SM",
                avBg: "#798C5E",
                name: "Shivaji Mali",
                meta: "Silver · joined programme · last: Spring Carnival claim",
                pts: "4,100",
              },
              {
                key: "d-member-3",
                init: "SY",
                avBg: "#DA7756",
                name: "Sanjay Yadav",
                meta: "Silver · joined programme · last: March Madness claim",
                pts: "4,100",
              },
            ].map((m) => (
              <div
                key={m.key}
                className="group flex cursor-pointer items-center gap-2.5 border-b border-[#E0D8CC] py-[7px] last:border-b-0"
                onClick={() => openDrill(m.key)}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: m.avBg }}
                >
                  {m.init}
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-[#2C2C2C] group-hover:text-[#DA7756]">
                    {m.name}
                  </div>
                  <div className="mt-px text-[9px] text-[#798C5E]">{m.meta}</div>
                </div>
                <div>
                  <div className="text-right text-[11px] font-bold text-[#2C2C2C]">{m.pts}</div>
                  <div className="text-right text-[8px] text-[#798C5E]">pts balance</div>
                </div>
              </div>
            ))}
            <div className="mt-2 rounded-md border border-[#EDC48830] bg-[#FFFAF0] px-[9px] py-[7px] text-[9.5px] text-[#798C5E]">
              ⚠️ Customers page shows 0 — data sync gap. Confirm with dev team before relying on
              member records.
            </div>
          </div>

          {/* Recent Claims */}
          <div className="rounded-[10px] border border-[#E0D8CC] bg-white p-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-semibold text-[#2C2C2C]">Recent Claims</div>
                <div className="mt-0.5 text-[9px] text-[#798C5E]">
                  52 total · 18 Granted, awaiting fulfilment
                </div>
              </div>
            </div>
            <div className="mb-2 flex gap-3.5 rounded-md bg-[#F6F4EE] px-[9px] py-[7px] text-[9.5px] text-[#798C5E]">
              <span>From 2 contests:</span>
              <span className="font-semibold text-[#2C2C2C]">
                Spring Carnival Scratch · 34 claims
              </span>
              <span className="font-semibold text-[#2C2C2C]">
                March Madness Spin 2026 · 18 claims
              </span>
            </div>
            <table className="w-full border-collapse text-[10.5px]">
              <thead>
                <tr>
                  {["Member", "Contest", "Prize", "Status"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-[#E0D8CC] bg-[#F6F4EE] px-2 py-[5px] text-left text-[9px] font-semibold uppercase tracking-[.05em] text-[#798C5E]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    key: "d-claim-1",
                    member: "Satish Poojary",
                    contest: "Spring Carnival Scratch",
                    prize: "XOXO Gift Box",
                    status: "Claimed",
                  },
                  {
                    key: "d-claim-2",
                    member: "Shivaji Mali",
                    contest: "Spring Carnival Scratch",
                    prize: "XOXO Gift Box",
                    status: "Claimed",
                  },
                  {
                    key: "d-claim-3",
                    member: "ASHOK YADAV",
                    contest: "March Madness Spin",
                    prize: "Lounge Access",
                    status: "Granted",
                  },
                  {
                    key: "d-claim-4",
                    member: "Roshan Shetty",
                    contest: "Spring Carnival Scratch",
                    prize: "XOXO Gift Box",
                    status: "Granted",
                  },
                  {
                    key: "d-claim-5",
                    member: "Sanjay Yadav",
                    contest: "March Madness Spin",
                    prize: "Lounge Access",
                    status: "Granted",
                  },
                ].map((c, i, arr) => (
                  <tr
                    key={c.key}
                    className="cursor-pointer transition-colors hover:bg-[#DA775608]"
                    onClick={() => openDrill(c.key)}
                  >
                    <td
                      className={`px-2 py-1.5 align-middle font-semibold ${
                        i === arr.length - 1 ? "" : "border-b border-[#E0D8CC]"
                      }`}
                    >
                      {c.member}
                    </td>
                    <td
                      className={`px-2 py-1.5 align-middle ${
                        i === arr.length - 1 ? "" : "border-b border-[#E0D8CC]"
                      }`}
                    >
                      {c.contest}
                    </td>
                    <td
                      className={`px-2 py-1.5 align-middle ${
                        i === arr.length - 1 ? "" : "border-b border-[#E0D8CC]"
                      }`}
                    >
                      {c.prize}
                    </td>
                    <td
                      className={`px-2 py-1.5 align-middle ${
                        i === arr.length - 1 ? "" : "border-b border-[#E0D8CC]"
                      }`}
                    >
                      {c.status === "Claimed" ? (
                        <BadgeOk>Claimed</BadgeOk>
                      ) : (
                        <BadgeWarn>Granted</BadgeWarn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="mt-2 cursor-pointer text-right text-[10px] text-[#DA7756]"
              onClick={() => openDrill("d-claims")}
            >
              View all 52 claims →
            </div>
          </div>
        </div>
      </div>

      {/* ── DRILL OVERLAY + PANEL ── */}
      <div
        className={`fixed inset-0 z-[500] bg-[#2C2C2C4D] backdrop-blur-[2px] ${
          drillOpen ? "block" : "hidden"
        }`}
        onClick={closeDrill}
      />
      <div
        className={`fixed top-0 z-[501] flex h-screen w-[460px] flex-col border-l border-[#C4B89D] bg-white shadow-[-4px_0_20px_rgba(44,44,44,0.12)] transition-[right] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] ${
          drillOpen ? "right-0" : "right-[-480px]"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#E0D8CC] px-4 py-3.5">
          <div className="text-[13px] font-semibold">
            {(drillKey && drillTitles[drillKey]) || "Detail"}
          </div>
          <button
            className="border-0 bg-transparent px-1 text-[20px] leading-none text-[#798C5E] hover:text-[#DA7756]"
            onClick={closeDrill}
          >
            ×
          </button>
        </div>
        <div className="flex min-h-[30px] shrink-0 items-center border-b border-[#E0D8CC] px-4 py-[7px] text-[10px] text-[#798C5E]">
          {(drillKey && drillTitles[drillKey]) || ""}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3.5 [scrollbar-width:thin]">
          {renderDrillBody(drillKey)}
        </div>
      </div>

      {/* ── AI CHAT ── */}
      <div
        className={`fixed bottom-[84px] right-[22px] z-[401] flex h-[500px] w-[370px] origin-bottom-right flex-col overflow-hidden rounded-[14px] border border-[#C4B89D] bg-white shadow-[0_8px_36px_rgba(44,44,44,0.18)] transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] ${
          aiOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible translate-y-2.5 scale-95 opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center gap-2.5 bg-gradient-to-br from-[#DA7756] to-[#B8694A] px-4 py-3">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-[14px]">
            ✦
          </div>
          <div className="flex-1">
            <div className="text-[12px] font-bold text-white">Loyalty AI</div>
            <div className="text-[9px] text-white/70">● Online · Runwal Demo context loaded</div>
          </div>
          <button
            className="border-0 bg-transparent px-1 py-0.5 text-[18px] text-white/80"
            style={FONT}
            onClick={() => setAiOpen(false)}
          >
            ×
          </button>
        </div>
        <div
          ref={msgsRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#F6F4EE] p-3 [scrollbar-width:thin]"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] break-words rounded-[11px] px-[11px] py-2 text-[11px] leading-[1.6] ${
                m.role === "user"
                  ? "self-end rounded-br-[3px] bg-[#DA7756] text-white"
                  : "self-start rounded-bl-[3px] border border-[#E0D8CC] bg-white text-[#2C2C2C]"
              }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-1 self-start rounded-[11px] rounded-bl-[3px] border border-[#E0D8CC] bg-white px-[13px] py-[9px]">
              <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-[#798C5E]" />
              <span
                className="h-[5px] w-[5px] animate-bounce rounded-full bg-[#798C5E]"
                style={{ animationDelay: "0.2s" }}
              />
              <span
                className="h-[5px] w-[5px] animate-bounce rounded-full bg-[#798C5E]"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}
        </div>
        {showSugs && (
          <div className="flex shrink-0 flex-wrap gap-1 border-t border-[#E0D8CC] px-2.5 py-[7px]">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="whitespace-nowrap rounded-full border border-[#C4B89D] bg-[#F6F4EE] px-[9px] py-[3px] text-[10px] text-[#798C5E] transition-all hover:border-[#DA7756] hover:text-[#DA7756]"
                style={FONT}
                onClick={() => addUserMsgAndReply(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex shrink-0 items-center gap-[7px] border-t border-[#E0D8CC] px-2.5 py-2">
          <input
            className="flex-1 rounded-lg border border-[#C4B89D] bg-[#F6F4EE] px-2.5 py-[7px] text-[11px] leading-[1.4] text-[#2C2C2C] outline-none focus:border-[#DA7756]"
            style={FONT}
            placeholder="Ask about your loyalty programme…"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendAI();
            }}
          />
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-[#DA7756] text-[13px] text-white"
            onClick={sendAI}
          >
            →
          </button>
        </div>
      </div>
      <button
        className="fixed bottom-[22px] right-[22px] z-[400] flex h-[50px] w-[50px] items-center justify-center rounded-full border-0 bg-gradient-to-br from-[#DA7756] to-[#B8694A] text-[20px] text-white shadow-[0_4px_16px_rgba(218,119,86,0.45)] transition-transform hover:scale-[1.08]"
        onClick={() => setAiOpen((o) => !o)}
      >
        {aiOpen ? "×" : "✦"}
      </button>

      {/* ── TOAST ── */}
      <div
        className={`pointer-events-none fixed bottom-[84px] left-1/2 z-[600] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2C2C2C] px-4 py-[7px] text-[11px] font-medium text-white transition-all duration-[280ms] ${
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {toast}
      </div>
    </div>
  );
};

export default LoyaltyDashboardNew;
