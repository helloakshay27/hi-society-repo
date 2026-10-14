// Page-scoped styles shared by the Club Members add / edit / details pages
export const CLUB_MEMBER_STYLES = `
  html body #root .club-member-page {
    background-color: #FDFDFB !important;
  }

  /* Header */
  html body #root .club-member-page .ref-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.55);
    transition: color 0.16s;
  }
  html body #root .club-member-page .ref-back:hover {
    color: #1A1A18;
  }
  html body #root .club-member-page .ref-edit-btn {
    display: inline-flex;
    align-items: center;
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
  html body #root .club-member-page .ref-edit-btn:hover {
    background: #F5F4F0 !important;
  }
  html body #root .club-member-page .ref-edit-btn svg {
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }

  /* Section cards */
  html body #root .club-member-page .ref-section {
    background: #FFFFFF !important;
    border: 1px solid rgba(26, 26, 24, 0.09) !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }
  html body #root .club-member-page .ref-section > .ref-section-body {
    padding: 22px 24px !important;
  }
  html body #root .club-member-page .ref-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  html body #root .club-member-page .ref-head h2 {
    flex: 1;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #1A1A18;
  }
  html body #root .club-member-page .ref-chip {
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 9999px;
    background: #F5F4F0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  html body #root .club-member-page .ref-chip svg {
    width: 14px;
    height: 14px;
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }
  html body #root .club-member-page .ref-remove-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    font-size: 12.5px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.7);
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.1);
    border-radius: 8px;
    transition: background-color 0.16s, color 0.16s;
  }
  html body #root .club-member-page .ref-remove-btn:hover {
    background: rgba(231, 132, 142, 0.12);
    color: #A63D49;
  }
  html body #root .club-member-page .ref-remove-btn svg {
    width: 14px;
    height: 14px;
    color: inherit !important;
    stroke: currentColor !important;
  }

  /* MUI fields */
  html body #root .club-member-page .MuiOutlinedInput-root {
    min-height: 44px;
    border-radius: 12px !important;
    background-color: #FFFFFF !important;
    font-size: 13.5px !important;
    font-weight: 500;
    color: #1A1A18;
    transition: box-shadow 0.16s ease;
  }
  html body #root .club-member-page .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.08) !important;
    border-radius: 12px !important;
  }
  html body #root .club-member-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .club-member-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #1A1A18 !important;
    border-width: 1px !important;
  }
  html body #root .club-member-page .MuiOutlinedInput-root.Mui-focused {
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }
  html body #root .club-member-page .MuiInputBase-input::placeholder {
    color: rgba(26, 26, 24, 0.3) !important;
    opacity: 1 !important;
  }
  html body #root .club-member-page .MuiInputLabel-root {
    color: rgba(26, 26, 24, 0.68) !important;
    font-weight: 600 !important;
  }
  html body #root .club-member-page .MuiFormLabel-asterisk {
    color: #ef4444 !important;
  }
  html body #root .club-member-page .MuiFormHelperText-root {
    font-size: 11.5px;
    color: rgba(26, 26, 24, 0.5) !important;
  }
  html body #root .club-member-page .MuiRadio-root {
    color: rgba(26, 26, 24, 0.35) !important;
  }
  html body #root .club-member-page .MuiRadio-root.Mui-checked {
    color: #1A1A18 !important;
  }
  html body #root .club-member-page .MuiFormControlLabel-label {
    font-size: 13.5px;
    font-weight: 500;
    color: #1A1A18;
  }
  html body #root .club-member-page button[role="checkbox"] {
    border-color: rgba(26, 26, 24, 0.3) !important;
    border-radius: 5px;
  }
  html body #root .club-member-page button[role="checkbox"][data-state="checked"] {
    background: #1A1A18 !important;
    border-color: #1A1A18 !important;
  }
  html body #root .club-member-page button[role="checkbox"][data-state="checked"] svg {
    color: #FFFFFF !important;
    stroke: #FFFFFF !important;
  }

  /* Upload drop zones */
  html body #root .club-member-page .ref-dropzone {
    border: 1.5px dashed rgba(26, 26, 24, 0.18);
    border-radius: 14px;
    background: #FAF9F7;
    transition: border-color 0.16s, background-color 0.16s;
  }
  html body #root .club-member-page .ref-dropzone:hover {
    border-color: rgba(26, 26, 24, 0.35);
    background: #F5F4F0;
  }
  html body #root .club-member-page .ref-dropzone svg {
    color: rgba(26, 26, 24, 0.45) !important;
    stroke: rgba(26, 26, 24, 0.45) !important;
  }

  /* Tabs (details page) */
  html body #root .club-member-page .ref-tabs-card {
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.09);
    border-radius: 16px;
  }
  html body #root .club-member-page .ref-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    height: auto !important;
    width: auto !important;
    margin: 16px 16px 0;
    padding: 4px !important;
    background: #F5F4F0 !important;
    border-radius: 12px !important;
  }
  html body #root .club-member-page .ref-tabs.ref-tabs-sub {
    margin: 0 0 24px;
  }
  html body #root .club-member-page .ref-tabs-card > div > [role="tabpanel"] {
    padding: 24px 24px 28px !important;
  }
  html body #root .club-member-page .ref-tabs-card [role="tabpanel"] [role="tabpanel"] {
    padding: 0 !important;
  }

  /* Status pills */
  html body #root .club-member-page .ref-pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border: none !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    box-shadow: none !important;
  }
  html body #root .club-member-page .ref-pill.is-success {
    background: rgba(121, 140, 94, 0.18) !important;
    color: #56683F !important;
  }
  html body #root .club-member-page .ref-pill.is-warning {
    background: rgba(237, 196, 136, 0.3) !important;
    color: #85621F !important;
  }
  html body #root .club-member-page .ref-pill.is-neutral {
    background: #F5F4F0 !important;
    color: rgba(26, 26, 24, 0.7) !important;
  }
  html body #root .club-member-page .ref-tab {
    flex: 1 1 auto;
    min-width: 0;
    padding: 8px 12px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: rgba(26, 26, 24, 0.6) !important;
    background: transparent !important;
    border: none !important;
    border-radius: 9px !important;
    box-shadow: none !important;
    transition: background-color 0.16s, color 0.16s;
  }
  html body #root .club-member-page .ref-tab:hover {
    color: #1A1A18 !important;
  }
  html body #root .club-member-page .ref-tab[data-state="active"] {
    background: #FFFFFF !important;
    color: #1A1A18 !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 2px rgba(26, 26, 24, 0.08) !important;
  }

  /* Details: "Label : Value" rows -> label stacked over value */
  html body #root .club-member-page .ref-tabs-card div.flex.items-start:has(> span[class*="min-w-[140px]"]) {
    flex-direction: column;
    gap: 4px;
  }
  html body #root .club-member-page .ref-tabs-card div.flex.items-start > span[class*="min-w-[140px]"] {
    min-width: 0 !important;
    font-size: 11px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.48) !important;
  }
  html body #root .club-member-page .ref-tabs-card div.flex.items-start > span.mx-2 {
    display: none;
  }
  html body #root .club-member-page .ref-tabs-card div.flex.items-start:has(> span[class*="min-w-[140px]"]) > span:last-child {
    font-size: 13.5px;
    font-weight: 500;
    color: #1A1A18 !important;
  }
  html body #root .club-member-page .ref-tabs-card table th {
    background: #FAF9F7;
    font-size: 12px;
    font-weight: 600;
    color: rgba(26, 26, 24, 0.6) !important;
  }

  /* Global "form svg" rule turns every icon black; keep icons on filled buttons white */
  html body #root .club-member-page button.btn-primary svg {
    color: #FFFFFF !important;
    stroke: #FFFFFF !important;
  }
`;
