import { Card, CardHead } from '../components/Card';
import { Tile } from '../components/Tile';
import { TileSkeleton, FunnelSkeleton, TableSkeleton } from '../components/Skeleton';
import { Funnel } from '../components/Funnel';
import { ScreensTable } from '../components/tables/ScreensTable';
import { EntryScreensTable } from '../components/tables/EntryScreensTable';
import { useSmartSecureDashboard } from '../context/DashboardContext';

function formatModuleName(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** Skeleton placeholder for the module pills bar */
function ModulePillsSkeleton() {
  const widths = [90, 105, 80, 85, 75, 80, 125, 90, 100, 95];
  return (
    <div className="mod-pills-bar" aria-busy="true">
      {widths.map((w, i) => (
        <span
          key={i}
          className="mod-pill mod-pill-skeleton ss-skeleton"
          style={{ width: w, height: 32, borderRadius: 9999, display: 'inline-block' }}
        />
      ))}
    </div>
  );
}

/** Displays "All Modules" and the modules API tree as clickable rounded pills matching the design */
function ModulePills() {
  const { modules, isModulesLoading, selectedModule, setSelectedModule } = useSmartSecureDashboard();

  if (isModulesLoading) return <ModulePillsSkeleton />;

  return (
    <div className="mod-pills-bar" role="tablist" aria-label="Workflow Modules">
      <button
        type="button"
        className={`mod-pill${!selectedModule ? ' on' : ''}`}
        onClick={() => setSelectedModule(null)}
        role="tab"
        aria-selected={!selectedModule}
      >
        All Modules
      </button>

      {modules.map((mod) => {
        const isSelected = selectedModule === mod.name;
        const formattedName = formatModuleName(mod.name);
        const usersCount = mod.users ?? 0;
        return (
          <button
            key={mod.name}
            type="button"
            className={`mod-pill${isSelected ? ' on' : ''}`}
            onClick={() => setSelectedModule(isSelected ? null : mod.name)}
            role="tab"
            aria-selected={isSelected}
            title={`${formattedName} (${usersCount} users)`}
          >
            {formattedName}{usersCount}
          </button>
        );
      })}
    </div>
  );
}

export function WorkflowSection() {
  const { flows, isFlowsLoading, selectedModule } = useSmartSecureDashboard();
  const { workflow: w, scopeNote } = flows;
  const currentModuleName = selectedModule ? formatModuleName(selectedModule) : 'All Modules';

  return (
    <section className="page on" id="pgFlows">
      <div className="section-head">
        <h2>Workflow Usage</h2>
        <span className="sd">
          User completion of key app workflows per module, all-modules comparison, and where sessions enter &amp; exit.
        </span>
      </div>

      {/* Module selector pills — sourced from the real modules API */}
      <ModulePills />

      {isFlowsLoading ? (
        <TileSkeleton count={4} cols={4} />
      ) : (
        <div className="tiles" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {flows.tiles.map((t) => <Tile key={t.label} {...t} />)}
        </div>
      )}

      {scopeNote && (
        <div className="bmnote crashnote" style={{ marginTop: 16 }}>
          <span>⚠</span>
          <div>
            <b>{scopeNote.kind === 'proposed' ? 'Proposed workflow — not yet in the PostHog catalogue.' : 'Known gap vs. the actual product flow.'}</b>{' '}
            {scopeNote.text}
          </div>
        </div>
      )}

      <Card
        style={{ margin: '16px 0' }}
        infoKey="F-step"
        head={
          <CardHead
            cr={w.proposed ? 'Workflow funnel (proposed event sequence)' : 'Workflow funnel (real event sequence)'}
            ct={`${currentModuleName} — completion funnel`}
            cd={
              w.proposed
                ? 'Shows step-by-step completion and drop-off for the selected workflow, using proposed (not yet confirmed) event names in sequence.'
                : 'Shows step-by-step completion and drop-off for the selected workflow, using the real PostHog event names in sequence.'
            }
          />
        }
      >
        {isFlowsLoading ? (
          <FunnelSkeleton steps={w.steps.length || 4} />
        ) : (
          <Funnel funnel={flows.funnel} />
        )}
      </Card>

      <Card
        style={{ marginTop: 12 }}
        infoKey="F-scr"
        bodyClassName="tbl-wrap"
        head={<CardHead cr="All screens in this module" ct={`All screens in ${currentModuleName}`} cd={`Every screen path inside ${currentModuleName}, with users, events, sessions and completion rate for each.`} />}
      >
        {isFlowsLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : (
          <ScreensTable rows={flows.screens} />
        )}
      </Card>

      <Card
        style={{ marginTop: 12 }}
        infoKey="F-entry"
        bodyClassName="tbl-wrap"
        head={<CardHead cr="Top entry screens" ct="Top entry screens" cd="The first screen seen in each session — usually reached via push notification, deep link, or the app icon." />}
      >
        {isFlowsLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : (
          <EntryScreensTable rows={flows.entryScreens} />
        )}
      </Card>
    </section>
  );
}
