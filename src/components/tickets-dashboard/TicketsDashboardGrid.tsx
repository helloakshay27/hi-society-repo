import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DEFAULT_TICKETS_GRID_LAYOUT } from './ticketsDashboardGridLayout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DEFAULT_STORAGE_KEY = 'tickets-dashboard-grid-layout';

interface TicketsDashboardGridProps {
  children: React.ReactNode;
  className?: string;
  storageKey?: string;
  defaultLayout?: GridLayout.Layout[];
}

/** True when items are piled / left-stacked instead of a real multi-column grid. */
const isBrokenLayout = (layout: GridLayout.Layout[]): boolean => {
  if (layout.length <= 1) return false;
  const allOrigin = layout.every((item) => (item.x ?? 0) === 0 && (item.y ?? 0) === 0);
  if (allOrigin) return true;
  // Half-width cards all glued to the left column (x=0) with empty right side.
  const leftStuck = layout.filter((item) => (item.w ?? 0) >= 4).every((item) => (item.x ?? 0) === 0);
  const hasWideCharts = layout.some((item) => (item.w ?? 0) >= 4);
  return leftStuck && hasWideCharts && layout.length > 3;
};

const mergeWithDefaults = (
  saved: GridLayout.Layout[],
  defaults: GridLayout.Layout[]
): GridLayout.Layout[] => {
  if (isBrokenLayout(saved)) return defaults;

  const savedMap = new Map(saved.map((l) => [l.i, l]));
  const defaultIds = new Set(defaults.map((l) => l.i));
  const merged = defaults.map((d) => {
    const savedItem = savedMap.get(d.i);
    if (!savedItem) return d;
    if (d.i.startsWith('kpi-')) {
      return {
        ...savedItem,
        x: d.x,
        y: d.y,
        w: d.w,
        h: d.h,
        minW: d.minW,
        minH: d.minH,
        maxH: d.maxH,
      };
    }
    return {
      ...savedItem,
      w: Math.max(savedItem.w ?? d.w, d.minW ?? 1),
      h: Math.max(savedItem.h ?? d.h, d.minH ?? 1),
      minW: d.minW,
      minH: d.minH,
    };
  });
  return isBrokenLayout(merged) ? defaults : merged;
};

/** Keep the same 12-col layout for desktop/tablet; stack only on very narrow screens. */
const toBreakpointLayouts = (lg: GridLayout.Layout[]): GridLayout.Layouts => {
  const stacked = lg.map((item, index) => ({
    ...item,
    x: 0,
    y: index * Math.max(item.h, item.minH ?? 3),
    w: 12,
  }));
  return {
    lg,
    md: lg,
    sm: lg,
    xs: stacked,
    xxs: stacked,
  };
};

/** Shared draggable + resizable grid — same chrome as Escalation / Visitor / Tickets. */
export const TicketsDashboardGrid: React.FC<TicketsDashboardGridProps> = ({
  children,
  className,
  storageKey = DEFAULT_STORAGE_KEY,
  defaultLayout = DEFAULT_TICKETS_GRID_LAYOUT,
}) => {
  const [layouts, setLayouts] = useState<GridLayout.Layout[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return mergeWithDefaults(JSON.parse(raw) as GridLayout.Layout[], defaultLayout);
    } catch {
      // ignore corrupt storage
    }
    return defaultLayout;
  });
  const [ready, setReady] = useState(false);
  const skipPersistRef = useRef(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Always prefer current defaults when storage key / defaults change (layout version bumps).
  useEffect(() => {
    setLayouts((prev) => mergeWithDefaults(prev, defaultLayout));
  }, [defaultLayout, storageKey]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    if (isBrokenLayout(layouts)) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(layouts));
    } catch {
      // ignore quota errors
    }
  }, [layouts, storageKey]);

  const responsiveLayouts = useMemo(() => toBreakpointLayouts(layouts), [layouts]);

  const handleLayoutChange = useCallback(
    (_current: GridLayout.Layout[], allLayouts: GridLayout.Layouts) => {
      const next = allLayouts.lg ?? allLayouts.md ?? allLayouts.sm ?? _current ?? [];
      if (isBrokenLayout(next)) {
        setLayouts(defaultLayout);
        return;
      }
      setLayouts(next);
    },
    [defaultLayout]
  );

  if (!ready) {
    return <div className="min-h-[320px] w-full" aria-hidden />;
  }

  return (
    <ResponsiveGridLayout
      className={`tickets-dashboard-grid w-full${className ? ` ${className}` : ''}`}
      layouts={responsiveLayouts}
      onLayoutChange={handleLayoutChange}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
      rowHeight={48}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      compactType="vertical"
      isDraggable
      isResizable
      resizeHandles={['se']}
      useCSSTransforms
    >
      {children}
    </ResponsiveGridLayout>
  );
};
