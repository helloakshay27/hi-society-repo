import React from 'react';
import { ModuleNode } from '../../api/types';

interface ModuleNavProps {
  modules: ModuleNode[];
  selectedModule: string | null;
  onSelectModule: (moduleName: string | null) => void;
  isLoading?: boolean;
  selectedSubModule?: string | null;
  onSelectSubModule?: (subModuleKey: string | null) => void;
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
  selectedSubModule,
  onSelectSubModule,
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

  // Modules with sub-modules: modules as tabs with a count, the selected one's sub-modules as pills.
  if (modules.some((m) => m.key)) {
    const subModules = modules.find((m) => m.key === selectedModule)?.sub_modules;
    return (
      <div
        className="mnav"
        id="modNav"
        title="Choose a module to inspect its completion funnel and flows"
      >
        <div className="mnav-buckets">
          <button
            type="button"
            className={selectedModule === null ? 'on' : ''}
            onClick={() => onSelectModule(null)}
          >
            All Modules
          </button>
          {modules.map((m) => (
            <button
              key={m.key}
              type="button"
              className={selectedModule === m.key ? 'on' : ''}
              onClick={() => onSelectModule(m.key ?? m.name)}
              title={`${m.users.toLocaleString()} users`}
            >
              {m.name}
              <span className="mcount">{m.sub_modules?.length ?? 0}</span>
            </button>
          ))}
        </div>
        {subModules && subModules.length > 0 && (
          <div className="mnav-mods">
            <div className="segbar">
              <button
                type="button"
                className={selectedSubModule == null ? 'on' : ''}
                onClick={() => onSelectSubModule?.(null)}
              >
                All
              </button>
              {subModules.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={selectedSubModule === s.key ? 'on' : ''}
                  onClick={() => onSelectSubModule?.(s.key)}
                  title={`${s.users.toLocaleString()} users`}
                >
                  {formatModuleName(s.name)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
