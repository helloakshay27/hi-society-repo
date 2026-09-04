import React from 'react';
import { KPI_STRIP } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';

export const KpiStrip: React.FC = () => {
  const { setActiveTab, openDrill } = useDashboard();

  return (
    <div
      className="kstrip"
      style={{ gridTemplateColumns: `repeat(${KPI_STRIP.length}, minmax(0, 1fr))` }}
    >
      {KPI_STRIP.map((item) => (
        <div
          key={item.id}
          className={`ks-item alert ${item.alertClass}`}
          onClick={() => {
            setActiveTab(item.tabId);
            window.setTimeout(() => openDrill(item.drillKey), 120);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="ks-label">{item.label}</div>
          <div className="ks-val">
            {item.value}
            {item.suffix && <em>{item.suffix}</em>}
          </div>
          <div className={`ks-trend ${item.trendClass}`}>{item.trend}</div>
        </div>
      ))}
    </div>
  );
};
