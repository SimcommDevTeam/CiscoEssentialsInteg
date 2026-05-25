"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Database, PhoneCall, UserRound } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/StateViews";
import type { ScreenPopupCallInfo, ScreenPopupCustomerInfo, ScreenPopupRecord } from "@/types";

interface ScreenPopupApiResponse {
  mode: "created-from-url" | "active-from-db";
  current: ScreenPopupRecord | null;
  active: ScreenPopupRecord[];
  ended: ScreenPopupRecord[];
  error?: string;
}

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
  const endedRecords = data?.ended ?? [];
  const endedPageCount = Math.max(1, Math.ceil(endedRecords.length / endedPageSize));
  const visibleEndedRecords = endedRecords.slice((endedPage - 1) * endedPageSize, endedPage * endedPageSize);

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
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load screen popup info");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadScreenPopupInfo();

    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <LoadingState label="Loading screen popup info" />;
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-white p-6 shadow-webex">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-red-600" />
          <div>
            <h3 className="text-base font-bold text-webex-navy">Screen popup could not load</h3>
            <p className="mt-1 text-sm leading-6 text-webex-muted">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-webex-muted">Incoming call</p>
          <h2 className="text-xl font-bold text-webex-navy">Screen Popup</h2>
        </div>
      </div>

      {data?.current ? (
        <div className="grid grid-cols-2 gap-3">
          <InfoCard
            title="Call Info"
            icon={<PhoneCall className="h-5 w-5" />}
            rows={callFields.map((field) => ({
              label: field.label,
              value: data.current?.callInfo[field.key] || "-"
            }))}
          />
          <InfoCard
            title="Customer Info"
            icon={<UserRound className="h-5 w-5" />}
            rows={customerFields.map((field) => ({
              label: field.label,
              value: data.current?.customerInfo?.[field.key] || "-"
            }))}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <EmptyInfoCard title="Call Info" icon={<PhoneCall className="h-5 w-5" />} />
          <EmptyInfoCard title="Customer Info" icon={<UserRound className="h-5 w-5" />} />
        </div>
      )}

      <section className="mt-5 rounded-lg border border-webex-line bg-white p-3 shadow-webex">
        <div className="flex items-center gap-2 border-b border-webex-line pb-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-webex-blue">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-webex-muted">Saved records</p>
            <h3 className="text-base font-bold text-webex-navy">Ended Screen Popups</h3>
          </div>
        </div>

        {data?.ended.length ? (
          <>
            <div className="mt-3 overflow-x-auto rounded-lg border border-webex-line">
              <table className="min-w-full divide-y divide-webex-line text-left text-sm">
                <thead className="bg-webex-canvas text-xs font-bold uppercase text-webex-muted">
                  <tr>
                    <th className="px-2 py-2">ANI</th>
                    <th className="px-2 py-2">DNIS</th>
                    <th className="px-2 py-2">Agent</th>
                    <th className="px-2 py-2">Queue</th>
                    <th className="px-2 py-2">Customer</th>
                    <th className="px-2 py-2">Phone</th>
                    <th className="px-2 py-2">Country</th>
                    <th className="px-2 py-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-webex-line bg-white">
                  {visibleEndedRecords.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-2 py-2 font-semibold text-webex-navy">{record.callInfo.ANI || "-"}</td>
                      <td className="px-2 py-2 text-webex-muted">{record.callInfo.DNIS || "-"}</td>
                      <td className="px-2 py-2 text-webex-muted">
                        {record.callInfo.AgentName || record.callInfo.AgentID || "-"}
                      </td>
                      <td className="px-2 py-2 text-webex-muted">
                        {record.callInfo.QueueName || record.callInfo.QueueID || "-"}
                      </td>
                      <td className="px-2 py-2 font-semibold text-webex-navy">{record.customerInfo?.Name || "-"}</td>
                      <td className="px-2 py-2 text-webex-muted">{record.customerInfo?.Phone || "-"}</td>
                      <td className="px-2 py-2 text-webex-muted">{record.customerInfo?.MailingCountry || "-"}</td>
                      <td className="px-2 py-2 text-webex-muted">{formatDate(record.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-webex-muted">
                Showing {(endedPage - 1) * endedPageSize + 1}-{Math.min(endedPage * endedPageSize, endedRecords.length)} of{" "}
                {endedRecords.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEndedPage((page) => Math.max(1, page - 1))}
                  disabled={endedPage === 1}
                  className="rounded-lg border border-webex-line px-2.5 py-1 font-bold text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-bold text-webex-navy">
                  Page {endedPage} of {endedPageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setEndedPage((page) => Math.min(endedPageCount, page + 1))}
                  disabled={endedPage === endedPageCount}
                  className="rounded-lg border border-webex-line px-2.5 py-1 font-bold text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState
              title="No ended records"
              description="Ended screen popup records will appear here after their status is updated in the database."
            />
          </div>
        )}
      </section>
    </section>
  );
}

function EmptyInfoCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-webex-line bg-white p-3 shadow-webex">
      <div className="flex items-center gap-2 border-b border-webex-line pb-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-webex-mint text-webex-teal">
          {icon}
        </div>
        <h3 className="text-base font-bold text-webex-navy">{title}</h3>
      </div>
      <div className="mt-3 rounded-lg bg-webex-canvas px-3 py-3 text-sm font-bold text-webex-muted">
        No Call is going
      </div>
    </article>
  );
}

function InfoCard({
  title,
  icon,
  rows
}: {
  title: string;
  icon: React.ReactNode;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rounded-lg border border-webex-line bg-white p-3 shadow-webex">
      <div className="flex items-center gap-2 border-b border-webex-line pb-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-webex-mint text-webex-teal">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-webex-navy">{title}</h3>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-webex-canvas px-2.5 py-1.5">
            <dt className="text-[11px] font-bold uppercase text-webex-muted">{row.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-bold text-webex-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
