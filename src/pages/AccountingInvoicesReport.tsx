import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, TextField } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { X } from "lucide-react";
import { format } from "date-fns";
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
  { key: "ageing6", label: "< 6 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
  { key: "ageing9", label: "< 9 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
  { key: "ageing12", label: "< 12 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
  { key: "ageing15", label: "< 15 Months", sortable: true, group: "Debtors Ageing (o/s amt)" },
];

const formatBillAmount = (value: number | null) => (value === null || value === undefined ? "" : value.toFixed(1));
const formatOutstanding = (value: number | null) => (value === null || value === undefined ? "" : value.toFixed(2));

interface FilterState {
  tower: string;
  flat: string;
  dueDate?: Date;
}

const AccountingInvoicesReport: React.FC = () => {
  const [rows, setRows] = useState<InvoiceReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
const lock_account_id = localStorage.getItem("lock_account_id") || "3";

  const [filterValues, setFilterValues] = useState<FilterState>({
    tower: "",
    flat: "",
    dueDate: undefined,
  });

  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    tower: "",
    flat: "",
    dueDate: undefined,
  });

  const lockAccountId = localStorage.getItem("lock_account_id")|| "3";

  const fetchInvoiceReport = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      const token = API_CONFIG.TOKEN;
      const response = await axios.get(`${baseUrl}/bills_invoice_report.json`, {
        params: { ...(lockAccountId ? { lock_account_id: lockAccountId } : {}) },
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
  }, [lockAccountId]);

  useEffect(() => {
    fetchInvoiceReport();
  }, [fetchInvoiceReport]);

  const towerOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.tower).filter(Boolean))).sort(),
    [rows]
  );
  const flatOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.flat).filter(Boolean))).sort(),
    [rows]
  );

  const handleOpenFilter = () => setFilterDialogOpen(true);
  const handleCloseFilter = () => setFilterDialogOpen(false);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filterValues });
    setFilterDialogOpen(false);
  };

  const handleResetFilters = () => {
    setFilterValues({ tower: "", flat: "", dueDate: undefined });
    setAppliedFilters({ tower: "", flat: "", dueDate: undefined });
    setFilterDialogOpen(false);
  };

  const removeAppliedFilter = (key: keyof FilterState) => {
    const updated = { ...appliedFilters, [key]: key === "dueDate" ? undefined : "" };
    setAppliedFilters(updated);
    setFilterValues(updated);
  };

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (appliedFilters.tower && row.tower !== appliedFilters.tower) return false;
      if (appliedFilters.flat && row.flat !== appliedFilters.flat) return false;
      if (appliedFilters.dueDate) {
        const formatted = format(appliedFilters.dueDate, "yyyy-MM-dd");
        if (row.dueDate !== formatted) return false;
      }
      return true;
    });
  }, [rows, appliedFilters]);

  const hasAppliedFilters = Boolean(
    appliedFilters.tower || appliedFilters.flat || appliedFilters.dueDate
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
      <div className="mb-4">
        <h1 className="text-brand-h2 font-semibold text-brand-text">Invoices Report</h1>
        <p className="mt-1 text-brand-body-4 text-brand-text-light">
          {hasAppliedFilters ? "Filtered results" : "All invoices"}
        </p>
      </div>

      {hasAppliedFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-brand-body-4 font-medium text-brand-text-light">
            Applied Filters:
          </span>
          {appliedFilters.tower && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-card-border bg-brand-light px-3 py-1 text-xs text-brand-text">
              Tower: {appliedFilters.tower}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeAppliedFilter("tower")} />
            </span>
          )}
          {appliedFilters.flat && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-card-border bg-brand-light px-3 py-1 text-xs text-brand-text">
              Flat: {appliedFilters.flat}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeAppliedFilter("flat")} />
            </span>
          )}
          {appliedFilters.dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-card-border bg-brand-light px-3 py-1 text-xs text-brand-text">
              Due Date: {format(appliedFilters.dueDate, "dd/MM/yyyy")}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeAppliedFilter("dueDate")} />
            </span>
          )}
        </div>
      )}

      <EnhancedTable
        data={filteredRows}
        columns={columns}
        renderCell={renderCell}
        getItemId={(item) => String(item.sr)}
        // enableExport
        exportFileName="invoices-report"
        storageKey="accounting-invoices-report-table"
        emptyMessage="No invoices found"
        loading={loading}
        loadingMessage="Loading invoice report..."
        onFilterClick={handleOpenFilter}
      />

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} modal={false} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-xl font-bold text-[hsl(var(--analytics-text))]">
              FILTER BY
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleCloseFilter} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                  Select Tower
                </InputLabel>
                <MuiSelect
                  value={filterValues.tower}
                  onChange={(e) =>
                    setFilterValues((prev) => ({ ...prev, tower: e.target.value }))
                  }
                  displayEmpty
                  label="Select Tower"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="">
                    <em>All Towers</em>
                  </MenuItem>
                  {towerOptions.map((tower) => (
                    <MenuItem key={tower} value={tower}>
                      {tower}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <FormControl fullWidth variant="outlined">
                <InputLabel shrink sx={{ backgroundColor: "white", px: 1 }}>
                  Select Flat
                </InputLabel>
                <MuiSelect
                  value={filterValues.flat}
                  onChange={(e) =>
                    setFilterValues((prev) => ({ ...prev, flat: e.target.value }))
                  }
                  displayEmpty
                  label="Select Flat"
                  sx={fieldStyles}
                  MenuProps={menuProps}
                >
                  <MenuItem value="">
                    <em>All Flats</em>
                  </MenuItem>
                  {flatOptions.map((flat) => (
                    <MenuItem key={flat} value={flat}>
                      {flat}
                    </MenuItem>
                  ))}
                </MuiSelect>
              </FormControl>

              <TextField
                label="Due Date"
                type="date"
                value={
                  filterValues.dueDate ? format(filterValues.dueDate, "yyyy-MM-dd") : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setFilterValues((prev) => ({ ...prev, dueDate: undefined }));
                    return;
                  }
                  const [year, month, day] = value.split("-").map(Number);
                  setFilterValues((prev) => ({
                    ...prev,
                    dueDate: new Date(year, month - 1, day),
                  }));
                }}
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: fieldStyles }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="text-[hsl(var(--analytics-text))] border-[hsl(var(--analytics-border))]"
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="bg-[#C72030] hover:bg-[#C72030]/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingInvoicesReport;
