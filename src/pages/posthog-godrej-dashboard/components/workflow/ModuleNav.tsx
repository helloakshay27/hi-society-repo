import React from 'react';
import { ModuleNode } from '../../../posthog-runwal-dashboard/api/types';

interface ModuleNavProps {
  modules: ModuleNode[];
  selectedModule: string | null;
  onSelectModule: (moduleName: string | null) => void;
  isLoading?: boolean;
}

/**
 * Bucket-tabs + module chips, matching the wireframe's .mnav-buckets/.mnav-mods
 * two-row layout. The real API's module list carries no bucket/category field,
 * so all real modules are grouped under a single "All Modules" bucket rather
 * than the wireframe's fixed 5-bucket taxonomy (which is specific to a fictional
 * sample catalogue, not the connected PostHog project).
 */
export const ModuleNav: React.FC<ModuleNavProps> = ({ modules, selectedModule, onSelectModule, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mnav" style={{ opacity: 0.6 }}>
        <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--muted)' }}>Loading module catalogue...</div>
      </div>
    );
  }

  if (!modules || modules.length === 0) return null;

  return (
    <div className="mnav" id="modNav" title="Choose a module — this filter applies to the per-module cards only">
      <div className="mnav-buckets">
        <button type="button" className="on">
          All Modules
          <span className="mcount">{modules.length}</span>
        </button>
      </div>
      <div className="mnav-mods">
        <div className="segbar">
          <button type="button" className={selectedModule === null ? 'on' : ''} onClick={() => onSelectModule(null)}>
            All Modules
          </button>
          {modules.map((m) => (
            <button key={m.name} type="button" className={selectedModule === m.name ? 'on' : ''} onClick={() => onSelectModule(m.name)}>
              {m.name}
              {m.users > 0 && <span className="mcount">{m.users}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
