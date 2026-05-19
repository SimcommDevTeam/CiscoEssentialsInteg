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
}

type SortDirection = "asc" | "desc";

export function DataGrid<T extends { id?: string }>({
  columns,
  rows,
  searchTerm,
  pageSize = 5
}: DataGridProps<T>) {
  const [sortKey, setSortKey] = useState<string>(String(columns[0]?.key ?? ""));
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return rows;
    }

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
    if (!sortable) {
      return;
    }

    setPage(1);
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  if (filteredRows.length === 0) {
    return (
      <EmptyState
        title="No recordings found"
        description="Try adjusting your search. The grid filters across call IDs, dates, numbers, call type, and duration."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-webex-line bg-white shadow-webex">
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                const isActiveSort = sortKey === key;
                return (
                  <th key={key} className="border-b border-webex-line px-4 py-3 text-xs font-bold uppercase text-webex-muted">
                    <button
                      type="button"
                      onClick={() => handleSort(key, column.sortable)}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg text-left",
                        column.sortable ? "hover:text-webex-blue" : "cursor-default"
                      )}
                    >
                      {column.header}
                      {column.sortable ? (
                        isActiveSort ? (
                          <ChevronDown
                            className={clsx(
                              "h-4 w-4 transition",
                              sortDirection === "asc" ? "rotate-180" : ""
                            )}
                          />
                        ) : (
                          <ChevronsUpDown className="h-4 w-4" />
                        )
                      ) : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="transition hover:bg-webex-mint/50">
                {columns.map((column) => (
                  <td key={String(column.key)} className="border-b border-webex-line px-4 py-4 text-sm text-webex-ink">
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

      <div className="flex flex-col gap-3 border-t border-webex-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-webex-muted">
          Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, sortedRows.length)} of{" "}
          {sortedRows.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage === 1}
            className="grid h-9 w-9 place-items-center rounded-lg border border-webex-line text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold text-webex-ink">
            {safePage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={safePage === pageCount}
            className="grid h-9 w-9 place-items-center rounded-lg border border-webex-line text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
