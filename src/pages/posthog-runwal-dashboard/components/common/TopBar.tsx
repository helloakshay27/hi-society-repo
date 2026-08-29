import React, { useState, useMemo, useEffect, useRef } from 'react';

interface TopBarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isNavCollapsed: boolean;
  onToggleNav: () => void;
  onBack?: () => void;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  orgName?: string;
  siteName?: string;
  isFetching?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  theme,
  onToggleTheme,
  isNavCollapsed,
  onToggleNav,
  onBack,
  userName = 'User',
  userRole = 'Administrator',
  userEmail,
  orgName = 'Runwal Group',
  siteName,
  isFetching = false,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute initials for avatar
  const initials = useMemo(() => {
    const parts = (userName || '').trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'RW';
  }, [userName]);

  return (
    <header className="topbar">
      <button
        className="iconbtn nav-toggle"
        id="navToggle"
        onClick={onToggleNav}
        aria-label={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-expanded={!isNavCollapsed}
        title={isNavCollapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
          <line x1="8" y1="3.5" x2="8" y2="16.5" />
        </svg>
      </button>

      <button
        className="back"
        onClick={onBack || (() => window.history.back())}
        aria-label="Back"
        title="Go back"
      >
        ←
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="topbar-title">{orgName} · Post Sales Analytics</span>
        {siteName && siteName !== 'All Live Sites / Projects' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--blue, #2c7be5)',
              background: 'var(--blue-tint, #e7effc)',
              border: '1px solid var(--blue-fill, #cfe1f8)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {siteName}
          </span>
        )}
      </div>

      <div className="spacer"></div>

      <span
        className="badge-live"
        title="Live telemetry active from PostHog & FM Matrix API endpoints"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11.5px',
          fontWeight: 500,
          color: 'var(--pos, #0f8a3d)',
          background: 'var(--green-tint, #e2efe6)',
          border: '1px solid rgba(15, 138, 61, 0.25)',
          borderRadius: '20px',
          padding: '3px 10px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--pos, #0f8a3d)',
            boxShadow: '0 0 0 2px rgba(15, 138, 61, 0.25)',
          }}
        ></span>
        <span>{isFetching ? 'Syncing data...' : 'Live Telemetry'}</span>
      </span>

      <span className="rule"></span>

      <button
        className="iconbtn"
        id="themeBtn"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {theme === 'dark' ? (
          <svg
            className="i-sun"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="10" cy="10" r="3.6" />
            <path d="M10 1.8v1.7M10 16.5v1.7M18.2 10h-1.7M3.5 10H1.8M15.8 4.2l-1.2 1.2M5.4 14.6l-1.2 1.2M15.8 15.8l-1.2-1.2M5.4 5.4 4.2 4.2" />
          </svg>
        ) : (
          <svg
            className="i-moon"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16.5 11.8A7 7 0 0 1 8.2 3.5a7 7 0 1 0 8.3 8.3Z" />
          </svg>
        )}
      </button>

      {/* Dynamic Logged-in User Profile Header Trigger */}
      <div style={{ position: 'relative' }} ref={profileRef}>
        <button
          type="button"
          onClick={() => setShowProfile((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--surface-2, #f5f4f1)',
            border: '1px solid var(--border, #e6e4de)',
            borderRadius: '20px',
            padding: '3px 10px 3px 4px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={`${userName} (${userRole})`}
          aria-expanded={showProfile}
        >
          <div
            className="avatar"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--blue, #2c7be5)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--ink, #141413)',
                maxWidth: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </span>
            <span
              style={{
                fontSize: '10px',
                color: 'var(--muted, #6f6e68)',
                fontWeight: 400,
              }}
            >
              {userRole}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--faint, #9b9990)', marginLeft: '1px' }}>▾</span>
        </button>

        {showProfile && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '230px',
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e6e4de)',
              borderRadius: 'var(--r, 12px)',
              boxShadow: 'var(--shadow-pop, 0 10px 34px rgba(0, 0, 0, 0.15))',
              padding: '14px',
              zIndex: 100,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--blue, #2c7be5)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '13px',
                    color: 'var(--ink, #141413)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted, #6f6e68)' }}>
                  {userRole}
                </div>
              </div>
            </div>

            {userEmail && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted, #6f6e68)',
                  background: 'var(--surface-2, #f5f4f1)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  wordBreak: 'break-all',
                  marginBottom: '8px',
                }}
              >
                📧 {userEmail}
              </div>
            )}

            <div
              style={{
                paddingTop: '8px',
                borderTop: '1px solid var(--border, #e6e4de)',
                fontSize: '11px',
                color: 'var(--muted, #6f6e68)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Organization</span>
              <span style={{ fontWeight: 600, color: 'var(--ink, #141413)' }}>{orgName}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

