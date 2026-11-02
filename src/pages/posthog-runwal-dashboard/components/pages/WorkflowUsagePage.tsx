import React, { useState, useEffect } from 'react';
import { DashboardFilters } from '../../api/types';
import { KpiTile } from '../common/KpiTile';
import { Card } from '../common/Card';
import { ModuleNav, formatModuleName } from '../workflow/ModuleNav';
import { WorkflowFunnel } from '../workflow/WorkflowFunnel';
import { AllScreensTable, EntryScreensTable } from '../workflow/ScreensTable';
import { ErrorState } from '../common/DashboardStates';
import { FunnelSkeleton, TableSkeleton } from '../common/Skeleton';
import {
  useModuleTree,
  useWorkflowUsage,
} from '../../hooks/useDashboardAnalytics';

interface WorkflowUsagePageProps {
  filters: DashboardFilters;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
  isRefreshing?: boolean;
}

export const WorkflowUsagePage: React.FC<WorkflowUsagePageProps> = ({
  filters,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
  isRefreshing = false,
}) => {

  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedSubModule, setSelectedSubModule] = useState<string | null>(null);

  const {
    data: moduleTreeData,
    isLoading: isModulesLoading,
  } = useModuleTree(filters, sitesSettled);

  const {
    data: wfData,
    isLoading: isWfLoading,
    isError: isWfError,
    error: wfError,
    refetch: refetchWf,
  } = useWorkflowUsage(filters, selectedModule, selectedSubModule, sitesSettled);

  // Refetch workflow usage when the selected module changes to ensure fresh data
  useEffect(() => {
    refetchWf();
  }, [selectedModule, selectedSubModule]);

  const isWfActiveLoading = isWfLoading || isRefreshing;
  const isModulesActiveLoading = isModulesLoading || isRefreshing;

  // Scopes whose app declares modules get screens arranged under them; others keep the flat tree.
  const hierarchy = moduleTreeData?.modules;
  const moduleList = hierarchy && hierarchy.length > 0 ? hierarchy : moduleTreeData?.tree || [];
  const selectedNode = moduleList.find((m) => (m.key ?? m.name) === selectedModule);

  const handleSelectModule = (moduleName: string | null) => {
    setSelectedModule(moduleName);
    setSelectedSubModule(null);
  };

  const kpis = wfData?.kpis;

  // Adoption KPI
  const fAdopt = kpis?.f_adopt?.value;
  const fAdoptDisplay =
    fAdopt != null
      ? `${Math.round(fAdopt)}%`
      : isWfActiveLoading
      ? '...'
      : '—';
  const fAdoptDelta = kpis?.f_adopt?.delta_pct;

  // Completion KPI
  const fComp = kpis?.f_comp?.value;
  const fCompDisplay =
    fComp != null
      ? `${Math.round(fComp)}%`
      : isWfActiveLoading
      ? '...'
      : '—';
  const fCompDelta = kpis?.f_comp?.delta_pct;

  // Biggest Step Drop
  const fStep = kpis?.f_step?.value;
  const fStepDisplay =
    fStep != null
      ? `${Math.round(fStep)}%`
      : isWfActiveLoading
      ? '...'
      : '—';

  // Volume KPI
  const fVol = kpis?.f_vol?.value;
  const fVolDisplay =
    fVol != null
      ? fVol.toLocaleString()
      : isWfActiveLoading
      ? '...'
      : '—';

  const funnelList = wfData?.funnel || [];
  const moduleFunnels = wfData?.module_funnels || [];
  const flowsList = wfData?.flows || [];
  const entryScreensList = wfData?.entry_screens || [];

  return (
    <section className="page on" id="pgFlows">
      <div className="section-head">
        <h2>Workflow Usage</h2>
        <span className="sd">
          Customer completion of key business workflows per module, step-by-step completion funnel, and entry screen behavior.
        </span>
      </div>

      <ModuleNav
        modules={moduleList}
        selectedModule={selectedModule}
        onSelectModule={handleSelectModule}
        isLoading={isModulesActiveLoading}
        selectedSubModule={selectedSubModule}
        onSelectSubModule={setSelectedSubModule}
      />

      {isWfError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState
            title="Failed to load Workflow Usage metrics"
            error={wfError}
            onRetry={() => refetchWf()}
          />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiTile
          id="wfAdoption"
          infoKey="F1"
          label="Workflow Adoption"
          val={fAdoptDisplay}
          dir={fAdoptDelta && fAdoptDelta > 0 ? 'up' : fAdoptDelta && fAdoptDelta < 0 ? 'dn' : 'flat'}
          delta={fAdoptDelta != null ? `${fAdoptDelta > 0 ? '+' : ''}${fAdoptDelta.toFixed(1)}%` : null}
          raw={fAdopt != null ? (fAdopt) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.wfAdoption}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isWfActiveLoading}
        />
        <KpiTile
          id="wfCompletion"
          infoKey="F2"
          label="Completion Rate"
          val={fCompDisplay}
          dir={fCompDelta && fCompDelta > 0 ? 'up' : fCompDelta && fCompDelta < 0 ? 'dn' : 'flat'}
          delta={fCompDelta != null ? `${fCompDelta > 0 ? '+' : ''}${fCompDelta.toFixed(1)}%` : null}
          raw={fComp != null ? (fComp) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.wfCompletion}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isWfActiveLoading}
        />
        <KpiTile
          infoKey="F3"
          label="Biggest Step Drop"
          val={fStepDisplay}
          dir="dn"
          delta={null}
          sub="highest single drop-off"
          noTarget={true}
          isLoading={isWfActiveLoading}
        />
        <KpiTile
          infoKey="F4"
          label="Usage Volume"
          val={fVolDisplay}
          dir="up"
          delta="this period"
          sub="sessions started"
          noTarget={true}
          isLoading={isWfActiveLoading}
        />
      </div>

      <Card
        id="card-wfFunnel"
        infoKey="chart.funnel"
        eyebrow="Workflow funnel (real event sequence)"
        title={`${selectedSubModule ? formatModuleName(selectedSubModule) : selectedNode?.key ? selectedNode.name : selectedModule ? formatModuleName(selectedModule) : moduleFunnels.length > 0 ? 'All Modules' : 'All Workflows'} — completion funnel`}
        purpose="Shows step-by-step completion and drop-off for the selected workflow, using real instrumented usage event sequences."
        style={{ margin: '16px 0' }}
      >
        {isWfActiveLoading ? (
          <FunnelSkeleton steps={4} />
        ) : moduleFunnels.length > 0 ? (
          <div className="tbl-wrap">
            <table className="pathtbl">
              <thead>
                <tr>
                  <th>Module</th>
                  <th className="num">Started</th>
                  <th className="num">Completed</th>
                  <th className="num">Completion</th>
                  <th className="num">Biggest Drop</th>
                </tr>
              </thead>
              <tbody>
                {moduleFunnels.map((f) => (
                  <tr key={f.key}>
                    <td className="strong">{f.name}</td>
                    <td className="num">{f.started.toLocaleString()}</td>
                    <td className="num">{f.completed.toLocaleString()}</td>
                    <td className="num">{Math.round(f.completion_pct)}%</td>
                    <td className="num">{Math.round(f.biggest_drop_pct)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <WorkflowFunnel funnel={funnelList} />
        )}
      </Card>

      <Card
        id="card-allScreens"
        infoKey="chart.screens"
        eyebrow="All screens & flows"
        title="All screens in this module"
        purpose="Every screen path inside this module with users, events, sessions and completion rate."
        style={{ marginTop: '12px' }}
      >
        {isWfActiveLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : (
          <AllScreensTable flows={flowsList} />
        )}
      </Card>

      <Card
        id="card-entryScreens"
        infoKey="chart.entries"
        eyebrow="Top entry screens"
        title="Session entry screens"
        purpose="The first screen property seen in each session — visitors, screen views, and bounce rate."
        style={{ marginTop: '12px' }}
      >
        {isWfActiveLoading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : (
          <EntryScreensTable entryScreens={entryScreensList} />
        )}
      </Card>
    </section>
  );
};
