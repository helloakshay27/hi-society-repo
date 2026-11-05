import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PostPossessionTab } from '../api';
import {
  createDashboardLayout,
  deleteDashboardLayout,
  fetchDashboardLayouts,
  getCurrentUserId,
  updateDashboardLayout,
  type DashboardLayoutRecord,
} from '../services/dashboardLayoutApi';

/** A dashboard card saved to "My Dashboard". `chartId` is the /dashboard_layouts `chart_code`. */
export interface MyDashboardCard {
  chartId: string;
  tab: PostPossessionTab;
  label: string;
  height: string;
  width: string;
  /** "x,y" */
  position: string;
  /** id of the /dashboard_layouts row, once synced */
  serverId?: number;
}

interface MyDashboardState {
  cards: MyDashboardCard[];
  addCard: (card: Omit<MyDashboardCard, 'serverId'>) => void;
  removeCard: (chartId: string) => void;
  updateCardLayout: (chartId: string, layout: Pick<MyDashboardCard, 'height' | 'width' | 'position'>) => void;
  setServerId: (chartId: string, serverId: number) => void;
  mergeServerRows: (rows: DashboardLayoutRecord[]) => void;
}

export const CHART_CODE_PREFIX = 'hs-';
const KNOWN_TABS: PostPossessionTab[] = [
  'allTowers', 'overview', 'helpdesk', 'security', 'staff', 'club', 'fitout', 'parking', 'community',
];

/** chart_code = hs-{tab}-{slug}. The backend doesn't store the module, so it is encoded in the code. */
export function parseChartCode(chartCode: string): { tab: PostPossessionTab; slug: string } | null {
  if (!chartCode.startsWith(CHART_CODE_PREFIX)) return null;
  const rest = chartCode.slice(CHART_CODE_PREFIX.length);
  const tab = KNOWN_TABS.find((t) => rest.startsWith(`${t}-`));
  return tab ? { tab, slug: rest.slice(tab.length + 1) } : null;
}

const humanize = (slug: string) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

let syncWarned = false;
const warnSyncFailed = (error: unknown) => {
  console.error('[My Dashboard] /dashboard_layouts sync failed', error);
  if (syncWarned) return;
  syncWarned = true;
  window.dispatchEvent(
    new CustomEvent('pp-toast', {
      detail: { message: 'Saved on this device — could not sync to the server', type: 'w' },
    })
  );
};

export const useMyDashboardStore = create<MyDashboardState>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) => {
        if (get().cards.some((c) => c.chartId === card.chartId)) return;
        set((state) => ({ cards: [...state.cards, card] }));
        // Sync in the background; the card is usable immediately either way.
        createDashboardLayout({
          chart_code: card.chartId,
          height: card.height,
          width: card.width,
          position: card.position,
        })
          .then((row) => {
            if (row?.id) get().setServerId(card.chartId, row.id);
          })
          .catch(warnSyncFailed);
      },

      removeCard: (chartId) => {
        const card = get().cards.find((c) => c.chartId === chartId);
        set((state) => ({ cards: state.cards.filter((c) => c.chartId !== chartId) }));
        if (card?.serverId) deleteDashboardLayout(card.serverId).catch(warnSyncFailed);
      },

      updateCardLayout: (chartId, layout) => {
        const card = get().cards.find((c) => c.chartId === chartId);
        if (!card) return;
        if (card.height === layout.height && card.width === layout.width && card.position === layout.position) return;
        set((state) => ({
          cards: state.cards.map((c) => (c.chartId === chartId ? { ...c, ...layout } : c)),
        }));
        if (card.serverId) {
          updateDashboardLayout(card.serverId, { chart_code: chartId, ...layout }).catch(warnSyncFailed);
        }
      },

      setServerId: (chartId, serverId) =>
        set((state) => ({
          cards: state.cards.map((c) => (c.chartId === chartId ? { ...c, serverId } : c)),
        })),

      /**
       * Reconcile with the server: attach ids to local cards, rebuild cards saved from another
       * browser/device, and push local cards that were never synced.
       */
      mergeServerRows: (rows) => {
        const local = get().cards;
        const byCode = new Map(rows.filter((r) => r.chart_code).map((r) => [r.chart_code as string, r]));
        const merged: MyDashboardCard[] = local.map((card) => {
          const row = byCode.get(card.chartId);
          return row ? { ...card, serverId: row.id } : card;
        });
        rows.forEach((row) => {
          const code = row.chart_code;
          if (!code || merged.some((c) => c.chartId === code)) return;
          const parsed = parseChartCode(code);
          if (!parsed) return;
          merged.push({
            chartId: code,
            tab: parsed.tab,
            label: humanize(parsed.slug),
            height: row.height ?? '8',
            width: row.width ?? '6',
            position: row.position ?? '0,0',
            serverId: row.id,
          });
        });
        set({ cards: merged });
        merged
          .filter((c) => !c.serverId)
          .forEach((card) => {
            createDashboardLayout({
              chart_code: card.chartId,
              height: card.height,
              width: card.width,
              position: card.position,
            })
              .then((row) => {
                if (row?.id) get().setServerId(card.chartId, row.id);
              })
              .catch(warnSyncFailed);
          });
      },
    }),
    { name: 'pp-my-dashboard-cards-v1' }
  )
);

/** Pull this user's saved cards from /dashboard_layouts and merge them in. */
export async function syncMyDashboardFromServer(): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const rows = await fetchDashboardLayouts(userId);
    useMyDashboardStore.getState().mergeServerRows(rows);
  } catch (error) {
    warnSyncFailed(error);
  }
}
