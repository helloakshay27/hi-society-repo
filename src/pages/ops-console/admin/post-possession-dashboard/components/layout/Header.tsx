import React, { useMemo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronsUpDown, Home, LogOut, Search } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { SOCIETY_SUBTITLE } from '../../data/mockData';
import { clearAuth, getUser } from '@/utils/auth';
import { permissionService } from '@/services/permissionService';
import { useDashboard } from '../../context/DashboardContext';
import type { DateGrain } from '../../types';
import { HeaderDatePicker } from './HeaderDatePicker';

const DATE_GRAINS: [DateGrain, string][] = [
  ['today', 'Today'],
  ['week', 'This week'],
  ['month', 'This month'],
  ['range', 'Custom'],
];

const getUserDisplay = (): { initials: string; name: string } => {
  let user: ReturnType<typeof getUser> = null;
  try {
    user = getUser();
  } catch {
    user = null;
  }
  const first = user?.firstname?.trim() ?? '';
  const last = user?.lastname?.trim() ?? '';
  const name = [first, last].filter(Boolean).join(' ') || user?.email || '';
  const initials =
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() ||
    (user?.email ? user.email.charAt(0).toUpperCase() : '');
  return { initials: initials || '?', name };
};

export const Header: React.FC = () => {
  const { initials: userInitials, name: userName } = useMemo(getUserDisplay, []);
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePos, setProfilePos] = useState({ top: 0, right: 12 });
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const trigger = profileTriggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setProfilePos({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
    }
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileTriggerRef.current?.contains(target) || profileMenuRef.current?.contains(target)) return;
      setProfileOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    const close = () => setProfileOpen(false);
    const timer = window.setTimeout(() => document.addEventListener('mousedown', onMouseDown), 0);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    navigate('/login');
    permissionService.clearUserData();
    clearAuth();
    window.location.reload();
  };
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
    towerOptions,
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
          onClick={() => setSocietyPickerOpen((open) => !open)}
        >
          <span className="soc-text">
            <span className="soc-n">{selectedSociety?.name ?? (societies.length === 0 ? 'Loading…' : 'Select society')}</span>
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
          {towerOptions.map((tower) => (
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
          ref={profileTriggerRef}
          type="button"
          className="av"
          onClick={() => setProfileOpen((open) => !open)}
          aria-label={userName ? `Profile menu — ${userName}` : 'Profile menu'}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          title={userName || undefined}
        >
          {userInitials}
        </button>
        {profileOpen &&
          createPortal(
            <div
              ref={profileMenuRef}
              role="menu"
              className="profile-menu-popover"
              style={{ top: profilePos.top, right: profilePos.right }}
            >
              {userName && <div className="profile-menu-name">{userName}</div>}
              <button
                type="button"
                role="menuitem"
                className="profile-menu-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/');
                }}
              >
                <Home size={15} aria-hidden strokeWidth={1.8} />
                <span>Back to Home</span>
              </button>
              <button type="button" role="menuitem" className="profile-menu-item danger" onClick={handleLogout}>
                <LogOut size={15} aria-hidden strokeWidth={1.8} />
                <span>Logout</span>
              </button>
            </div>,
            document.body
          )}
      </div>
    </header>
  );
};
