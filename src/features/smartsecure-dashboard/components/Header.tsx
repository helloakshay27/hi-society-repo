import { Menu, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartSecureDashboard } from '../context/DashboardContext';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, setTheme, setNavCollapsed, appName } = useSmartSecureDashboard();
  const isQuikgate = appName === 'QuikGate' || location.pathname.includes('quickgate') || location.pathname.includes('quikgate');

  return (
    <header className="topbar">
      <button
        className="iconbtn nav-toggle"
        onClick={() => setNavCollapsed(!state.navCollapsed)}
        aria-label={state.navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        title={state.navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
      >
        <Menu size={17} />
      </button>
      <button className="back" aria-label="Back" onClick={() => navigate(-1)}>
        <ArrowLeft size={17} />
      </button>
      <span className="topbar-title">{isQuikgate ? 'QuikGate Analytics' : 'SmartSecure Analytics'}</span>
      <div className="spacer" />
      <span className="rule" />
      <button
        className="iconbtn"
        onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        aria-label={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
        title={`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`}
      >
        {state.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <span className="badge-sample">Wireframe · sample data</span>
      <div className="avatar">{isQuikgate ? 'QG' : 'SS'}</div>
    </header>
  );
}
