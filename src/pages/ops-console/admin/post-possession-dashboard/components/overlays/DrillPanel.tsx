import React, { useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle, Info, X } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

const TOAST_ICONS = {
  d: Info,
  ok: CheckCircle,
  w: AlertTriangle,
  e: AlertCircle,
};

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useDashboard();

  return (
    <div className="tw2" id="tc">
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.type];
        return (
          <div key={t.id} className={`tos t-${t.type === 'ok' ? 'ok' : t.type === 'w' ? 'w' : t.type === 'e' ? 'e' : 'd'}`}>
            <Icon size={12} style={{ flexShrink: 0 }} />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export const DrillPanel: React.FC = () => {
  const { drillOpen, drillContent, closeDrill, openDrill, setActiveTab, toast } = useDashboard();
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer || !drillOpen) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button');
      if (!btn) return;
      const onclick = btn.getAttribute('onclick') || '';
      if (onclick.includes('closeD()')) closeDrill();
      if (onclick.includes("toast('")) {
        const m = onclick.match(/toast\('([^']*)','([^']*)'\)/);
        if (m) toast(m[1], m[2] as 'd' | 'ok' | 'w' | 'e');
      }
      if (onclick.includes('swTabById')) {
        const m = onclick.match(/swTabById\('([^']+)'\)/);
        if (m) setActiveTab(m[1] as Parameters<typeof setActiveTab>[0]);
        closeDrill();
      }
      if (onclick.includes('openD(')) {
        const m = onclick.match(/openD\('([^']+)'\)/);
        if (m) openDrill(m[1]);
      }
    };

    footer.addEventListener('click', handleClick);
    return () => footer.removeEventListener('click', handleClick);
  }, [drillOpen, drillContent, closeDrill, openDrill, setActiveTab, toast]);

  if (!drillContent) return null;

  return (
    <>
      <div className={`dov${drillOpen ? ' on' : ''}`} id="dov" onClick={closeDrill} />
      <div className={`dpan${drillOpen ? ' on' : ''}`} id="dpan">
        <div className="dhd">
          <button type="button" className="dbk" onClick={closeDrill}>
            <ArrowLeft size={13} />
          </button>
          <div style={{ flex: 1 }}>
            <div className="dtt" id="dtt">
              {drillContent.t}
            </div>
            <div className="dsu" id="dsu">
              {drillContent.s}
            </div>
          </div>
          <button type="button" className="dbk" onClick={closeDrill}>
            <X size={13} />
          </button>
        </div>
        <div className="dbd" id="dbd" dangerouslySetInnerHTML={{ __html: drillContent.b }} />
        {drillContent.f && (
          <div className="dft" id="dft" ref={footerRef} dangerouslySetInnerHTML={{ __html: drillContent.f }} />
        )}
      </div>
    </>
  );
};
