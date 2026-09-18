import React from 'react';
import { ModuleNode } from '../../api/types';

interface ModuleNavProps {
  modules: ModuleNode[];
  selectedModule: string | null;
  onSelectModule: (moduleName: string | null) => void;
  isLoading?: boolean;
}

// "main_home6" -> "Main Home 6" — display only; onSelectModule/selection
// comparisons keep using the raw m.name.
export const formatModuleName = (name: string) => {
  const spaced = name.replace(/_/g, ' ').replace(/([a-zA-Z])(\d)/g, '$1 $2');
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ModuleNav: React.FC<ModuleNavProps> = ({
  modules,
  selectedModule,
  onSelectModule,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="mnav" style={{ opacity: 0.6 }}>
        <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--muted)' }}>
          Loading module catalogue...
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return null;
  }

  return (
    <div
      className="mnav"
      id="modNav"
      title="Choose a module to inspect its completion funnel and flows"
      style={{ marginBottom: '14px' }}
    >
      <div className="mnav-mods">
        <div className="segbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <button
            type="button"
            className={selectedModule === null ? 'on' : ''}
            onClick={() => onSelectModule(null)}
          >
            All Modules
          </button>
          {modules.map((m) => (
            <button
              key={m.name}
              type="button"
              className={selectedModule === m.name ? 'on' : ''}
              onClick={() => onSelectModule(m.name)}
              title={`${m.users ? m.users.toLocaleString() + ' users' : ''}`}
            >
              {formatModuleName(m.name)}
              {m.users > 0 && <span className="mcount" style={{ marginLeft: '4px' }}>{m.users}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
