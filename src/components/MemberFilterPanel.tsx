import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { API_CONFIG, getAuthHeader } from "@/config/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberFilterState {
  roles: string[];      // e.g. ["owner", "tenant"]
  towers: string[];     // block IDs as strings
}

interface Tower {
  id: number;
  name: string;
}

interface MemberFilterPanelProps {
  /** Current filter state */
  value: MemberFilterState;
  /** Called whenever the filter changes */
  onChange: (filters: MemberFilterState) => void;
  /** Optional extra className on the trigger button */
  className?: string;
}

// ─── Static role definitions ─────────────────────────────────────────────────

const ROLE_OPTIONS: { label: string; value: string; color: string }[] = [
  { label: "Owner",       value: "owner",      color: "#C72030" },
  { label: "Tenant",      value: "tenant",     color: "#3B82F6" },
  { label: "Primary",     value: "primary",    color: "#C72030" },
  { label: "Secondary",   value: "secondary",  color: "#9CA3AF" },
  { label: "Lives Here",  value: "lives_here", color: "#22C55E" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const MemberFilterPanel = ({
  value,
  onChange,
  className = "",
}: MemberFilterPanelProps) => {
  const baseURL = API_CONFIG.BASE_URL;

  const [open, setOpen]           = useState(false);
  const [towers, setTowers]       = useState<Tower[]>([]);
  const [towerSearch, setTowerSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // ── fetch towers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const societyId = localStorage.getItem("selectedSocietyId") || "";
    if (!societyId) return;

    axios
      .get(`${baseURL}/get_society_blocks.json?society_id=${societyId}`, {
        headers: { Authorization: getAuthHeader() },
      })
      .then((res) => {
        const blocks: Tower[] = (res.data?.society_blocks || []).map(
          (b: { id: number; name: string }) => ({ id: b.id, name: b.name })
        );
        setTowers(blocks);
      })
      .catch(() => {/* silently ignore – towers are optional */});
  }, [open, baseURL]);

  // ── close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── helpers ───────────────────────────────────────────────────────────────
  const toggleRole = (role: string) => {
    const next = value.roles.includes(role)
      ? value.roles.filter((r) => r !== role)
      : [...value.roles, role];
    onChange({ ...value, roles: next });
  };

  const toggleTower = (id: string) => {
    const next = value.towers.includes(id)
      ? value.towers.filter((t) => t !== id)
      : [...value.towers, id];
    onChange({ ...value, towers: next });
  };

  const clearAll = () => {
    onChange({ roles: [], towers: [] });
  };

  const activeCount = value.roles.length + value.towers.length;

  const filteredTowers = towers.filter((t) =>
    t.name.toLowerCase().includes(towerSearch.toLowerCase())
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className={`relative inline-block ${className}`} ref={panelRef}>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm font-medium transition-colors
          ${activeCount > 0
            ? "bg-[#C72030] text-white border-[#C72030]"
            : "bg-white text-gray-700 border-gray-300 hover:border-[#C72030] hover:text-[#C72030]"
          }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="ml-1 bg-white text-[#C72030] rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* ── Active chips (outside panel) ── */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.roles.map((r) => {
            const opt = ROLE_OPTIONS.find((o) => o.value === r);
            return (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: opt?.color ?? "#C72030" }}
              >
                {opt?.label ?? r}
                <button
                  type="button"
                  onClick={() => toggleRole(r)}
                  className="hover:opacity-80"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {value.towers.map((tid) => {
            const tower = towers.find((t) => t.id.toString() === tid);
            return (
              <span
                key={tid}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-[#C72030]"
              >
                {tower?.name ?? tid}
                <button
                  type="button"
                  onClick={() => toggleTower(tid)}
                  className="hover:opacity-80"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{ minWidth: "220px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Filters
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-[#C72030] hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Role section */}
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Role
            </p>
            {ROLE_OPTIONS.map((opt) => {
              const active = value.roles.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleRole(opt.value)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-left"
                >
                  {/* color dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{opt.label}</span>
                  {active && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: opt.color }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tower (block) section */}
          <div className="px-3 py-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Filter by Tower
            </p>

            {/* Tower search */}
            {towers.length > 4 && (
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Filter..."
                  value={towerSearch}
                  onChange={(e) => setTowerSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#C72030] focus:ring-1 focus:ring-[#C72030]"
                />
              </div>
            )}

            {filteredTowers.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">
                {towers.length === 0 ? "Loading towers…" : "No towers found"}
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredTowers.map((tower) => {
                  const tid = tower.id.toString();
                  const active = value.towers.includes(tid);
                  return (
                    <button
                      key={tower.id}
                      type="button"
                      onClick={() => toggleTower(tid)}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-left"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "#C72030" }}
                      />
                      <span className="text-sm text-gray-700 flex-1">{tower.name}</span>
                      {active && (
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 bg-[#C72030]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberFilterPanel;
