import React from 'react';

interface HeaderProps {
  navCollapsed: boolean;
  onToggleNav: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isLive?: boolean;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  navCollapsed,
  onToggleNav,
  theme,
  onToggleTheme,
  isLive = false,
  isRefreshing = false
}) => {
  return (
    <header className="topbar">
      <button
        className="iconbtn nav-toggle"
        id="navToggle"
        aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-expanded={!navCollapsed}
        title={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        onClick={onToggleNav}
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
        aria-label="Back"
        onClick={() => window.history.back()}
      >
        &#8592;
      </button>

      <span className="topbar-title">Lockated Analytics</span>

      <div className="spacer" />
      <span className="rule" />

      <button
        className="iconbtn"
        id="themeBtn"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        onClick={onToggleTheme}
      >
        {theme === 'light' ? (
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
        ) : (
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
        )}
      </button>

      {isRefreshing ? (
        <span className="badge-sample" style={{ color: 'var(--blue)' }}>
          Syncing data...
        </span>
      ) : isLive ? (
        <span
          className="badge-sample"
          style={{
            color: 'var(--green)',
            borderColor: 'rgba(15, 138, 61, 0.3)',
            background: 'var(--green-tint)',
            fontWeight: 500
          }}
        >
          ● Live API Data
        </span>
      ) : (
        <span className="badge-sample">API data unavailable</span>
      )}
      <div className="avatar">LK</div>
    </header>
  );
};
