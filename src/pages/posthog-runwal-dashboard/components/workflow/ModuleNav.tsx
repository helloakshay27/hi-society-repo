import React from 'react';
import { ModuleNode } from '../../api/types';

interface ModuleNavProps {
  modules: ModuleNode[];
  subModules: ModuleNode[];
  selectedModule: string | null;
  selectedSubModule: string | null;
  onSelectModule: (moduleName: string | null) => void;
  /** null = the whole module. */
  onSelectSubModule: (subModuleKey: string | null) => void;
  isLoading?: boolean;
  isSubModulesLoading?: boolean;
}

// Every module and sub-module gets its own button: each row is one line that scrolls sideways (see .mnav-buckets).
const VISIBLE_ITEMS = Infinity;

// "main_home6" -> "Main Home 6" — display only; selections use raw keys/names.
export const formatModuleName = (name: string) => {
  const spaced = name.replace(/_/g, ' ').replace(/([a-zA-Z])(\d)/g, '$1 $2');
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const moduleValue = (module: ModuleNode) => module.key ?? module.name;

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

  if (!modules.length) return null;

  const shownModules = modules.slice(0, VISIBLE_ITEMS);
  const restModules = modules.slice(VISIBLE_ITEMS);
  const selectedModuleIsHidden = !!selectedModule && !shownModules.some((module) => moduleValue(module) === selectedModule);
  const shownSubModules = subModules.slice(0, VISIBLE_ITEMS);
  const restSubModules = subModules.slice(VISIBLE_ITEMS);
  const selectedSubModuleIsHidden =
    !!selectedSubModule &&
    !shownSubModules.some((subModule) => moduleValue(subModule) === selectedSubModule);

  return (
    <div
      className="mnav"
      id="modNav"
      title="Choose a module and submodule to inspect its completion funnel and flows"
      style={{ marginBottom: '14px' }}
    >
      <div className="mnav-buckets">
        <button
          type="button"
          className={selectedModule === null ? 'on' : ''}
          onClick={() => onSelectModule(null)}
          title="Every module side by side"
        >
          All Modules
        </button>
        {shownModules.map((module) => (
          <button
            key={moduleValue(module)}
            type="button"
            className={selectedModule === moduleValue(module) ? 'on' : ''}
            onClick={() => onSelectModule(moduleValue(module))}
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
              <option key={moduleValue(module)} value={moduleValue(module)}>
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
                <button
                  type="button"
                  className={selectedSubModule === null ? 'on' : ''}
                  onClick={() => onSelectSubModule(null)}
                >
                  All
                </button>
                {shownSubModules.map((subModule) => (
                  <button
                    key={moduleValue(subModule)}
                    type="button"
                    className={selectedSubModule === moduleValue(subModule) ? 'on' : ''}
                    onClick={() => onSelectSubModule(moduleValue(subModule))}
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
                      <option key={moduleValue(subModule)} value={moduleValue(subModule)}>
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
