import React, { useCallback, useEffect, useState } from 'react';
import GridLayout, { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DEFAULT_TICKETS_GRID_LAYOUT } from './ticketsDashboardGridLayout';

const ResponsiveGridLayout = WidthProvider(Responsive);

const STORAGE_KEY = 'tickets-dashboard-grid-layout';

interface TicketsDashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

const mergeWithDefaults = (saved: GridLayout.Layout[]): GridLayout.Layout[] => {
  const savedMap = new Map(saved.map((l) => [l.i, l]));
  const defaultIds = new Set(DEFAULT_TICKETS_GRID_LAYOUT.map((l) => l.i));
  const merged = DEFAULT_TICKETS_GRID_LAYOUT.map((d) => savedMap.get(d.i) ?? d);
  for (const l of saved) {
    if (!defaultIds.has(l.i)) merged.push(l);
  }
  return merged;
};

/** Shared draggable + resizable grid that wraps every card on the Tickets Dashboard. */
export const TicketsDashboardGrid: React.FC<TicketsDashboardGridProps> = ({ children, className }) => {
  const [layouts, setLayouts] = useState<GridLayout.Layout[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return mergeWithDefaults(JSON.parse(raw) as GridLayout.Layout[]);
    } catch {
      // ignore corrupt storage
    }
    return DEFAULT_TICKETS_GRID_LAYOUT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    } catch {
      // ignore quota errors
    }
  }, [layouts]);

  const handleLayoutChange = useCallback((_current: GridLayout.Layout[], allLayouts: GridLayout.Layouts) => {
    setLayouts(allLayouts.lg ?? []);
  }, []);

  return (
    <ResponsiveGridLayout
      className={className}
      layouts={{ lg: layouts }}
      onLayoutChange={handleLayoutChange}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={48}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      compactType="vertical"
      isDraggable
      isResizable
      resizeHandles={['se']}
    >
      {children}
    </ResponsiveGridLayout>
  );
};