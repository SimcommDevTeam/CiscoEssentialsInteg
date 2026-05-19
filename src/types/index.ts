export interface IncomingCall {
  ani: string;
  dnis: string;
  customerName: string;
  phoneNumber: string;
  disposition: string;
}

export interface CallRecording {
  id: string;
  callStartDate: string;
  callEndDate: string;
  ani: string;
  dnis: string;
  duration: string;
  callType: "Inbound" | "Outbound" | "Internal";
  recordingUrl: string;
  recordingFileName: string;
}

export interface DataGridColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}
