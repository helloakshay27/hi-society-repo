import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { INFO_TOOLTIPS } from '../../data/infoTooltips';
import { useDashboard } from '../../context/DashboardContext';

function resolveInfoAnchor(anchor: HTMLElement | null, key: string): HTMLElement | null {
  if (anchor?.isConnected) return anchor;
  return document.querySelector<HTMLElement>(
    `.pp-dashboard-root .info-btn[data-info="${CSS.escape(key)}"]`
  );
}

function positionInfoPop(pop: HTMLDivElement, anchor: HTMLElement) {
  const d = pop.dataset.infoKey;
  if (!d) return;

  const r = anchor.getBoundingClientRect();
  if (r.width === 0 && r.height === 0 && r.top === 0 && r.left === 0) return;

  const popW = 280;
  let left = r.left + r.width / 2 - popW / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - popW - 12));
  pop.style.width = `${popW}px`;
  pop.style.left = `${left}px`;
  pop.style.top = '-9999px';

  const popH = pop.offsetHeight;
  let top = r.bottom + 8;
  if (top + popH > window.innerHeight - 12) top = r.top - popH - 8;
  pop.style.top = `${Math.max(8, top)}px`;
}

export const InfoPopover: React.FC = () => {
  const { infoKey, infoAnchor, hideInfo } = useDashboard();
  const popRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const cancelScheduledHide = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    cancelScheduledHide();
  }, [infoKey, infoAnchor]);

  useEffect(() => {
    if (!infoKey || !popRef.current) return;

    const pop = popRef.current;
    const d = INFO_TOOLTIPS[infoKey];
    if (!d) return;

    const anchor = resolveInfoAnchor(infoAnchor, infoKey);
    if (!anchor) return;

    if (activeBtnRef.current && activeBtnRef.current !== anchor) {
      activeBtnRef.current.classList.remove('on');
    }
    activeBtnRef.current = anchor;
    anchor.classList.add('on');

    let html = `<div class="info-what">${d.what}</div>`;
    if (d.formula) {
      html += `<div class="info-formula-wrap"><div class="info-formula-lbl">Formula</div><div class="info-formula">${d.formula}</div></div>`;
    }
    if (d.note) html += `<div class="info-note">${d.note}</div>`;
    pop.innerHTML = html;
    pop.dataset.infoKey = infoKey;
    pop.classList.add('on');

    const place = () => {
      const liveAnchor = resolveInfoAnchor(anchor, infoKey);
      if (liveAnchor && popRef.current) positionInfoPop(popRef.current, liveAnchor);
    };

    place();
    requestAnimationFrame(place);

    return () => {
      anchor.classList.remove('on');
      pop.classList.remove('on');
      delete pop.dataset.infoKey;
      if (activeBtnRef.current === anchor) activeBtnRef.current = null;
    };
  }, [infoKey, infoAnchor]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const pop = popRef.current;
      if (!pop) return;
      const target = e.target as HTMLElement;
      if (!pop.contains(target) && !target.closest?.('.info-btn')) hideInfo();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideInfo();
    };
    const onScroll = () => hideInfo();
    const onHoverLeave = () => {
      cancelScheduledHide();
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        hideInfo();
      }, 60);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('pp-hide-info', onHoverLeave);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('pp-hide-info', onHoverLeave);
      cancelScheduledHide();
    };
  }, [hideInfo]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`info-pop${infoKey ? ' on' : ''}`}
      id="infoPop"
      role="tooltip"
      ref={popRef}
      onMouseEnter={cancelScheduledHide}
      onMouseLeave={() => hideInfo()}
    />,
    document.body
  );
};
