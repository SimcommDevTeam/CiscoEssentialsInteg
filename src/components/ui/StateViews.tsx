import { Inbox } from "lucide-react";

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-4 rounded-lg border border-webex-line bg-white shadow-webex">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-webex-line" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-webex-blue" />
      </div>
      <p className="text-sm font-semibold text-webex-muted">{label}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-webex-line bg-white p-8 text-center shadow-webex">
      <div className="grid h-12 w-12 place-items-center rounded-lg border border-webex-line bg-webex-blue-light text-webex-blue">
        <Inbox className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-webex-ink">{title}</h3>
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-webex-muted">{description}</p>
      </div>
    </div>
  );
}
