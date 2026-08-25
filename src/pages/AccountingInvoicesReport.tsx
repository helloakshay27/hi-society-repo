import React, { useMemo, useState } from "react";
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

const TOWERS = ["A", "B", "C", "D", "FM", "GL"];
const FLATS = ["101", "102", "103", "104", "105", "Office", "Team"];

const DUMMY_INVOICE_REPORT_ROWS: InvoiceReportRow[] = [
  { sr: 1, tower: "C", flat: "101", partyName: "Deepak Gupta, Ani...", billNo: "283921", billPeriod: "NA", billDate: "17/11/2025", billAmt: 1180.0, dueDate: "2025-11-20", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 1180.0, ageing6: null, ageing9: null, ageing12: null, ageing15: 1180.0 },
  { sr: 2, tower: "FM", flat: "Office", partyName: "Ravi Sampat", billNo: "test0010", billPeriod: "NA", billDate: "09/05/2025", billAmt: 1800.0, dueDate: "2025-12-30", paidAmount: 1800.0, paidDate: "02/09/2025", receiptNo: "", receiptDate: "02/09/2025", outstandingAmt: 0, ageing6: null, ageing9: 0, ageing12: null, ageing15: null },
  { sr: 3, tower: "A", flat: "101", partyName: "Deepak Gupta", billNo: "1001", billPeriod: "NA", billDate: "15/07/2024", billAmt: 0, dueDate: "2024-07-25", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 0, ageing6: 0, ageing9: null, ageing12: null, ageing15: null },
  { sr: 4, tower: "A", flat: "101", partyName: "Deepak Gupta", billNo: "0183", billPeriod: "NA", billDate: "11/04/2024", billAmt: 0, dueDate: "2024-02-13", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 0, ageing6: null, ageing9: 0, ageing12: null, ageing15: null },
  { sr: 5, tower: "A", flat: "102", partyName: "Ankita Shah, Khar...", billNo: "562", billPeriod: "2022-11-01 to 202...", billDate: "10/09/2022", billAmt: 11.0, dueDate: "2022-11-25", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 11.0, ageing6: null, ageing9: null, ageing12: null, ageing15: 11.0 },
  { sr: 6, tower: "FM", flat: "Office", partyName: "Ravi Sampat", billNo: "561", billPeriod: "2022-11-01 to 202...", billDate: "10/09/2022", billAmt: 22.0, dueDate: "2022-11-25", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 22.0, ageing6: null, ageing9: null, ageing12: null, ageing15: 22.0 },
  { sr: 7, tower: "A", flat: "101", partyName: "Deepak Gupta", billNo: "560", billPeriod: "2022-11-01 to 202...", billDate: "10/09/2022", billAmt: 11.0, dueDate: "2022-11-25", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 11.0, ageing6: null, ageing9: null, ageing12: null, ageing15: 11.0 },
  { sr: 8, tower: "FM", flat: "Office", partyName: "Ravi Sampat", billNo: "560", billPeriod: "2022-11-01 to 202...", billDate: "06/09/2022", billAmt: 11.0, dueDate: "2022-11-16", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 11.0, ageing6: null, ageing9: null, ageing12: null, ageing15: 11.0 },
  { sr: 9, tower: "A", flat: "101", partyName: "Deepak Gupta", billNo: "559", billPeriod: "2022-11-01 to 202...", billDate: "06/09/2022", billAmt: 1.0, dueDate: "2022-11-16", paidAmount: 1.0, paidDate: "07/11/2022", receiptNo: "1003", receiptDate: "07/11/2022", outstandingAmt: 0, ageing6: null, ageing9: null, ageing12: null, ageing15: 0 },
  { sr: 10, tower: "A", flat: "101", partyName: "Deepak Gupta", billNo: "558", billPeriod: "2022-11-01 to 202...", billDate: "06/09/2022", billAmt: 35543.0, dueDate: "2022-11-16", paidAmount: 35543.0, paidDate: "06/11/2022", receiptNo: "1002", receiptDate: "06/11/2022", outstandingAmt: 0, ageing6: null, ageing9: null, ageing12: null, ageing15: 0 },
  { sr: 11, tower: "FM", flat: "Office", partyName: "Ravi Sampat", billNo: "558", billPeriod: "2022-11-01 to 202...", billDate: "06/09/2022", billAmt: 35543.0, dueDate: "2022-11-16", paidAmount: null, paidDate: "", receiptNo: "", receiptDate: "", outstandingAmt: 35543.0, ageing6: null, ageing9: null, ageing12: null, ageing15: 35543.0 },
  { sr: 12, tower: "FM", flat: "Office", partyName: "Ravi Sampat", billNo: "558", billPeriod: "2022-11-01 to 202...", billDate: "06/09/2022", billAmt: 35543.0, dueDate: "2022-11-16", paidAmount: 35543.0, paidDate: "07/11/2022", receiptNo: "1005", receiptDate: "07/11/2022", outstandingAmt: 0, ageing6: null, ageing9: null, ageing12: null, ageing15: 0 },
];

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
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

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
    return DUMMY_INVOICE_REPORT_ROWS.filter((row) => {
      if (appliedFilters.tower && row.tower !== appliedFilters.tower) return false;
      if (appliedFilters.flat && row.flat !== appliedFilters.flat) return false;
      if (appliedFilters.dueDate) {
        const formatted = format(appliedFilters.dueDate, "yyyy-MM-dd");
        if (row.dueDate !== formatted) return false;
      }
      return true;
    });
  }, [appliedFilters]);

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
        enableExport
        exportFileName="invoices-report"
        storageKey="accounting-invoices-report-table"
        emptyMessage="No invoices found"
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
                  {TOWERS.map((tower) => (
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
                  {FLATS.map((flat) => (
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
