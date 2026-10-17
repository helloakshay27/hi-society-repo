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
}

export const emptyLateFee: LateFeeState = {
  enabled: false,
  calculationType: "fixed",
  calculationBase: "outstanding_amount",
  rate: "",
  frequency: "one_time",
  graceDays: "",
};

export type LateFeeErrors = { rate?: string; frequency?: string; graceDays?: string };

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
  return errors;
};

/** A recurring rule back-charges older unpaid invoices, so saving it needs a confirmation. */
export const needsBackdateConfirm = (lateFee: LateFeeState) =>
  lateFee.enabled && lateFee.frequency !== "one_time" && Object.keys(validateLateFee(lateFee)).length === 0;

/**
 * overdue_* fields for the charge_setup payload. When the rule is off, `clearWhenOff`
 * sends overdue_trigger "" so an existing rule is switched off on edit.
 */
export const buildOverduePayload = (lateFee: LateFeeState, clearWhenOff = false): Record<string, unknown> => {
  if (!lateFee.enabled) return clearWhenOff ? { overdue_trigger: "" } : {};
  const isInterest = lateFee.calculationType === "percentage";
  return {
    overdue_trigger: OVERDUE_TRIGGER,
    overdue_calculation_type: lateFee.calculationType,
    ...(isInterest ? { overdue_calculation_base: lateFee.calculationBase } : {}),
    overdue_rate: Number(lateFee.rate),
    overdue_frequency: lateFee.frequency,
    overdue_grace_days: lateFee.graceDays === "" ? 0 : Number(lateFee.graceDays),
  };
};

const labelOf = <T extends string>(options: { value: T; label: string }[], value: unknown) =>
  options.find((o) => o.value === value)?.label;

/** Display labels for the details page. */
export const describeLateFee = (charge: Record<string, unknown>) => {
  const isInterest = charge.overdue_calculation_type === "percentage";
  const rate = charge.overdue_rate;
  return {
    enabled: charge.overdue_trigger === OVERDUE_TRIGGER,
    type: labelOf(LATE_FEE_TYPE_OPTIONS, charge.overdue_calculation_type) ?? "-",
    rateLabel: isInterest ? "Interest Rate (% per year)" : "Amount (₹)",
    rate: rate != null && rate !== "" ? (isInterest ? `${rate}%` : `₹${rate}`) : "-",
    calculateOn: isInterest ? labelOf(CALCULATE_ON_OPTIONS, charge.overdue_calculation_base) ?? "-" : null,
    frequency: labelOf(FREQUENCY_OPTIONS, charge.overdue_frequency) ?? "-",
    graceDays: charge.overdue_grace_days != null ? String(charge.overdue_grace_days) : "0",
  };
};
