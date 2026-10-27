import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import { Switch } from "@/components/ui/switch";
import { menuProps } from "@/components/ticket-management/fieldStyles";
import {
  CALCULATE_ON_OPTIONS,
  FREQUENCY_OPTIONS,
  LATE_FEE_TYPE_OPTIONS,
  LateFeeErrors,
  LateFeeState,
  OverdueCalculationBase,
  OverdueCalculationType,
  OverdueFrequency,
} from "./lateFeeRuleUtils";

/** The "Use as a Late Fee / Overdue Interest rule" toggle box. */
export const LateFeeToggle: React.FC<{ checked: boolean; onCheckedChange: (checked: boolean) => void }> = ({
  checked,
  onCheckedChange,
}) => (
  <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-[#F5F4F0] px-4 py-3 cursor-pointer">
    <span>
      <span className="block text-sm font-semibold text-[#1A1A18]">Use as a Late Fee / Overdue Interest rule</span>
      <span className="block text-xs text-gray-500">
        Charged automatically on invoices that are still unpaid after their due date.
      </span>
    </span>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label="Use as a Late Fee / Overdue Interest rule"
    />
  </label>
);

/** "Late fee" badge for a charge setup, with the "Not active" / "Off" variants. */
export const LateFeeBadge: React.FC<{ state: "active" | "inactive" | "off" }> = ({ state }) => (
  <span className="inline-flex flex-wrap items-center gap-1.5">
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        state === "off" ? "bg-gray-100 text-gray-600" : "bg-[#F2EBC9] text-[#7A5B00]"
      }`}
    >
      {state === "off" ? "Late fee – Off" : "Late fee"}
    </span>
    {state === "inactive" && (
      <span className="text-xs font-medium text-red-600">Not active – set an effective date</span>
    )}
  </span>
);

/** The API's 422 messages, shown under the charge form. */
export const ServerErrorList: React.FC<{ messages: string[] }> = ({ messages }) =>
  messages.length === 0 ? null : (
    <ul role="alert" className="list-disc space-y-1 rounded-lg border border-red-200 bg-red-50 py-3 pl-8 pr-4 text-sm text-red-700">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );

interface LateFeeRuleFieldsProps {
  lateFee: LateFeeState;
  onChange: <K extends keyof LateFeeState>(field: K, value: LateFeeState[K]) => void;
  errors: LateFeeErrors;
  /** The page's MUI input styling, applied as `& .MuiInputBase-root`. */
  fieldStyles: Record<string, unknown>;
}

const blockMinus = (e: React.KeyboardEvent) => {
  if (e.key === "-") e.preventDefault();
};

/** The 6-field "Late Fee Rule" section shown while the toggle is on. */
export const LateFeeRuleFields: React.FC<LateFeeRuleFieldsProps> = ({ lateFee, onChange, errors, fieldStyles }) => {
  const isInterest = lateFee.calculationType === "percentage";
  const sx = { "& .MuiInputBase-root": fieldStyles };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-[#1A1A18]">Late Fee Rule</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <FormControl fullWidth required sx={sx}>
          <InputLabel shrink>Late Fee Type</InputLabel>
          <Select
            value={lateFee.calculationType}
            onChange={(e) => onChange("calculationType", e.target.value as OverdueCalculationType)}
            label="Late Fee Type"
            notched
            MenuProps={menuProps}
          >
            {LATE_FEE_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={isInterest ? "Interest Rate (% per year)" : "Amount (₹)"}
          required
          type="number"
          placeholder={isInterest ? "e.g. 18" : "e.g. 250"}
          value={lateFee.rate}
          onChange={(e) => {
            if (e.target.value.startsWith("-")) return;
            onChange("rate", e.target.value);
          }}
          error={!!errors.rate}
          helperText={errors.rate}
          variant="outlined"
          fullWidth
          InputLabelProps={{ shrink: true }}
          InputProps={{ notched: true }}
          inputProps={{ min: 0, max: isInterest ? 100 : undefined, step: "0.01", onKeyDown: blockMinus }}
          sx={sx}
        />

        {isInterest && (
          <FormControl fullWidth required sx={sx}>
            <InputLabel shrink>Calculate On</InputLabel>
            <Select
              value={lateFee.calculationBase}
              onChange={(e) => onChange("calculationBase", e.target.value as OverdueCalculationBase)}
              label="Calculate On"
              notched
              MenuProps={menuProps}
            >
              {CALCULATE_ON_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <FormControl fullWidth required error={!!errors.frequency} sx={sx}>
          <InputLabel shrink>Charge Frequency</InputLabel>
          <Select
            value={lateFee.frequency}
            onChange={(e) => onChange("frequency", e.target.value as OverdueFrequency)}
            label="Charge Frequency"
            notched
            MenuProps={menuProps}
          >
            {FREQUENCY_OPTIONS.filter((option) => !(isInterest && option.fixedOnly)).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {errors.frequency && <FormHelperText>{errors.frequency}</FormHelperText>}
        </FormControl>

        <TextField
          label="Grace Period (days)"
          type="number"
          placeholder="e.g. 5"
          value={lateFee.graceDays}
          onChange={(e) => {
            if (e.target.value.startsWith("-")) return;
            onChange("graceDays", e.target.value);
          }}
          error={!!errors.graceDays}
          helperText={errors.graceDays || "Late fee starts on due date + grace days + 1"}
          variant="outlined"
          fullWidth
          InputLabelProps={{ shrink: true }}
          InputProps={{ notched: true }}
          inputProps={{
            min: 0,
            step: "1",
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "-" || e.key === ".") e.preventDefault();
            },
          }}
          sx={sx}
        />

        <TextField
          label="Late Fee Effective From"
          type="date"
          value={lateFee.effectiveFrom}
          onChange={(e) => onChange("effectiveFrom", e.target.value)}
          error={!!errors.effectiveFrom}
          helperText={
            errors.effectiveFrom || "Late fees are charged only from this date. Leave empty to start today."
          }
          variant="outlined"
          fullWidth
          InputLabelProps={{ shrink: true }}
          InputProps={{ notched: true }}
          sx={sx}
        />
      </div>
    </div>
  );
};
