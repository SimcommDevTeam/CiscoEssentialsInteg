"use client";

import { Bell, Headphones, Radio, Search } from "lucide-react";
import clsx from "clsx";

export type DashboardTab = "screen-popup" | "search-play";

interface DashboardShellProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  screenPopupOnly?: boolean;
  children: React.ReactNode;
}

const tabs = [
  { id: "screen-popup" as const, label: "Screen Popup", icon: Radio },
  { id: "search-play" as const, label: "Search & Play", icon: Search }
];

export function DashboardShell({ activeTab, onTabChange, screenPopupOnly = false, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-webex-canvas">
      <header className="sticky top-0 z-10 bg-white shadow-webex">
        {/* Webex brand accent line */}
        <div className="h-[3px] bg-webex-blue" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 xl:px-8">
          {/* Top row: brand + actions */}
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-webex-blue text-white">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-webex-blue">Cisco Webex</span>
                <span className="hidden text-webex-line sm:block">|</span>
                <span className="hidden text-sm font-semibold text-webex-navy sm:block">
                  Calling Integration
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-md border border-webex-line bg-webex-canvas px-3 py-1.5 text-xs font-semibold text-webex-muted sm:flex">
                Cisco Webex Workspace
              </span>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md border border-webex-line text-webex-muted transition hover:border-webex-blue hover:text-webex-blue"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tab navigation — hidden when launched from a call URL */}
          {!screenPopupOnly && (
            <nav className="flex gap-1" aria-label="Primary navigation">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={clsx(
                      "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition",
                      isActive
                        ? "border-b-webex-blue text-webex-blue"
                        : "border-b-transparent text-webex-muted hover:border-b-webex-line hover:text-webex-navy"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 xl:px-8">{children}</main>
    </div>
  );
}
