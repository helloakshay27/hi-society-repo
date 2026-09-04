import React from 'react';
import { FILTER_CHIPS } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';

export const FilterBar: React.FC = () => {
  const { activeChip, setActiveChip, setActiveTab, openDrill } = useDashboard();

  return (
    <div className="fbar" id="fbar">
      <div className="fbar-row2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`qchip ${chip.chipClass}${activeChip === chip.key ? ' on' : ''}`}
            id={`qc-${chip.key}`}
            onClick={() => {
              const isOn = activeChip === chip.key;
              setActiveChip(isOn ? null : chip.key);
              setActiveTab(chip.tabId);
              window.setTimeout(() => openDrill(chip.drillKey), 120);
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
