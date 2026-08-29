import React, { useState } from 'react';
import { DashboardFilters } from '../../api/types';
import { KpiTile } from '../common/KpiTile';
import { Card } from '../common/Card';
import { ModuleNav } from '../workflow/ModuleNav';
import { WorkflowFunnel } from '../workflow/WorkflowFunnel';
import { AllScreensTable, EntryScreensTable } from '../workflow/ScreensTable';
import { ErrorState } from '../common/DashboardStates';
import {
  useModuleTree,
  useWorkflowUsage,
} from '../../hooks/useDashboardAnalytics';

interface WorkflowUsagePageProps {
  filters: DashboardFilters;
  benchmarks: Record<string, number | null>;
  onBenchmarkChange: (id: string, value: number | null) => void;
  sitesSettled?: boolean;
}

export const WorkflowUsagePage: React.FC<WorkflowUsagePageProps> = ({
  filters,
  benchmarks,
  onBenchmarkChange,
  sitesSettled = true,
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

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
  } = useWorkflowUsage(filters, selectedModule, null, sitesSettled);

  const moduleList = moduleTreeData?.tree || [];
  const kpis = wfData?.kpis;

  // Adoption KPI
  const fAdopt = kpis?.f_adopt?.value;
  const fAdoptDisplay =
    fAdopt != null
      ? `${Math.round(fAdopt <= 1 ? fAdopt * 100 : fAdopt)}%`
      : isWfLoading
      ? '...'
      : '—';
  const fAdoptDelta = kpis?.f_adopt?.delta_pct;

  // Completion KPI
  const fComp = kpis?.f_comp?.value;
  const fCompDisplay =
    fComp != null
      ? `${Math.round(fComp <= 1 ? fComp * 100 : fComp)}%`
      : isWfLoading
      ? '...'
      : '—';
  const fCompDelta = kpis?.f_comp?.delta_pct;

  // Biggest Step Drop
  const fStep = kpis?.f_step?.value;
  const fStepDisplay =
    fStep != null
      ? `${Math.round(fStep <= 1 ? fStep * 100 : fStep)}%`
      : isWfLoading
      ? '...'
      : '—';

  // Volume KPI
  const fVol = kpis?.f_vol?.value;
  const fVolDisplay =
    fVol != null
      ? fVol.toLocaleString()
      : isWfLoading
      ? '...'
      : '—';

  const funnelList = wfData?.funnel || [];
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
        onSelectModule={setSelectedModule}
        isLoading={isModulesLoading}
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
          label="Workflow Adoption"
          val={fAdoptDisplay}
          dir={fAdoptDelta && fAdoptDelta > 0 ? 'up' : fAdoptDelta && fAdoptDelta < 0 ? 'dn' : 'flat'}
          delta={fAdoptDelta != null ? `${fAdoptDelta > 0 ? '+' : ''}${fAdoptDelta.toFixed(1)}%` : null}
          raw={fAdopt != null ? (fAdopt <= 1 ? fAdopt * 100 : fAdopt) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.wfAdoption}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isWfLoading}
        />
        <KpiTile
          id="wfCompletion"
          label="Completion Rate"
          val={fCompDisplay}
          dir={fCompDelta && fCompDelta > 0 ? 'up' : fCompDelta && fCompDelta < 0 ? 'dn' : 'flat'}
          delta={fCompDelta != null ? `${fCompDelta > 0 ? '+' : ''}${fCompDelta.toFixed(1)}%` : null}
          raw={fComp != null ? (fComp <= 1 ? fComp * 100 : fComp) : undefined}
          unit="%"
          goodUp={true}
          benchmark={benchmarks.wfCompletion}
          onBenchmarkChange={onBenchmarkChange}
          isLoading={isWfLoading}
        />
        <KpiTile
          label="Biggest Step Drop"
          val={fStepDisplay}
          dir="dn"
          delta={null}
          sub="highest single drop-off"
          noTarget={true}
          isLoading={isWfLoading}
        />
        <KpiTile
          label="Usage Volume"
          val={fVolDisplay}
          dir="up"
          delta="this period"
          sub="workflow completions"
          noTarget={true}
          isLoading={isWfLoading}
        />
      </div>

      <Card
        id="card-wfFunnel"
        eyebrow="Workflow funnel (real event sequence)"
        title={`${selectedModule || 'All Workflows'} — completion funnel`}
        purpose="Shows step-by-step completion and drop-off for the selected workflow, using real instrumented PostHog event sequences."
        style={{ margin: '16px 0' }}
      >
        {isWfLoading ? (
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            Loading workflow funnel...
          </div>
        ) : (
          <WorkflowFunnel funnel={funnelList} />
        )}
      </Card>

      <Card
        id="card-allScreens"
        eyebrow="All screens & flows"
        title="Screen path flows"
        purpose="Every screen path inside this module with users, events, sessions and completion rate."
        style={{ marginTop: '12px' }}
      >
        {isWfLoading ? (
          <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            Loading screen paths...
          </div>
        ) : (
          <AllScreensTable flows={flowsList} />
        )}
      </Card>

      <Card
        id="card-entryScreens"
        eyebrow="Top entry screens"
        title="Session entry screens"
        purpose="The first screen property seen in each session — visitors, screen views, and bounce rate."
        style={{ marginTop: '12px' }}
      >
        {isWfLoading ? (
          <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            Loading entry screens...
          </div>
        ) : (
          <EntryScreensTable entryScreens={entryScreensList} />
        )}
      </Card>
    </section>
  );
};
