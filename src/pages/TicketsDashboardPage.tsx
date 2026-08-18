import React, { useState } from 'react';
import {
  DashboardTopNav,
  TicketsKpiTilesRow,
  TicketsPieCard,
  TicketsBarCard,
  ActivityFeedCard,
  TicketsAgeingMatrixCard,
  CheckListCard,
  type TicketsDashboardDateRange,
} from '@/components/tickets-dashboard';

const getDefaultDateRange = (): TicketsDashboardDateRange => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  return { startDate, endDate };
};

const TicketsDashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<TicketsDashboardDateRange>(getDefaultDateRange);

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
      <DashboardTopNav dateRange={dateRange} onStartDateChange={handleStartDateChange} onEndDateChange={handleEndDateChange} />

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6">
          <TicketsKpiTilesRow dateRange={dateRange} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TicketsPieCard metric="tickets-overview" dateRange={dateRange} />
            <TicketsPieCard metric="proactive-reactive" dateRange={dateRange} />
          </div>

          <ActivityFeedCard />

          <TicketsBarCard metric="unit-category" dateRange={dateRange} />
          <TicketsBarCard metric="unit-category-proactive" dateRange={dateRange} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TicketsBarCard metric="common-area-category" dateRange={dateRange} />
            <TicketsBarCard metric="common-area-category-proactive" dateRange={dateRange} />
          </div>

          <TicketsAgeingMatrixCard dateRange={dateRange} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TicketsBarCard metric="response-tat" dateRange={dateRange} />
            <TicketsBarCard metric="resolution-tat" dateRange={dateRange} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TicketsPieCard metric="fm-vs-project" dateRange={dateRange} />
            <TicketsPieCard metric="golden-tickets" dateRange={dateRange} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TicketsBarCard metric="complaint-mode" dateRange={dateRange} />
            <TicketsBarCard metric="delivery-visitors" dateRange={dateRange} />
          </div>

          <CheckListCard />
        </div>
      </div>
    </div>
  );
};

export default TicketsDashboardPage;
