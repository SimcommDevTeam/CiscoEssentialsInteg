"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import type { DataGridColumn } from "@/types";
import { EmptyState } from "@/components/ui/StateViews";

interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  rows: T[];
  searchTerm: string;
  pageSize?: number;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
}

type SortDirection = "asc" | "desc";

export function DataGrid<T extends { id?: string }>({
  columns,
  rows,
  searchTerm,
  pageSize = 5,
  defaultSortKey,
  defaultSortDirection = "asc"
}: DataGridProps<T>) {
  const [sortKey, setSortKey] = useState<string>(defaultSortKey ?? String(columns[0]?.key ?? ""));
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return rows;
    return rows.filter((row) =>
      Object.values(row as Record<string, unknown>).some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )
    );
  }, [rows, searchTerm]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bValue = String((b as Record<string, unknown>)[sortKey] ?? "");
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [filteredRows, sortDirection, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(key: string, sortable?: boolean) {
    if (!sortable) return;
    setPage(1);
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  if (filteredRows.length === 0) {
    return (
      <EmptyState
        title="No recordings found"
        description="No recordings match your selected date range. Try adjusting the From or To date and search again."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-webex-line bg-white shadow-webex">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left">

          {/* Webex-themed light-blue header */}
          <thead>
            <tr className="border-b-2 border-b-webex-blue bg-webex-blue-light">
              {columns.map((column) => {
                const key = String(column.key);
                const isActiveSort = sortKey === key;
                return (
                  <th
                    key={key}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-webex-ink"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(key, column.sortable)}
                      className={clsx(
                        "flex items-center gap-1.5 text-left transition",
                        column.sortable
                          ? "cursor-pointer hover:text-webex-blue"
                          : "cursor-default"
                      )}
                    >
                      {column.header}
                      {column.sortable && (
                        isActiveSort ? (
                          <ChevronDown
                            className={clsx(
                              "h-3.5 w-3.5 text-webex-blue transition-transform",
                              sortDirection === "asc" ? "rotate-180" : ""
                            )}
                          />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-webex-muted opacity-60" />
                        )
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pagedRows.map((row, rowIndex) => (
              <tr
                key={String(row.id ?? rowIndex)}
                className={clsx(
                  "transition-colors",
                  rowIndex % 2 === 0 ? "bg-white" : "bg-webex-canvas",
                  "hover:bg-webex-blue-light"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="border-b border-webex-line px-4 py-3.5 text-sm text-webex-ink"
                  >
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[String(column.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-webex-line bg-webex-canvas px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-webex-muted">
          Showing{" "}
          <span className="font-semibold text-webex-ink">
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sortedRows.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-webex-ink">{sortedRows.length}</span> recordings
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="grid h-7 w-7 place-items-center rounded-md border border-webex-line bg-white text-webex-muted transition hover:border-webex-blue hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <span className="text-xs font-semibold text-webex-ink">
            Page {safePage} of {pageCount}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage === pageCount}
            className="grid h-7 w-7 place-items-center rounded-md border border-webex-line bg-white text-webex-muted transition hover:border-webex-blue hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
