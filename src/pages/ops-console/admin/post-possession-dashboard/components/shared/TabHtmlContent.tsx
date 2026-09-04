import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Chart, type ChartConfiguration } from 'chart.js/auto';
import { applyBrandHexRemap } from '../../charts/chartPalette';
import { inlineLucideIcons, normalizeInfoButtons } from '../../utils/lucideInline';

interface TabHtmlContentProps {
  html: string;
  charts?: Record<string, ChartConfiguration>;
  className?: string;
}

const CANVAS_RE = /<div class="chx"([^>]*)>\s*<canvas id="([^"]+)"><\/canvas>\s*<\/div>/g;

function preprocessHtml(html: string): string {
  const normalized = normalizeInfoButtons(applyBrandHexRemap(html));
  return inlineLucideIcons(
    normalized
      .replace(/onclick="openD\('([^']+)'\)"/g, 'data-drill="$1" role="button" tabindex="0"')
      .replace(/onclick="swTabById\('([^']+)'\)"/g, 'data-goto-tab="$1" role="button" tabindex="0"')
      .replace(/onclick="showInfo\('([^']+)'[^"]*"/g, 'type="button" data-info="$1"')
      .replace(/onclick="toast\('([^']*)','([^']*)'\)"/g, 'data-toast="$1" data-toast-type="$2"')
      .replace(/onclick="event\.stopPropagation\(\);openD\('([^']+)'\)"/g, 'data-drill="$1"')
      .replace(/<button class="rk-a"([^>]*)>/g, '<button type="button" class="rk-a"$1>')
  );
}

/** Keep card/grid DOM intact — replace canvas with mount points for Chart.js */
function injectChartPlaceholders(html: string): string {
  return html.replace(CANVAS_RE, (_match, attrs: string, id: string) => {
    const styleMatch = attrs.match(/style="([^"]*)"/);
    const height = styleMatch?.[1].match(/height:\s*([^;]+)/)?.[1]?.trim() ?? '190px';
    return `<div class="chx" data-pp-chart="${id}" style="height:${height}"></div>`;
  });
}

function wrapGridTables(container: HTMLElement) {
  container.querySelectorAll<HTMLTableElement>('.g .card > .tbl').forEach((table) => {
    if (table.parentElement?.classList.contains('tbl-scroll')) return;
    const wrap = document.createElement('div');
    wrap.className = 'tbl-scroll';
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

function dispatchDynamicRenders(container: HTMLElement) {
  const slotBody = container.querySelector('#slotBody');
  if (slotBody && slotBody.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-slots', { detail: slotBody }));
  }
  const ageingBody = container.querySelector('#ageingBody');
  if (ageingBody && ageingBody.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-ageing', { detail: ageingBody }));
  }
  const towerTicketBars = container.querySelector('#towerTicketBars');
  if (towerTicketBars && towerTicketBars.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-tower-bars', { detail: towerTicketBars }));
  }
  const gateBars = container.querySelector('#gateBars');
  if (gateBars && gateBars.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-gate-bars', { detail: gateBars }));
  }
  const parkingTowerBars = container.querySelector('#parkingTowerBars');
  if (parkingTowerBars && parkingTowerBars.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-parking-bars', { detail: parkingTowerBars }));
  }
  const evTableBody = container.querySelector('#evTableBody');
  if (evTableBody && evTableBody.children.length === 0) {
    window.dispatchEvent(
      new CustomEvent('pp-render-events', { detail: { tbody: evTableBody, container } })
    );
  }
  const dirTableBody = container.querySelector('#dirTableBody');
  if (dirTableBody && dirTableBody.children.length === 0) {
    window.dispatchEvent(
      new CustomEvent('pp-render-directory', { detail: { tbody: dirTableBody, container } })
    );
  }
}

export const TabHtmlContent: React.FC<TabHtmlContentProps> = ({
  html,
  charts = {},
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstancesRef = useRef<Map<string, Chart>>(new Map());
  const chartsRef = useRef(charts);
  chartsRef.current = charts;
  const processedHtml = useMemo(
    () => injectChartPlaceholders(preprocessHtml(html)),
    [html]
  );

  const mountCharts = useCallback((container: HTMLElement) => {
    const chartConfigs = chartsRef.current;
    chartInstancesRef.current.forEach((chart) => chart.destroy());
    chartInstancesRef.current.clear();

    container.querySelectorAll<HTMLElement>('[data-pp-chart]').forEach((placeholder) => {
      const id = placeholder.getAttribute('data-pp-chart');
      if (!id) return;

      const config = chartConfigs[id];
      placeholder.innerHTML = '';

      if (!config) return;

      const canvas = document.createElement('canvas');
      canvas.id = id;
      placeholder.appendChild(canvas);

      const chart = new Chart(canvas, {
        ...config,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...config.options,
        },
      });
      chartInstancesRef.current.set(id, chart);
    });

    requestAnimationFrame(() => {
      chartInstancesRef.current.forEach((chart) => {
        try {
          chart.resize();
        } catch {
          /* chart may be torn down */
        }
      });
    });
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    const infoEl = target.closest('.info-btn[data-info]') as HTMLElement | null;
    if (infoEl?.dataset.info) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    const drillEl = target.closest('[data-drill]') as HTMLElement | null;
    if (drillEl?.dataset.drill) {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('pp-open-drill', { detail: drillEl.dataset.drill }));
      return;
    }
    const tabEl = target.closest('[data-goto-tab]') as HTMLElement | null;
    if (tabEl?.dataset.gotoTab) {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('pp-goto-tab', { detail: tabEl.dataset.gotoTab }));
      return;
    }
    const toastEl = target.closest('[data-toast]') as HTMLElement | null;
    if (toastEl?.dataset.toast) {
      e.stopPropagation();
      window.dispatchEvent(
        new CustomEvent('pp-toast', {
          detail: { message: toastEl.dataset.toast, type: toastEl.dataset.toastType || 'd' },
        })
      );
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = processedHtml;
    wrapGridTables(container);
    dispatchDynamicRenders(container);
    mountCharts(container);

    const showInfoPopover = (btn: HTMLElement) => {
      const key = btn.dataset.info;
      if (!key) return;
      window.dispatchEvent(
        new CustomEvent('pp-show-info', { detail: { key, el: btn, toggle: false } })
      );
    };

    const infoButtons = container.querySelectorAll<HTMLElement>('.info-btn[data-info]');
    const cleanups: Array<() => void> = [];

    infoButtons.forEach((btn) => {
      const onEnter = () => showInfoPopover(btn);
      const onLeave = () => window.dispatchEvent(new CustomEvent('pp-hide-info'));
      btn.addEventListener('mouseenter', onEnter);
      btn.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        btn.removeEventListener('mouseenter', onEnter);
        btn.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [processedHtml, mountCharts]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container?.querySelector('[data-pp-chart]')) return;
    mountCharts(container);
  }, [charts, mountCharts]);

  useEffect(() => {
    const onResize = () => {
      chartInstancesRef.current.forEach((chart) => {
        try {
          chart.resize();
        } catch {
          /* chart may be torn down */
        }
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chartInstancesRef.current.forEach((chart) => chart.destroy());
      chartInstancesRef.current.clear();
    };
  }, []);

  return <div ref={containerRef} className={className ?? 'pp-tab-content'} onClick={handleClick} />;
};
