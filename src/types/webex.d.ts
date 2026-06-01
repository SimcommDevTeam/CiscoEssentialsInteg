export interface WebexUser {
  id: string;
  displayName: string;
  email: string | null;
  orgId: string | null;
}

interface WebexContext {
  getUser(): Promise<WebexUser>;
}

interface WebexApplicationInstance {
  onReady(): Promise<void>;
  context: WebexContext;
}

interface WebexApplicationConstructor {
  new (): WebexApplicationInstance;
  ErrorCodes: Record<number, string>;
}

interface WebexGlobal {
  Application: WebexApplicationConstructor;
}

declare global {
  interface Window {
    Webex?: WebexGlobal;
  }
}
