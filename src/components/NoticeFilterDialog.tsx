import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, RotateCcw, Search } from "lucide-react";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// ── Static options ────────────────────────────────────────────────────────────
const NOTICE_TYPE_OPTIONS = [
  { value: "0", label: "General" },
  { value: "1", label: "Personal" },
];

const STATUS_OPTIONS = [
  { value: "1", label: "Published" },
  { value: "2", label: "Disabled" },
  { value: "0", label: "Rejected" },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tower {
  id: number;
  name: string;
}

interface Flat {
  id: number;
  flat_no: string;
  flat_str?: string;
}

export interface NoticeFilters {
  tower_ids: string[];
  flat_ids: string[];
  shared_in: string[];
  date_range: string;
  publish_in: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: NoticeFilters) => void;
}

const empty: NoticeFilters = {
  tower_ids: [],
  flat_ids: [],
  shared_in: [],
  date_range: "",
  publish_in: [],
};

// ── Component ─────────────────────────────────────────────────────────────────
export const NoticeFilterDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyFilters,
}) => {
  const [selectedTower, setSelectedTower] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [selectedNoticeType, setSelectedNoticeType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [towers, setTowers] = useState<Tower[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loadingTowers, setLoadingTowers] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);

  // ── Load towers on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoadingTowers(true);
    const token = localStorage.getItem("token") || "";
    const societyId =
      localStorage.getItem("selectedSocietyId") ||
      localStorage.getItem("society_id") ||
      localStorage.getItem("org_id") ||
      "";

    fetch(
      getFullUrl(
        `/get_society_blocks.json?token=${token}&society_id=${societyId}`
      ),
      { headers: { Authorization: getAuthHeader() } }
    )
      .then((r) => r.json())
      .then((d) => setTowers(Array.isArray(d.society_blocks) ? d.society_blocks : []))
      .catch(() => setTowers([]))
      .finally(() => setLoadingTowers(false));
  }, [isOpen]);

  // ── Load flats when tower changes ─────────────────────────────────────────
  const fetchFlats = useCallback(
    async (blockId: string) => {
      if (!blockId) {
        setFlats([]);
        setSelectedFlat("");
        return;
      }
      setLoadingFlats(true);
      const token = localStorage.getItem("token") || "";
      const societyId =
        localStorage.getItem("selectedSocietyId") ||
        localStorage.getItem("society_id") ||
        localStorage.getItem("org_id") ||
        "";
      try {
        const res = await fetch(
          getFullUrl(
            `/get_society_flats.json?token=${token}&society_id=${societyId}&society_block_id=${blockId}`
          ),
          { headers: { Authorization: getAuthHeader() } }
        );
        const d = await res.json();
        setFlats(Array.isArray(d.society_flats) ? d.society_flats : []);
      } catch {
        setFlats([]);
      } finally {
        setLoadingFlats(false);
      }
    },
    []
  );

  const handleTowerChange = (value: string) => {
    setSelectedTower(value);
    setSelectedFlat("");
    fetchFlats(value === "__all__" ? "" : value);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setSelectedTower("");
    setSelectedFlat("");
    setSelectedNoticeType("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    setFlats([]);
    onApplyFilters(empty);
    onClose();
  };

  // ── Apply ─────────────────────────────────────────────────────────────────
  const handleApply = () => {
    const filters: NoticeFilters = { ...empty };

    if (selectedTower && selectedTower !== "__all__") {
      filters.tower_ids = [selectedTower];
    }
    if (selectedFlat && selectedFlat !== "__all__") {
      filters.flat_ids = [selectedFlat];
    }
    if (selectedNoticeType !== "") {
      filters.shared_in = [selectedNoticeType];
    }
    if (dateFrom && dateTo) {
      // Format: DD/MM/YYYY - DD/MM/YYYY  (adjust if your API needs another format)
      const fmt = (s: string) => {
        const [y, m, d] = s.split("-");
        return `${d}/${m}/${y}`;
      };
      filters.date_range = `${fmt(dateFrom)} - ${fmt(dateTo)}`;
    }
    if (selectedStatus !== "") {
      filters.publish_in = [selectedStatus];
    }

    onApplyFilters(filters);
    onClose();
  };

  const hasFilters =
    selectedTower || selectedFlat || selectedNoticeType || selectedStatus || dateFrom || dateTo;

  // ── Styles ────────────────────────────────────────────────────────────────
  const fieldCls =
    "h-10 w-full rounded border border-gray-300 bg-white text-sm focus:ring-0 focus:border-gray-400";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white rounded-xl shadow-xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold text-gray-900 tracking-wide uppercase">
            Filter Notices
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Tower */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Select Tower / Block
            </Label>
            <Select
              value={selectedTower}
              onValueChange={handleTowerChange}
              disabled={loadingTowers}
            >
              <SelectTrigger className={fieldCls}>
                <SelectValue
                  placeholder={
                    loadingTowers ? "Loading towers…" : "Select Tower"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-56">
                <SelectItem value="__all__">All Towers</SelectItem>
                {towers.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flat */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Select Flat
            </Label>
            <Select
              value={selectedFlat}
              onValueChange={setSelectedFlat}
              disabled={!selectedTower || selectedTower === "__all__" || loadingFlats}
            >
              <SelectTrigger className={fieldCls}>
                <SelectValue
                  placeholder={
                    loadingFlats
                      ? "Loading flats…"
                      : !selectedTower || selectedTower === "__all__"
                      ? "Select tower first"
                      : "Select Flat"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-56">
                <SelectItem value="__all__">All Flats</SelectItem>
                {flats.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.flat_str || f.flat_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notice Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Notice Type
            </Label>
            <Select value={selectedNoticeType} onValueChange={setSelectedNoticeType}>
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Select Notice Type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="__all__">All Types</SelectItem>
                {NOTICE_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">From</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  className={fieldCls}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">To</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className={fieldCls}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className={fieldCls}>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="__all__">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 gap-1.5 text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#C72030] hover:bg-[#a01828] text-white px-6 gap-1.5 text-sm"
          >
            <Search className="w-3.5 h-3.5" />
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
