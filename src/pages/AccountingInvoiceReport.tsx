import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { API_CONFIG } from "@/config/apiConfig";

interface InvoiceReportRow {
  sr: number;
  tower: string;
  flat: string;
  partyName: string;
  billNo: string;
  billPeriod: string;
  billDate: string;
  billAmt: number;
  dueDate: string;
  paidAmount: number | null;
  paidDate: string;
  receiptNo: string;
  receiptDate: string;
  outstandingAmt: number;
  ageing6: number | null;
  ageing9: number | null;
  ageing12: number | null;
  ageing15: number | null;
}

interface OptionItem {
  id: number;
  name: string;
}

interface FilterState {
  towerId: string;
  towerName: string;
  flatId: string;
  flatName: string;
  dueDate?: Date;
}

const pick = (obj: Record<string, unknown>, keys: string[]): unknown => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  }
  return undefined;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const pickList = (data: Record<string, unknown> | undefined, keys: string[]): unknown[] => {
  if (!data) return [];
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[];
  }
  return [];
};

const toOptionList = (raw: unknown, nameKeys: string[]): OptionItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const obj = item as Record<string, unknown>;
    return { id: Number(obj.id), name: String(pick(obj, nameKeys) ?? obj.id ?? "") };
  });
};

const normalizeInvoiceRow = (item: Record<string, unknown>, index: number): InvoiceReportRow => ({
  sr: toNumberOrNull(pick(item, ["sr", "sr_no", "serial_no"])) ?? index + 1,
  tower: String(pick(item, ["tower", "tower_name", "block_name", "wing_name"]) ?? ""),
  flat: String(pick(item, ["flat", "flat_no", "flat_name", "unit_name"]) ?? ""),
  partyName: String(pick(item, ["party_name", "member_name", "customer_name", "user_name"]) ?? ""),
  billNo: String(pick(item, ["bill_no", "bill_number", "invoice_no", "invoice_number"]) ?? ""),
  billPeriod: String(pick(item, ["bill_period", "period"]) ?? ""),
  billDate: String(pick(item, ["bill_date", "invoice_date"]) ?? ""),
  billAmt: toNumberOrNull(pick(item, ["bill_amt", "bill_amount", "amount", "total_amount"])) ?? 0,
  dueDate: String(pick(item, ["due_date"]) ?? ""),
  paidAmount: toNumberOrNull(pick(item, ["paid_amount", "amount_paid"])),
  paidDate: String(pick(item, ["paid_date"]) ?? ""),
  receiptNo: String(pick(item, ["receipt_no", "receipt_number"]) ?? ""),
  receiptDate: String(pick(item, ["receipt_date"]) ?? ""),
  outstandingAmt:
    toNumberOrNull(pick(item, ["outstanding_amt", "outstanding_amount", "balance_amount", "balance"])) ?? 0,
  ageing6: toNumberOrNull(pick(item, ["ageing_6", "ageing6", "ageing_6_months", "less_than_6_months"])),
  ageing9: toNumberOrNull(pick(item, ["ageing_9", "ageing9", "ageing_9_months", "less_than_9_months"])),
  ageing12: toNumberOrNull(pick(item, ["ageing_12", "ageing12", "ageing_12_months", "less_than_12_months"])),
  ageing15: toNumberOrNull(
    pick(item, ["ageing_15", "ageing15", "ageing_15_months", "less_than_15_months", "above_15_months"])
  ),
});

const extractInvoiceReportList = (data: unknown): Record<string, unknown>[] => {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const obj = data as Record<string, unknown>;
  const candidate =
    obj?.bills_invoice_report ?? obj?.data ?? obj?.report ?? obj?.invoices ?? obj?.rows;
  return Array.isArray(candidate) ? (candidate as Record<string, unknown>[]) : [];
};

const columns: ColumnConfig[] = [
  { key: "sr", label: "Sr.", sortable: false, draggable: false, hideable: false },
  { key: "tower", label: "Tower", sortable: true },
  { key: "flat", label: "Flat", sortable: true },
  { key: "partyName", label: "Party Name", sortable: true },
  { key: "billNo", label: "Bill No.", sortable: true },
  { key: "billPeriod", label: "Bill Period", sortable: false },
  { key: "billDate", label: "Bill Date", sortable: true },
  { key: "billAmt", label: "Bill Amt.", sortable: true },
  { key: "dueDate", label: "Due Date", sortable: true },
  { key: "paidAmount", label: "Paid Amount", sortable: true },
  { key: "paidDate", label: "Paid Date", sortable: true },
  { key: "receiptNo", label: "Receipt No.", sortable: true },
  { key: "receiptDate", label: "Receipt Date", sortable: true },
  { key: "outstandingAmt", label: "Outstanding Amt.", sortable: true },
  { key: "ageing6", label: "Ageing < 6 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
  { key: "ageing9", label: "Ageing < 9 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
  { key: "ageing12", label: "Ageing < 12 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
  { key: "ageing15", label: "Ageing < 15 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
];

const formatBillAmount = (value: number | null) => (value === null || value === undefined ? "" : value.toFixed(1));
const formatOutstanding = (value: number | null) => (value === null || value === undefined ? "" : value.toFixed(2));

const EMPTY_FILTERS: FilterState = { towerId: "", towerName: "", flatId: "", flatName: "", dueDate: undefined };

const AccountingInvoiceReport: React.FC = () => {
  const [towers, setTowers] = useState<OptionItem[]>([]);
  const [flats, setFlats] = useState<OptionItem[]>([]);
  const [flatsLoading, setFlatsLoading] = useState(false);

  const [selectedTower, setSelectedTower] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [dueDate, setDueDate] = useState<Date>();

  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);

  const [rows, setRows] = useState<InvoiceReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTowers = useCallback(async () => {
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const res = await axios.get(`${baseUrl}/account/soc_flat_charges/form_options.json`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = (res.data || {}) as Record<string, unknown>;
      setTowers(toOptionList(pickList(data, ["towers"]), ["name"]));
    } catch (error) {
      console.error("Error fetching towers:", error);
      toast.error("Failed to load towers");
    }
  }, []);

  useEffect(() => {
    fetchTowers();
  }, [fetchTowers]);

  useEffect(() => {
    setSelectedFlat("");
    setFlats([]);
    if (!selectedTower) return;

    const fetchFlats = async () => {
      setFlatsLoading(true);
      try {
        const baseUrl = API_CONFIG.BASE_URL;
        const token = API_CONFIG.TOKEN;
        const res = await axios.get(`${baseUrl}/crm/admin/society_flats.json`, {
          params: {
            "q[society_block_id_eq]": selectedTower,
          },
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = res.data;
        const list = Array.isArray(data) ? data : Array.isArray(data?.society_flats) ? data.society_flats : [];
        setFlats(
          list.map((item: Record<string, unknown>) => ({
            id: Number(item.id),
            name: String(item.flat_no ?? item.name ?? item.id ?? ""),
          }))
        );
      } catch (error) {
        console.error("Error fetching flats:", error);
        toast.error("Failed to load flats for the selected tower");
        setFlats([]);
      } finally {
        setFlatsLoading(false);
      }
    };
    fetchFlats();
  }, [selectedTower]);

  const fetchInvoiceReport = useCallback(async (filters: FilterState) => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const currentLockAccountId = localStorage.getItem("lock_account_id");
      const params: Record<string, string> = {};
      if (currentLockAccountId) params.lock_account_id = currentLockAccountId;
      if (filters.towerId) params["q[society_block_id_eq]"] = filters.towerId;
      if (filters.flatId) params["q[society_flat_id_eq]"] = filters.flatId;
      if (filters.dueDate) params["q[due_date_eq]"] = format(filters.dueDate, "yyyy-MM-dd");

      const response = await axios.get(`${baseUrl}/bills_invoice_report.json`, {
        params,
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const list = extractInvoiceReportList(response.data);
      setRows(list.map(normalizeInvoiceRow));
    } catch (error) {
      console.error("Error fetching invoice report:", error);
      toast.error("Failed to fetch invoice report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoiceReport(EMPTY_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    const towerName = towers.find((t) => String(t.id) === selectedTower)?.name ?? "";
    const flatName = flats.find((f) => String(f.id) === selectedFlat)?.name ?? "";
    const next: FilterState = { towerId: selectedTower, towerName, flatId: selectedFlat, flatName, dueDate };
    setAppliedFilters(next);
    fetchInvoiceReport(next);
  };

  const handleReset = () => {
    setSelectedTower("");
    setSelectedFlat("");
    setDueDate(undefined);
    setAppliedFilters(EMPTY_FILTERS);
    fetchInvoiceReport(EMPTY_FILTERS);
  };

  const removeAppliedFilter = (key: "tower" | "flat" | "dueDate") => {
    if (key === "tower") setSelectedTower("");
    if (key === "flat") setSelectedFlat("");
    if (key === "dueDate") setDueDate(undefined);

    const next: FilterState = {
      ...appliedFilters,
      ...(key === "tower" ? { towerId: "", towerName: "" } : {}),
      ...(key === "flat" ? { flatId: "", flatName: "" } : {}),
      ...(key === "dueDate" ? { dueDate: undefined } : {}),
    };
    setAppliedFilters(next);
    fetchInvoiceReport(next);
  };

  const hasAppliedFilters = Boolean(
    appliedFilters.towerId || appliedFilters.flatId || appliedFilters.dueDate
  );

  const renderCell = (item: InvoiceReportRow, columnKey: string) => {
    switch (columnKey) {
      case "billAmt":
      case "paidAmount":
        return formatBillAmount(item[columnKey as "billAmt" | "paidAmount"]);
      case "outstandingAmt":
      case "ageing6":
      case "ageing9":
      case "ageing12":
      case "ageing15":
        return formatOutstanding(item[columnKey as "outstandingAmt" | "ageing6" | "ageing9" | "ageing12" | "ageing15"]);
      default:
        return item[columnKey as keyof InvoiceReportRow] ?? "";
    }
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Tower</label>
            <Select value={selectedTower} onValueChange={setSelectedTower}>
              <SelectTrigger>
                <SelectValue placeholder="Select Tower" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 max-h-60">
                {towers.map((tower) => (
                  <SelectItem key={tower.id} value={String(tower.id)}>
                    {tower.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Select Flat</label>
            <Select value={selectedFlat} onValueChange={setSelectedFlat} disabled={!selectedTower || flatsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={selectedTower ? "Select Flat" : "Select tower first"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 max-h-60">
                {flats.map((flat) => (
                  <SelectItem key={flat.id} value={String(flat.id)}>
                    {flat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Due Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="bg-teal-500 hover:bg-teal-600 text-white">
              Apply
            </Button>
            <Button onClick={handleReset} className="bg-cyan-400 hover:bg-cyan-500 text-white">
              Reset
            </Button>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 mt-6 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Applied Filters</p>
          {hasAppliedFilters && (
            <div className="flex flex-wrap gap-2">
              {appliedFilters.towerId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs text-gray-700">
                  Tower: {appliedFilters.towerName}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeAppliedFilter("tower")}
                  />
                </span>
              )}
              {appliedFilters.flatId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs text-gray-700">
                  Flat: {appliedFilters.flatName}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeAppliedFilter("flat")}
                  />
                </span>
              )}
              {appliedFilters.dueDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs text-gray-700">
                  Due Date: {format(appliedFilters.dueDate, "dd/MM/yyyy")}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeAppliedFilter("dueDate")}
                  />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.sr)}
        pagination={false}
        enableExport
        exportFileName="invoice-report"
        storageKey="accounting-invoice-report-table"
        emptyMessage="No invoices found"
        loading={loading}
        loadingMessage="Loading invoice report..."
      />
    </div>
  );
};

export default AccountingInvoiceReport;
