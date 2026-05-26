"use client";

import { Download, Headphones, X } from "lucide-react";
import type { CallRecording } from "@/types";
import { downloadRecording } from "@/lib/audio";

interface AudioPlayerModalProps {
  recording: CallRecording | null;
  onClose: () => void;
}

export function AudioPlayerModal({ recording, onClose }: AudioPlayerModalProps) {
  if (!recording) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-webex-navy/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-webex-lg">

        {/* Webex-blue header */}
        <div className="flex items-center justify-between bg-webex-blue px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-white/20">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70">Recording Playback</p>
              <h3 className="text-base font-bold text-white">{recording.id}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-white/70 transition hover:bg-white/20 hover:text-white"
            aria-label="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="ANI" value={recording.ani} />
            <Metric label="DNIS" value={recording.dnis} />
            <Metric label="Duration" value={recording.duration} />
            <Metric label="Type" value={recording.callType} />
          </div>

          {/* Audio player */}
          <div className="rounded-md border border-webex-line bg-webex-canvas p-3">
            <audio className="w-full" src={recording.recordingUrl} controls autoPlay />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-webex-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-webex-line px-4 py-2 text-sm font-semibold text-webex-muted transition hover:border-webex-blue hover:text-webex-blue"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => downloadRecording(recording.recordingUrl, recording.recordingFileName)}
              className="inline-flex items-center gap-2 rounded-md bg-webex-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-webex-blue-dark"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-webex-line bg-webex-canvas px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-webex-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-webex-ink">{value || "—"}</p>
    </div>
  );
}
