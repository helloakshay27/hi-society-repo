// Page-scoped styles shared by the BMS Offers add / edit / view pages
export const OFFER_PAGE_STYLES = `
  html body #root .offer-ref-page {
    background-color: #FDFDFB !important;
  }
  html body #root .offer-ref-page .ref-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    font-size: 13px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.55);
    transition: color 0.16s;
  }
  html body #root .offer-ref-page .ref-back:hover {
    color: #1A1A18;
  }
  html body #root .offer-ref-page .ref-card {
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.09) !important;
    border-radius: 16px !important;
    box-shadow: none !important;
    overflow: hidden;
  }
  html body #root .offer-ref-page .ref-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 22px 24px 0;
  }
  html body #root .offer-ref-page .ref-card-head h2 {
    margin: 0;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #1A1A18 !important;
  }
  html body #root .offer-ref-page .ref-chip {
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 9999px;
    background: #F5F4F0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  html body #root .offer-ref-page .ref-chip svg {
    width: 14px;
    height: 14px;
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }
  html body #root .offer-ref-page .ref-card-body {
    padding: 20px 24px 22px;
  }
  html body #root .offer-ref-page .ref-label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(26, 26, 24, 0.68);
  }

  /* MUI outlined fields */
  html body #root .offer-ref-page .MuiOutlinedInput-root {
    min-height: 44px;
    border-radius: 12px !important;
    background-color: #FFFFFF !important;
    font-size: 13.5px !important;
    font-weight: 500;
    color: #1A1A18;
    transition: box-shadow 0.16s ease;
  }
  html body #root .offer-ref-page .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.08) !important;
    border-radius: 12px !important;
  }
  html body #root .offer-ref-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .offer-ref-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #1A1A18 !important;
    border-width: 1px !important;
  }
  html body #root .offer-ref-page .MuiOutlinedInput-root.Mui-focused {
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }
  html body #root .offer-ref-page .MuiOutlinedInput-input::placeholder {
    color: rgba(26, 26, 24, 0.3) !important;
    opacity: 1 !important;
  }
  html body #root .offer-ref-page .MuiInputLabel-root {
    color: rgba(26, 26, 24, 0.68) !important;
    font-weight: 600 !important;
  }
  html body #root .offer-ref-page .ref-textarea {
    display: block;
    width: 100%;
    min-height: 120px;
    padding: 12px 14px !important;
    font-size: 13.5px !important;
    font-weight: 500;
    line-height: 1.5;
    color: #1A1A18;
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.08) !important;
    border-radius: 12px !important;
    box-shadow: none;
    outline: none;
    resize: vertical;
    transition: border-color 0.16s, box-shadow 0.16s;
  }
  html body #root .offer-ref-page .ref-textarea:hover {
    border-color: rgba(26, 26, 24, 0.28) !important;
  }
  html body #root .offer-ref-page .ref-textarea:focus {
    border-color: #1A1A18 !important;
    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
  }
  html body #root .offer-ref-page .ref-textarea::placeholder {
    color: rgba(26, 26, 24, 0.3);
  }

  /* Image drop zone */
  html body #root .offer-ref-page .ref-dropzone {
    min-height: 160px;
    padding: 28px 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    background: #FAF9F7;
    border: 1.5px dashed rgba(26, 26, 24, 0.16);
    border-radius: 12px;
    transition: border-color 0.16s, background-color 0.16s;
  }
  html body #root .offer-ref-page .ref-dropzone:hover,
  html body #root .offer-ref-page .ref-dropzone.is-over {
    background: #F5F4F0;
    border-color: rgba(26, 26, 24, 0.4);
  }
  html body #root .offer-ref-page .ref-dropzone-icon {
    width: 48px;
    height: 48px;
    border-radius: 9999px;
    background: #FFFFFF;
    border: 1px solid rgba(26, 26, 24, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  html body #root .offer-ref-page .ref-dropzone-icon svg {
    color: #1A1A18 !important;
    stroke: #1A1A18 !important;
  }

  /* Global "form svg" rule turns every icon black; keep icons on filled buttons white */
  html body #root .offer-ref-page :is(button.btn-primary, .ref-remove) svg {
    color: #FFFFFF !important;
    stroke: #FFFFFF !important;
  }
  html body #root .offer-ref-page .ref-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    background: #1A1A18;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* View page */
  html body #root .offer-ref-page .ref-kv-label {
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(26, 26, 24, 0.48);
  }
  html body #root .offer-ref-page .ref-kv-value {
    font-size: 13.5px;
    font-weight: 500;
    color: #1A1A18;
    word-break: break-word;
  }
  html body #root .offer-ref-page .ref-link {
    color: #1A1A18;
    text-decoration: underline;
    text-underline-offset: 2px;
    word-break: break-all;
  }
  html body #root .offer-ref-page .ref-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
  }
  html body #root .offer-ref-page .ref-pill-success {
    background: rgba(121, 140, 94, 0.18);
    color: #56683F;
  }
  html body #root .offer-ref-page .ref-pill-danger {
    background: rgba(231, 132, 142, 0.18);
    color: #A63D49;
  }
  html body #root .offer-ref-page .ref-pill-warning {
    background: rgba(237, 196, 136, 0.3);
    color: #85621F;
  }
  html body #root .offer-ref-page .ref-pill-neutral {
    background: #F5F4F0;
    color: #1A1A18;
  }
  html body #root .offer-ref-page .ref-edit-btn {
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
  html body #root .offer-ref-page .ref-edit-btn:hover {
    background: #F5F4F0;
  }
`;
