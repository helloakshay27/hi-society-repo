import React from 'react';
import { ModuleNode } from '../../api/types';

interface ModuleNavProps {
  modules: ModuleNode[];
  subModules: ModuleNode[];
  selectedModule: string | null;
  selectedSubModule: string | null;
  onSelectModule: (moduleName: string | null) => void;
  onSelectSubModule: (subModuleName: string) => void;
  isLoading?: boolean;
  isSubModulesLoading?: boolean;
}

const VISIBLE_ITEMS = 8;

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
  subModules,
  selectedModule,
  selectedSubModule,
  onSelectModule,
  onSelectSubModule,
  isLoading,
  isSubModulesLoading,
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

  const shownModules = modules.slice(0, VISIBLE_ITEMS);
  const restModules = modules.slice(VISIBLE_ITEMS);
  const selectedModuleIsHidden = !!selectedModule && !shownModules.some((module) => module.name === selectedModule);
  const shownSubModules = subModules.slice(0, VISIBLE_ITEMS);
  const restSubModules = subModules.slice(VISIBLE_ITEMS);
  const selectedSubModuleIsHidden =
    !!selectedSubModule && !shownSubModules.some((subModule) => subModule.name === selectedSubModule);

  return (
    <div
      className="mnav"
      id="modNav"
      title="Choose a module and submodule to inspect its completion funnel and flows"
      style={{ marginBottom: '14px' }}
    >
      <div className="mnav-buckets">
        {shownModules.map((module) => (
          <button
            key={module.name}
            type="button"
            className={selectedModule === module.name ? 'on' : ''}
            onClick={() => onSelectModule(module.name)}
            title={`${module.users.toLocaleString()} users · ${module.sessions.toLocaleString()} sessions`}
          >
            {formatModuleName(module.name)}
          </button>
        ))}
        {restModules.length > 0 && (
          <select
            className="mmore"
            aria-label="More modules"
            value={selectedModuleIsHidden ? selectedModule : ''}
            onChange={(event) => {
              if (event.target.value) onSelectModule(event.target.value);
            }}
          >
            <option value="">More ({restModules.length})…</option>
            {restModules.map((module) => (
              <option key={module.name} value={module.name}>
                {formatModuleName(module.name)}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedModule && (
        <div className="mnav-mods">
          <div className="segbar">
            {isSubModulesLoading ? (
              <span className="mnav-loading">Loading submodules…</span>
            ) : (
              <>
                {shownSubModules.map((subModule) => (
                  <button
                    key={subModule.name}
                    type="button"
                    className={selectedSubModule === subModule.name ? 'on' : ''}
                    onClick={() => onSelectSubModule(subModule.name)}
                    title={`${subModule.users.toLocaleString()} users · ${subModule.events.toLocaleString()} events`}
                  >
                    {formatModuleName(subModule.name)}
                  </button>
                ))}
                {restSubModules.length > 0 && (
                  <select
                    className="mmore"
                    aria-label="More submodules"
                    value={selectedSubModuleIsHidden ? selectedSubModule : ''}
                    onChange={(event) => {
                      if (event.target.value) onSelectSubModule(event.target.value);
                    }}
                  >
                    <option value="">More ({restSubModules.length})…</option>
                    {restSubModules.map((subModule) => (
                      <option key={subModule.name} value={subModule.name}>
                        {formatModuleName(subModule.name)}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
