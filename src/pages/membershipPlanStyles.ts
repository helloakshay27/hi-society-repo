// Page-scoped styles shared by the Membership Plan add / edit pages
export const MEMBERSHIP_PLAN_STYLES = `
  html body #root .membership-plan-page {
    background-color: #FDFDFB !important;
  }

  /* Section cards */
  html body #root .membership-plan-page .ref-card {
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.09);
    border-radius: 16px;
    overflow: hidden;
  }
  html body #root .membership-plan-page .ref-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 22px 24px 0;
  }
  html body #root .membership-plan-page .ref-card-head h2 {
    flex: 1;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1A1A18;
  }
  html body #root .membership-plan-page .ref-chip {
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 9999px;
    background: #F5F4F0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  html body #root .membership-plan-page .ref-chip svg {
    width: 14px;
    height: 14px;
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }
  html body #root .membership-plan-page .ref-card-body {
    padding: 20px 24px 22px;
  }
  html body #root .membership-plan-page .ref-count {
    padding: 3px 10px;
    border-radius: 9999px;
    background: #F5F4F0;
    font-size: 12px;
    font-weight: 600;
    color: #1A1A18;
  }

  /* MUI outlined fields */
  html body #root .membership-plan-page .MuiOutlinedInput-root {
    height: 44px !important;
    border-radius: 12px !important;
    background-color: #FFFFFF !important;
    font-size: 13.5px !important;
    font-weight: 500;
    color: #1A1A18;
    transition: box-shadow 0.16s ease;
  }
  html body #root .membership-plan-page .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.08) !important;
    border-radius: 12px !important;
  }
  html body #root .membership-plan-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .membership-plan-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #1A1A18 !important;
    border-width: 1px !important;
  }
  html body #root .membership-plan-page .MuiOutlinedInput-root.Mui-focused {
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }
  html body #root .membership-plan-page .MuiOutlinedInput-input::placeholder {
    color: rgba(26, 26, 24, 0.3) !important;
    opacity: 1 !important;
  }
  html body #root .membership-plan-page .MuiInputLabel-root {
    font-size: 14px !important;
    color: rgba(26, 26, 24, 0.68) !important;
    -webkit-text-fill-color: rgba(26, 26, 24, 0.68) !important;
    font-weight: 600 !important;
    background: transparent !important;
  }
  html body #root .membership-plan-page .MuiFormLabel-asterisk {
    color: #ef4444 !important;
    -webkit-text-fill-color: #ef4444 !important;
  }

  /* Amenities table */
  html body #root .membership-plan-page .ref-card table {
    border-color: rgba(26, 26, 24, 0.09) !important;
  }
  html body #root .membership-plan-page .ref-card :is(th, td) {
    border-color: rgba(26, 26, 24, 0.08) !important;
    font-size: 13px;
    color: #1A1A18;
  }
  html body #root .membership-plan-page .ref-card thead tr,
  html body #root .membership-plan-page .ref-card th {
    background: #FAF9F7 !important;
  }
  html body #root .membership-plan-page .ref-card th {
    font-size: 12px !important;
    font-weight: 600 !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
    color: rgba(26, 26, 24, 0.6) !important;
  }
  html body #root .membership-plan-page .ref-cell-field {
    height: 34px;
    padding: 0 10px;
    font-size: 13px;
    font-weight: 500;
    color: #1A1A18;
    background-color: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.1);
    border-radius: 10px;
    outline: none;
    transition: border-color 0.16s, box-shadow 0.16s;
  }
  html body #root .membership-plan-page .ref-cell-field:hover:not(:disabled) {
    border-color: rgba(26, 26, 24, 0.28);
  }
  html body #root .membership-plan-page .ref-cell-field:focus {
    border-color: #1A1A18;
    box-shadow: 0 0 0 3px rgba(26, 26, 24, 0.1);
  }
  html body #root .membership-plan-page .ref-cell-field:disabled {
    background-color: #FAF9F7;
    cursor: not-allowed;
  }
  html body #root .membership-plan-page .ref-cell-field::placeholder {
    color: rgba(26, 26, 24, 0.3);
  }
  html body #root .membership-plan-page .ref-check {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #1A1A18;
  }

  html body #root .membership-plan-page button.btn-primary svg {
    color: #FFFFFF !important;
    stroke: #FFFFFF !important;
  }
`;
