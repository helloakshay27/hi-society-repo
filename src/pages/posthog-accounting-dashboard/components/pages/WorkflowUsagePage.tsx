import React, { useState } from 'react';
import { DashboardFilters } from '../../../posthog-runwal-dashboard/api/types';
import { KpiTile } from '../../../posthog-runwal-dashboard/components/common/KpiTile';
import { Card } from '../../../posthog-runwal-dashboard/components/common/Card';
import { WorkflowFunnel } from '../../../posthog-runwal-dashboard/components/workflow/WorkflowFunnel';
import { AllScreensTable, EntryScreensTable } from '../../../posthog-runwal-dashboard/components/workflow/ScreensTable';
import { ErrorState } from '../../../posthog-runwal-dashboard/components/common/DashboardStates';
import { useModuleTree, useWorkflowUsage } from '../../../posthog-runwal-dashboard/hooks/useDashboardAnalytics';
import { ModuleNav, formatModuleName } from '../../../posthog-godrej-dashboard/components/workflow/ModuleNav';

interface WorkflowUsagePageProps {
  filters: DashboardFilters;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
}

const asPct = (v: number) => Math.round(v <= 1 ? v * 100 : v);
const signedPct = (d: number | null | undefined) => (d != null ? `${d > 0 ? '+' : ''}${d.toFixed(1)}%` : null);
const dirOf = (d: number | null | undefined): 'up' | 'dn' | 'flat' => (d && d > 0 ? 'up' : d && d < 0 ? 'dn' : 'flat');

const Loading: React.FC<{ height: number; text: string }> = ({ height, text }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>{text}</div>
);

/** Hi Society Accounting — Workflow Usage tab (wireframe pgFlows), wired to the live PostHog adoption APIs. */
export const WorkflowUsagePage: React.FC<WorkflowUsagePageProps> = ({
  filters,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const { data: moduleTreeData, isLoading: isModulesLoading } = useModuleTree(filters, sitesSettled);
  const {
    data: wfData,
    isLoading: isWfLoading,
    isError: isWfError,
    error: wfError,
    refetch: refetchWf,
  } = useWorkflowUsage(filters, selectedModule, null, sitesSettled);

  const kpis = wfData?.kpis;
  const fAdopt = kpis?.f_adopt?.value;
  const fAdoptDelta = kpis?.f_adopt?.delta_pct;
  const fComp = kpis?.f_comp?.value;
  const fCompDelta = kpis?.f_comp?.delta_pct;
  const fStep = kpis?.f_step?.value;
  const fVol = kpis?.f_vol?.value;

  const pending = isWfLoading ? '...' : '—';
  const workflowName = selectedModule ? formatModuleName(selectedModule) : 'All Accounting workflows';

  return (
    <section className="page on" id="pgFlows">
      <div className="section-head">
        <h2>Workflow Usage</h2>
        <span className="sd">
          Completion of key Accounting workflows (create, edit, report drill-down), and where users navigate &amp; exit.
        </span>
      </div>

      <ModuleNav
        modules={moduleTreeData?.tree || []}
        selectedModule={selectedModule}
        onSelectModule={setSelectedModule}
        isLoading={isModulesLoading}
      />

      {isWfError && (
        <div style={{ marginBottom: '16px' }}>
          <ErrorState title="Failed to load Workflow Usage metrics" error={wfError} onRetry={() => refetchWf()} />
        </div>
      )}

      <div className="tiles" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KpiTile
          id="wfAdoption"
          infoKey="F1"
          label="Workflow Adoption"
          val={fAdopt != null ? `${asPct(fAdopt)}%` : pending}
          dir={dirOf(fAdoptDelta)}
          delta={signedPct(fAdoptDelta)}
          raw={fAdopt != null ? asPct(fAdopt) : undefined}
          unit="%"
          goodUp
          benchmark={benchmarks.wfAdoption}
          onBenchmarkChange={onBenchmarkChange}
          noTarget
          isLoading={isWfLoading}
        />
        <KpiTile
          id="wfCompletion"
          infoKey="F2"
          label="Completion Rate"
          val={fComp != null ? `${asPct(fComp)}%` : pending}
          dir={dirOf(fCompDelta)}
          delta={signedPct(fCompDelta)}
          raw={fComp != null ? asPct(fComp) : undefined}
          unit="%"
          goodUp
          benchmark={benchmarks.wfCompletion}
          onBenchmarkChange={onBenchmarkChange}
          noTarget
          isLoading={isWfLoading}
        />
        <KpiTile
          infoKey="F3"
          label="Biggest Step Drop"
          val={fStep != null ? `${asPct(fStep)}%` : pending}
          dir="dn"
          delta={null}
          sub="before this step"
          noTarget
          isLoading={isWfLoading}
        />
        <KpiTile
          infoKey="F4"
          label="Usage Volume"
          val={fVol != null ? fVol.toLocaleString() : pending}
          dir="up"
          delta="this period"
          sub="events at the last step"
          noTarget
          isLoading={isWfLoading}
        />
      </div>

      <Card
        id="card-wfFunnel"
        infoKey="chart.funnel"
        eyebrow="Workflow funnel (real event sequence)"
        title={`${workflowName} — completion funnel`}
        purpose="Step-by-step drop-off for the selected workflow, using the real instrumented PostHog event sequence."
        style={{ margin: '16px 0' }}
      >
        {isWfLoading ? <Loading height={180} text="Loading workflow funnel..." /> : <WorkflowFunnel funnel={wfData?.funnel || []} />}
      </Card>

      <Card
        id="card-allScreens"
        infoKey="chart.screens"
        eyebrow="All screens in this module"
        title="All steps in this workflow"
        purpose={`Every screen in ${workflowName}, with users, events, sessions and the share that reach the last step.`}
        style={{ marginTop: '12px' }}
      >
        {isWfLoading ? <Loading height={140} text="Loading screen paths..." /> : <AllScreensTable flows={wfData?.flows || []} />}
      </Card>

      <Card
        id="card-entryScreens"
        infoKey="chart.entries"
        eyebrow="Top entry screens"
        title="Top entry screens"
        purpose="The first Accounting screen seen in each session — visitors, screen views, and bounce rate."
        style={{ marginTop: '12px' }}
      >
        {isWfLoading ? (
          <Loading height={140} text="Loading entry screens..." />
        ) : (
          <EntryScreensTable entryScreens={wfData?.entry_screens || []} />
        )}
      </Card>
    </section>
  );
};
