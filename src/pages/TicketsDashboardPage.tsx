import React, { useState } from 'react';
import {
  DashboardTopNav,
  TicketsKpiTile,
  useTicketsOverview,
  useEscalationOverview,
  useVisitorOverview,
  useUtilityOverview,
  TicketsPieCard,
  TicketsBarCard,
  EscalationPieCard,
  ExecutiveEscalationCard,
  VisitorPieCard,
  VisitorBarCard,
  UtilityPieCard,
  UtilityBarCard,
  ActivityFeedCard,
  TicketsAgeingMatrixCard,
  CheckListCard,
  TicketsDashboardGrid,
  DEFAULT_ESCALATION_GRID_LAYOUT,
  DEFAULT_VISITOR_GRID_LAYOUT,
  DEFAULT_UTILITY_GRID_LAYOUT,
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
  const [goldenActive, setGoldenActive] = useState(false);
  const [redFlagActive, setRedFlagActive] = useState(false);

  const overview = useTicketsOverview(dateRange);
  const utilityOverview = useUtilityOverview(dateRange, activeTab === 'utility');
  const escalationOverview = useEscalationOverview(dateRange, activeTab === 'escalation');
  const visitorOverview = useVisitorOverview(dateRange, activeTab === 'visitor');

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
        goldenActive={goldenActive}
        onGoldenToggle={() => setGoldenActive((v) => !v)}
        redFlagActive={redFlagActive}
        onRedFlagToggle={() => setRedFlagActive((v) => !v)}
      />

      <div className="p-4 sm:p-6">
        {activeTab === 'tickets' && (
          <TicketsDashboardGrid storageKey="tickets-dashboard-grid-layout-v3">
            <div key="kpi-open">
              <TicketsKpiTile label="Open Tickets" value={overview?.ticket_status.total_open} tone="purple" />
            </div>
            <div key="kpi-closed">
              <TicketsKpiTile label="Closed Tickets" value={overview?.ticket_status.total_closed} tone="teal" />
            </div>
            <div key="kpi-total">
              <TicketsKpiTile label="Total Tickets" value={overview?.total_tickets} tone="peach" />
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
          <TicketsDashboardGrid
            storageKey="utility-dashboard-grid-layout-v4"
            defaultLayout={DEFAULT_UTILITY_GRID_LAYOUT}
          >
            <div key="kpi-power-mains">
              <TicketsKpiTile
                label="Total Consumption (Mains)"
                value={
                  utilityOverview?.power_mains_kwh != null
                    ? `${utilityOverview.power_mains_kwh.toLocaleString()} kWh`
                    : undefined
                }
                tone="purple"
              />
            </div>
            <div key="kpi-power-solar">
              <TicketsKpiTile
                label="Solar Total"
                value={
                  utilityOverview?.power_solar_kwh != null
                    ? `${utilityOverview.power_solar_kwh.toLocaleString()} kWh`
                    : undefined
                }
                tone="teal"
              />
            </div>
            <div key="kpi-power-dg">
              <TicketsKpiTile
                label="DG Total"
                value={
                  utilityOverview?.power_dg_kwh != null
                    ? `${utilityOverview.power_dg_kwh.toLocaleString()} kWh`
                    : undefined
                }
                tone="peach"
              />
            </div>
            <div key="kpi-diesel">
              <TicketsKpiTile
                label="Total Diesel Consumed"
                value={
                  utilityOverview?.diesel_liters != null
                    ? `${utilityOverview.diesel_liters.toLocaleString()} L`
                    : undefined
                }
                tone="blue"
              />
            </div>

            <div key="kpi-water-total">
              <TicketsKpiTile
                label="Total Sourced (Water)"
                value={
                  utilityOverview?.water_total_kl != null
                    ? `${utilityOverview.water_total_kl.toLocaleString()} KL`
                    : undefined
                }
                tone="blue"
              />
            </div>
            <div key="kpi-water-domestic">
              <TicketsKpiTile
                label="Domestic Outlet"
                value={
                  utilityOverview?.water_domestic_kl != null
                    ? `${utilityOverview.water_domestic_kl.toLocaleString()} KL`
                    : undefined
                }
                tone="teal"
              />
            </div>
            <div key="kpi-water-flushing">
              <TicketsKpiTile
                label="Flushing Outlet"
                value={
                  utilityOverview?.water_flushing_kl != null
                    ? `${utilityOverview.water_flushing_kl.toLocaleString()} KL`
                    : undefined
                }
                tone="purple"
              />
            </div>
            <div key="kpi-water-irrigation">
              <TicketsKpiTile
                label="Irrigation Outlet"
                value={
                  utilityOverview?.water_irrigation_kl != null
                    ? `${utilityOverview.water_irrigation_kl.toLocaleString()} KL`
                    : undefined
                }
                tone="peach"
              />
            </div>

            <div key="kpi-water-stp">
              <TicketsKpiTile
                label="STP Total"
                value={
                  utilityOverview?.water_stp_kl != null
                    ? `${utilityOverview.water_stp_kl.toLocaleString()} KL`
                    : undefined
                }
                tone="teal"
              />
            </div>
            <div key="kpi-carbon-scope1">
              <TicketsKpiTile
                label="Carbon Scope 1"
                value={
                  utilityOverview?.carbon_scope1 != null
                    ? Number.isInteger(utilityOverview.carbon_scope1)
                      ? utilityOverview.carbon_scope1
                      : Number(utilityOverview.carbon_scope1.toFixed(1))
                    : undefined
                }
                tone="purple"
              />
            </div>
            <div key="kpi-carbon-scope2">
              <TicketsKpiTile
                label="Carbon Scope 2"
                value={
                  utilityOverview?.carbon_scope2 != null
                    ? Number.isInteger(utilityOverview.carbon_scope2)
                      ? utilityOverview.carbon_scope2
                      : Number(utilityOverview.carbon_scope2.toFixed(1))
                    : undefined
                }
                tone="peach"
              />
            </div>
            <div key="kpi-fuel">
              <TicketsKpiTile
                label="Fuel Consumption"
                value={
                  utilityOverview?.fuel_consumption != null
                    ? `${utilityOverview.fuel_consumption.toLocaleString()} L`
                    : undefined
                }
                tone="blue"
              />
            </div>

            <div key="kpi-energy-intensity">
              <TicketsKpiTile
                label="Energy Intensity"
                value={
                  utilityOverview?.energy_intensity != null
                    ? Number.isInteger(utilityOverview.energy_intensity)
                      ? utilityOverview.energy_intensity
                      : Number(utilityOverview.energy_intensity.toFixed(3))
                    : undefined
                }
                tone="purple"
              />
            </div>
            <div key="kpi-power-renewable">
              <TicketsKpiTile
                label="Total Renewable"
                value={
                  utilityOverview?.power_renewable_kwh != null
                    ? `${utilityOverview.power_renewable_kwh.toLocaleString()} kWh`
                    : undefined
                }
                tone="teal"
              />
            </div>
            <div key="kpi-carbon-total">
              <TicketsKpiTile
                label="Total Carbon"
                value={
                  utilityOverview != null
                    ? Number(
                        (
                          (utilityOverview.carbon_scope1 ?? 0) + (utilityOverview.carbon_scope2 ?? 0)
                        ).toFixed(1)
                      )
                    : undefined
                }
                tone="peach"
              />
            </div>
            <div key="kpi-utility-sites">
              <TicketsKpiTile
                label="Total Power"
                value={
                  utilityOverview != null
                    ? `${(
                        (utilityOverview.power_mains_kwh ?? 0) +
                        (utilityOverview.power_solar_kwh ?? 0) +
                        (utilityOverview.power_dg_kwh ?? 0)
                      ).toLocaleString()} kWh`
                    : undefined
                }
                tone="blue"
              />
            </div>

            <div key="pie-power-sources">
              <UtilityPieCard metric="power-sources" dateRange={dateRange} />
            </div>
            <div key="pie-water-sources">
              <UtilityPieCard metric="water-sources" dateRange={dateRange} />
            </div>
            <div key="pie-renewable-sources">
              <UtilityPieCard metric="renewable-sources" dateRange={dateRange} />
            </div>

            <div key="bar-power">
              <UtilityBarCard metric="power-bar" dateRange={dateRange} />
            </div>
            <div key="bar-water">
              <UtilityBarCard metric="water-bar" dateRange={dateRange} />
            </div>
            <div key="bar-power-top">
              <UtilityBarCard metric="power-top-bar" dateRange={dateRange} />
            </div>
            <div key="bar-water-top">
              <UtilityBarCard metric="water-top-bar" dateRange={dateRange} />
            </div>
            <div key="bar-dry-segregation">
              <UtilityBarCard metric="dry-segregation" dateRange={dateRange} />
            </div>
            <div key="bar-ev-consumption">
              <UtilityBarCard metric="ev-consumption" dateRange={dateRange} />
            </div>
          </TicketsDashboardGrid>
        )}

        {activeTab === 'escalation' && (
          <TicketsDashboardGrid
            storageKey="escalation-dashboard-grid-layout-v3"
            defaultLayout={DEFAULT_ESCALATION_GRID_LAYOUT}
          >
            <div key="kpi-open-escalation">
              <TicketsKpiTile label="Open Escalation" value={escalationOverview?.open} tone="purple" />
            </div>
            <div key="kpi-close-escalation">
              <TicketsKpiTile label="Close Escalation" value={escalationOverview?.closed} tone="teal" />
            </div>
            <div key="kpi-average-escalation">
              <TicketsKpiTile
                label="Average Escalation"
                value={
                  escalationOverview?.average_ageing != null
                    ? Number.isInteger(escalationOverview.average_ageing)
                      ? escalationOverview.average_ageing
                      : Number(escalationOverview.average_ageing.toFixed(1))
                    : undefined
                }
                tone="blue"
              />
            </div>
            <div key="kpi-total-escalation">
              <TicketsKpiTile
                label="Total Escalation"
                value={
                  escalationOverview != null
                    ? (escalationOverview.open ?? 0) + (escalationOverview.closed ?? 0)
                    : undefined
                }
                tone="peach"
              />
            </div>

            <div key="open-escalation">
              <EscalationPieCard metric="open-escalation" dateRange={dateRange} />
            </div>
            <div key="close-escalation">
              <EscalationPieCard metric="close-escalation" dateRange={dateRange} />
            </div>
            <div key="average-escalation">
              <EscalationPieCard metric="average-escalation" dateRange={dateRange} />
            </div>
            <div key="executive-escalation-pie">
              <EscalationPieCard metric="executive-escalation" dateRange={dateRange} />
            </div>

            <div key="executive-escalation">
              <ExecutiveEscalationCard dateRange={dateRange} />
            </div>
          </TicketsDashboardGrid>
        )}

        {activeTab === 'visitor' && (
          <TicketsDashboardGrid
            storageKey="visitor-dashboard-grid-layout-v5"
            defaultLayout={DEFAULT_VISITOR_GRID_LAYOUT}
          >
            <div key="kpi-total-visitors">
              <TicketsKpiTile label="Total Visitors" value={visitorOverview?.total_visitors} tone="purple" />
            </div>
            <div key="kpi-expected-visitors">
              <TicketsKpiTile label="Expected Visitors" value={visitorOverview?.expected_visitors} tone="teal" />
            </div>
            <div key="kpi-unexpected-visitors">
              <TicketsKpiTile label="Unexpected Visitors" value={visitorOverview?.unexpected_visitors} tone="peach" />
            </div>
            <div key="kpi-total-vehicles">
              <TicketsKpiTile label="Total Vehicles" value={visitorOverview?.total_vehicles} tone="blue" />
            </div>
            <div key="kpi-goods-inwards">
              <TicketsKpiTile label="Goods Inwards" value={visitorOverview?.goods_inwards} tone="teal" />
            </div>
            <div key="kpi-goods-outwards">
              <TicketsKpiTile label="Goods Outwards" value={visitorOverview?.goods_outwards} tone="peach" />
            </div>

            <div key="pie-expected-unexpected">
              <VisitorPieCard metric="expected-unexpected" dateRange={dateRange} />
            </div>
            <div key="pie-goods-in-out">
              <VisitorPieCard metric="goods-in-out" dateRange={dateRange} />
            </div>
            <div key="pie-delivery-visitors">
              <VisitorPieCard metric="delivery-visitors" dateRange={dateRange} />
            </div>

            <div key="bar-total-visitors">
              <VisitorBarCard metric="total-visitors" dateRange={dateRange} />
            </div>
            <div key="bar-goods-in">
              <VisitorBarCard metric="goods-in" dateRange={dateRange} />
            </div>
            <div key="bar-goods-out">
              <VisitorBarCard metric="goods-out" dateRange={dateRange} />
            </div>
            <div key="bar-delivery-visitors">
              <VisitorBarCard metric="delivery-visitors" dateRange={dateRange} />
            </div>
          </TicketsDashboardGrid>
        )}
      </div>
    </div>
  );
};

export default TicketsDashboardPage;
