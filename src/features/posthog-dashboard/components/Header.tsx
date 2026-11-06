import { useDashboard } from '../context/DashboardContext';
import type { Tier } from '../data/constants';
import { Menu, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserProfileMenu } from './UserProfileMenu';

const TIER_OPTIONS: { value: Tier; label: string; hint: string }[] = [
  { value: 't1', label: 'Site Manager', hint: 'One or more sites' },
  // { value: 't2', label: 'Regional', hint: 'One company and all of its sites' },
  { value: 't3', label: 'Management', hint: 'All sites for the organisation' },
];
export function Header() {
  const navigate = useNavigate();
  const { vm, setTier, setTheme, setNavCollapsed } = useDashboard();
  const { state } = vm;
  const tierAvailable = (t: Tier) => t === 't1' || t === 't3';

  return (
    <header className="topbar">
      <button 
        className="iconbtn nav-toggle" 
        onClick={() => setNavCollapsed(!state.navCollapsed)}
        aria-label="Collapse navigation" 
        title="Collapse navigation"
      >
        <Menu size={17} />
      </button>
      <button className="back" aria-label="Back" onClick={() => navigate(-1)}>
        <ArrowLeft size={17} />
      </button>
      <span className="topbar-title">Adoption Analytics</span>
      <div className="spacer"></div>

      <div className="topbar-tier">
        <span className="tt-label">View as</span>
        <div className="seg tier" role="group" aria-label="View as">
          {TIER_OPTIONS.map((t) => (
            <button
              key={t.value}
              className={state.tier === t.value ? 'on' : ''}
              disabled={!tierAvailable(t.value)}
              title={tierAvailable(t.value) ? t.hint : 'Needs a company grouping'}
              onClick={() => tierAvailable(t.value) && setTier(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <span className="rule"></span>
      <button 
        className="iconbtn" 
        onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        aria-label="Switch theme" 
        title="Switch theme"
      >
        {state.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      
      {vm.generatedAt ? (
        <span className="badge-sample" title={`generated_at: ${vm.generatedAt}`}>
          Live API
        </span>
      ) : (
        <span className="badge-sample">Awaiting API data</span>
      )}
      
      <UserProfileMenu />
    </header>
  );
}
