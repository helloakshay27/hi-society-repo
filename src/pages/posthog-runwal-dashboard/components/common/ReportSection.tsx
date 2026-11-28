/**
 * The dashboard as one scrollable report: Traffic & Session, Adoption & Engagement and Workflow Usage one
 * below the other, the left navigation jumping to each and showing which one is on screen.
 *
 * A section is drawn (and its data asked for) only once it comes near the screen, or when the navigation
 * jumps to it: opening the dashboard does not read every chart at once (Downloads & sign-ups alone reads
 * each of the user's Hi Society societies in turn).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PageId } from '../../types';

export const REPORT_ORDER: PageId[] = ['pgTraffic', 'pgAdopt', 'pgFlows'];
const ROOT = '.posthog-dashboard-root';
const upTo = (page: PageId) => REPORT_ORDER.slice(0, REPORT_ORDER.indexOf(page) + 1);

/** Which section is on screen, which sections are drawn, and a jump to a section. */
export function useReportNav(start: PageId) {
  const [active, setActive] = useState<PageId>(start);
  const [mounted, setMounted] = useState<Set<PageId>>(() => new Set(upTo(start)));
  const jumping = useRef<number | null>(null);

  const markSeen = useCallback((page: PageId) => {
    setMounted((m) => (m.has(page) ? m : new Set([...m, page])));
  }, []);

  const scrollTo = useCallback((page: PageId, behavior: ScrollBehavior) => {
    const el = document.getElementById(`sec-${page}`);
    if (el) el.scrollIntoView({ behavior, block: 'start' });
  }, []);

  /** Jump to a section (the sections before it are drawn first, so it lands where it will stay). */
  const goTo = useCallback(
    (page: PageId) => {
      setMounted((m) => new Set([...m, ...upTo(page)]));
      setActive(page);
      // While the page scrolls there, the scroll position does not move the highlight.
      if (jumping.current) window.clearTimeout(jumping.current);
      jumping.current = window.setTimeout(() => (jumping.current = null), 900);
      requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(page, 'smooth')));
    },
    [scrollTo]
  );

  // Back on the section the viewer was on before a refresh.
  useEffect(() => {
    if (start === 'pgTraffic') return;
    const t = window.setTimeout(() => scrollTo(start, 'auto'), 250);
    return () => window.clearTimeout(t);
  }, [start, scrollTo]);

  // The highlighted section: the last one whose top has passed just under the top bar.
  useEffect(() => {
    const root = document.querySelector(ROOT) as HTMLElement | null;
    if (!root) return;
    let frame = 0;
    const onScroll = () => {
      if (frame || jumping.current) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const line = root.getBoundingClientRect().top + 140;
        let current: PageId = REPORT_ORDER[0];
        for (const page of REPORT_ORDER) {
          const el = document.getElementById(`sec-${page}`);
          if (el && el.getBoundingClientRect().top <= line) current = page;
        }
        // At the very bottom the last section is the one being read.
        if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) current = REPORT_ORDER[REPORT_ORDER.length - 1];
        setActive(current);
      });
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { active, goTo, isMounted: (page: PageId) => mounted.has(page), markSeen };
}

/** One section of the report: a placeholder until it comes near the screen, then its page. */
export const ReportSection: React.FC<{
  id: PageId;
  mounted: boolean;
  onSeen: (id: PageId) => void;
  children: React.ReactNode;
}> = ({ id, mounted, onSeen, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mounted) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      onSeen(id);
      return;
    }
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && onSeen(id), {
      root: el.closest(ROOT),
      rootMargin: '600px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [id, mounted, onSeen]);

  return (
    <div ref={ref} id={`sec-${id}`} data-section={id} className={`report-section${mounted ? '' : ' report-pending'}`}>
      {mounted ? children : <div className="report-placeholder" aria-hidden="true" />}
    </div>
  );
};

/**
 * Draws its children only once they come near the screen (then keeps them). Downloads & sign-ups sits in it:
 * it reads each of the user's Hi Society societies in turn, which should not start just because the
 * Adoption section above it came into view.
 */
export const LazyMount: React.FC<{ minHeight?: number; children: React.ReactNode }> = ({ minHeight = 600, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setShown(true), {
      root: el.closest(ROOT),
      rootMargin: '300px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return <div ref={ref} style={shown ? undefined : { minHeight }}>{shown ? children : null}</div>;
};
