import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ChartConfiguration } from 'chart.js';
import type { DateGrain, TabId, ToastType } from '../types';
import { useToast } from '../hooks/useToast';
import { useDrillPanel } from '../hooks/useDrillPanel';
import { getChartsForTab } from '../charts/chartConfigs';
import {
  AGEING_MATRIX,
  DIRECTORY,
  EVENTS,
  FILTER_CHIPS,
  GATE_BARS,
  PARKING_TOWER_BARS,
  SLOT_DATA,
  TOWER_TICKET_BARS,
} from '../data/mockData';
import { rgba } from '../charts/chartPalette';

interface DashboardContextValue {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  initializedTabs: Set<string>;
  markTabInitialized: (tab: TabId) => void;
  getCharts: (tabId: TabId) => Record<string, ChartConfiguration>;
  openDrill: (key: string) => void;
  closeDrill: () => void;
  drillOpen: boolean;
  drillContent: ReturnType<typeof useDrillPanel>['content'];
  toast: (message: string, type?: ToastType) => void;
  toasts: ReturnType<typeof useToast>['toasts'];
  dismissToast: (id: string) => void;
  activeChip: string | null;
  setActiveChip: (chip: string | null) => void;
  towerFilter: string;
  setTowerFilter: (tower: string) => void;
  dateGrain: DateGrain;
  setDateGrain: (grain: DateGrain) => void;
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  showInfo: (key: string, el: HTMLElement, toggle?: boolean) => void;
  hideInfo: () => void;
  infoKey: string | null;
  infoAnchor: HTMLElement | null;
  flashSectionId: string | null;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

function renderAgeingMatrix(tbody: HTMLElement, openDrill: (k: string) => void) {
  const colors = ['var(--for)', 'var(--amb)', 'var(--coral)', 'var(--crim)', 'var(--crim)'];
  const bgs = [
    'rgba(8,80,65,.06)',
    'rgba(186,117,23,.08)',
    'rgba(218,119,86,.1)',
    'rgba(163,45,45,.1)',
    'rgba(163,45,45,.14)',
  ];
  tbody.innerHTML = AGEING_MATRIX.map((r) => {
    const tot = r.cols.reduce((a, b) => a + b, 0);
    const cells = r.cols
      .map((v, i) =>
        v > 0
          ? `<td style="text-align:center;cursor:pointer;background:${bgs[i]};color:${colors[i]};font-weight:700" data-drill="tickets_open">${v}</td>`
          : `<td style="text-align:center;color:var(--sto)">—</td>`
      )
      .join('');
    return `<tr><td><span style="font-size:11px;font-weight:600;color:${r.color}">${r.pri}</span></td>${cells}<td style="text-align:center;font-weight:700;font-size:12px">${tot}</td></tr>`;
  }).join('');
  tbody.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('tickets_open'));
  });
}

function renderTowerBars(container: HTMLElement, openDrill: (k: string) => void) {
  container.innerHTML = TOWER_TICKET_BARS.map(
    (d) =>
      `<div class="trow"><div class="tn">${d.n}</div><div class="tb2" data-drill="tickets_open"><div class="tf" style="width:${d.v * 3.5}%;background:${d.c}"></div></div><div class="tv">${d.v}</div></div>`
  ).join('');
  container.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('tickets_open'));
  });
}

function renderGateBars(container: HTMLElement, openDrill: (k: string) => void) {
  container.innerHTML = GATE_BARS.map(
    (d) =>
      `<div class="trow"><div class="tn" style="width:90px;font-size:11px">${d.n}</div><div class="tb2" data-drill="vis_today"><div class="tf" style="width:${d.v}%;background:${d.c}"></div></div><div class="tv">${d.v}</div></div>`
  ).join('');
  container.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('vis_today'));
  });
}

function renderParkingBars(container: HTMLElement, openDrill: (k: string) => void) {
  container.innerHTML = PARKING_TOWER_BARS.map((r) => {
    const tot = r.v4 + r.v2;
    return `<div class="trow"><div class="tn">${r.n}</div><div class="tb2" data-drill="parking_all"><div class="tf" style="width:${(tot / 3) * 100}%;background:${r.c4}"></div></div><div class="tv">${tot}</div></div>`;
  }).join('');
  container.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('parking_all'));
  });
}

function renderSlots(tbody: HTMLElement, openDrill: (k: string) => void) {
  let totBook = 0;
  let totCap = 0;
  tbody.innerHTML = SLOT_DATA.map((d) => {
    const vac = d.mCap - d.mBook + (d.eCap - d.eBook);
    totBook += d.mBook + d.eBook;
    totCap += d.mCap + d.eCap;
    return `<tr data-drill="bookings_today"><td>${d.n}</td><td><span class="slot-book">${d.mBook}</span>/${d.mCap}</td><td><span class="slot-book">${d.eBook}</span>/${d.eCap}</td><td class="slot-vac">${vac}</td></tr>`;
  }).join('');
  const totVac = totCap - totBook;
  tbody.innerHTML += `<tr><td>Total</td><td colspan="2" style="text-align:center">${totBook}/${totCap} booked</td><td class="slot-vac">${totVac} vacant</td></tr>`;
  tbody.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('bookings_today'));
  });
}

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabId>('t-lb');
  const [initializedTabs, setInitializedTabs] = useState<Set<string>>(() => new Set(['t-lb']));
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [towerFilter, setTowerFilter] = useState('All');
  const [dateGrain, setDateGrain] = useState<DateGrain>('month');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [infoKey, setInfoKey] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<HTMLElement | null>(null);
  const [flashSectionId, setFlashSectionId] = useState<string | null>(null);

  const { toasts, toast, dismiss } = useToast();
  const { content: drillContent, isOpen: drillOpen, openDrill, closeDrill } = useDrillPanel(toast);

  const markTabInitialized = useCallback((tab: TabId) => {
    setInitializedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  const getCharts = useCallback(
    (tabId: TabId) => (initializedTabs.has(tabId) ? getChartsForTab(tabId) : {}),
    [initializedTabs]
  );

  const showInfo = useCallback((key: string, el: HTMLElement, toggle = true) => {
    if (toggle) {
      setInfoKey((prev) => {
        if (prev === key) {
          setInfoAnchor(null);
          return null;
        }
        setInfoAnchor(el);
        return key;
      });
      return;
    }
    setInfoKey(key);
    setInfoAnchor(el);
  }, []);

  const hideInfo = useCallback(() => {
    setInfoKey(null);
    setInfoAnchor(null);
  }, []);

  useEffect(() => {
    markTabInitialized(activeTab);
  }, [activeTab, markTabInitialized]);

  useEffect(() => {
    const onDrill = (e: Event) => openDrill((e as CustomEvent<string>).detail);
    const onTab = (e: Event) => setActiveTab((e as CustomEvent<TabId>).detail);
    const onInfo = (e: Event) => {
      const { key, el, toggle } = (e as CustomEvent<{ key: string; el: HTMLElement; toggle?: boolean }>)
        .detail;
      showInfo(key, el, toggle);
    };
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      toast(message, type);
    };
    const onAgeing = (e: Event) => renderAgeingMatrix((e as CustomEvent<HTMLElement>).detail, openDrill);
    const onTower = (e: Event) => renderTowerBars((e as CustomEvent<HTMLElement>).detail, openDrill);
    const onGate = (e: Event) => renderGateBars((e as CustomEvent<HTMLElement>).detail, openDrill);
    const onParking = (e: Event) => renderParkingBars((e as CustomEvent<HTMLElement>).detail, openDrill);
    const onSlots = (e: Event) => renderSlots((e as CustomEvent<HTMLElement>).detail, openDrill);
    const onEvents = (e: Event) => {
      const { tbody, container } = (e as CustomEvent<{ tbody: HTMLElement; container: HTMLElement }>).detail;
      renderEventsPage(1, 5, tbody, container, openDrill);
    };
    const onDirectory = (e: Event) => {
      const { tbody, container } = (e as CustomEvent<{ tbody: HTMLElement; container: HTMLElement }>).detail;
      renderDirectoryPage(1, 4, tbody, container, openDrill);
    };

    window.addEventListener('pp-open-drill', onDrill);
    window.addEventListener('pp-goto-tab', onTab);
    window.addEventListener('pp-show-info', onInfo);
    window.addEventListener('pp-toast', onToast);
    window.addEventListener('pp-render-ageing', onAgeing);
    window.addEventListener('pp-render-tower-bars', onTower);
    window.addEventListener('pp-render-gate-bars', onGate);
    window.addEventListener('pp-render-parking-bars', onParking);
    window.addEventListener('pp-render-slots', onSlots);
    window.addEventListener('pp-render-events', onEvents);
    window.addEventListener('pp-render-directory', onDirectory);

    return () => {
      window.removeEventListener('pp-open-drill', onDrill);
      window.removeEventListener('pp-goto-tab', onTab);
      window.removeEventListener('pp-show-info', onInfo);
      window.removeEventListener('pp-toast', onToast);
      window.removeEventListener('pp-render-ageing', onAgeing);
      window.removeEventListener('pp-render-tower-bars', onTower);
      window.removeEventListener('pp-render-gate-bars', onGate);
      window.removeEventListener('pp-render-parking-bars', onParking);
      window.removeEventListener('pp-render-slots', onSlots);
      window.removeEventListener('pp-render-events', onEvents);
      window.removeEventListener('pp-render-directory', onDirectory);
    };
  }, [openDrill, showInfo, toast]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      initializedTabs,
      markTabInitialized,
      getCharts,
      openDrill,
      closeDrill,
      drillOpen,
      drillContent,
      toast,
      toasts,
      dismissToast: dismiss,
      activeChip,
      setActiveChip,
      towerFilter,
      setTowerFilter,
      dateGrain,
      setDateGrain,
      copilotOpen,
      setCopilotOpen,
      showInfo,
      hideInfo,
      infoKey,
      infoAnchor,
      flashSectionId,
    }),
    [
      activeTab,
      initializedTabs,
      markTabInitialized,
      getCharts,
      openDrill,
      closeDrill,
      drillOpen,
      drillContent,
      toast,
      toasts,
      dismiss,
      activeChip,
      towerFilter,
      dateGrain,
      copilotOpen,
      showInfo,
      hideInfo,
      infoKey,
      infoAnchor,
      flashSectionId,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

// Events & directory pagination helpers exported for overlay components
export function renderEventsPage(page: number, perPage: number, tbody: HTMLElement, container: HTMLElement, openDrill: (k: string) => void) {
  const total = EVENTS.length;
  const pages = Math.ceil(total / perPage);
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  const slice = EVENTS.slice(start, start + perPage);
  tbody.innerHTML = slice
    .map(
      (e) =>
        `<tr data-drill="${e.drill}"><td style="color:var(--sto);font-weight:600">${e.t}</td><td><div class="evt-title">${e.title}</div><div class="evt-sub">${e.sub}</div></td><td><span class="b" style="background:${rgba(e.color, 0.12)};color:${e.color}">${e.domain}</span></td></tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill((el as HTMLElement).dataset.drill!));
  });
  const info = container.querySelector('#evPgnInfo');
  if (info) info.textContent = `Showing ${start + 1}–${Math.min(start + perPage, total)} of ${total}`;
  const btns = container.querySelector('#evPgnBtns');
  if (btns) {
    let html = `<button class="pgn-b" ${safePage === 1 ? 'disabled' : ''} data-ev-page="${safePage - 1}">‹</button>`;
    for (let p = 1; p <= pages; p++) {
      html += `<button class="pgn-b ${p === safePage ? 'cur' : ''}" data-ev-page="${p}">${p}</button>`;
    }
    html += `<button class="pgn-b" ${safePage === pages ? 'disabled' : ''} data-ev-page="${safePage + 1}">›</button>`;
    btns.innerHTML = html;
    btns.querySelectorAll('[data-ev-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = Number((btn as HTMLElement).dataset.evPage);
        if (!Number.isNaN(p)) renderEventsPage(p, perPage, tbody, container, openDrill);
      });
    });
  }
}

export function renderDirectoryPage(page: number, perPage: number, tbody: HTMLElement, container: HTMLElement, openDrill: (k: string) => void) {
  const total = DIRECTORY.length;
  const pages = Math.ceil(total / perPage);
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * perPage;
  const slice = DIRECTORY.slice(start, start + perPage);
  tbody.innerHTML = slice
    .map(
      (v) =>
        `<tr data-drill="directory_all"><td><div class="evt-title">${v.company}</div><div class="evt-sub">${v.cat}</div></td><td>${v.cat.split(' · ')[0]}</td><td><span class="b ${v.status === 'Active' ? 'bok' : 'ber'}">${v.status}</span></td></tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('directory_all'));
  });
  const info = container.querySelector('#dirPgnInfo');
  if (info) info.textContent = `Showing ${start + 1}–${Math.min(start + perPage, total)} of ${total}`;
  const btns = container.querySelector('#dirPgnBtns');
  if (btns) {
    let html = `<button class="pgn-b" ${safePage === 1 ? 'disabled' : ''} data-dir-page="${safePage - 1}">‹</button>`;
    for (let p = 1; p <= pages; p++) {
      html += `<button class="pgn-b ${p === safePage ? 'cur' : ''}" data-dir-page="${p}">${p}</button>`;
    }
    html += `<button class="pgn-b" ${safePage === pages ? 'disabled' : ''} data-dir-page="${safePage + 1}">›</button>`;
    btns.innerHTML = html;
    btns.querySelectorAll('[data-dir-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = Number((btn as HTMLElement).dataset.dirPage);
        if (!Number.isNaN(p)) renderDirectoryPage(p, perPage, tbody, container, openDrill);
      });
    });
  }
}

export { FILTER_CHIPS };
