// Shared row shape/mapping for the "Tax Summary" style report used by
// AccountingGSTReceivable.tsx (GET /lock_account_transactions/gst_receivable)
// and AccountingTaxSummary.tsx (GET /lock_account_transactions/tax_summary).

export interface TaxSummaryRow {
  ledgerId: number;
  ledgerName: string;
  taxName?: string;
  taxPercentage: string;
  transactionAmount: number;
  taxAmount: number;
}

export interface TaxSummaryApiRow {
  ledger_id?: number;
  ledger_name?: string;
  tax_name?: string;
  tax_percentage?: string | number;
  transaction_amount?: number;
  tax_amount?: number;
}

export const mapTaxSummaryRow = (row: TaxSummaryApiRow): TaxSummaryRow => ({
  ledgerId: row.ledger_id ?? 0,
  ledgerName: row.ledger_name || "",
  taxName: row.tax_name || undefined,
  taxPercentage: row.tax_percentage !== undefined && row.tax_percentage !== null ? `${row.tax_percentage}` : "",
  transactionAmount: row.transaction_amount || 0,
  taxAmount: row.tax_amount || 0,
});

export const formatLedgerTaxName = (row: TaxSummaryRow) =>
  row.taxName ? `${row.ledgerName} / ${row.taxName}` : row.ledgerName;
