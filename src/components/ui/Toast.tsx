import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-30 flex max-w-sm items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-webex">
      <CheckCircle2 className="h-5 w-5" />
      {message}
    </div>
  );
}
