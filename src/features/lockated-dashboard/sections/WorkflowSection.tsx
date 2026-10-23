import React from 'react';
import type { Device, AdminScope } from '../data/types';
import { WORKFLOWS } from '../data/workflows';
import { Tile } from '../components/Tile';
import { ChartCard } from '../components/ChartCard';
import { FunnelChart } from '../components/Charts';
import { buildFlows, type WorkflowMetrics } from '../data/metrics';

interface WorkflowSectionProps {
  dev: Device;
  scope: AdminScope;
  range: number;
  workflowKey: string;
  onSelectWorkflow: (key: string) => void;
  theme: 'light' | 'dark';
  metrics?: WorkflowMetrics;
  isLoading?: boolean;
}

export const WorkflowSection: React.FC<WorkflowSectionProps> = ({
  dev,
  scope,
  range,
  workflowKey,
  onSelectWorkflow,
  theme,
  metrics,
  isLoading
}) => {
  const m =
    metrics ??
    buildFlows({
      dev,
      scope,
      prev: true,
      wf: workflowKey,
      bucket: 'Service & Support',
      page: 'pgFlows',
      range,
      rangeLabel: 'Last 30 days',
      rangeFrom: '',
      rangeTo: '',
      project: 'All Projects',
      theme,
      navCollapsed: false
    });

  const buckets = Array.from(new Set(WORKFLOWS.map((workflow) => workflow.bucket)));
  const activeWorkflow = WORKFLOWS.find((workflow) => workflow.key === workflowKey) || WORKFLOWS[0];

  const currentBucket = activeWorkflow.bucket;

  const bucketModules = WORKFLOWS.filter((workflow) => workflow.bucket === currentBucket);
  const { tiles: tilesToRender, funnelSteps, funnelDrops, screenRows, entryRows } = m;

  return (
    <section className="section" id="pgFlows">
      <div className="section-head">
        <h2>Workflow Usage</h2>
        <span className="sd">
          Resident completion of key society workflows per module, all-modules comparison, and where residents navigate &amp; exit.
        </span>
      </div>

      {isLoading && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            marginBottom: '12px',
            borderRadius: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
            fontSize: '12px'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              border: '2px solid var(--blue)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block'
            }}
          />
          <span>Updating workflow metrics from analytics API...</span>
        </div>
      )}

      {/* Module Nav */}
      <div className="mnav" title="Choose a module — this filter applies to the per-module cards only">
        {/* Bucket Tabs */}
        <div className="mnav-buckets">
          {buckets.map((b) => {
            const count = WORKFLOWS.filter((w) => w.bucket === b).length;
            const isSelected = b === currentBucket;
            return (
              <button
                key={b}
                type="button"
                className={isSelected ? 'on' : ''}
                onClick={() => {
                  const firstOfBucket = WORKFLOWS.find((w) => w.bucket === b);
                  if (firstOfBucket) onSelectWorkflow(firstOfBucket.key);
                }}
              >
                {b}
                <span className="mcount">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Module Chips */}
        <div className="mnav-mods">
          <div className="segbar">
            {bucketModules.map((w) => (
              <button
                key={w.key}
                type="button"
                className={w.key === activeWorkflow.key ? 'on' : ''}
                onClick={() => onSelectWorkflow(w.key)}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 KPI Tiles */}
      <div className="tiles" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {tilesToRender.map((t) => (
          <Tile
            key={t.label}
            label={t.label}
            val={t.val}
            dir={t.dir}
            delta={t.delta}
            sub={t.sub}
          />
        ))}
      </div>

      {/* Scope Note banner if present */}
      {activeWorkflow.incompleteNote && (
        <div className="bmnote crashnote">
          <span>&#9888;</span>
          <div>
            <b>Scope note on this funnel.</b> {activeWorkflow.incompleteNote}
          </div>
        </div>
      )}

      {/* Workflow Funnel Card */}
      <ChartCard
        eyebrow="Workflow funnel (real event sequence)"
        title={`${activeWorkflow.name} — completion funnel`}
        purpose="Shows step-by-step completion and drop-off for the selected workflow, using the real PostHog event names in sequence."
        style={{ margin: '16px 0' }}
      >
        <FunnelChart
          steps={funnelSteps}
          drops={funnelDrops}
          theme={theme}
        />
      </ChartCard>

      {/* All Screens in this Module */}
      <ChartCard
        eyebrow="All screens in this module"
        title="All screens in this module"
        purpose={`Every screen path inside ${activeWorkflow.name}, with users, events, sessions and completion rate for each.`}
        style={{ marginTop: '12px' }}
      >
        <div className="tbl-wrap">
          <table className="pathtbl">
            <thead>
              <tr>
                <th>Screen</th>
                <th className="num">Users</th>
                <th className="num">Events</th>
                <th className="num">Sessions</th>
                <th className="num">Completion</th>
              </tr>
            </thead>
            <tbody>
              {screenRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--sub)' }}>
                    No screen events recorded for this workflow in the selected period
                  </td>
                </tr>
              ) : (
                screenRows.map((r) => (
                  <tr key={r.s}>
                    <td>{r.s}</td>
                    <td className="num">{r.users.toLocaleString()}</td>
                    <td className="num">{r.events.toLocaleString()}</td>
                    <td className="num">{r.sess.toLocaleString()}</td>
                    <td className="num">{r.comp == null ? '--' : `${r.comp}%`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Top Entry Screens */}
      <ChartCard
        eyebrow="Top entry screens"
        title="Top entry screens"
        purpose="The first screen property seen in each session — usually reached via push notification, deep link, or the app icon."
        style={{ marginTop: '12px' }}
      >
        <div className="tbl-wrap">
          <table className="pathtbl">
            <thead>
              <tr>
                <th>Screen</th>
                <th className="num">Visitors</th>
                <th className="num">Views</th>
                <th className="num">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {entryRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--sub)' }}>
                    No entry screens recorded for the selected period
                  </td>
                </tr>
              ) : (
                entryRows.map((r) => (
                  <tr key={r.screen}>
                    <td>{r.screen}</td>
                    <td className="num">{r.visitors.toLocaleString()}</td>
                    <td className="num">{r.views.toLocaleString()}</td>
                    <td className="num">{r.bounce}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </section>
  );
};
