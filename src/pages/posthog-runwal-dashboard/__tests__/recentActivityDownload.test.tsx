// @vitest-environment jsdom
// The Recent Activity download button (shared by every dashboard page that uses this sidebar): while
// the server makes the file it shows a spinner and says what is happening; a failed download says so.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

const download = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock('../hooks/useDashboardAnalytics', () => ({
  useRecentActiveUsers: () => ({ data: { users: [] }, isLoading: false }),
}));
vi.mock('../api/api', () => ({
  activityUserLabel: () => 'someone',
  downloadActiveUsersExport: (...args: unknown[]) => download.fn(...args),
}));

import { RecentActivitySidebar } from '../components/common/RecentActivitySidebar';

const filters = { apiPath: 'commercial/lease', from: '2026-10-16', to: '2026-11-14' } as never;

afterEach(() => {
  cleanup();
  download.fn.mockReset();
});

describe('Recent Activity download', () => {
  it('shows a loader while the file is made, and the button again when it is saved', async () => {
    let finish!: () => void;
    download.fn.mockImplementation((_f: unknown, onPhase: (p: string) => void) => new Promise<void>((resolve) => {
      onPhase('preparing');
      finish = resolve;
    }));
    render(<RecentActivitySidebar filters={filters} />);
    const button = screen.getByRole('button', { name: 'Download user activity' });
    await act(async () => { fireEvent.click(button); });

    expect(download.fn).toHaveBeenCalledWith(filters, expect.any(Function));
    expect(screen.getByRole('status').textContent).toContain('Preparing Excel file…');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(screen.getAllByTestId('export-spinner').length).toBeGreaterThan(0);

    fireEvent.click(button);   // a second click while it runs starts nothing
    expect(download.fn).toHaveBeenCalledTimes(1);

    await act(async () => { finish(); });
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByTestId('export-spinner')).toBeNull();
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('says when a download failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    download.fn.mockRejectedValue(new Error('Export failed (422): site_id is required'));
    render(<RecentActivitySidebar filters={filters} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Download user activity' })); });
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Download failed');
    expect(status.getAttribute('title')).toContain('site_id is required');
  });
});
