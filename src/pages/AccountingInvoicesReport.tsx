import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarIcon, X, Filter, NotepadText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
    <div className="w-full bg-[#f9f7f2] p-6" style={{ minHeight: "100vh", boxSizing: "border-box" }}>
      {/* Header */}
      <div className="mb-6 rounded-lg border-2 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5E0D3] text-[#C72030]">
            <NotepadText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold uppercase text-[#1A1A1A]">Invoices Report</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
            onClick={handleOpenFilter}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Applied Filters */}
        {hasAppliedFilters && (
          <div className="border-t border-dashed border-gray-300 mt-4 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Applied Filters</p>
            <div className="flex flex-wrap gap-2">
              {appliedFilters.tower && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs text-gray-700">
                  Tower: {appliedFilters.tower}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeAppliedFilter("tower")} />
                </span>
              )}
              {appliedFilters.flat && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs text-gray-700">
                  Flat: {appliedFilters.flat}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeAppliedFilter("flat")} />
                </span>
              )}
              {appliedFilters.dueDate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-300 px-3 py-1 text-xs text-gray-700">
                  Due Date: {format(appliedFilters.dueDate, "dd/MM/yyyy")}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeAppliedFilter("dueDate")} />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-5 text-center border-b border-[#EAECF0] bg-[#F8F9FC]">
          <p className="text-sm font-medium text-[#667085]">Lockated</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#101828]">Invoices Report</h1>
          <p className="mt-1 text-sm text-[#475467]">
            {hasAppliedFilters ? "Filtered results" : "All invoices"}
          </p>
        </div>

        <div className="p-4">
          <EnhancedTable
            data={filteredRows}
            columns={columns}
            renderCell={renderCell}
            getItemId={(item) => String(item.sr)}
            enableExport
            exportFileName="invoices-report"
            storageKey="accounting-invoices-report-table"
            emptyMessage="No invoices found"
            leftActions={
              <Button
                variant="outline"
                className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/10"
                onClick={handleOpenFilter}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            }
          />
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-lg font-semibold">Filter Invoices</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleCloseFilter} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select Tower</Label>
              <Select
                value={filterValues.tower}
                onValueChange={(value) => setFilterValues((prev) => ({ ...prev, tower: value === "all" ? "" : value }))}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Select Tower" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999] max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">All Towers</SelectItem>
                  {TOWERS.map((tower) => (
                    <SelectItem key={tower} value={tower}>
                      {tower}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Select Flat</Label>
              <Select
                value={filterValues.flat}
                onValueChange={(value) => setFilterValues((prev) => ({ ...prev, flat: value === "all" ? "" : value }))}
              >
                <SelectTrigger className="w-full bg-white border border-gray-300">
                  <SelectValue placeholder="Select Flat" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999] max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">All Flats</SelectItem>
                  {FLATS.map((flat) => (
                    <SelectItem key={flat} value={flat}>
                      {flat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filterValues.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterValues.dueDate ? format(filterValues.dueDate, "dd/MM/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterValues.dueDate}
                    onSelect={(date) => setFilterValues((prev) => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="bg-[#C72030] hover:bg-[#A01B28] text-white"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingInvoicesReport;
