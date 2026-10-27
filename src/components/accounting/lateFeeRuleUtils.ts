/**
 * Late fee / overdue interest rule on a charge setup — shared by the Charge
 * create, edit and details pages. Option values are sent verbatim as the
 * charge_setup.overdue_* payload fields.
 */

export type OverdueCalculationType = "fixed" | "percentage";
export type OverdueCalculationBase = "outstanding_amount" | "invoice_amount";
export type OverdueFrequency = "one_time" | "daily" | "monthly";

export const LATE_FEE_TYPE_OPTIONS: { value: OverdueCalculationType; label: string }[] = [
  { value: "fixed", label: "Fixed Amount" },
  { value: "percentage", label: "Interest (% per year)" },
];

export const CALCULATE_ON_OPTIONS: { value: OverdueCalculationBase; label: string }[] = [
  { value: "outstanding_amount", label: "Unpaid amount" },
  { value: "invoice_amount", label: "Full invoice amount" },
];

// "Once" is only allowed for Fixed — interest is a % per year, so it must accrue daily or monthly.
export const FREQUENCY_OPTIONS: { value: OverdueFrequency; label: string; fixedOnly?: boolean }[] = [
  { value: "one_time", label: "Once", fixedOnly: true },
  { value: "daily", label: "Every day" },
  { value: "monthly", label: "Every month" },
];

// A late fee rule has no charge type of its own — the API expects it saved as Fixed (1) with value 0.
export const LATE_FEE_CHARGE_CATEGORY_ID = 1;

export const OVERDUE_TRIGGER = "invoice_overdue";

export const BACKDATE_CONFIRM_MESSAGE =
  "This rule will also charge older unpaid invoices for every period since their due date. Save it anyway?";

export interface LateFeeState {
  enabled: boolean;
  calculationType: OverdueCalculationType;
  calculationBase: OverdueCalculationBase;
  rate: string;
  frequency: OverdueFrequency;
  graceDays: string;
  /** YYYY-MM-DD; "" = not set (the API then starts the rule today). */
  effectiveFrom: string;
}

export const emptyLateFee: LateFeeState = {
  enabled: false,
  calculationType: "fixed",
  calculationBase: "outstanding_amount",
  rate: "",
  frequency: "one_time",
  graceDays: "",
  effectiveFrom: "",
};

export type LateFeeErrors = { rate?: string; frequency?: string; graceDays?: string; effectiveFrom?: string };

const isOneOf = <T extends string>(value: unknown, options: { value: T }[]): value is T =>
  options.some((o) => o.value === value);

/** Builds form state from a charge_setup GET response. */
export const lateFeeFromCharge = (charge: Record<string, unknown>): LateFeeState => ({
  enabled: charge.overdue_trigger === OVERDUE_TRIGGER,
  calculationType: isOneOf(charge.overdue_calculation_type, LATE_FEE_TYPE_OPTIONS)
    ? charge.overdue_calculation_type
    : emptyLateFee.calculationType,
  calculationBase: isOneOf(charge.overdue_calculation_base, CALCULATE_ON_OPTIONS)
    ? charge.overdue_calculation_base
    : emptyLateFee.calculationBase,
  rate: charge.overdue_rate != null ? String(charge.overdue_rate) : "",
  frequency: isOneOf(charge.overdue_frequency, FREQUENCY_OPTIONS) ? charge.overdue_frequency : emptyLateFee.frequency,
  graceDays: charge.overdue_grace_days != null ? String(charge.overdue_grace_days) : "",
  effectiveFrom: typeof charge.overdue_effective_from === "string" ? charge.overdue_effective_from.slice(0, 10) : "",
});

/** Applies one field change, keeping the rule consistent (Interest can't be charged "Once"). */
export const withLateFeeField = <K extends keyof LateFeeState>(
  prev: LateFeeState,
  field: K,
  value: LateFeeState[K]
): LateFeeState => {
  const next = { ...prev, [field]: value };
  if (next.calculationType === "percentage" && next.frequency === "one_time") next.frequency = "daily";
  return next;
};

/** Returns a message per invalid field (mirrors the API's 422 validations). */
export const validateLateFee = (lateFee: LateFeeState): LateFeeErrors => {
  const errors: LateFeeErrors = {};
  const isInterest = lateFee.calculationType === "percentage";
  const rate = lateFee.rate === "" ? null : Number(lateFee.rate);
  if (rate === null) errors.rate = isInterest ? "Interest rate is required" : "Amount is required";
  else if (!(rate > 0)) errors.rate = "Must be greater than 0";
  else if (isInterest && rate > 100) errors.rate = "Must be at most 100 (% per year)";
  if (isInterest && lateFee.frequency === "one_time") errors.frequency = "Interest must be charged every day or every month";
  if (lateFee.graceDays !== "") {
    const grace = Number(lateFee.graceDays);
    if (!Number.isInteger(grace) || grace < 0) errors.graceDays = "Use a whole number, 0 or more";
  }
  if (lateFee.effectiveFrom !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(lateFee.effectiveFrom)) {
    errors.effectiveFrom = "Use a valid date";
  }
  return errors;
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Fees are only charged from the effective date, so only a recurring rule with a
 * past effective date back-charges older unpaid invoices — that needs a confirmation.
 */
export const needsBackdateConfirm = (lateFee: LateFeeState) =>
  lateFee.enabled &&
  lateFee.frequency !== "one_time" &&
  lateFee.effectiveFrom !== "" &&
  lateFee.effectiveFrom < todayISO() &&
  Object.keys(validateLateFee(lateFee)).length === 0;

/** True for a charge setup that is a late-fee rule — it must never be used as an invoice line. */
export const isLateFeeRule = (charge: Record<string, unknown>) =>
  charge.overdue_trigger != null && charge.overdue_trigger !== "";

const sameValue = (a: unknown, b: unknown) => {
  if (a == null || a === "") return b == null || b === "";
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b);
  return String(a) === String(b);
};

/**
 * overdue_* fields for the charge_setup payload.
 * - Create (no `original`): a switched-off rule sends nothing; an empty effective date is left out.
 * - Edit (`original` = the charge_setup GET response): only changed fields are sent, so
 *   overdue_effective_from goes out only when the user changed it, and switching the rule off
 *   sends just overdue_trigger "". The API rejects "" for the date while the rule is on.
 */
export const buildOverduePayload = (
  lateFee: LateFeeState,
  original?: Record<string, unknown>
): Record<string, unknown> => {
  if (!lateFee.enabled) return original && isLateFeeRule(original) ? { overdue_trigger: "" } : {};
  const isInterest = lateFee.calculationType === "percentage";
  const full: Record<string, unknown> = {
    overdue_trigger: OVERDUE_TRIGGER,
    overdue_calculation_type: lateFee.calculationType,
    ...(isInterest ? { overdue_calculation_base: lateFee.calculationBase } : {}),
    overdue_rate: Number(lateFee.rate),
    overdue_frequency: lateFee.frequency,
    overdue_grace_days: lateFee.graceDays === "" ? 0 : Number(lateFee.graceDays),
    ...(lateFee.effectiveFrom !== "" ? { overdue_effective_from: lateFee.effectiveFrom } : {}),
  };
  if (!original) return full;
  const originalDate =
    typeof original.overdue_effective_from === "string" ? original.overdue_effective_from.slice(0, 10) : "";
  return Object.fromEntries(
    Object.entries(full).filter(([key, value]) =>
      key === "overdue_effective_from" ? value !== originalDate : !sameValue(value, original[key])
    )
  );
};

/** Messages from a 422 body: `{ errors: [...] }` or `{ error: "..." }`. */
export const apiErrorMessages = (error: unknown): string[] => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== "object") return [];
  const { errors, error: single } = data as Record<string, unknown>;
  if (Array.isArray(errors)) return errors.filter((m): m is string => typeof m === "string" && m.trim() !== "");
  if (typeof errors === "string" && errors.trim()) return [errors];
  if (typeof single === "string" && single.trim()) return [single];
  return [];
};

const labelOf = <T extends string>(options: { value: T; label: string }[], value: unknown) =>
  options.find((o) => o.value === value)?.label;

const formatEffectiveDate = (value: unknown): string | null => {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/**
 * Late fee state of a charge setup for the list/details pages:
 * - "active": rule on with an effective date
 * - "inactive": rule on but no effective date — it charges nothing
 * - "off": rule switched off but its overdue_* fields are still filled
 * - null: a normal charge
 */
export const lateFeeRuleState = (charge: Record<string, unknown>): "active" | "inactive" | "off" | null => {
  if (isLateFeeRule(charge)) return charge.overdue_effective_from ? "active" : "inactive";
  const hasRuleFields = ["overdue_calculation_type", "overdue_rate", "overdue_frequency"].some(
    (key) => charge[key] != null && charge[key] !== ""
  );
  return hasRuleFields ? "off" : null;
};

const FREQUENCY_SUMMARY: Record<string, string> = { one_time: "once", daily: "daily", monthly: "monthly" };

/** e.g. "₹100 once after 1 grace day, from 01 Nov 2026" / "18% p.a. monthly after 5 grace days, from …". */
export const lateFeeSummary = (charge: Record<string, unknown>): string => {
  const isInterest = charge.overdue_calculation_type === "percentage";
  const rate = charge.overdue_rate;
  const amount = rate == null || rate === "" ? "-" : isInterest ? `${rate}% p.a.` : `₹${rate}`;
  const grace = Number(charge.overdue_grace_days) || 0;
  const from = formatEffectiveDate(charge.overdue_effective_from);
  const parts = [amount, FREQUENCY_SUMMARY[String(charge.overdue_frequency)], `after ${grace} grace ${grace === 1 ? "day" : "days"}`];
  return parts.filter(Boolean).join(" ") + (from ? `, from ${from}` : "");
};

/** Display labels for the details page. */
export const describeLateFee = (charge: Record<string, unknown>) => {
  const isInterest = charge.overdue_calculation_type === "percentage";
  const rate = charge.overdue_rate;
  return {
    enabled: charge.overdue_trigger === OVERDUE_TRIGGER,
    state: lateFeeRuleState(charge),
    summary: lateFeeSummary(charge),
    effectiveFrom: formatEffectiveDate(charge.overdue_effective_from),
    type: labelOf(LATE_FEE_TYPE_OPTIONS, charge.overdue_calculation_type) ?? "-",
    rateLabel: isInterest ? "Interest Rate (% per year)" : "Amount (₹)",
    rate: rate != null && rate !== "" ? (isInterest ? `${rate}%` : `₹${rate}`) : "-",
    calculateOn: isInterest ? labelOf(CALCULATE_ON_OPTIONS, charge.overdue_calculation_base) ?? "-" : null,
    frequency: labelOf(FREQUENCY_OPTIONS, charge.overdue_frequency) ?? "-",
    graceDays: charge.overdue_grace_days != null ? String(charge.overdue_grace_days) : "0",
  };
};
