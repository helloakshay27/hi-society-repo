// Shared row shape/dummy data for the "Tax Summary" style report used by
// AccountingGSTReceivable.tsx and AccountingTaxSummary.tsx.

export interface TaxSummaryRow {
  ledgerId: number;
  ledgerName: string;
  taxName?: string;
  taxPercentage: string;
  transactionAmount: number;
  taxAmount: number;
}

// TODO: replace with a real fetch once the Tax Summary API endpoint is
// available; wire it the same way as AccountingBalanceSheet.
export const DUMMY_TAX_SUMMARY_ROWS: TaxSummaryRow[] = [
  { ledgerId: 2606, ledgerName: "Sinking Fund", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2607, ledgerName: "Repair Fund", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2608, ledgerName: "Common Maintenance Charges", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2609, ledgerName: "Common Electricity Charges", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2610, ledgerName: "Common Insurance", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2611, ledgerName: "Statutory, Water and Other Expenses", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2612, ledgerName: "Non Occupancy Charges", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2613, ledgerName: "Interest (*)", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2614, ledgerName: "Arrears(P)", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2615, ledgerName: "CGST", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 2616, ledgerName: "SGST", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 14940, ledgerName: "Access Card Charges", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 15130, ledgerName: "Water Meter", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 22123, ledgerName: "Parking", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 24996, ledgerName: "Club Memberships", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
  { ledgerId: 24997, ledgerName: "Multipurpose Hall", taxPercentage: "", transactionAmount: 0, taxAmount: 0 },
];

export const formatLedgerTaxName = (row: TaxSummaryRow) =>
  `${row.ledgerName} /${row.taxName ? ` ${row.taxName}` : ""}`;
