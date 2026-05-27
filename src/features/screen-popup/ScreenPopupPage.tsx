"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Database, PhoneCall, Radio, UserRound } from "lucide-react";
import clsx from "clsx";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";
import type { ScreenPopupCallInfo, ScreenPopupCustomerInfo, ScreenPopupRecord } from "@/types";

interface ScreenPopupApiResponse {
  mode: "created-from-url" | "active-from-db";
  current: ScreenPopupRecord | null;
  active: ScreenPopupRecord[];
  ended: ScreenPopupRecord[];
  error?: string;
}

const DISPOSITION_TREE: Record<string, string[]> = {
  "Resolved": ["First Call Resolution", "Assisted Resolution", "Self-Service Guided"],
  "Callback Required": ["Scheduled Callback", "Voicemail Left", "No Answer – Will Retry"],
  "Transferred": ["Billing", "Technical Support", "Retention", "Sales", "Supervisor"],
  "Escalated": ["Manager Requested", "Formal Complaint", "Technical Escalation"],
  "Unable to Resolve": ["Wrong Number", "Customer Disconnected", "Language Barrier", "Repeat Contact"],
  "Informational": ["General Inquiry", "Status Update", "Account Inquiry"],
};

const callFields: Array<{ key: keyof ScreenPopupCallInfo; label: string }> = [
  { key: "ANI", label: "ANI" },
  { key: "DNIS", label: "DNIS" },
  { key: "AgentName", label: "Agent Name" },
  { key: "QueueName", label: "Queue Name" }
];

const customerFields: Array<{ key: keyof ScreenPopupCustomerInfo; label: string }> = [
  { key: "Name", label: "Name" },
  { key: "Email", label: "Email" },
  { key: "Phone", label: "Phone" },
  { key: "MailingCity", label: "Mailing City" },
  { key: "MailingCountry", label: "Mailing Country" }
];

const endedPageSize = 5;

export function ScreenPopupPage() {
  const [data, setData] = useState<ScreenPopupApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [endedPage, setEndedPage] = useState(1);

  const [dispositionCategory, setDispositionCategory] = useState("");
  const [dispositionSub, setDispositionSub] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const endedRecords = data?.ended ?? [];
  const endedPageCount = Math.max(1, Math.ceil(endedRecords.length / endedPageSize));
  const visibleEndedRecords = endedRecords.slice(
    (endedPage - 1) * endedPageSize,
    endedPage * endedPageSize
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadScreenPopupInfo() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/screen-popup${window.location.search}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load screen popup info");
        }
        setData(payload);
        setEndedPage(1);
        setDispositionCategory(payload.current?.disposition ?? "");
        setDispositionSub(payload.current?.dispositionSub ?? "");
        setSaveStatus("idle");
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load screen popup info"
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadScreenPopupInfo();
    return () => controller.abort();
  }, []);

  async function handleSaveDisposition() {
    if (!data?.current || !dispositionCategory || !dispositionSub) return;
    setSaveStatus("saving");
    setSaveError("");
    try {
      const response = await fetch("/api/screen-popup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: data.current.id, disposition: dispositionCategory, dispositionSub })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save disposition");
      }
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Failed to save disposition");
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading screen popup info" />;
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-white p-5 shadow-webex">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <h3 className="text-sm font-bold text-webex-navy">Screen popup could not load</h3>
          <p className="mt-1 text-sm leading-relaxed text-webex-muted">{error}</p>
        </div>
      </div>
    );
  }

  const hasActiveCall = Boolean(data?.current);

  const dispositionFooter = hasActiveCall ? (
    <div className="pt-3">
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-webex-muted">
        Disposition
      </label>
      <div className="flex flex-col gap-2">
        {/* Level 1 — category */}
        <select
          value={dispositionCategory}
          onChange={(e) => { setDispositionCategory(e.target.value); setDispositionSub(""); setSaveStatus("idle"); }}
          className="h-9 w-full rounded-md border border-webex-line bg-webex-canvas px-3 text-sm text-webex-ink transition focus:border-webex-blue focus:bg-white focus:outline-none"
        >
          <option value="">Select category…</option>
          {Object.keys(DISPOSITION_TREE).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {/* Level 2 — sub-disposition, appears once category is chosen */}
        {dispositionCategory && (
          <select
            value={dispositionSub}
            onChange={(e) => { setDispositionSub(e.target.value); setSaveStatus("idle"); }}
            className="h-9 w-full rounded-md border border-webex-line bg-webex-canvas px-3 text-sm text-webex-ink transition focus:border-webex-blue focus:bg-white focus:outline-none"
          >
            <option value="">Select disposition…</option>
            {(DISPOSITION_TREE[dispositionCategory] ?? []).map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={handleSaveDisposition}
          disabled={!dispositionCategory || !dispositionSub || saveStatus === "saving"}
          className="h-9 rounded-md bg-webex-blue px-4 text-sm font-bold text-white transition hover:bg-webex-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saveStatus === "saving" ? "Saving…" : "Save"}
        </button>
      </div>

      {saveStatus === "saved" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Disposition saved successfully
        </div>
      )}
      {saveStatus === "error" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {saveError}
        </div>
      )}
    </div>
  ) : null;

  return (
    <section className="space-y-4">

      {/* ── Info cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {hasActiveCall ? (
          <>
            <InfoCard
              title="Call Info"
              icon={<PhoneCall className="h-4 w-4" />}
              rows={callFields.map((f) => ({
                label: f.label,
                value: String(data?.current?.callInfo[f.key] || "—")
              }))}
              footer={dispositionFooter}
            />
            <InfoCard
              title="Customer Info"
              icon={<UserRound className="h-4 w-4" />}
              rows={customerFields.map((f) => ({
                label: f.label,
                value: String(data?.current?.customerInfo?.[f.key] || "—")
              }))}
            />
          </>
        ) : (
          <>
            <EmptyInfoCard title="Call Info" icon={<PhoneCall className="h-4 w-4" />} />
            <EmptyInfoCard title="Customer Info" icon={<UserRound className="h-4 w-4" />} />
          </>
        )}
      </div>

      {/* ── Ended records ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-lg border border-webex-line bg-white shadow-webex">
        <div className="flex items-center gap-3 border-b border-webex-line bg-webex-canvas px-5 py-3">
          <Database className="h-4 w-4 text-webex-blue" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-webex-blue">
              Saved Records
            </p>
            <h3 className="text-sm font-bold text-webex-navy">Ended Screen Popups</h3>
          </div>
          {endedRecords.length > 0 && (
            <span className="ml-auto rounded-md bg-webex-blue-light px-2.5 py-1 text-xs font-bold text-webex-blue">
              {endedRecords.length}
            </span>
          )}
        </div>

        {endedRecords.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b-2 border-b-webex-blue bg-webex-blue-light">
                    {["ANI", "DNIS", "Agent", "Queue", "Customer", "Phone", "Country", "Disposition", "Created"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-webex-ink"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visibleEndedRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className={clsx(
                        "transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-webex-canvas",
                        "hover:bg-webex-blue-light"
                      )}
                    >
                      <td className="border-b border-webex-line px-4 py-3 text-sm font-semibold text-webex-navy">
                        {record.callInfo.ANI || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {record.callInfo.DNIS || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {record.callInfo.AgentName || record.callInfo.AgentID || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {record.callInfo.QueueName || record.callInfo.QueueID || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm font-semibold text-webex-navy">
                        {record.customerInfo?.Name || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {record.customerInfo?.Phone || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {record.customerInfo?.MailingCountry || "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {record.disposition ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center rounded-md bg-webex-blue-light px-2 py-0.5 text-xs font-semibold text-webex-blue">
                              {record.disposition}
                            </span>
                            {record.dispositionSub && (
                              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-webex-muted">
                                {record.dispositionSub}
                              </span>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="border-b border-webex-line px-4 py-3 text-sm text-webex-muted">
                        {formatDate(record.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-webex-line bg-webex-canvas px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-webex-muted">
                Showing{" "}
                <span className="font-semibold text-webex-ink">
                  {(endedPage - 1) * endedPageSize + 1}–
                  {Math.min(endedPage * endedPageSize, endedRecords.length)}
                </span>{" "}
                of <span className="font-semibold text-webex-ink">{endedRecords.length}</span> records
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEndedPage((p) => Math.max(1, p - 1))}
                  disabled={endedPage === 1}
                  className="grid h-7 w-7 place-items-center rounded-md border border-webex-line bg-white text-webex-muted transition hover:border-webex-blue hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-semibold text-webex-ink">
                  Page {endedPage} of {endedPageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setEndedPage((p) => Math.min(endedPageCount, p + 1))}
                  disabled={endedPage === endedPageCount}
                  className="grid h-7 w-7 place-items-center rounded-md border border-webex-line bg-white text-webex-muted transition hover:border-webex-blue hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              title="No ended records"
              description="Ended screen popup records will appear here after their status is updated in the database."
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ── sub-components ───────────────────────────────────────────── */

function InfoCard({
  title,
  icon,
  rows,
  footer
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ label: string; value: string }>;
  footer?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-webex-line bg-white shadow-webex">
      <div className="flex items-center gap-2.5 border-b border-webex-line bg-webex-blue-light px-4 py-3">
        <span className="text-webex-blue">{icon}</span>
        <h3 className="text-sm font-bold text-webex-navy">{title}</h3>
      </div>
      <dl className="grid gap-2 p-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md border border-webex-line bg-webex-canvas px-3 py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-webex-muted">
              {row.label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-webex-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      {footer && (
        <div className="border-t border-webex-line px-4 pb-4">
          {footer}
        </div>
      )}
    </article>
  );
}

function EmptyInfoCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <article className="overflow-hidden rounded-lg border border-webex-line bg-white shadow-webex">
      <div className="flex items-center gap-2.5 border-b border-webex-line bg-webex-blue-light px-4 py-3">
        <span className="text-webex-blue">{icon}</span>
        <h3 className="text-sm font-bold text-webex-navy">{title}</h3>
      </div>
      <div className="flex min-h-32 flex-col items-center justify-center gap-2.5 p-6">
        <Radio className="h-8 w-8 text-webex-line" />
        <div className="text-center">
          <p className="text-sm font-semibold text-webex-muted">No active call</p>
          <p className="mt-0.5 text-xs text-webex-muted">Waiting for an incoming call</p>
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
