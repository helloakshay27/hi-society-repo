// Page-scoped styles shared by the Facility Booking add / edit / details pages
export const FACILITY_BOOKING_STYLES = `
  html body #root .booking-ref-page {
    background-color: #FDFDFB !important;
  }

  /* Header */
  html body #root .booking-ref-page .ref-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.55);
    transition: color 0.16s;
  }
  html body #root .booking-ref-page .ref-back:hover {
    color: #1A1A18;
  }
  html body #root .booking-ref-page .ref-edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #1A1A18 !important;
    background: #FFFFFF !important;
    border: 1px solid rgba(26, 26, 24, 0.12) !important;
    border-radius: 10px !important;
    box-shadow: none !important;
  }
  html body #root .booking-ref-page .ref-edit-btn:hover {
    background: #F5F4F0 !important;
  }
  html body #root .booking-ref-page .ref-edit-btn svg {
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }
  html body #root .booking-ref-page .ref-danger-btn {
    color: #FFFFFF !important;
    background: #A63D49 !important;
    border: 1px solid #A63D49 !important;
    border-radius: 8px !important;
  }
  html body #root .booking-ref-page .ref-danger-btn:hover {
    background: #8E3440 !important;
  }

  /* Cards */
  html body #root .booking-ref-page .ref-card {
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.09);
    border-radius: 16px;
    overflow: hidden;
  }
  html body #root .booking-ref-page .ref-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 22px 24px 0;
  }
  html body #root .booking-ref-page .ref-card-head h2 {
    flex: 1;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1A1A18;
  }
  html body #root .booking-ref-page .ref-card-body {
    padding: 20px 24px 22px;
  }
  html body #root .booking-ref-page .ref-card-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(26, 26, 24, 0.08);
  }
  html body #root .booking-ref-page .ref-chip {
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 9999px;
    background: #F5F4F0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  html body #root .booking-ref-page .ref-chip svg {
    width: 14px;
    height: 14px;
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }
  html body #root .booking-ref-page .ref-subhead {
    font-size: 14px;
    font-weight: 600;
    color: #1A1A18;
  }

  /* MUI fields */
  html body #root .booking-ref-page .MuiOutlinedInput-root {
    min-height: 44px;
    border-radius: 12px !important;
    background-color: #FFFFFF !important;
    font-size: 13.5px !important;
    font-weight: 500;
    color: #1A1A18;
    transition: box-shadow 0.16s ease;
  }
  html body #root .booking-ref-page .MuiOutlinedInput-root.Mui-disabled {
    background-color: #FAF9F7 !important;
  }
  html body #root .booking-ref-page .Mui-disabled {
    -webkit-text-fill-color: #1A1A18 !important;
  }
  html body #root .booking-ref-page .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.08) !important;
    border-width: 1px !important;
    border-radius: 12px !important;
  }
  html body #root .booking-ref-page .MuiOutlinedInput-root:not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .booking-ref-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #1A1A18 !important;
    border-width: 1px !important;
  }
  html body #root .booking-ref-page .MuiOutlinedInput-root.Mui-focused {
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }
  html body #root .booking-ref-page .MuiInputBase-input::placeholder {
    color: rgba(26, 26, 24, 0.3) !important;
    opacity: 1 !important;
  }
  html body #root .booking-ref-page .MuiSelect-select em {
    font-style: normal;
    color: rgba(26, 26, 24, 0.3);
  }
  html body #root .booking-ref-page .MuiSelect-icon {
    color: rgba(26, 26, 24, 0.45) !important;
  }
  html body #root .booking-ref-page .MuiInputLabel-root {
    color: rgba(26, 26, 24, 0.68) !important;
    -webkit-text-fill-color: rgba(26, 26, 24, 0.68) !important;
    font-weight: 600 !important;
  }
  html body #root .booking-ref-page .MuiFormLabel-asterisk {
    color: #ef4444 !important;
    -webkit-text-fill-color: #ef4444 !important;
  }

  /* Add page: slot options, counters, payment method */
  html body #root .booking-ref-page .ref-option {
    border: 1px solid rgba(26, 26, 24, 0.1);
    border-radius: 12px;
    background: #FFFFFF;
    transition: border-color 0.16s, background-color 0.16s;
  }
  html body #root .booking-ref-page .ref-option:hover {
    border-color: rgba(26, 26, 24, 0.28);
  }
  html body #root .booking-ref-page .ref-option.is-selected {
    border-color: #1A1A18;
    background: #FAF9F7;
    box-shadow: inset 0 0 0 1px #1A1A18;
  }
  html body #root .booking-ref-page .ref-option.is-disabled {
    background: #FAF9F7;
    opacity: 0.5;
  }
  html body #root .booking-ref-page .ref-option input[type="checkbox"],
  html body #root .booking-ref-page input.ref-check {
    accent-color: #1A1A18;
  }
  html body #root .booking-ref-page .ref-counter {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    border: 1px solid rgba(26, 26, 24, 0.12);
    background: #FFFFFF;
    color: #1A1A18;
    font-size: 18px;
    line-height: 1;
    transition: background-color 0.16s;
  }
  html body #root .booking-ref-page .ref-counter:hover {
    background: #F5F4F0;
  }
  html body #root .booking-ref-page .ref-table {
    border: 1px solid rgba(26, 26, 24, 0.09);
    border-radius: 12px;
    overflow: hidden;
  }
  html body #root .booking-ref-page .ref-table thead {
    background: #FAF9F7 !important;
  }
  html body #root .booking-ref-page .ref-table th {
    font-size: 12px !important;
    font-weight: 600 !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
    color: rgba(26, 26, 24, 0.6) !important;
  }
  html body #root .booking-ref-page .ref-summary {
    background: #FAF9F7;
    border: 1px solid rgba(26, 26, 24, 0.08);
    border-radius: 14px;
  }
  html body #root .booking-ref-page .ref-radio {
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    border: 1.5px solid rgba(26, 26, 24, 0.3);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.16s;
  }
  html body #root .booking-ref-page .ref-radio.is-checked {
    border-color: #1A1A18;
  }
  html body #root .booking-ref-page .ref-radio.is-checked::after {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: #1A1A18;
  }
  html body #root .booking-ref-page .ref-num-input {
    height: 34px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 500;
    color: #1A1A18;
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.1);
    border-radius: 10px;
    outline: none;
  }
  html body #root .booking-ref-page .ref-num-input:focus {
    border-color: #1A1A18;
    box-shadow: 0 0 0 3px rgba(26, 26, 24, 0.1);
  }

  /* Details page tabs (shared CustomTabs) */
  html body #root .booking-ref-page .ref-tabs-card [role="tablist"] {
    display: inline-flex !important;
    flex-wrap: wrap;
    gap: 4px;
    width: auto !important;
    height: auto !important;
    margin-bottom: 16px;
    padding: 4px !important;
    background: #F5F4F0 !important;
    border-radius: 12px !important;
  }
  html body #root .booking-ref-page .ref-tabs-card [role="tab"] {
    flex: 0 0 auto !important;
    min-width: 96px;
    padding: 8px 16px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: rgba(26, 26, 24, 0.6) !important;
    background: transparent !important;
    border: none !important;
    border-radius: 9px !important;
    box-shadow: none !important;
  }
  html body #root .booking-ref-page .ref-tabs-card [role="tab"]:hover {
    color: #1A1A18 !important;
  }
  html body #root .booking-ref-page .ref-tabs-card [role="tab"][data-state="active"] {
    background: #FFFFFF !important;
    color: #1A1A18 !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 2px rgba(26, 26, 24, 0.08) !important;
  }
  html body #root .booking-ref-page .ref-tabs-card [role="tabpanel"] {
    padding: 0 !important;
    margin-top: 0 !important;
  }

  /* Details: "Label  Value" rows -> label stacked over value */
  html body #root .booking-ref-page .ref-kv div.flex.items-start.text-sm {
    flex-direction: column;
    gap: 4px;
  }
  html body #root .booking-ref-page .ref-kv div.flex.items-start.text-sm > span:first-child {
    width: auto !important;
    font-size: 11px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.48) !important;
  }
  html body #root .booking-ref-page .ref-kv div.flex.items-start.text-sm > span:last-child {
    font-size: 13.5px;
    font-weight: 500;
    color: #1A1A18 !important;
  }

  html body #root .booking-ref-page button.btn-primary svg {
    color: #FFFFFF !important;
    stroke: #FFFFFF !important;
  }
`;

export const PILL_BASE = "px-2.5 py-0.5 text-[12px] font-semibold rounded-full border-0 shadow-none";
export const PILL_SUCCESS = "bg-[rgba(121,140,94,0.18)] text-[#56683F] hover:bg-[rgba(121,140,94,0.18)]";
export const PILL_DANGER = "bg-[rgba(231,132,142,0.18)] text-[#A63D49] hover:bg-[rgba(231,132,142,0.18)]";
export const PILL_WARNING = "bg-[rgba(237,196,136,0.3)] text-[#85621F] hover:bg-[rgba(237,196,136,0.3)]";
