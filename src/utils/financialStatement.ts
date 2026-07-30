// Shared row-building logic for statutory two-column financial statements
// (Balance Sheet, Profit and Loss) used by AccountingBalanceSheet.tsx and
// AccountingProfitLoss.tsx. Both pages fetch/construct the same tree shape
// (name + values + nested accounts) and lay it out against a fixed statutory
// template, appending anything beyond the template so no data is dropped.

export interface StatementNode {
  name: string;
  values?: { total_formatted?: string; total?: number }[];
  accounts?: StatementNode[];
}

export type SectionChild = string | { label: string; summary?: boolean };

export type SectionTemplate = { label: string; children: SectionChild[] };

export type StatementRow = {
  level: number;
  label: string;
  amount: string | number | null;
  isHeader?: boolean;
  isSpacer?: boolean;
  isTotal?: boolean;
  isSummary?: boolean;
};

export const normalize = (value?: string) => (value || "").trim().toLowerCase();

export const rawAmount = (node?: StatementNode): string | number | null => {
  const value = node?.values?.[0];
  if (!value) return null;
  return value.total_formatted ?? value.total ?? null;
};

export const leafAmount = (node: StatementNode): string | number | null =>
  node.accounts && node.accounts.length > 0 ? null : rawAmount(node);

export const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  const isNegative = trimmed.startsWith("(") && trimmed.endsWith(")");
  const numeric = parseFloat(trimmed.replace(/[(),]/g, ""));
  if (Number.isNaN(numeric)) return 0;
  return isNegative ? -numeric : numeric;
};

export const formatAmount = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return "0.0";
  return rounded < 0 ? `(${Math.abs(rounded).toFixed(1)})` : rounded.toFixed(1);
};

// Renders nodes that fall outside the standard template (e.g. custom
// groups/ledgers a society has added) so nothing fetched is silently dropped.
export const dynamicRows = (node: StatementNode, level: number): StatementRow[] => {
  const rows: StatementRow[] = [{ level, label: node.name, amount: leafAmount(node) }];
  (node.accounts || []).forEach((child) => rows.push(...dynamicRows(child, level + 1)));
  return rows;
};

export const buildSideRows = (
  template: SectionTemplate[],
  apiNodes: StatementNode[],
): { rows: StatementRow[]; total: number } => {
  const rows: StatementRow[] = [];
  const usedTopLevel = new Set<string>();
  let total = 0;

  template.forEach((section) => {
    const apiNode = apiNodes.find((n) => normalize(n.name) === normalize(section.label));
    if (apiNode) usedTopLevel.add(normalize(apiNode.name));

    const headerAmount = apiNode ? rawAmount(apiNode) : 0;
    total += toNumber(headerAmount ?? 0);
    rows.push({ level: 0, label: section.label, amount: headerAmount, isHeader: true });

    const childApiNodes = apiNode?.accounts || [];
    const usedChildren = new Set<string>();

    section.children.forEach((child) => {
      const childLabel = typeof child === "string" ? child : child.label;
      const isSummary = typeof child === "object" && child.summary;
      const match = childApiNodes.find((n) => normalize(n.name) === normalize(childLabel));
      if (match) usedChildren.add(normalize(match.name));
      rows.push({
        level: 1,
        label: childLabel,
        amount: match ? leafAmount(match) : 0,
        isSummary,
      });
    });

    childApiNodes
      .filter((n) => !usedChildren.has(normalize(n.name)))
      .forEach((n) => rows.push(...dynamicRows(n, 1)));

    rows.push({ level: 0, label: "", amount: null, isSpacer: true });
  });

  apiNodes
    .filter((n) => !usedTopLevel.has(normalize(n.name)))
    .forEach((n) => {
      total += toNumber(rawAmount(n) ?? 0);
      rows.push(...dynamicRows(n, 0));
      rows.push({ level: 0, label: "", amount: null, isSpacer: true });
    });

  rows.push({ level: 0, label: "Total", amount: total, isTotal: true });

  return { rows, total };
};
