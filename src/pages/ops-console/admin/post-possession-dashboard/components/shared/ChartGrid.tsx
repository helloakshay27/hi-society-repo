import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Responsive, type Layout } from 'react-grid-layout';
import { RotateCcw } from 'lucide-react';
import type { PostPossessionTab } from '../../api';
import { useMyDashboardStore } from '../../store/myDashboardStore';
import { AddToDashboardButton } from './AddToDashboardButton';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * Drag-and-drop + resizable chart cards for the tab panels.
 *
 * The tab content is HTML injected into a container, so instead of rewriting every card as a
 * React child, `mountChartGrid` finds each run of chart cards in the container, replaces the run
 * with a react-grid-layout grid, and moves the existing card elements (with their canvases and
 * mounted tables) into the grid items. Same react-grid-layout setup as the FM Matrix dashboard:
 * 12 columns, vertical compaction, bottom-right resize handle, layout saved on drag/resize stop.
 */

const ROW_HEIGHT = 24;
const MARGIN = 14;
const COLS = { lg: 12, md: 12, sm: 4, xs: 4, xxs: 2 };
const BREAKPOINTS = { lg: 1200, md: 900, sm: 640, xs: 480, xxs: 0 };
const MIN_W = 2;
const MIN_H = 3;
// v3: layouts saved before the gap fix baked the gappy default positions in — start fresh
const STORAGE_PREFIX = 'pp-grid-layout-v3';
export const GRID_RESET_EVENT = 'pp-grid-reset';

interface GridCard {
  key: string;
  /** chart_code used for My Dashboard / /dashboard_layouts: hs-{tab}-{slug} */
  chartId: string;
  label: string;
  el: HTMLElement;
  layout: Omit<Layout, 'i'>;
  /** Section labels are draggable but have a fixed height */
  fixedSize?: boolean;
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number') setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function loadLayout(storageKey: string): Layout[] | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Self-healing merge: keep a saved entry only if it still matches a card and respects the minimum size. */
function reconcile(defaults: Layout[], stored: Layout[] | null): Layout[] {
  if (!stored) return defaults;
  const byId = new Map(stored.map((item) => [item.i, item]));
  return defaults.map((item) => {
    const saved = byId.get(item.i);
    if (
      !saved ||
      !Number.isFinite(saved.x) ||
      !Number.isFinite(saved.y) ||
      saved.w < (item.minW ?? 1) ||
      saved.h < (item.minH ?? 1)
    ) {
      return item;
    }
    return { ...item, x: saved.x, y: saved.y, w: saved.w, h: saved.h };
  });
}

/** Stack full width at narrow breakpoints instead of squeezing columns. */
function stackFullWidth(layout: Layout[], cols: number): Layout[] {
  const ordered = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
  let y = 0;
  return ordered.map((item) => {
    const placed = { ...item, x: 0, w: cols, y };
    y += item.h;
    return placed;
  });
}

const CardHost: React.FC<{ el: HTMLElement }> = ({ el }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (host && el.parentNode !== host) host.appendChild(el);
  }, [el]);
  return <div ref={hostRef} className="pp-grid-host" />;
};

interface ChartGridProps {
  cards: GridCard[];
  storageKey: string;
  showReset: boolean;
  tab: PostPossessionTab;
  /** 'tab': a normal tab (layout in localStorage). 'my': My Dashboard (layout in the store + /dashboard_layouts). */
  mode: 'tab' | 'my';
}

const ChartGrid: React.FC<ChartGridProps> = ({ cards, storageKey, showReset, tab, mode }) => {
  const defaults: Layout[] = cards.map((card) => ({
    i: card.key,
    ...card.layout,
    minW: Math.min(MIN_W, card.layout.w),
    minH: Math.min(MIN_H, card.layout.h),
    ...(card.fixedSize ? { isResizable: false } : {}),
  }));
  const [layout, setLayout] = useState<Layout[]>(() => {
    if (mode === 'my') {
      // Start from each card's saved My Dashboard size/position
      const saved = useMyDashboardStore.getState().cards;
      return defaults.map((item) => {
        const card = cards.find((c) => c.key === item.i);
        const entry = saved.find((c) => c.chartId === card?.chartId);
        if (!entry) return item;
        const [x, y] = entry.position.split(',').map(Number);
        const w = Number(entry.width);
        const h = Number(entry.height);
        return {
          ...item,
          x: Number.isFinite(x) ? x : item.x,
          y: Number.isFinite(y) ? y : item.y,
          w: w > 0 ? Math.min(12, w) : item.w,
          h: h > 0 ? h : item.h,
        };
      });
    }
    return reconcile(defaults, loadLayout(storageKey));
  });
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const { ref, width } = useContainerWidth();

  // A drag that ends on a card would otherwise fire that card's click (e.g. open its drill
  // panel). Track real movement and swallow the click that follows a drag.
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  useEffect(() => {
    const wrap = ref.current;
    if (!wrap) return;
    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClickRef.current) return;
      event.stopPropagation();
      event.preventDefault();
    };
    wrap.addEventListener('click', onClickCapture, true);
    return () => wrap.removeEventListener('click', onClickCapture, true);
  }, [ref]);
  const endGesture = useCallback(() => {
    if (!movedRef.current) return;
    movedRef.current = false;
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 350);
  }, []);

  // My Dashboard persists each moved/resized card to the store (and PATCHes /dashboard_layouts);
  // normal tabs persist the whole layout to localStorage.
  const persist = useCallback(
    (next: Layout[]) => {
      setLayout(next);
      if (mode === 'my') {
        const { updateCardLayout } = useMyDashboardStore.getState();
        next.forEach((item) => {
          const card = cards.find((c) => c.key === item.i);
          if (!card) return;
          updateCardLayout(card.chartId, {
            height: String(item.h),
            width: String(item.w),
            position: `${item.x},${item.y}`,
          });
        });
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable — layout just won't persist */
      }
    },
    [storageKey, mode, cards]
  );

  const reset = useCallback(() => {
    if (mode === 'tab') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
    setLayout(defaults);
    if (mode === 'my') persist(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, cards, mode]);

  useEffect(() => {
    const onReset = () => reset();
    window.addEventListener(GRID_RESET_EVENT, onReset);
    return () => window.removeEventListener(GRID_RESET_EVENT, onReset);
  }, [reset]);

  return (
    <div className="pp-grid-wrap" ref={ref}>
      {showReset && (
        <div className="pp-grid-toolbar">
          <button
            type="button"
            className="pp-grid-reset no-drag"
            onClick={() => window.dispatchEvent(new Event(GRID_RESET_EVENT))}
          >
            <RotateCcw size={13} aria-hidden />
            Reset layout
          </button>
        </div>
      )}
      {width > 0 && (
        <Responsive
          width={width}
          className="pp-grid"
          layouts={{
            lg: layout,
            md: layout,
            sm: stackFullWidth(layout, COLS.sm),
            xs: stackFullWidth(layout, COLS.xs),
            xxs: stackFullWidth(layout, COLS.xxs),
          }}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          margin={[MARGIN, MARGIN]}
          containerPadding={[0, 0]}
          compactType="vertical"
          resizeHandles={['se']}
          draggableCancel=".no-drag,.info-btn,button,a,input,select,textarea,table,.tbox"
          isBounded
          isDraggable
          isResizable
          onDragStart={() => {
            movedRef.current = false;
          }}
          onDrag={() => {
            movedRef.current = true;
          }}
          onResizeStart={() => {
            movedRef.current = false;
          }}
          onResize={() => {
            movedRef.current = true;
          }}
          onDragStop={(next) => {
            persist(next);
            endGesture();
          }}
          onResizeStop={(next) => {
            persist(next);
            endGesture();
          }}
        >
          {cards.map((card) => (
            <div key={card.key} className="pp-grid-item">
              <CardHost el={card.el} />
              {!card.fixedSize && (
                <AddToDashboardButton
                  chartId={card.chartId}
                  label={card.label}
                  tab={tab}
                  getLayout={() => {
                    const item = layoutRef.current.find((l) => l.i === card.key);
                    return {
                      height: String(item?.h ?? card.layout.h),
                      width: String(item?.w ?? card.layout.w),
                      position: `${item?.x ?? card.layout.x},${item?.y ?? card.layout.y}`,
                    };
                  }}
                />
              )}
            </div>
          ))}
        </Responsive>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------------- */
/* DOM → grid conversion                                                      */
/* ------------------------------------------------------------------------- */

const isVisible = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return rect.height > 0 && rect.width > 0 && getComputedStyle(el).display !== 'none';
};

/**
 * A row of sibling cards (.g2 / .g3 / .krow / .rg / .pulse-row / .pcols …): a grid or flex
 * container with 2+ visible children that all share the same first class. Each child becomes
 * its own grid item. Composite blocks with differing children (hero banners, shells) stay whole.
 */
function isRowOfCards(el: Element): boolean {
  const display = getComputedStyle(el).display;
  if (display !== 'grid' && display !== 'flex') return false;
  if (display === 'flex' && getComputedStyle(el).flexDirection.startsWith('column')) return false;
  const kids = Array.from(el.children).filter(isVisible);
  if (kids.length < 2) return false;
  const first = kids[0].classList[0] ?? kids[0].tagName;
  return kids.every((kid) => (kid.classList[0] ?? kid.tagName) === first);
}

/** Readable name of a card, used for its chart_code and the add/remove messages. */
function cardLabel(el: HTMLElement): string {
  const heading = el.querySelector('.ch3')?.textContent?.trim();
  if (heading) return heading.replace(/\s+/g, ' ').slice(0, 60);
  // Otherwise the first text line without digits (digits are data and change between loads)
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (text.length >= 3 && text.length <= 60 && !/\d/.test(text)) return text;
    node = walker.nextNode();
  }
  return 'Card';
}

const slugify = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'card';

const rowsFor = (px: number) => Math.max(1, Math.ceil((px + MARGIN) / (ROW_HEIGHT + MARGIN)));

/**
 * A wrapper with no look of its own (transparent, borderless, no shadow) whose visible children
 * are laid out normally: it only groups cards, so the cards inside should move independently.
 * Wrappers that stack/overlay their children (position: absolute, e.g. the notice carousel)
 * stay whole.
 */
function isPlainWrapper(el: Element): boolean {
  // Section labels and other thin rows (label + rule) are one piece, not a group of cards
  if (el.classList.contains('sec-head') || el.classList.contains('nstack') || el.getBoundingClientRect().height < 80) return false;
  const style = getComputedStyle(el);
  const transparent = style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent';
  const noBorder = ['Top', 'Right', 'Bottom', 'Left'].every(
    (side) => parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) === 0
  );
  if (!transparent || !noBorder || style.boxShadow !== 'none' || style.backgroundImage !== 'none') return false;
  const kids = Array.from(el.children).filter(isVisible);
  if (kids.length === 0) return false;
  return kids.every((kid) => {
    const position = getComputedStyle(kid).position;
    return position !== 'absolute' && position !== 'fixed';
  });
}

/** The independently movable cards inside a top-level block. */
function collectItems(block: HTMLElement, depth = 0): HTMLElement[] {
  if (depth < 3 && (isRowOfCards(block) || isPlainWrapper(block))) {
    const kids = Array.from(block.children).filter(isVisible) as HTMLElement[];
    return kids.flatMap((kid) => collectItems(kid, depth + 1));
  }
  return [block];
}

/**
 * Turn every top-level block of a tab (cards, KPI cards, hero banners, tables, insight bars…) into
 * an item of ONE draggable, resizable grid; rows of sibling cards are split so each card moves
 * on its own. Hidden/empty blocks are left in place. Returns a cleanup function.
 */
export interface MountChartGridOptions {
  tab: PostPossessionTab;
  /** 'my' renders only the cards saved to My Dashboard (chart_codes in `codes`). */
  mode?: 'tab' | 'my';
  codes?: Set<string>;
  onMounted?: () => void;
}

export function mountChartGrid(container: HTMLElement, scope: string, options: MountChartGridOptions): () => void {
  const mode = options.mode ?? 'tab';
  const roots: Root[] = [];
  let cancelled = false;

  // Wait a beat so the tables mounted by React roots have rendered before measuring heights.
  const timer = window.setTimeout(() => {
    if (cancelled || !container.isConnected) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.width < 50) return;
    const unit = ROW_HEIGHT + MARGIN;
    const blocks = Array.from(container.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && !child.classList.contains('pp-grid-mount')
    );

    const cards: GridCard[] = [];
    const slugCounts = new Map<string, number>();
    const rowWrappers: HTMLElement[] = [];
    const gridded: HTMLElement[] = [];

    blocks.forEach((block, blockIndex) => {
      if (!isVisible(block)) return; // leave hidden/empty blocks where they are
      gridded.push(block);
      const items = collectItems(block);
      const isRow = items.length !== 1 || items[0] !== block;
      if (isRow) rowWrappers.push(block);
      // Columns for each item. Rounding every card independently leaves gaps when a row doesn't
      // divide into 12 (e.g. 5 cards), so cards in the same visual row share their boundaries.
      const rects = items.map((el) => el.getBoundingClientRect());
      const colOf = (px: number) => Math.round(((px - containerRect.left) / containerRect.width) * 12);
      const spans = items.map((_, i) => {
        const siblings = items
          .map((__, j) => j)
          .filter((j) => Math.abs(rects[j].top - rects[i].top) < 8)
          .sort((a, b) => rects[a].left - rects[b].left);
        const pos = siblings.indexOf(i);
        const start =
          pos === 0
            ? colOf(rects[i].left)
            : colOf((rects[siblings[pos - 1]].right + rects[i].left) / 2);
        const end =
          pos === siblings.length - 1
            ? colOf(rects[i].right)
            : colOf((rects[i].right + rects[siblings[pos + 1]].left) / 2);
        const x = Math.min(11, Math.max(0, start));
        return { x, w: Math.max(1, Math.min(12 - x, end - x)) };
      });
      items.forEach((el, i) => {
        const rect = rects[i];
        const { x, w } = spans[i];
        const label = cardLabel(el);
        const baseSlug = slugify(label);
        const seen = (slugCounts.get(baseSlug) ?? 0) + 1;
        slugCounts.set(baseSlug, seen);
        cards.push({
          // Index-based so a saved layout survives changing card text/data
          key: `card-${blockIndex}-${i}`,
          chartId: `hs-${options.tab}-${seen > 1 ? `${baseSlug}-${seen}` : baseSlug}`,
          label,
          el,
          fixedSize: block.classList.contains('sec-head'),
          layout: {
            x,
            y: Math.max(0, Math.round((rect.top - containerRect.top) / unit)),
            w,
            h: rowsFor(rect.height),
          },
        });
      });
    });

    // My Dashboard shows only the saved cards; everything else in this tab is dropped.
    const shown = mode === 'my' ? cards.filter((card) => options.codes?.has(card.chartId)) : cards;
    if (mode === 'my') {
      cards.forEach((card) => {
        if (!shown.includes(card)) card.el.remove();
      });
      blocks.forEach((block) => {
        if (!gridded.includes(block)) block.remove();
      });
    }
    if (!shown.length) {
      if (mode === 'my') gridded.forEach((block) => block.remove());
      options.onMounted?.();
      return;
    }
    const gridCards = shown;
    const mount = document.createElement('div');
    mount.className = 'pp-grid-mount';
    // In My Dashboard the first block may already have been dropped, so anchor to the container
    if (mode === 'my') container.prepend(mount);
    else gridded[0].before(mount);
    // Pull the cards out of their original blocks; each grid host re-parents its card.
    gridCards.forEach((card) => card.el.parentElement?.removeChild(card.el));
    rowWrappers.forEach((wrapper) => wrapper.remove());
    gridded.forEach((block) => {
      if (!rowWrappers.includes(block)) block.remove();
    });

    const root = createRoot(mount);
    roots.push(root);
    root.render(
      <ChartGrid cards={gridCards} storageKey={`${STORAGE_PREFIX}:${scope}`} showReset tab={options.tab} mode={mode} />
    );
    options.onMounted?.();
  }, 250);

  return () => {
    cancelled = true;
    window.clearTimeout(timer);
    // Unmounting during a React commit logs a race warning, so defer it.
    window.setTimeout(() => roots.forEach((root) => root.unmount()), 0);
  };
}
