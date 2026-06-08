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
}

interface WebexApplicationInstance {
  onReady(): Promise<void>;
  getSidebar(): Promise<WebexSidebar>;
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
