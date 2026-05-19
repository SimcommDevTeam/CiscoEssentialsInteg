"use client";

import { useState } from "react";
import { Check, PhoneCall, RotateCcw, UserRound } from "lucide-react";
import { SelectField, TextInput } from "@/components/ui/FormControls";
import { Toast } from "@/components/ui/Toast";
import { dispositionOptions, incomingCallSample } from "@/lib/mockData";
import type { IncomingCall } from "@/types";

type FormErrors = Partial<Record<keyof IncomingCall, string>>;

export function ScreenPopupPage() {
  const [form, setForm] = useState<IncomingCall>(incomingCallSample);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState("");

  function updateField(field: keyof IncomingCall, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!form.ani.trim()) nextErrors.ani = "ANI is required";
    if (!form.dnis.trim()) nextErrors.dnis = "DNIS is required";
    if (!form.customerName.trim()) nextErrors.customerName = "Customer name is required";
    if (!form.phoneNumber.trim()) nextErrors.phoneNumber = "Phone number is required";
    if (!form.disposition.trim()) nextErrors.disposition = "Select a disposition";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setToast("Call details saved successfully");
    window.setTimeout(() => setToast(""), 2800);
  }

  function resetSample() {
    setForm(incomingCallSample);
    setErrors({});
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-webex-line bg-white p-5 shadow-webex sm:p-6">
          <div className="flex flex-col gap-4 border-b border-webex-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-webex-mint text-webex-teal">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-webex-muted">Incoming call</p>
                <h3 className="text-xl font-bold text-webex-navy">Screen Popup</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={resetSample}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-webex-line px-4 py-2 text-sm font-bold text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue"
            >
              <RotateCcw className="h-4 w-4" />
              Load sample
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
            <TextInput label="ANI" value={form.ani} onChange={(value) => updateField("ani", value)} error={errors.ani} />
            <TextInput label="DNIS" value={form.dnis} onChange={(value) => updateField("dnis", value)} error={errors.dnis} />
            <TextInput
              label="Customer Name"
              value={form.customerName}
              onChange={(value) => updateField("customerName", value)}
              error={errors.customerName}
            />
            <TextInput
              label="Phone Number"
              value={form.phoneNumber}
              onChange={(value) => updateField("phoneNumber", value)}
              error={errors.phoneNumber}
            />
            <div className="md:col-span-2">
              <SelectField
                label="Disposition"
                value={form.disposition}
                onChange={(value) => updateField("disposition", value)}
                options={dispositionOptions}
                error={errors.disposition}
              />
            </div>

            <div className="flex justify-end md:col-span-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-webex-blue px-5 py-3 text-sm font-bold text-white shadow-webex transition hover:bg-webex-navy sm:w-auto"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
            </div>
          </form>
        </div>

        <aside className="rounded-lg border border-webex-line bg-white p-5 shadow-webex">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-webex-blue">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-webex-muted">Customer context</p>
              <h4 className="text-lg font-bold text-webex-navy">{form.customerName || "Unknown caller"}</h4>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <InfoRow label="ANI" value={form.ani} />
            <InfoRow label="DNIS" value={form.dnis} />
            <InfoRow label="Phone" value={form.phoneNumber} />
            <InfoRow label="Disposition" value={form.disposition || "Pending"} />
          </dl>
        </aside>
      </div>

      {toast ? <Toast message={toast} /> : null}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-webex-canvas px-3 py-2">
      <dt className="font-semibold text-webex-muted">{label}</dt>
      <dd className="truncate font-bold text-webex-navy">{value}</dd>
    </div>
  );
}
