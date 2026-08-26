import React, { useState } from 'react';
import {
  DashboardTopNav,
  TicketsKpiTile,
  useTicketsOverview,
  TicketsPieCard,
  TicketsBarCard,
  ActivityFeedCard,
  TicketsAgeingMatrixCard,
  CheckListCard,
  TicketsDashboardGrid,
  type TicketsDashboardDateRange,
  type DashboardTab,
} from '@/components/tickets-dashboard';

const getDefaultDateRange = (): TicketsDashboardDateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  return { startDate, endDate };
};

const TicketsDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<TicketsDashboardDateRange>(getDefaultDateRange);
  const [activeTab, setActiveTab] = useState<DashboardTab>('tickets');

  const overview = useTicketsOverview(dateRange);

  const handleStartDateChange = (value: string) => {
    if (!value) return;
    setDateRange((prev) => ({ ...prev, startDate: new Date(`${value}T00:00:00`) }));
  };

  const handleEndDateChange = (value: string) => {
    if (!value) return;
    setDateRange((prev) => ({ ...prev, endDate: new Date(`${value}T00:00:00`) }));
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <DashboardTopNav
        dateRange={dateRange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="p-4 sm:p-6">
        {activeTab === 'tickets' && (
          <TicketsDashboardGrid>
          <div key="kpi-open">
            <TicketsKpiTile label="Open Tickets" value={overview?.ticket_status.total_open} bg="bg-brand-purple-bg" />
          </div>
          <div key="kpi-closed">
            <TicketsKpiTile label="Closed Tickets" value={overview?.ticket_status.total_closed} bg="bg-brand-teal-bg" />
          </div>
          <div key="kpi-total">
            <TicketsKpiTile label="Total Tickets" value={overview?.total_tickets} bg="bg-brand-error-bg" />
          </div>

          <div key="tickets-overview">
            <TicketsPieCard metric="tickets-overview" dateRange={dateRange} />
          </div>
          <div key="proactive-reactive">
            <TicketsPieCard metric="proactive-reactive" dateRange={dateRange} />
          </div>

          <div key="activity-feed">
            <ActivityFeedCard />
          </div>

          <div key="unit-category">
            <TicketsBarCard metric="unit-category" dateRange={dateRange} />
          </div>
          <div key="unit-category-proactive">
            <TicketsBarCard metric="unit-category-proactive" dateRange={dateRange} />
          </div>

          <div key="common-area-category">
            <TicketsBarCard metric="common-area-category" dateRange={dateRange} />
          </div>
          <div key="common-area-category-proactive">
            <TicketsBarCard metric="common-area-category-proactive" dateRange={dateRange} />
          </div>

          <div key="ageing-matrix">
            <TicketsAgeingMatrixCard dateRange={dateRange} />
          </div>

          <div key="response-tat">
            <TicketsBarCard metric="response-tat" dateRange={dateRange} />
          </div>
          <div key="resolution-tat">
            <TicketsBarCard metric="resolution-tat" dateRange={dateRange} />
          </div>

          <div key="fm-vs-project">
            <TicketsPieCard metric="fm-vs-project" dateRange={dateRange} />
          </div>
          <div key="golden-tickets">
            <TicketsPieCard metric="golden-tickets" dateRange={dateRange} />
          </div>

          <div key="complaint-mode">
            <TicketsBarCard metric="complaint-mode" dateRange={dateRange} />
          </div>
          <div key="delivery-visitors">
            <TicketsBarCard metric="delivery-visitors" dateRange={dateRange} />
          </div>

          <div key="checklist">
            <CheckListCard />
          </div>
        </TicketsDashboardGrid>
        )}

        {activeTab === 'utility' && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border bg-white py-24">
            <p className="text-brand-body-3 text-brand-text-light">Utility dashboard coming soon</p>
          </div>
        )}

        {activeTab === 'escalation' && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border bg-white py-24">
            <p className="text-brand-body-3 text-brand-text-light">Escalation dashboard coming soon</p>
          </div>
        )}

        {activeTab === 'visitor' && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-brand-border bg-white py-24">
            <p className="text-brand-body-3 text-brand-text-light">Visitor dashboard coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsDashboardPage;
