import { useState, useCallback, type ReactNode, type ThHTMLAttributes } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "../utils/cn";

/* ── Types ─────────────────────────────────────────────────────────── */

export type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  /** Unique key — also used as default accessor into row object. */
  id: string;
  /** Column header label (already translated). */
  header: string;
  /** Custom cell renderer. Falls back to `String(row[id])`. */
  cell?: (row: T, index: number) => ReactNode;
  /** Enable sorting on this column. */
  sortable?: boolean;
  /** Custom sort comparator. Required if cell data isn't directly sortable. */
  compare?: (a: T, b: T) => number;
  /** Extra classes on `<th>` and `<td>`. */
  className?: string;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Unique key extractor per row. */
  rowKey: (row: T, index: number) => string | number;
  /** Render when data is empty. */
  emptyState?: ReactNode;
  /** Additional class on the outer scroll wrapper. */
  className?: string;
  /** Compact density. */
  compact?: boolean;
};

/* ── Sortable header cell ─────────────────────────────────────────── */

type SortableThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  direction: SortDirection | null;
  onToggle: () => void;
};

function SortableTh({ children, direction, onToggle, className, ...props }: SortableThProps) {
  const Icon =
    direction === "asc" ? ChevronUp : direction === "desc" ? ChevronDown : ChevronsUpDown;
  return (
    <th
      scope="col"
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
      className={cn(
        "cursor-pointer select-none hover:bg-[var(--color-surface-muted)] transition-colors",
        className,
      )}
      onClick={onToggle}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon className="size-3.5 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
      </span>
    </th>
  );
}

/* ── DataTable ────────────────────────────────────────────────────── */

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyState,
  className,
  compact = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const handleSort = useCallback(
    (colId: string) => {
      if (sortColumn === colId) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(colId);
        setSortDir("asc");
      }
    },
    [sortColumn],
  );

  const sortedData = (() => {
    if (!sortColumn) return data;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col?.sortable) return data;

    const compare =
      col.compare ??
      ((a: T, b: T) => {
        const aVal = (a as Record<string, unknown>)[col.id];
        const bVal = (b as Record<string, unknown>)[col.id];
        if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
        return String(aVal ?? "").localeCompare(String(bVal ?? ""));
      });

    const sorted = [...data].sort(compare);
    return sortDir === "desc" ? sorted.reverse() : sorted;
  })();

  const cellPadding = compact ? "px-3 py-1.5" : "px-4 py-3";

  return (
    <div
      className={cn("overflow-x-auto rounded-lg border border-[var(--color-border)]", className)}
      data-density={compact ? "compact" : undefined}
    >
      <table className="w-full min-w-0 text-left">
        <thead>
          <tr className="bg-[var(--color-surface-muted)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {columns.map((col) =>
              col.sortable ? (
                <SortableTh
                  key={col.id}
                  direction={sortColumn === col.id ? sortDir : null}
                  onToggle={() => handleSort(col.id)}
                  className={cn(cellPadding, col.className)}
                >
                  {col.header}
                </SortableTh>
              ) : (
                <th key={col.id} scope="col" className={cn(cellPadding, col.className)}>
                  {col.header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {sortedData.length === 0 && emptyState ? (
            <tr>
              <td
                colSpan={columns.length}
                className="p-8 text-center text-[var(--color-text-muted)]"
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                className="hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.id} className={cn(cellPadding, col.className)}>
                    {col.cell
                      ? col.cell(row, index)
                      : String((row as Record<string, unknown>)[col.id] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
