"use client";

import { Download, X } from "lucide-react";
import type { CallRecording } from "@/types";
import { downloadRecording } from "@/lib/audio";

interface AudioPlayerModalProps {
  recording: CallRecording | null;
  onClose: () => void;
}

export function AudioPlayerModal({ recording, onClose }: AudioPlayerModalProps) {
  if (!recording) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-webex-navy/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-webex">
        <div className="flex items-center justify-between border-b border-webex-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-webex-muted">Recording playback</p>
            <h3 className="text-lg font-bold text-webex-navy">{recording.id}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-webex-line text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue"
            aria-label="Close player"
            title="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="ANI" value={recording.ani} />
            <Metric label="DNIS" value={recording.dnis} />
            <Metric label="Duration" value={recording.duration} />
            <Metric label="Type" value={recording.callType} />
          </div>

          <audio className="w-full" src={recording.recordingUrl} controls autoPlay />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => downloadRecording(recording.recordingUrl, recording.recordingFileName)}
              className="inline-flex items-center gap-2 rounded-lg bg-webex-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-webex-navy"
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
    <div className="rounded-lg border border-webex-line bg-webex-canvas p-3">
      <p className="text-xs font-bold uppercase text-webex-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-webex-navy">{value}</p>
    </div>
  );
}
