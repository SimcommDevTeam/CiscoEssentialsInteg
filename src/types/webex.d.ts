export interface WebexUser {
  id: string;
  displayName: string;
  email: string | null;
  orgId: string | null;
}

interface WebexApplicationStates {
  user: WebexUser;
}

interface WebexApplicationInfo {
  states: WebexApplicationStates;
}

interface WebexBadgeOptions {
  badgeType: "count" | "dot";
  count?: number;
}

interface WebexSidebar {
  showBadge(options: WebexBadgeOptions): Promise<boolean>;
  showNotification(message: string, url?: string): Promise<boolean>;
}

interface WebexContext {
  getSidebar(): Promise<WebexSidebar>;
}

interface WebexCall {
  id: string;
  state: "Started" | "Connected" | "Ended" | string;
  callType?: string;
  localParticipant?: unknown;
  remoteParticipants?: unknown[];
}

type WebexViewState = "IN_FOCUS" | "OUT_OF_FOCUS" | string;

export interface WebexApplicationInstance {
  onReady(): Promise<void>;
  listen(): Promise<void>;
  on(event: "sidebar:callStateChanged", handler: (call: WebexCall) => void): void;
  on(event: "application:viewStateChanged", handler: (viewState: WebexViewState) => void): void;
  context: WebexContext;
  application: WebexApplicationInfo;
}

interface WebexApplicationConstructor {
  new (): WebexApplicationInstance;
}

interface WebexGlobal {
  Application: WebexApplicationConstructor;
}

declare global {
  interface Window {
    webex?: WebexGlobal;
  }
}
