import { sampleAudioDataUri } from "@/lib/audio";
import type { CallRecording, IncomingCall } from "@/types";

export const incomingCallSample: IncomingCall = {
  ani: "+1 408 555 0198",
  dnis: "800-WEBEX-01",
  customerName: "Avery Johnson",
  phoneNumber: "+1 415 555 0134",
  disposition: "Follow-up Required"
};

export const dispositionOptions = [
  "Resolved",
  "Follow-up Required",
  "Transferred",
  "Voicemail",
  "Escalated"
];

export const callRecordings: CallRecording[] = [
  {
    id: "CX-100248",
    callStartDate: "2026-05-16 09:12",
    callEndDate: "2026-05-16 09:21",
    ani: "+1 408 555 0198",
    dnis: "800-WEBEX-01",
    duration: "09:14",
    callType: "Inbound",
    recordingUrl: sampleAudioDataUri,
    recordingFileName: "CX-100248.wav"
  },
  {
    id: "CX-100249",
    callStartDate: "2026-05-16 10:04",
    callEndDate: "2026-05-16 10:11",
    ani: "+1 650 555 0110",
    dnis: "800-SUPPORT",
    duration: "07:02",
    callType: "Outbound",
    recordingUrl: sampleAudioDataUri,
    recordingFileName: "CX-100249.wav"
  },
  {
    id: "CX-100250",
    callStartDate: "2026-05-16 11:36",
    callEndDate: "2026-05-16 11:49",
    ani: "+1 512 555 0103",
    dnis: "800-WEBEX-02",
    duration: "13:30",
    callType: "Inbound",
    recordingUrl: sampleAudioDataUri,
    recordingFileName: "CX-100250.wav"
  },
  {
    id: "CX-100251",
    callStartDate: "2026-05-16 13:18",
    callEndDate: "2026-05-16 13:22",
    ani: "+1 212 555 0156",
    dnis: "EXT-2044",
    duration: "04:06",
    callType: "Internal",
    recordingUrl: sampleAudioDataUri,
    recordingFileName: "CX-100251.wav"
  },
  {
    id: "CX-100252",
    callStartDate: "2026-05-16 14:07",
    callEndDate: "2026-05-16 14:25",
    ani: "+1 303 555 0187",
    dnis: "800-SUPPORT",
    duration: "18:44",
    callType: "Inbound",
    recordingUrl: sampleAudioDataUri,
    recordingFileName: "CX-100252.wav"
  },
  {
    id: "CX-100253",
    callStartDate: "2026-05-16 15:40",
    callEndDate: "2026-05-16 15:46",
    ani: "+1 206 555 0171",
    dnis: "800-WEBEX-01",
    duration: "06:18",
    callType: "Outbound",
    recordingUrl: sampleAudioDataUri,
    recordingFileName: "CX-100253.wav"
  }
];
