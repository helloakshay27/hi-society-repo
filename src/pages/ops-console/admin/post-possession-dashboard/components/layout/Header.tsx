import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Check, ChevronsUpDown, Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SOCIETY_NAME, SOCIETY_SUBTITLE, TOWER_FILTERS, USER_INITIALS } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';
import type { DateGrain } from '../../types';
import { HeaderDatePicker } from './HeaderDatePicker';

const DATE_GRAINS: [DateGrain, string][] = [
  ['today', 'Today'],
  ['week', 'This week'],
  ['month', 'This month'],
  ['range', 'Custom'],
];

export const Header: React.FC = () => {
  const [societyPickerOpen, setSocietyPickerOpen] = useState(false);
  const [societyPopupPosition, setSocietyPopupPosition] = useState({
    top: 0,
    left: 0,
    width: 320,
    maxHeight: 380,
  });
  const societyTriggerRef = useRef<HTMLButtonElement>(null);
  const societyPopupRef = useRef<HTMLDivElement>(null);
  const {
    societyId,
    societies,
    selectSociety,
    towerFilter,
    setTowerFilter,
    dateGrain,
    setDateGrain,
    toast,
  } = useDashboard();
  const selectedSociety = societies.find((society) => society.id === societyId);
  const availableSocietyId = selectedSociety?.id ?? '';
  const positionSocietyPopup = useCallback(() => {
    const trigger = societyTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(380, openAbove ? spaceAbove : spaceBelow));
    const top = openAbove ? rect.top - maxHeight - 6 : rect.bottom + 6;
    setSocietyPopupPosition({ top, left, width, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (societyPickerOpen) positionSocietyPopup();
  }, [societyPickerOpen, positionSocietyPopup]);

  useEffect(() => {
    if (!societyPickerOpen) return;

    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (societyTriggerRef.current?.contains(target) || societyPopupRef.current?.contains(target)) {
        return;
      }
      setSocietyPickerOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSocietyPickerOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDocumentMouseDown);
    }, 0);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', positionSocietyPopup);
    window.addEventListener('scroll', positionSocietyPopup, true);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', positionSocietyPopup);
      window.removeEventListener('scroll', positionSocietyPopup, true);
    };
  }, [societyPickerOpen, positionSocietyPopup]);

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
        <button
          ref={societyTriggerRef}
          type="button"
          className="soc"
          aria-label="Select society"
          aria-expanded={societyPickerOpen}
          aria-controls="society-picker"
          disabled={societies.length === 0}
          onClick={() => setSocietyPickerOpen((open) => !open)}
        >
          <span className="soc-text">
            <span className="soc-n">{selectedSociety?.name ?? SOCIETY_NAME}</span>
            <span className="soc-s">{SOCIETY_SUBTITLE}</span>
          </span>
          <ChevronsUpDown size={16} className="soc-caret" aria-hidden strokeWidth={1.8} />
        </button>
        {societyPickerOpen &&
          createPortal(
            <div
              ref={societyPopupRef}
              id="society-picker"
              className="society-picker-popover"
              style={societyPopupPosition}
              onWheel={(event) => event.stopPropagation()}
            >
              <Command className="society-picker-command" label="Search societies">
                <CommandInput placeholder="Search societies..." autoFocus />
                <CommandList className="society-picker-list">
                  <CommandEmpty className="society-picker-empty">No societies found.</CommandEmpty>
                  <CommandGroup>
                    {societies.map((society) => (
                      <CommandItem
                        key={society.id}
                        value={`${society.name} ${society.id}`}
                        onSelect={() => {
                          selectSociety(society.id);
                          setSocietyPickerOpen(false);
                          toast(`Switched to ${society.name}`, 'ok');
                        }}
                        className="society-picker-item"
                      >
                        <Check
                          className={`society-picker-check${availableSocietyId === society.id ? ' selected' : ''}`}
                          aria-hidden
                        />
                        <span>{society.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>,
            document.body
          )}
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
          <Search size={16} className="sb-ico" aria-hidden strokeWidth={1.8} />
          <input type="text" size={40} placeholder="Search tickets, visitors, members" />
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
