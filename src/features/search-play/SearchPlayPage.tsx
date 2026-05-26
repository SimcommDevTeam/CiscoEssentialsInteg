"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileSpreadsheet, Play, Search, SlidersHorizontal } from "lucide-react";
import * as XLSX from "xlsx";
import { AudioPlayerModal } from "@/components/ui/AudioPlayerModal";
import { DataGrid } from "@/components/ui/DataGrid";
import { LoadingState } from "@/components/ui/StateViews";
import { downloadRecording } from "@/lib/audio";
import type { CallRecording, DataGridColumn } from "@/types";

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function getDefaults() {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: toDatetimeLocal(from), to: toDatetimeLocal(to) };
}

const FILTER_COLUMNS = [
  { key: "", label: "All Columns" },
  { key: "id", label: "Call ID" },
  { key: "callStartDate", label: "Call Start Date" },
  { key: "callEndDate", label: "Call End Date" },
  { key: "ani", label: "ANI" },
  { key: "dnis", label: "DNIS" },
  { key: "duration", label: "Duration" },
  { key: "callType", label: "Call Type" },
];

export function SearchPlayPage() {
  const defaults = useMemo(getDefaults, []);

  const twoMonthsAgoValue = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return toDatetimeLocal(d);
  }, []);

  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);

  // Grid filter state
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const fetchRecordings = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    setFilterValue("");
    setFilterColumn("");
    try {
      const params = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString()
      });
      const response = await fetch(`/api/search-play?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to fetch recordings");
        return;
      }
      setRecordings(data.recordings ?? []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings(defaults.from, defaults.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    if (!fromDate || !toDate) {
      setError("Please select both From and To dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be after To date.");
      return;
    }
    if (new Date(fromDate) < new Date(twoMonthsAgoValue)) {
      setError("From date cannot be more than 2 months in the past.");
      return;
    }
    fetchRecordings(fromDate, toDate);
  }

  // Client-side grid filter applied on top of API results
  const filteredRecordings = useMemo(() => {
    const term = filterValue.trim().toLowerCase();
    if (!term) return recordings;
    return recordings.filter((row) => {
      if (filterColumn) {
        return String((row as unknown as Record<string, unknown>)[filterColumn] ?? "")
          .toLowerCase()
          .includes(term);
      }
      return Object.values(row).some((v) => String(v).toLowerCase().includes(term));
    });
  }, [recordings, filterColumn, filterValue]);

  function handleDownloadExcel() {
    const rows = filteredRecordings.map((r) => ({
      "Call ID": r.id,
      "Call Start Date": r.callStartDate,
      "Call End Date": r.callEndDate,
      "ANI": r.ani,
      "DNIS": r.dnis,
      "Duration": r.duration,
      "Call Type": r.callType,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recordings");
    XLSX.writeFile(wb, `recordings_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const columns = useMemo<DataGridColumn<CallRecording>[]>(
    () => [
      { key: "id", header: "Call ID", sortable: true },
      { key: "callStartDate", header: "Call Start Date", sortable: true },
      { key: "callEndDate", header: "Call End Date", sortable: true },
      { key: "ani", header: "ANI", sortable: true },
      { key: "dnis", header: "DNIS", sortable: true },
      { key: "duration", header: "Duration", sortable: true },
      {
        key: "callType",
        header: "Call Type",
        sortable: true,
        render: (row) => (
          <span className="inline-flex items-center rounded-md bg-webex-blue-light px-2.5 py-1 text-xs font-semibold text-webex-blue">
            {row.callType}
          </span>
        )
      },
      {
        key: "recordings",
        header: "Actions",
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRecording(row)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-webex-blue px-3 text-xs font-semibold text-white transition hover:bg-webex-blue-dark"
              aria-label={`Play ${row.id}`}
              title="Play"
            >
              <Play className="h-3.5 w-3.5" />
              Play
            </button>
            <button
              type="button"
              onClick={() => downloadRecording(row.recordingUrl, row.recordingFileName)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-webex-line px-3 text-xs font-semibold text-webex-muted transition hover:border-webex-blue hover:text-webex-blue"
              aria-label={`Download ${row.id}`}
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <section className="space-y-4">

      {/* ── Combined filter panel ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-webex-line bg-white shadow-webex">

        {/* Date range section */}
        <div className="border-b border-webex-line">
          <div className="flex items-center gap-2 bg-webex-canvas px-5 py-3">
            <Search className="h-4 w-4 text-webex-blue" />
            <span className="text-sm font-bold text-webex-navy">Date Range</span>
            <span className="ml-auto text-xs text-webex-muted">Up to 2 months back</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-webex-muted" htmlFor="from-date">
                From Date
              </label>
              <input
                id="from-date"
                type="datetime-local"
                value={fromDate}
                min={twoMonthsAgoValue}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 rounded-md border border-webex-line bg-webex-canvas px-3 text-sm text-webex-ink transition focus:border-webex-blue focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-webex-muted" htmlFor="to-date">
                To Date
              </label>
              <input
                id="to-date"
                type="datetime-local"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 rounded-md border border-webex-line bg-webex-canvas px-3 text-sm text-webex-ink transition focus:border-webex-blue focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="h-9 rounded-md bg-webex-blue px-5 text-sm font-bold text-white transition hover:bg-webex-blue-dark disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {error && (
            <div className="mx-5 mb-4 flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Grid filter section */}
        <div>
          <div className="flex items-center gap-2 bg-webex-canvas px-5 py-3">
            <SlidersHorizontal className="h-4 w-4 text-webex-blue" />
            <span className="text-sm font-bold text-webex-navy">Filter Results</span>
            {recordings.length > 0 && !loading && (
              <span className="ml-2 text-xs text-webex-muted">
                {filteredRecordings.length === recordings.length
                  ? `${recordings.length} recording${recordings.length !== 1 ? "s" : ""}`
                  : `${filteredRecordings.length} of ${recordings.length} recordings`}
              </span>
            )}
            {filteredRecordings.length > 0 && !loading && (
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-webex-line bg-white px-3 text-xs font-semibold text-webex-muted transition hover:border-webex-blue hover:text-webex-blue"
                title="Download as Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Download Excel
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-3 px-5 py-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-webex-muted" htmlFor="filter-column">
                Column
              </label>
              <select
                id="filter-column"
                value={filterColumn}
                onChange={(e) => { setFilterColumn(e.target.value); setFilterValue(""); }}
                className="h-9 rounded-md border border-webex-line bg-webex-canvas px-3 text-sm text-webex-ink transition focus:border-webex-blue focus:bg-white focus:outline-none"
              >
                {FILTER_COLUMNS.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-48">
              <label className="text-xs font-semibold text-webex-muted" htmlFor="filter-value">
                Search Value
              </label>
              <input
                id="filter-value"
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder={filterColumn ? `Filter by ${FILTER_COLUMNS.find((c) => c.key === filterColumn)?.label ?? filterColumn}…` : "Search across all columns…"}
                className="h-9 rounded-md border border-webex-line bg-webex-canvas px-3 text-sm text-webex-ink placeholder:text-webex-muted transition focus:border-webex-blue focus:bg-white focus:outline-none"
              />
            </div>

            {filterValue && (
              <button
                type="button"
                onClick={() => { setFilterValue(""); setFilterColumn(""); }}
                className="h-9 rounded-md border border-webex-line px-3 text-xs font-semibold text-webex-muted transition hover:border-red-300 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Results grid ──────────────────────────────────────────── */}
      {loading ? (
        <LoadingState label="Fetching recordings…" />
      ) : (
        <DataGrid columns={columns} rows={filteredRecordings} searchTerm="" />
      )}

      <AudioPlayerModal recording={selectedRecording} onClose={() => setSelectedRecording(null)} />
    </section>
  );
}
