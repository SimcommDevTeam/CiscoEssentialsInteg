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
  application: WebexApplicationInfo;
}

interface WebexSidebarApplicationInstance {
  onReady(): Promise<void>;
  getSidebar(): Promise<WebexSidebar>;
}

interface WebexApplicationConstructor {
  new (): WebexApplicationInstance;
}

interface WebexSidebarApplicationConstructor {
  new (): WebexSidebarApplicationInstance;
}

interface WebexGlobal {
  Application: WebexApplicationConstructor;
}

interface WebexSidebarGlobal {
  Application: WebexSidebarApplicationConstructor;
}

declare global {
  interface Window {
    webex?: WebexGlobal;
  }
  const webex: WebexSidebarGlobal;
}
