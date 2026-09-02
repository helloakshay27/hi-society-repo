import React from 'react';
import { Bell, Building2, ChevronsUpDown, Search } from 'lucide-react';
import { SOCIETY_NAME, SOCIETY_SUBTITLE, TOWER_FILTERS, USER_INITIALS } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';
import type { DateGrain } from '../../types';
import { HeaderDatePicker } from './HeaderDatePicker';

const DATE_GRAINS: [DateGrain, string][] = [
  ['today', 'Today'],
  ['week', 'This Week'],
  ['month', 'This Month'],
  ['range', 'Custom Range'],
];

export const Header: React.FC = () => {
  const { towerFilter, setTowerFilter, dateGrain, setDateGrain, toast } = useDashboard();

  return (
    <header className="hdr">
      <div className="hdr-main">
        <a className="logo" href="#" onClick={(e) => e.preventDefault()}>
          <div className="lm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2L14 6V14H10V10H6V14H2V6L8 2Z" fill="white" />
            </svg>
          </div>
          <span className="lt">HiSociety</span>
        </a>
        <div className="sep" />
        <div className="soc" onClick={() => toast('Society selector', 'd')} role="button" tabIndex={0}>
          <Building2 size={12} className="soc-ico" aria-hidden />
          <div className="soc-text">
            <div className="soc-n">{SOCIETY_NAME}</div>
            <div className="soc-s">{SOCIETY_SUBTITLE}</div>
          </div>
          <ChevronsUpDown size={11} className="soc-caret" aria-hidden />
        </div>
        <div className="tw">
          {TOWER_FILTERS.map((tower) => (
            <button
              key={tower}
              type="button"
              className={`tp${towerFilter === tower ? ' on' : ''}`}
              onClick={() => {
                setTowerFilter(tower);
                toast(`Filtered to Tower ${tower}`, 'd');
              }}
            >
              {tower}
            </button>
          ))}
        </div>
        <div className="hg" />
        <div className="sb">
          <Search size={12} className="sb-ico" aria-hidden />
          <input type="text" size={40} placeholder="Search tickets, visitors, members…" />
        </div>
        <div className="tw-f">
          {DATE_GRAINS.map(([grain, label]) => (
            <button
              key={grain}
              type="button"
              className={`tf-btn${dateGrain === grain ? ' on' : ''}`}
              onClick={() => setDateGrain(grain)}
            >
              {label}
            </button>
          ))}
        </div>
        <HeaderDatePicker dateGrain={dateGrain} />
      </div>
      <div className="hdr-end">
        <button type="button" className="ib" onClick={() => toast('3 new alerts', 'd')} aria-label="Notifications">
          <Bell size={15} />
          <span className="nd" />
        </button>
        <div className="lv">
          <span className="ld" />
          Live
        </div>
        <button
          type="button"
          className="av"
          onClick={() => toast('Profile settings', 'd')}
          aria-label="Profile settings"
        >
          {USER_INITIALS}
        </button>
      </div>
    </header>
  );
};
