import { useLayoutEffect, useRef } from 'react';

export function useEnhancedTableScrollViewport(
  viewportClassName: string,
  rows: readonly unknown[],
  trailingContentSelector?: string,
  visibleRowCount = 10
) {
  const tableRootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = tableRootRef.current;
    const viewport = root?.closest<HTMLElement>(`.${viewportClassName}`);
    const table = root?.querySelector<HTMLTableElement>('table.dashboard-enhanced-table');
    if (!viewport || !table) return;

    const fitViewport = () => {
      const headerHeight = table.tHead?.getBoundingClientRect().height ?? 0;
      const visibleRows = Array.from(table.tBodies.item(0)?.rows ?? []).slice(
        0,
        visibleRowCount
      );
      const rowsHeight = visibleRows.reduce(
        (height, row) => height + row.getBoundingClientRect().height,
        0
      );
      const paginationHeight =
        viewport
          ?.querySelector<HTMLElement>(
            'nav[aria-label="Table pagination"], nav[aria-label="pagination"]'
          )
          ?.getBoundingClientRect().height ?? 0;
      const trailingContentHeight =
        trailingContentSelector
          ? root?.querySelector<HTMLElement>(trailingContentSelector)?.getBoundingClientRect().height ?? 0
          : 0;
      if (headerHeight > 0) {
        viewport.style.maxHeight = `${
          headerHeight + rowsHeight + paginationHeight + trailingContentHeight
        }px`;
      }
    };

    fitViewport();
    const body = table.tBodies.item(0);
    const observer = body ? new MutationObserver(fitViewport) : null;
    if (body) observer?.observe(body, { childList: true });
    window.addEventListener('resize', fitViewport);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', fitViewport);
    };
  }, [rows, trailingContentSelector, viewportClassName, visibleRowCount]);

  return tableRootRef;
}
