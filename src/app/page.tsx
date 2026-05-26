"use client";

import { useEffect, useState } from "react";
import { DashboardShell, type DashboardTab } from "@/components/layout/DashboardShell";
import { ScreenPopupPage } from "@/features/screen-popup/ScreenPopupPage";
import { SearchPlayPage } from "@/features/search-play/SearchPlayPage";

const CALL_QUERY_KEYS = ["ANI", "DNIS", "InteractionID", "AgentID", "AgentName", "QueueID", "QueueName", "TenantID"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("screen-popup");
  const [screenPopupOnly, setScreenPopupOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasCallParams = CALL_QUERY_KEYS.some((k) => params.has(k));
    setScreenPopupOnly(hasCallParams);
  }, []);

  const effectiveTab: DashboardTab = screenPopupOnly ? "screen-popup" : activeTab;

  return (
    <DashboardShell activeTab={effectiveTab} onTabChange={setActiveTab} screenPopupOnly={screenPopupOnly}>
      {effectiveTab === "screen-popup" ? <ScreenPopupPage /> : <SearchPlayPage />}
    </DashboardShell>
  );
}
