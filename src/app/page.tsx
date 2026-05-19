"use client";

import { useState } from "react";
import { DashboardShell, type DashboardTab } from "@/components/layout/DashboardShell";
import { ScreenPopupPage } from "@/features/screen-popup/ScreenPopupPage";
import { SearchPlayPage } from "@/features/search-play/SearchPlayPage";

export default function Home() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("screen-popup");

  return (
    <DashboardShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "screen-popup" ? <ScreenPopupPage /> : <SearchPlayPage />}
    </DashboardShell>
  );
}
