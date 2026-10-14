// Page-scoped styles shared by the Facility Setup add / edit / details pages
export const FACILITY_SETUP_STYLES = `
  html body #root .facility-setup-page {
    background-color: #FDFDFB !important;
  }
  html body #root .facility-setup-page .ref-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.55);
    transition: color 0.16s;
  }
  html body #root .facility-setup-page .ref-back:hover {
    color: #1A1A18;
  }
  html body #root .facility-setup-page .ref-edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    color: #1A1A18;
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.12);
    border-radius: 10px;
    transition: background-color 0.16s;
  }
  html body #root .facility-setup-page .ref-edit-btn:hover {
    background: #F5F4F0;
  }
  html body #root .facility-setup-page .ref-edit-btn svg {
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }

  /* Section cards */
  html body #root .facility-setup-page .ref-section {
    padding: 22px 24px !important;
    background: #FFFFFF !important;
    border: 1px solid rgba(26, 26, 24, 0.09) !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }
  html body #root .facility-setup-page .ref-section [class*="w-12"][class*="h-12"].rounded-full {
    width: 32px !important;
    height: 32px !important;
    flex: none;
    background: #F5F4F0 !important;
    color: #1A1A18 !important;
  }
  html body #root .facility-setup-page .ref-section [class*="w-12"][class*="h-12"].rounded-full svg {
    width: 14px !important;
    height: 14px !important;
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }
  html body #root .facility-setup-page .ref-section h3.uppercase {
    font-size: 14px !important;
    font-weight: 600 !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
    color: #1A1A18 !important;
  }

  /* Tables inside sections */
  html body #root .facility-setup-page .ref-section table {
    border-color: rgba(26, 26, 24, 0.09) !important;
  }
  html body #root .facility-setup-page .ref-section :is(th, td) {
    border-color: rgba(26, 26, 24, 0.08) !important;
    font-size: 13px;
    color: #1A1A18;
  }
  html body #root .facility-setup-page .ref-section thead tr,
  html body #root .facility-setup-page .ref-section th {
    background: #FAF9F7 !important;
  }
  html body #root .facility-setup-page .ref-section th {
    font-size: 12px !important;
    font-weight: 600 !important;
    color: rgba(26, 26, 24, 0.6) !important;
  }

  /* MUI outlined fields */
  html body #root .facility-setup-page .MuiOutlinedInput-root {
    min-height: 44px;
    border-radius: 12px !important;
    background-color: #FFFFFF !important;
    font-size: 13.5px !important;
    font-weight: 500;
    color: #1A1A18;
    transition: box-shadow 0.16s ease;
  }
  html body #root .facility-setup-page .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.08) !important;
    border-radius: 12px !important;
  }
  html body #root .facility-setup-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .facility-setup-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #1A1A18 !important;
    border-width: 1px !important;
  }
  html body #root .facility-setup-page .MuiOutlinedInput-root.Mui-focused {
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }
  html body #root .facility-setup-page .MuiOutlinedInput-input::placeholder {
    color: rgba(26, 26, 24, 0.3) !important;
    opacity: 1 !important;
  }
  html body #root .facility-setup-page .MuiInputLabel-root {
    color: rgba(26, 26, 24, 0.68) !important;
    font-weight: 600 !important;
    background: transparent !important;
  }

  /* Plain (shadcn) textareas, e.g. Cancellation Policy */
  html body #root .facility-setup-page textarea:not(.MuiInputBase-input) {
    font-size: 13.5px;
    color: #1A1A18;
    border: 1px solid rgba(26, 26, 24, 0.08) !important;
    border-radius: 12px !important;
    box-shadow: none !important;
  }
  html body #root .facility-setup-page textarea:not(.MuiInputBase-input):hover {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .facility-setup-page textarea:not(.MuiInputBase-input):focus {
    border-color: #1A1A18 !important;
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }

  /* Details page: "Label : Value" rows → stacked label over value */
  html body #root .facility-setup-page .ref-section div.flex.items-start:has(> span[class*="min-w-[140px]"]) {
    flex-direction: column;
    gap: 4px;
  }
  html body #root .facility-setup-page .ref-section div.flex.items-start > span[class*="min-w-[140px]"] {
    min-width: 0 !important;
    font-size: 11px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.48) !important;
  }
  html body #root .facility-setup-page .ref-section div.flex.items-start > span.mx-2 {
    display: none;
  }
  html body #root .facility-setup-page .ref-section div.flex.items-start:has(> span[class*="min-w-[140px]"]) > span:last-child {
    font-size: 13.5px;
    font-weight: 500;
    color: #1A1A18 !important;
  }

  /* Upload drop zones (cover / booking summary image) */
  html body #root .facility-setup-page .ref-upload {
    border: 1.5px dashed rgba(26, 26, 24, 0.18) !important;
    border-radius: 14px;
    background: #FAF9F7;
    cursor: pointer;
    transition: border-color 0.16s, background-color 0.16s;
  }
  html body #root .facility-setup-page .ref-upload:hover {
    border-color: rgba(26, 26, 24, 0.35) !important;
    background: #F5F4F0;
  }
  html body #root .facility-setup-page .ref-upload .ref-upload-icon svg {
    color: rgba(26, 26, 24, 0.45) !important;
    stroke: rgba(26, 26, 24, 0.45) !important;
  }

  /* Global "form svg" rule turns every icon black; keep icons on filled buttons white */
  html body #root .facility-setup-page button.btn-primary svg {
    color: #FFFFFF !important;
    stroke: #FFFFFF !important;
  }
`;
