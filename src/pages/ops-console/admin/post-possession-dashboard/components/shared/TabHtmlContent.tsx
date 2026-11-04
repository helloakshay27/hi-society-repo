import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Chart, type ChartConfiguration } from 'chart.js/auto';
import { createRoot, type Root } from 'react-dom/client';
import {
  QuarantineCasesEnhancedTable,
  type QuarantineCaseRow,
} from './QuarantineCasesEnhancedTable';
import {
  RegisteredSlotsEnhancedTable,
  type RegisteredSlotRow,
} from './RegisteredSlotsEnhancedTable';
import {
  FacilitySlotsEnhancedTable,
  type FacilitySlotRow,
} from './FacilitySlotsEnhancedTable';
import {
  ImportantEventsEnhancedTable,
  type ImportantEventRow,
} from './ImportantEventsEnhancedTable';
import {
  BusinessDirectoryEnhancedTable,
  type BusinessDirectoryRow,
} from './BusinessDirectoryEnhancedTable';
import { applyBrandHexRemap } from '../../charts/chartPalette';
import {
  centerLabelForChart,
  doughnutRowsFromConfig,
  renderBusinessGenieDonut,
} from '../../charts/bgDonut';
import { colsSpecFromBarConfig, renderBusinessGenieCols } from '../../charts/bgCols';
import { inlineLucideIcons, normalizeInfoButtons } from '../../utils/lucideInline';
import { bindPostPossessionApiData } from '../../apiView';
import type { PostPossessionApiState, PostPossessionTab } from '../../api';

interface TabHtmlContentProps {
  html: string;
  charts?: Record<string, ChartConfiguration>;
  className?: string;
  apiTab?: PostPossessionTab;
  apiState?: PostPossessionApiState;
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

function readQuarantineCaseTable(table: HTMLTableElement): {
  rows: QuarantineCaseRow[];
  emptyMessage: string;
} {
  const sourceRows = Array.from(table.tBodies.item(0)?.rows ?? []);
  const rows = sourceRows
    .filter((row) => row.cells.length >= 7)
    .map((row, index) => {
      const values = Array.from(row.cells, (cell) => cell.textContent?.trim() ?? '');
      return {
        id: `${values[0]}-${index}`,
        resident: values[0],
        tower: values[1],
        flat: values[2],
        type: values[3],
        start: values[4],
        end: values[5],
        status: values[6],
      };
    });

  return {
    rows,
    emptyMessage:
      rows.length > 0
        ? 'No quarantine cases found.'
        : sourceRows[0]?.cells.item(0)?.textContent?.trim() || 'No quarantine cases found.',
  };
}

function readRegisteredSlotsTable(table: HTMLTableElement): {
  rows: RegisteredSlotRow[];
  emptyMessage: string;
} {
  const sourceRows = Array.from(table.tBodies.item(0)?.rows ?? []);
  const rows = sourceRows
    .filter((row) => row.cells.length >= 8)
    .map((row, index) => {
      const values = Array.from(row.cells, (cell) => cell.textContent?.trim() ?? '');
      return {
        id: `${values[0]}-${index}`,
        slot: values[0],
        tower: values[1],
        flat: values[2],
        vehicleNumber: values[3],
        vehicleType: values[4],
        parkingType: values[5],
        stickerNumber: values[6],
        status: values[7],
      };
    });

  return {
    rows,
    emptyMessage:
      rows.length > 0
        ? 'No registered slots found.'
        : sourceRows[0]?.cells.item(0)?.textContent?.trim() || 'No registered slots found.',
  };
}

function readFacilitySlotsTable(table: HTMLTableElement): {
  rows: FacilitySlotRow[];
  emptyMessage: string;
} {
  const sourceRows = Array.from(table.tBodies.item(0)?.rows ?? []);
  const rows = sourceRows
    .filter((row) => row.cells.length >= 4)
    .map((row, index) => {
      const values = Array.from(row.cells, (cell) => cell.textContent?.trim() ?? '');
      return {
        id: `${values[0]}-${index}`,
        facility: values[0],
        morning: values[1],
        evening: values[2],
        vacantToday: values[3],
      };
    });

  return {
    rows,
    emptyMessage:
      rows.length > 0
        ? 'No facility slots found.'
        : sourceRows[0]?.cells.item(0)?.textContent?.trim() || 'No facility slots found.',
  };
}

function readImportantEventsTable(table: HTMLTableElement): {
  rows: ImportantEventRow[];
  emptyMessage: string;
} {
  const sourceRows = Array.from(table.tBodies.item(0)?.rows ?? []);
  const rows = sourceRows
    .filter((row) => row.cells.length >= 3)
    .map((row, index) => {
      const values = Array.from(row.cells, (cell) => cell.textContent?.trim() ?? '');
      return {
        id: `${values[0]}-${index}`,
        time: values[0],
        event: values[1],
        domain: values[2],
      };
    });

  return {
    rows,
    emptyMessage:
      rows.length > 0
        ? 'No important events found.'
        : sourceRows[0]?.cells.item(0)?.textContent?.trim() || 'No important events found.',
  };
}

function readBusinessDirectoryTable(table: HTMLTableElement): {
  rows: BusinessDirectoryRow[];
  emptyMessage: string;
} {
  const sourceRows = Array.from(table.tBodies.item(0)?.rows ?? []);
  const rows = sourceRows
    .filter((row) => row.cells.length >= 3)
    .map((row, index) => {
      const companyCell = row.cells.item(0);
      return {
        id: `${companyCell?.textContent?.trim() ?? 'vendor'}-${index}`,
        company:
          companyCell?.querySelector<HTMLElement>('.evt-title')?.textContent?.trim() ??
          companyCell?.textContent?.trim() ??
          '',
        category: row.cells.item(1)?.textContent?.trim() ?? '',
        status: row.cells.item(2)?.textContent?.trim() ?? '',
      };
    });

  return {
    rows,
    emptyMessage:
      rows.length > 0
        ? 'No vendors found.'
        : sourceRows[0]?.cells.item(0)?.textContent?.trim() || 'No vendors found.',
  };
}

function wrapGridTables(container: HTMLElement) {
  container
    .querySelectorAll<HTMLTableElement>(
      '.g .card > .tbl, .g .card .slottbl, #evTable'
    )
    .forEach((table) => {
      const parent = table.parentElement;
      if (parent?.classList.contains('tbl-scroll')) {
        if (table.id === 'evTable') {
          parent.classList.add('important-events-scroll');
        }
        return;
      }
      const wrap = document.createElement('div');
      wrap.className =
        table.id === 'evTable'
          ? 'tbl-scroll important-events-scroll'
          : table.classList.contains('slottbl')
            ? 'tbl-scroll facility-slots-scroll'
            : 'tbl-scroll';
      table.parentNode?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
}

function dispatchDynamicRenders(container: HTMLElement, apiTab?: PostPossessionTab) {
  const slotBody = container.querySelector('#slotBody');
  if (slotBody && slotBody.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-slots', { detail: slotBody }));
  }
  const ageingBody = container.querySelector('#ageingBody');
  if (ageingBody && ageingBody.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-ageing', { detail: ageingBody }));
  }
  const ageing = container.querySelector('#ageing');
  if (ageing && ageing.children.length === 0) {
    window.dispatchEvent(new CustomEvent('pp-render-ageing', { detail: ageing }));
  }
  const notices = container.querySelector('#notices');
  if (notices && apiTab !== 'helpdesk' && !notices.getAttribute('data-pp-ready')) {
    window.dispatchEvent(new CustomEvent('pp-render-notices', { detail: notices }));
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
  apiTab,
  apiState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstancesRef = useRef<Map<string, Chart>>(new Map());
  const enhancedTableRootRef = useRef<Root | null>(null);
  const directoryTableRootRef = useRef<Root | null>(null);
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
      if (!config) return;
      placeholder.innerHTML = '';

      // Business Genie SVG donuts (center total + side legend) instead of Chart.js pie
      if (config.type === 'doughnut') {
        renderBusinessGenieDonut(
          placeholder,
          doughnutRowsFromConfig(config),
          centerLabelForChart(id)
        );
        return;
      }

      // Business Genie vertical column charts (palette by index, value labels, optional avg/ghost)
      if (config.type === 'bar') {
        const colsSpec = colsSpecFromBarConfig(id, config);
        if (colsSpec) {
          renderBusinessGenieCols(placeholder, colsSpec);
          return;
        }
      }

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

    const infoEl = target.closest('[data-info]') as HTMLElement | null;
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
    dispatchDynamicRenders(container, apiTab);
    if (apiTab) bindPostPossessionApiData(container, apiTab, apiState);
    if (
      apiTab === 'community' ||
      apiTab === 'parking' ||
      apiTab === 'club' ||
      apiTab === 'overview'
    ) {
      const tableSelector =
        apiTab === 'club'
          ? 'table.slottbl'
          : apiTab === 'overview'
            ? '#evTable'
            : 'table.tbl';
      const dataTable = container.querySelector<HTMLTableElement>(tableSelector);
      if (dataTable) {
        const mountNode = document.createElement('div');
        dataTable.replaceWith(mountNode);
        const root = createRoot(mountNode);
        enhancedTableRootRef.current = root;
        if (apiTab === 'community') {
          const { rows, emptyMessage } = readQuarantineCaseTable(dataTable);
          root.render(<QuarantineCasesEnhancedTable rows={rows} emptyMessage={emptyMessage} />);
        } else if (apiTab === 'parking') {
          const { rows, emptyMessage } = readRegisteredSlotsTable(dataTable);
          root.render(<RegisteredSlotsEnhancedTable rows={rows} emptyMessage={emptyMessage} />);
        } else if (apiTab === 'club') {
          const { rows, emptyMessage } = readFacilitySlotsTable(dataTable);
          root.render(
            <FacilitySlotsEnhancedTable
              rows={rows}
              emptyMessage={emptyMessage}
            />
          );
        } else {
          const { rows, emptyMessage } = readImportantEventsTable(dataTable);
          root.render(
            <ImportantEventsEnhancedTable rows={rows} emptyMessage={emptyMessage} />
          );
        }
      }
    }
    if (apiTab === 'community') {
      const directoryTable = container.querySelector<HTMLTableElement>('#dirTable');
      if (directoryTable) {
        const { rows, emptyMessage } = readBusinessDirectoryTable(directoryTable);
        const mountNode = document.createElement('div');
        directoryTable.replaceWith(mountNode);
        container.querySelector('#dirPgnInfo')?.closest('.pgn')?.remove();
        const root = createRoot(mountNode);
        directoryTableRootRef.current = root;
        root.render(
          <BusinessDirectoryEnhancedTable rows={rows} emptyMessage={emptyMessage} />
        );
      }
    }
    mountCharts(container);

    const showInfoPopover = (btn: HTMLElement) => {
      const key = btn.dataset.info;
      if (!key) return;
      window.dispatchEvent(
        new CustomEvent('pp-show-info', { detail: { key, el: btn, toggle: false } })
      );
    };

    // info-btn on card titles + pulse-ico tiles (Overview domain pulse cards)
    const infoButtons = container.querySelectorAll<HTMLElement>('[data-info]');
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

    return () => {
      cleanups.forEach((fn) => fn());
      enhancedTableRootRef.current?.unmount();
      enhancedTableRootRef.current = null;
      directoryTableRootRef.current?.unmount();
      directoryTableRootRef.current = null;
    };
  }, [apiState, apiTab, processedHtml, mountCharts]);

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
