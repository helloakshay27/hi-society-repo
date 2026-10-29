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
  'clipboard-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  'hard-hat': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/><path d="M20 13c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3"/><path d="M10 13V6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7"/><rect x="2" y="16" width="20" height="4" rx="1"/></svg>',
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
