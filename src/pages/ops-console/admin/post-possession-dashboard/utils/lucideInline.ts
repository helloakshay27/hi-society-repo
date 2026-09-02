/** Inline SVG replacements for lucide icons stripped from generated tab HTML */

const CHEVRON_RIGHT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

const INFO_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><line x1="12" y1="16.2" x2="12" y2="11"/><circle cx="12" cy="7.4" r="0.6" fill="currentColor" stroke="none"/></svg>';

const ICONS: Record<string, string> = {
  'chevron-right': CHEVRON_RIGHT,
  'chevron-left': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  'map-pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
};

export function inlineLucideIcons(html: string): string {
  return html.replace(/<i data-lucide="([^"]+)"([^>]*)><\/i>/g, (_, name: string, attrs: string) => {
    const svg = ICONS[name];
    if (!svg) return '';
    const styleMatch = attrs.match(/style="([^"]*)"/);
    const style = styleMatch?.[1] ?? 'width:12px;height:12px';
    return `<span class="pp-lucide" style="${style}">${svg}</span>`;
  });
}

export function normalizeInfoButtons(html: string): string {
  return html.replace(
    /<button class="info-btn"[^>]*onclick="showInfo\('([^']+)'[^"]*"[^>]*>[\s\S]*?<\/button>/g,
    (_, key: string) =>
      `<button type="button" class="info-btn" data-info="${key}" aria-label="More info">${INFO_ICON}</button>`
  );
}
