import { Inbox, Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-lg border border-webex-line bg-white">
      <div className="flex items-center gap-3 text-sm font-semibold text-webex-muted">
        <Loader2 className="h-5 w-5 animate-spin text-webex-blue" />
        {label}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-webex-line bg-white p-6 text-center">
      <Inbox className="h-9 w-9 text-webex-teal" />
      <h3 className="mt-3 text-base font-bold text-webex-navy">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-webex-muted">{description}</p>
    </div>
  );
}
