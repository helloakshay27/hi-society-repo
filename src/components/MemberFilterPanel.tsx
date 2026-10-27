import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { getHiSocietyBaseUrl, getAuthHeader } from "@/config/apiConfig";

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
  const [open, setOpen]           = useState(false);
  const [draft, setDraft]         = useState<MemberFilterState>(value);
  const [towers, setTowers]       = useState<Tower[]>([]);
  const [loadingTowers, setLoadingTowers] = useState(false);
  const [towerSearch, setTowerSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<CSSProperties>({});

  // ── fetch towers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    let societyId =
      localStorage.getItem("selectedSocietyId") ||
      sessionStorage.getItem("selectedSocietyId") ||
      localStorage.getItem("society_id") ||
      sessionStorage.getItem("society_id") ||
      "";

    // selectedUserSociety is an association ID; resolve it to id_society
    // before passing it as the API's society_id.
    if (!societyId) {
      const selectedUserSociety =
        localStorage.getItem("selectedUserSociety") ||
        sessionStorage.getItem("selectedUserSociety");
      if (selectedUserSociety) {
        try {
          const approvedSocieties = JSON.parse(
            localStorage.getItem("hiSocietyApprovedSocieties") ||
              sessionStorage.getItem("hiSocietyApprovedSocieties") ||
              "[]"
          );
          const selected = Array.isArray(approvedSocieties)
            ? approvedSocieties.find(
                (society: any) => String(society?.id) === selectedUserSociety
              )
            : null;
          societyId = String(selected?.id_society ?? selected?.society?.id ?? "");
        } catch (error) {
          console.error("Unable to resolve selected society for tower filter:", error);
        }
      }
    }

    if (!societyId) {
      setTowers([]);
      setLoadingTowers(false);
      return;
    }

    let active = true;
    setLoadingTowers(true);
    axios
      .get(`${getHiSocietyBaseUrl().replace(/\/+$/, "")}/get_society_blocks.json`, {
        params: { society_id: societyId },
        headers: { Authorization: getAuthHeader(), Accept: "application/json" },
      })
      .then((res) => {
        if (!active) return;
        const data = res.data;
        const blocks = Array.isArray(data)
          ? data
          : Array.isArray(data?.society_blocks)
            ? data.society_blocks
            : [];
        setTowers(
          blocks
            .filter((block: any) => block?.id != null)
            .map((block: any) => ({ id: Number(block.id), name: String(block.name ?? "") }))
        );
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error fetching society towers:", error);
        setTowers([]);
      })
      .finally(() => {
        if (active) setLoadingTowers(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  // ── close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Render the dropdown above page overflow containers and keep it in view.
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const panelHeight = Math.min(560, window.innerHeight - 32);
      const spaceBelow = window.innerHeight - trigger.bottom - 8;
      const placeAbove = spaceBelow < Math.min(panelHeight, 360) && trigger.top > spaceBelow;
      const top = placeAbove
        ? Math.max(16, trigger.top - Math.min(panelHeight, trigger.top - 16) - 8)
        : trigger.bottom + 8;
      const width = 288;
      const left = Math.max(16, Math.min(trigger.right - width, window.innerWidth - width - 16));

      setDropdownPosition({
        position: "fixed",
        top,
        left,
        width,
        maxHeight: `min(560px, calc(100vh - ${top + 16}px))`,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  // ── draft (applied on "Apply") ───────────────────────────────────────────
  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleDraftRole = (role: string) => {
    setDraft((d) => ({
      ...d,
      roles: d.roles.includes(role) ? d.roles.filter((r) => r !== role) : [...d.roles, role],
    }));
  };

  const toggleDraftTower = (id: string) => {
    setDraft((d) => ({
      ...d,
      towers: d.towers.includes(id) ? d.towers.filter((t) => t !== id) : [...d.towers, id],
    }));
  };

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleReset = () => {
    setDraft({ roles: [], towers: [] });
    clearAll();
    setOpen(false);
  };

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
        ref={triggerRef}
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
      {open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownPosition}
          className="z-[1100] overflow-y-auto overscroll-contain bg-white rounded-2xl shadow-xl border border-gray-200 p-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-semibold text-gray-900 uppercase tracking-wide">
              Filter By
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Role section */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Role</p>
            <div className="space-y-0.5">
              {ROLE_OPTIONS.map((opt) => {
                const active = draft.roles.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleDraftRole(opt.value)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-left"
                  >
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
          </div>

          {/* Tower (block) section */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Tower</p>

            {towers.length > 4 && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tower..."
                  value={towerSearch}
                  onChange={(e) => setTowerSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#C72030] focus:ring-1 focus:ring-[#C72030]"
                />
              </div>
            )}

            {loadingTowers ? (
              <p className="text-xs text-gray-400 px-2 py-1">Loading towers…</p>
            ) : filteredTowers.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">
                {towers.length === 0 ? "No towers available" : "No towers found"}
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {filteredTowers.map((tower) => {
                  const tid = tower.id.toString();
                  const active = draft.towers.includes(tid);
                  return (
                    <button
                      key={tower.id}
                      type="button"
                      onClick={() => toggleDraftTower(tid)}
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

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-5 rounded-md text-sm font-medium bg-white border border-[#C72030] text-[#C72030]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-9 px-5 rounded-md text-sm font-medium bg-[#C72030] hover:bg-[#a01828] text-white"
            >
              Apply
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MemberFilterPanel;
