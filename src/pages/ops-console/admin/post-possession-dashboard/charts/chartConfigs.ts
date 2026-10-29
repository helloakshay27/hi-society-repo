import type { ChartConfiguration } from 'chart.js';
import {
  ASSET_CHART_BAR,
  ASSET_CHART_SERIES,
  DOUGHNUT_OPTIONS,
  PP_AXIS,
  doughnutCenterPlugin,
  rgba,
  seriesColor,
} from './chartPalette';

const S = ASSET_CHART_SERIES;

function doughnutDataset(data: number[]) {
  return {
    data,
    backgroundColor: data.map((_, i) => seriesColor(i, 0.92)),
    borderColor: '#FFFFFF',
    borderWidth: 2,
    hoverOffset: 6,
    hoverBorderWidth: 2,
  };
}

function doughnutConfig(
  labels: string[],
  data: number[],
  cutout = '65%'
): ChartConfiguration {
  return {
    type: 'doughnut',
    data: { labels, datasets: [doughnutDataset(data)] },
    options: {
      ...DOUGHNUT_OPTIONS,
      cutout,
    },
    plugins: [doughnutCenterPlugin],
  };
}


function compositeBarColor(value: number) {
  if (value >= 80) return rgba(S[2], 0.85);
  if (value >= 65) return rgba(S[1], 0.75);
  if (value >= 55) return rgba(S[0], 0.55);
  return rgba(S[0], 0.95);
}

function rejectionBarColor(value: number) {
  if (value < 30) return rgba(S[2], 0.8);
  if (value < 50) return rgba(S[0], 0.55);
  return rgba(S[0], 0.95);
}

export function getLeaderboardCharts(): Record<string, ChartConfiguration> {
  return {
    towerCompositeChart: {
      type: 'bar',
      data: {
        labels: ['T2', 'T1', 'T3', 'FM'],
        datasets: [
          {
            data: [87, 74, 61, 52],
            backgroundColor: (ctx) => {
              const v = (ctx.dataset.data[ctx.dataIndex] as number) ?? 0;
              return compositeBarColor(v);
            },
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        scales: {
          x: PP_AXIS,
          y: { ...PP_AXIS, max: 100, beginAtZero: true },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw} composite score` } },
        },
      },
    },
    towerRejectionChart: {
      type: 'bar',
      data: {
        labels: ['T2', 'T1', 'T3', 'FM'],
        datasets: [
          {
            data: [22, 45, 58, 61],
            backgroundColor: (ctx) => {
              const v = (ctx.dataset.data[ctx.dataIndex] as number) ?? 0;
              return rejectionBarColor(v);
            },
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        scales: {
          x: PP_AXIS,
          y: {
            ...PP_AXIS,
            max: 100,
            ticks: { ...PP_AXIS.ticks, callback: (v) => `${v}%` },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw}% rejected` } },
        },
      },
    },
  };
}

export function getHelpdeskCharts(): Record<string, ChartConfiguration> {
  return {
    ticketStatusChart: doughnutConfig(
      ['Pending', 'In progress', 'On hold', 'Closed', 'Completed'],
      [40, 8, 1, 5, 5]
    ),
    proactiveChart: doughnutConfig(['Proactive', 'Reactive'], [35, 24]),
    escalationChart: {
      type: 'bar',
      data: {
        labels: ['Response Escalation', 'Resolution Escalation'],
        datasets: [
          {
            label: 'Breached',
            data: [42, 38],
            backgroundColor: rgba(S[0], 0.85),
            borderRadius: 5,
            borderSkipped: false,
            stack: 's',
          },
          {
            label: 'Achieved',
            data: [17, 21],
            backgroundColor: rgba(S[2], 0.75),
            borderRadius: 5,
            borderSkipped: false,
            stack: 's',
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 7, font: { size: 10 } },
          },
        },
        scales: {
          x: PP_AXIS,
          y: { ...PP_AXIS, max: 59, stacked: true },
        },
      },
    },
    categoryChart: {
      type: 'bar',
      data: {
        labels: ['Housekeeping (28)', 'Plumbing (5)', 'Electrical (15)', 'Other (3)', 'Civil (8)'],
        datasets: [
          {
            label: 'Response breach rate',
            data: [85, 60, 60, 67, 50],
            backgroundColor: (ctx) => {
              const v = (ctx.dataset.data[ctx.dataIndex] as number) ?? 0;
              if (v >= 80) return rgba(S[0], 0.95);
              if (v >= 60) return rgba(S[0], 0.6);
              return rgba(S[1], 0.65);
            },
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            ...PP_AXIS,
            beginAtZero: true,
            max: 100,
            ticks: { ...PP_AXIS.ticks, callback: (v) => `${v}%` },
          },
          y: PP_AXIS,
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw}% of this category breaches Response SLA` } },
        },
      },
    },
    modeChart: doughnutConfig(
      ['Mobile', 'App', 'Common Area', 'Apartment', 'Other'],
      [22, 18, 9, 7, 3],
      '60%'
    ),
  };
}

export function getSecurityCharts(): Record<string, ChartConfiguration> {
  return {
    guestTypeChart: {
      type: 'bar',
      data: {
        labels: ['Guest', 'Support Staff', 'Delivery', 'Contractor', 'Other'],
        datasets: [
          {
            data: [98, 54, 38, 32, 12],
            backgroundColor: [
              seriesColor(0, 0.9),
              seriesColor(1, 0.85),
              seriesColor(2, 0.85),
              seriesColor(3, 0.8),
              seriesColor(4, 0.7),
            ],
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: { scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } }, plugins: { legend: { display: false } } },
    },
    visitTypeChart: doughnutConfig(
      ['Post-Approved (on arrival)', 'Pre-Approved (ahead of time)'],
      [134, 100]
    ),
    hourlyTrafficChart: {
      type: 'bar',
      data: {
        labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '5PM', '6PM', '7PM', '8PM'],
        datasets: [
          {
            data: [12, 18, 22, 16, 28, 52, 61, 48, 20],
            backgroundColor: (ctx) => {
              const v = (ctx.dataset.data[ctx.dataIndex] as number) ?? 0;
              return v > 45 ? rgba(S[0], 0.95) : rgba(S[1], 0.65);
            },
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: { scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } }, plugins: { legend: { display: false } } },
    },
    purposeChart: {
      type: 'bar',
      data: {
        labels: ['Guest', 'Meeting', 'Delivery', 'Contractor', 'Support Staff', 'Other'],
        datasets: [
          {
            data: [89, 52, 41, 28, 18, 6],
            backgroundColor: [
              seriesColor(0, 0.9),
              seriesColor(1, 0.85),
              seriesColor(2, 0.85),
              seriesColor(3, 0.8),
              seriesColor(4, 0.75),
              seriesColor(5, 0.65),
            ],
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: { x: { ...PP_AXIS, beginAtZero: true }, y: PP_AXIS },
        plugins: { legend: { display: false } },
      },
    },
    vehicleHourChart: {
      type: 'bar',
      data: {
        labels: ['8AM', '10AM', '12PM', '2PM', '4PM', '5PM', '6PM', '7PM', '8PM'],
        datasets: [
          {
            label: 'Member Vehicles',
            data: [10, 9, 8, 7, 9, 10, 11, 9, 8],
            backgroundColor: rgba(S[2], 0.75),
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Guest Vehicles',
            data: [2, 3, 4, 3, 5, 14, 18, 12, 4],
            backgroundColor: rgba(S[0], 0.85),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 7, font: { size: 10 } },
          },
        },
        scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } },
      },
    },
  };
}

export function getStaffCharts(): Record<string, ChartConfiguration> {
  return {
    staffCategoryChart: {
      type: 'bar',
      data: {
        labels: ['Housekeeping', 'Security', 'Maintenance', 'Gardening'],
        datasets: [
          {
            label: 'Scheduled',
            data: [14, 10, 6, 4],
            backgroundColor: ASSET_CHART_BAR.muted,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Present',
            data: [10, 9, 6, 4],
            backgroundColor: ASSET_CHART_BAR.solid,
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 7, font: { size: 10 } },
          },
        },
        scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } },
      },
    },
    shiftCoverageChart: {
      type: 'bar',
      data: {
        labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
        datasets: [
          {
            label: 'Scheduled',
            data: [12, 10, 9, 3],
            backgroundColor: ASSET_CHART_BAR.muted,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Present',
            data: [11, 9, 6, 3],
            backgroundColor: (ctx) => {
              const scheduled = [12, 10, 9, 3];
              const present = (ctx.dataset.data[ctx.dataIndex] as number) ?? 0;
              const pct = present / scheduled[ctx.dataIndex];
              return pct < 0.7 ? rgba(S[0], 0.9) : ASSET_CHART_BAR.solid;
            },
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 7, font: { size: 10 } },
          },
        },
        scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } },
      },
    },
  };
}

export function getClubCharts(): Record<string, ChartConfiguration> {
  return {
    memberStatusChart: doughnutConfig(['Pending', 'Inactive', 'Active', 'Expired'], [78, 24, 15, 0]),
    facilityChart: {
      type: 'bar',
      data: {
        labels: ['Yoga Room', 'Swimming Pool', 'Banquet Hall', 'Running Track', 'Golf Club N', 'Movie Theater', 'Studio', 'Cricket Ground'],
        datasets: [
          {
            data: [145, 62, 48, 22, 18, 12, 8, 5],
            backgroundColor: Array.from({ length: 8 }, (_, i) => seriesColor(i, 0.85)),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: { scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } }, plugins: { legend: { display: false } } },
    },
    planDistChart: doughnutConfig(
      ['Basic Plan Gold', 'Summer Plan', 'Summer Membership', 'Test (demo)'],
      [45, 28, 12, 5],
      '60%'
    ),
    facilityTypeChart: {
      type: 'bar',
      data: {
        labels: ['Bookable (Instant)', 'Request-based (Approval)'],
        datasets: [
          {
            label: 'Confirmed',
            data: [128, 14],
            backgroundColor: rgba(S[2], 0.8),
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Pending Approval',
            data: [0, 8],
            backgroundColor: rgba(S[0], 0.75),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 7, font: { size: 10 } },
          },
        },
        scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true } },
      },
    },
  };
}

export function getFitoutCharts(): Record<string, ChartConfiguration> {
  return {
    fitoutTypeChart: doughnutConfig(['Fitout (Renovation)', 'Move In (New Resident)'], [32, 6]),
    deviationChart: doughnutConfig(['Structural', 'Electrical', 'Plumbing', 'Aesthetic'], [2, 2, 2, 1]),
    createdByChart: {
      type: 'bar',
      data: {
        labels: ['Admin-Raised (22)', 'Resident-Raised (16)'],
        datasets: [
          {
            label: 'Avg days to decision',
            data: [1.8, 4.6],
            backgroundColor: [seriesColor(0, 0.85), seriesColor(1, 0.85)],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { ...PP_AXIS, beginAtZero: true, ticks: { ...PP_AXIS.ticks, callback: (v) => `${v}d` } },
          y: PP_AXIS,
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw} days average` } },
        },
      },
    },
    rejectByCreatorChart: {
      type: 'bar',
      data: {
        labels: ['Admin-Raised (79 decided)', 'Resident-Raised (53 decided)'],
        datasets: [
          {
            label: 'Rejection rate',
            data: [30, 75],
            backgroundColor: [seriesColor(0, 0.85), seriesColor(1, 0.9)],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            ...PP_AXIS,
            beginAtZero: true,
            max: 100,
            ticks: { ...PP_AXIS.ticks, callback: (v) => `${v}%` },
          },
          y: PP_AXIS,
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw}% rejected` } },
        },
      },
    },
    rejectByTypeChart: {
      type: 'bar',
      data: {
        labels: ['Fitout — Renovation (110 decided)', 'Move In (22 decided)'],
        datasets: [
          {
            label: 'Rejection rate',
            data: [62, 23],
            backgroundColor: [seriesColor(0, 0.7), seriesColor(2, 0.8)],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            ...PP_AXIS,
            beginAtZero: true,
            max: 100,
            ticks: { ...PP_AXIS.ticks, callback: (v) => `${v}%` },
          },
          y: PP_AXIS,
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw}% rejected` } },
        },
      },
    },
  };
}

export function getParkingCharts(): Record<string, ChartConfiguration> {
  return {
    parkingTypeChart: doughnutConfig(['SUV', 'Hatchback', 'Bike'], [2, 2, 1], '62%'),
  };
}

export function getCommunityCharts(): Record<string, ChartConfiguration> {
  return {
    adoptionChart: {
      type: 'bar',
      data: {
        labels: ['FM', 'T1', 'T2', 'T3'],
        datasets: [
          {
            label: 'Adoption Rate',
            data: [23, 70, 86, 17],
            backgroundColor: (ctx) => {
              const v = (ctx.dataset.data[ctx.dataIndex] as number) ?? 0;
              if (v < 30) return rgba(S[0], 0.9);
              if (v > 80) return rgba(S[2], 0.85);
              return rgba(S[1], 0.7);
            },
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        scales: {
          x: PP_AXIS,
          y: {
            ...PP_AXIS,
            max: 100,
            ticks: { ...PP_AXIS.ticks, callback: (v) => `${v}%` },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw}% of residents registered on the app` } },
        },
      },
    },
    pollChart: {
      type: 'bar',
      data: {
        labels: ['Test Poll', 'test polls 5454', 'Kids Play Area', 'Poll (generic)'],
        datasets: [
          {
            label: 'Total Votes',
            data: [0, 1, 0, 0],
            backgroundColor: rgba(S[0], 0.7),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: { ...PP_AXIS, beginAtZero: true, max: 5, ticks: { stepSize: 1 } },
          y: PP_AXIS,
        },
        plugins: { legend: { display: false } },
      },
    },
    notifChannelChart: {
      type: 'bar',
      data: {
        labels: ['Push', 'Email', 'SMS'],
        datasets: [
          {
            label: 'Sent',
            data: [19, 12, 14],
            backgroundColor: ASSET_CHART_BAR.muted,
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Delivered',
            data: [19, 12, 11],
            backgroundColor: ASSET_CHART_BAR.solid,
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: PP_AXIS, y: { ...PP_AXIS, beginAtZero: true, max: 25 } },
      },
    },
    quarantineTowerChart: doughnutConfig(['Tower A', 'FM', 'GL / Team'], [4, 1, 3], '62%'),
  };
}

export function getChartsForTab(tabId: string): Record<string, ChartConfiguration> {
  switch (tabId) {
    case 't-lb':
      return getLeaderboardCharts();
    case 't-op':
      return getHelpdeskCharts();
    case 't-sc':
      return getSecurityCharts();
    case 't-st':
      return getStaffCharts();
    case 't-cl':
      return getClubCharts();
    case 't-ft':
      return getFitoutCharts();
    case 't-pk':
      return getParkingCharts();
    case 't-co':
      return getCommunityCharts();
    default:
      return {};
  }
}
