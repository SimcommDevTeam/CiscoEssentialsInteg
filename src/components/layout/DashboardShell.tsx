"use client";

import { Bell, Headphones, Radio, Search, ShieldCheck } from "lucide-react";
import clsx from "clsx";

export type DashboardTab = "screen-popup" | "search-play";

interface DashboardShellProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
}

const tabs = [
  { id: "screen-popup" as const, label: "Screen Popup", icon: Radio },
  { id: "search-play" as const, label: "Search & Play", icon: Search }
];

export function DashboardShell({ activeTab, onTabChange, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-webex-canvas">
      <header className="sticky top-0 z-10 border-b border-webex-line bg-white/95 backdrop-blur">
        <div className="px-4 py-4 sm:px-6 xl:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-webex-mint text-webex-teal">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-webex-teal">
                    Cisco Webex
                  </p>
                  <h1 className="text-xl font-bold text-webex-navy sm:text-2xl">
                    Calling Integration
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-lg border border-webex-line bg-webex-canvas px-3 py-2 text-sm font-semibold text-webex-navy md:flex">
                  <ShieldCheck className="h-4 w-4 text-webex-teal" />
                  Secure mock workspace
                </div>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-webex-line bg-white text-webex-muted transition hover:border-webex-cyan hover:text-webex-blue"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>

            <nav className="overflow-x-auto" aria-label="Primary navigation">
              <div className="inline-flex min-w-full gap-2 rounded-lg border border-webex-line bg-webex-canvas p-1 sm:min-w-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={clsx(
                        "flex min-w-40 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition sm:flex-none",
                        isActive
                          ? "bg-webex-blue text-white shadow-webex"
                          : "text-webex-muted hover:bg-white hover:text-webex-navy"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 xl:px-8">{children}</main>
    </div>
  );
}
