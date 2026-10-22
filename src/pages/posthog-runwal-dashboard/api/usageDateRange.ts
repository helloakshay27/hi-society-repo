export function previousPeriodFor(fromStr: string, toStr: string) {
  const from = Date.parse(`${fromStr}T00:00:00Z`);
  const to = Date.parse(`${toStr}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
    return { from: '', to: '' };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const duration = Math.round((to - from) / dayMs);
  const previousTo = new Date(from - dayMs);
  const previousFrom = new Date(previousTo.getTime() - duration * dayMs);
  return {
    from: previousFrom.toISOString().slice(0, 10),
    to: previousTo.toISOString().slice(0, 10),
  };
}
