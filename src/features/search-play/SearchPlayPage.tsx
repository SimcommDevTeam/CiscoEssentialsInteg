"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Play, Search } from "lucide-react";
import { AudioPlayerModal } from "@/components/ui/AudioPlayerModal";
import { DataGrid } from "@/components/ui/DataGrid";
import { LoadingState } from "@/components/ui/StateViews";
import { downloadRecording } from "@/lib/audio";
import { callRecordings } from "@/lib/mockData";
import type { CallRecording, DataGridColumn } from "@/types";

export function SearchPlayPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

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
          <span className="rounded-lg bg-webex-mint px-2.5 py-1 text-xs font-bold text-webex-teal">
            {row.callType}
          </span>
        )
      },
      {
        key: "recordings",
        header: "Recordings",
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedRecording(row)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-webex-line text-webex-blue transition hover:border-webex-cyan hover:bg-webex-mint"
              aria-label={`Play ${row.id}`}
              title="Play"
            >
              <Play className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => downloadRecording(row.recordingUrl, row.recordingFileName)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-webex-line text-webex-muted transition hover:border-webex-cyan hover:bg-webex-mint hover:text-webex-blue"
              aria-label={`Download ${row.id}`}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        )
      }
    ],
    []
  );

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-webex-line bg-white p-5 shadow-webex sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-webex-muted">Recording management</p>
            <h3 className="text-xl font-bold text-webex-navy">Search & Play</h3>
          </div>
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Search recordings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-webex-muted" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search any column"
              className="h-11 w-full rounded-lg border border-webex-line bg-white pl-10 pr-3 text-sm text-webex-ink transition placeholder:text-slate-400 focus:border-webex-cyan"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading mock recordings" />
      ) : (
        <DataGrid columns={columns} rows={callRecordings} searchTerm={searchTerm} />
      )}

      <AudioPlayerModal recording={selectedRecording} onClose={() => setSelectedRecording(null)} />
    </section>
  );
}
