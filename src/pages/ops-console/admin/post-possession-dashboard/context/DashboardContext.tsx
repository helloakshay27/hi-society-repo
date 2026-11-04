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
import {
  createEndpointErrors,
  fetchPostPossessionFilters,
  fetchPostPossessionTab,
  getSocietyOptions,
  getSelectedSocietyId,
  POST_POSSESSION_TAB_BY_DASHBOARD_TAB,
  type EndpointResult,
  type PostPossessionApiState,
  type PostPossessionRequestFilters,
  type PostPossessionTab,
  type SocietyOption,
} from '../api';

const IMPORTANT_EVENTS_PER_PAGE = 20;
const TAB_BADGE_SOURCES: Array<{ tab: PostPossessionTab; endpoint: string }> = [
  { tab: 'allTowers', endpoint: 'summary' },
  { tab: 'helpdesk', endpoint: 'kpis' },
  { tab: 'security', endpoint: 'kpis' },
  { tab: 'staff', endpoint: 'kpis' },
  { tab: 'club', endpoint: 'kpis' },
  { tab: 'fitout', endpoint: 'kpis' },
  { tab: 'parking', endpoint: 'kpis' },
];

export interface ApiDateRange {
  from: string;
  to: string;
}

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
  societyId: string | null;
  societies: SocietyOption[];
  selectSociety: (societyId: string) => void;
  postPossessionApi: Partial<Record<PostPossessionTab, PostPossessionApiState>>;
  tabBadgeApi: Partial<Record<PostPossessionTab, EndpointResult>>;
  apiDateRange: ApiDateRange | null;
  setApiDateRange: (range: ApiDateRange) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}


const HELPDESK_NOTICES = [
  {
    pill: 'p-bad',
    label: 'Critical risk',
    key: '#E5484D',
    title: 'Response escalation breached on 42 of 59 tickets (71%)',
    body: 'Tickets are created but not acknowledged within target — likely understaffing or assignment gaps.',
    cta: 'Review unassigned tickets',
    drill: 'resp_breach',
  },
  {
    pill: 'p-warn',
    label: 'High risk',
    key: '#F2A312',
    title: 'Resolution escalation breached on 38 tickets (64%)',
    body: 'Acknowledged but not resolved in time. If most are Housekeeping + Electrical, vendor capacity is the bottleneck.',
    cta: 'Review ageing tickets',
    drill: 'tickets_open',
  },
  {
    pill: 'p-white',
    label: 'Watchlist',
    key: '#5A4BE0',
    title: 'Proactive ratio at 59% — below the 70% target',
    body: 'Team-raised tickets need to stay above 70% to signal a proactive maintenance culture.',
    cta: 'View proactive breakdown',
    drill: 'tickets_open',
  },
];

function mountNoticeStack(root: HTMLElement, openDrill: (k: string) => void) {
  let ni = 0;
  const q = (k: string) => root.querySelector(`[data-n="${k}"]`) as HTMLElement | null;
  const render = () => {
    const n = HELPDESK_NOTICES[ni];
    const pill = q('pill');
    const count = q('count');
    const title = q('title');
    const body = q('body');
    const cta = q('cta');
    if (!pill || !count || !title || !body || !cta) return;
    pill.className = `pill ${n.pill}`;
    pill.textContent = n.label;
    count.textContent = `${ni + 1} of ${HELPDESK_NOTICES.length}`;
    count.style.background = n.key;
    title.textContent = n.title;
    body.textContent = n.body;
    cta.textContent = n.cta;
    const go = root.querySelector('.go') as HTMLElement | null;
    if (go) go.setAttribute('data-drill', n.drill);
  };
  q('next')?.addEventListener('click', () => {
    ni = (ni + 1) % HELPDESK_NOTICES.length;
    render();
  });
  q('prev')?.addEventListener('click', () => {
    ni = (ni + HELPDESK_NOTICES.length - 1) % HELPDESK_NOTICES.length;
    render();
  });
  root.querySelector('.go')?.addEventListener('click', () => {
    const drill = (root.querySelector('.go') as HTMLElement)?.getAttribute('data-drill');
    if (drill) openDrill(drill);
  });
  root.setAttribute('data-pp-ready', '1');
  render();
}

function renderAgeingMatrix(host: HTMLElement, openDrill: (k: string) => void) {
  // Business Genie: ink tint deepening with age × volume (veda-gardens-vertical-bars.html)
  const rowsHtml = AGEING_MATRIX.map((r) => {
    const tot = r.cols.reduce((a, b) => a + b, 0);
    const cells = r.cols
      .map((n, i) => {
        if (!n) return `<span class="cell z">—</span>`;
        const bg =
          i === 0 ? '#FFFFFF' : `rgba(26,26,24,${(0.03 + i * 0.02 + n * 0.008).toFixed(3)})`;
        return `<span class="cell" style="background:${bg}" data-drill="tickets_open">${n}</span>`;
      })
      .join('');
    return `<div class="grid-row"><span>${r.pri}</span>${cells}<span class="tot">${tot}</span></div>`;
  }).join('');

  // Support both legacy <tbody> and BG .age grid host
  if (host.tagName === 'TBODY') {
    const table = host.closest('table');
    const wrap = table?.parentElement;
    if (wrap && table) {
      const age = document.createElement('div');
      age.className = 'tbox num';
      age.id = 'ageing';
      age.innerHTML =
        `<div class="grid-head"><span>Priority</span><span>0–3 days</span><span>4–7 days</span><span>8–14 days</span><span>15–30 days</span><span>30+ days</span><span>Total</span></div>${rowsHtml}`;
      wrap.replaceChild(age, table);
      age.querySelectorAll('[data-drill]').forEach((el) => {
        el.addEventListener('click', () => openDrill('tickets_open'));
      });
      return;
    }
  }

  host.classList.add('num');
  // #ageing sits under an existing .grid-head in the BG markup — rows only
  host.innerHTML = rowsHtml;
  host.querySelectorAll('[data-drill]').forEach((el) => {
    el.addEventListener('click', () => openDrill('tickets_open'));
  });
}

function renderTowerBars(container: HTMLElement, openDrill: (k: string) => void) {
  const max = Math.max(...TOWER_TICKET_BARS.map((d) => d.v), 1);
  container.classList.add('hbars', 'num');
  container.innerHTML = TOWER_TICKET_BARS.map(
    (d) =>
      `<div class="hbar" data-drill="tickets_open"><span>${d.n}</span><div class="htrack"><i style="width:${(d.v / max) * 100}%"></i></div><b>${d.v}</b></div>`
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

function getPath(source: unknown, path: string[]): unknown {
  let value = source;
  for (const key of path) {
    if (typeof value !== 'object' || value === null || !(key in value)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function getRequestFilters(
  result: EndpointResult | undefined,
  towerFilter: string,
  apiDateRange: ApiDateRange | null,
  tab: PostPossessionTab
): PostPossessionRequestFilters {
  const data = result?.data;
  const site = getPath(data, ['site']);
  const siteId =
    typeof site === 'object' &&
    site !== null &&
    'id' in site &&
    (typeof site.id === 'number' || typeof site.id === 'string')
      ? String(site.id)
      : undefined;
  const towers = getPath(data, ['towers']);
  const normalizedFilter = towerFilter.toLowerCase().replace(/^tower\s*/, '').replace(/^t(?=\d)/, '');
  const tower = towerFilter !== 'All' && Array.isArray(towers)
    ? towers.find((item) => {
        if (typeof item !== 'object' || item === null || !('name' in item)) return false;
        const name = String(item.name).toLowerCase().replace(/^tower\s*/, '').replace(/^t(?=\d)/, '');
        return name === normalizedFilter;
      })
    : undefined;
  const towerId =
    tab === 'helpdesk' &&
    typeof tower === 'object' &&
    tower !== null &&
    'id' in tower &&
    (typeof tower.id === 'number' || typeof tower.id === 'string')
      ? String(tower.id)
      : undefined;

  return {
    siteId,
    towerId,
    dateFrom: apiDateRange?.from,
    dateTo: apiDateRange?.to,
  };
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
  const [societyId, setSocietyId] = useState<string | null>(() => getSelectedSocietyId());
  const [postPossessionApi, setPostPossessionApi] = useState<
    Partial<Record<PostPossessionTab, PostPossessionApiState>>
  >({});
  const [tabBadgeApi, setTabBadgeApi] = useState<
    Partial<Record<PostPossessionTab, EndpointResult>>
  >({});
  const [apiFilters, setApiFilters] = useState<{
    societyId: string | null;
    loading: boolean;
    result?: EndpointResult;
  }>({ societyId: null, loading: false });
  const [apiDateRange, setApiDateRange] = useState<ApiDateRange | null>(null);
  const societies = useMemo(() => getSocietyOptions(apiFilters.result?.data), [apiFilters.result]);

  const { toasts, toast, dismiss } = useToast();
  const { content: drillContent, isOpen: drillOpen, openDrill, closeDrill } = useDrillPanel(toast);
  const selectSociety = useCallback((nextSocietyId: string) => {
    localStorage.setItem('selectedSocietyId', nextSocietyId);
    localStorage.setItem('society_id', nextSocietyId);
    sessionStorage.setItem('selectedSocietyId', nextSocietyId);
    setSocietyId(nextSocietyId);
    setTowerFilter('All');
  }, []);

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
    let cancelled = false;
    setApiFilters((current) => ({ societyId, loading: true, result: current.result }));
    void fetchPostPossessionFilters().then((result) => {
      if (cancelled) return;
      setApiFilters({ societyId, loading: false, result });
    });

    return () => {
      cancelled = true;
    };
  }, [societyId]);

  useEffect(() => {
    let cancelled = false;
    setTabBadgeApi({});
    if (!societyId || apiFilters.loading || apiFilters.societyId !== societyId) {
      return () => {
        cancelled = true;
      };
    }

    const requests = TAB_BADGE_SOURCES.map(async ({ tab, endpoint }) => {
      const requestFilters = getRequestFilters(apiFilters.result, towerFilter, apiDateRange, tab);
      const endpoints = await fetchPostPossessionTab(tab, societyId, requestFilters, [endpoint]);
      return [tab, endpoints[endpoint]] as const;
    });

    void Promise.all(requests).then((results) => {
      if (cancelled) return;
      const next: Partial<Record<PostPossessionTab, EndpointResult>> = {};
      for (const [tab, result] of results) {
        if (result) next[tab] = result;
      }
      setTabBadgeApi(next);
    });

    return () => {
      cancelled = true;
    };
  }, [societyId, apiFilters, towerFilter, apiDateRange]);

  useEffect(() => {
    const apiTab = POST_POSSESSION_TAB_BY_DASHBOARD_TAB[activeTab];
    if (!apiTab) return;

    let cancelled = false;
    setPostPossessionApi((current) => ({
      ...current,
      [apiTab]: { societyId, loading: true, endpoints: {} },
    }));

    if (!societyId) {
      setPostPossessionApi((current) => ({
        ...current,
        [apiTab]: {
          societyId: null,
          loading: false,
          endpoints: createEndpointErrors(
            apiTab,
            'A valid society_id is required. Select a society and reopen this tab.'
          ),
        },
      }));
      return () => {
        cancelled = true;
      };
    }
    if (apiFilters.loading || apiFilters.societyId !== societyId) return;

    const requestFilters = getRequestFilters(
      apiFilters.result,
      towerFilter,
      apiDateRange,
      apiTab
    );
    const pageFilters =
      apiTab === 'overview'
        ? { ...requestFilters, page: 1, perPage: IMPORTANT_EVENTS_PER_PAGE }
        : requestFilters;
    void fetchPostPossessionTab(apiTab, societyId, pageFilters).then((endpoints) => {
      if (cancelled) return;
      setPostPossessionApi((current) => ({
        ...current,
        [apiTab]: { societyId, loading: false, endpoints },
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, societyId, apiFilters, towerFilter, apiDateRange]);

  useEffect(() => {
    if (activeTab === 't-ov' || !societyId || apiFilters.loading || apiFilters.societyId !== societyId) {
      return;
    }

    let cancelled = false;
    const requestFilters = getRequestFilters(
      apiFilters.result,
      towerFilter,
      apiDateRange,
      'overview'
    );
    setPostPossessionApi((current) => ({
      ...current,
      overview: { societyId, loading: true, endpoints: {} },
    }));
    void fetchPostPossessionTab('overview', societyId, {
      ...requestFilters,
      page: 1,
      perPage: IMPORTANT_EVENTS_PER_PAGE,
    }).then((endpoints) => {
      if (cancelled) return;
      setPostPossessionApi((current) => ({
        ...current,
        overview: { societyId, loading: false, endpoints },
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab, societyId, apiFilters, towerFilter, apiDateRange]);

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
      renderDirectoryPage(1, 20, tbody, container, openDrill);
    };
    const onEventsPage = (e: Event) => {
      const page = Number((e as CustomEvent<number>).detail);
      if (!Number.isInteger(page) || page < 1 || !societyId || apiFilters.loading) return;
      const requestFilters = getRequestFilters(
        apiFilters.result,
        towerFilter,
        apiDateRange,
        'overview'
      );
      setPostPossessionApi((current) => ({
        ...current,
        overview: { societyId, loading: true, endpoints: current.overview?.endpoints ?? {} },
      }));
      void fetchPostPossessionTab('overview', societyId, {
        ...requestFilters,
        page,
        perPage: IMPORTANT_EVENTS_PER_PAGE,
      }).then((endpoints) => {
        setPostPossessionApi((current) => ({
          ...current,
          overview: { societyId, loading: false, endpoints },
        }));
      });
    };

    window.addEventListener('pp-open-drill', onDrill);
    window.addEventListener('pp-goto-tab', onTab);
    window.addEventListener('pp-show-info', onInfo);
    window.addEventListener('pp-toast', onToast);
    const onNotices = (e: Event) =>
      mountNoticeStack((e as CustomEvent<HTMLElement>).detail, openDrill);
    window.addEventListener('pp-render-ageing', onAgeing);
    window.addEventListener('pp-render-notices', onNotices);
    window.addEventListener('pp-render-tower-bars', onTower);
    window.addEventListener('pp-render-gate-bars', onGate);
    window.addEventListener('pp-render-parking-bars', onParking);
    window.addEventListener('pp-render-slots', onSlots);
    window.addEventListener('pp-render-events', onEvents);
    window.addEventListener('pp-render-directory', onDirectory);
    window.addEventListener('pp-overview-events-page', onEventsPage);

    return () => {
      window.removeEventListener('pp-open-drill', onDrill);
      window.removeEventListener('pp-goto-tab', onTab);
      window.removeEventListener('pp-show-info', onInfo);
      window.removeEventListener('pp-toast', onToast);
      window.removeEventListener('pp-render-ageing', onAgeing);
      window.removeEventListener('pp-render-notices', onNotices);
      window.removeEventListener('pp-render-tower-bars', onTower);
      window.removeEventListener('pp-render-gate-bars', onGate);
      window.removeEventListener('pp-render-parking-bars', onParking);
      window.removeEventListener('pp-render-slots', onSlots);
      window.removeEventListener('pp-render-events', onEvents);
      window.removeEventListener('pp-render-directory', onDirectory);
      window.removeEventListener('pp-overview-events-page', onEventsPage);
    };
  }, [activeTab, apiDateRange, apiFilters, openDrill, societyId, showInfo, toast, towerFilter]);

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
      societyId,
      societies,
      selectSociety,
      postPossessionApi,
      tabBadgeApi,
      apiDateRange,
      setApiDateRange,
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
      societyId,
      societies,
      selectSociety,
      postPossessionApi,
      tabBadgeApi,
      apiDateRange,
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
