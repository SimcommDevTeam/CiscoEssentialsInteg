export type { WebexUser } from "./webex";

export interface IncomingCall {
  ani: string;
  dnis: string;
  customerName: string;
  phoneNumber: string;
  disposition: string;
}

export interface ScreenPopupCallInfo {
  ANI: string;
  DNIS: string;
  InteractionID: string;
  AgentID: string;
  AgentName: string;
  QueueID: string;
  QueueName: string;
  TenantID: string;
}

export interface ScreenPopupCustomerInfo {
  Name: string | null;
  Email: string | null;
  Id: string | null;
  Phone: string | null;
  MailingCity: string | null;
  MailingCountry: string | null;
}

export interface ScreenPopupRecord {
  id: number;
  status: "active" | "ended" | string;
  disposition: string | null;
  dispositionSub: string | null;
  createdAt: string;
  updatedAt: string | null;
  callInfo: ScreenPopupCallInfo;
  customerInfo: ScreenPopupCustomerInfo | null;
}

export interface CallRecording {
  id: string;
  callStartDate: string;
  callEndDate: string;
  ani: string;
  dnis: string;
  duration: string;
  callType: string;
  recordingUrl: string;
  recordingFileName: string;
}

export interface DataGridColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}
