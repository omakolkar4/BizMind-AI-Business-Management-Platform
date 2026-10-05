"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
  businessStage?: string;
  userName?: string;
  userEmail?: string;
}

export function DashboardShell({
  children,
  businessName = "NovaBite Foods",
  businessStage = "Growing",
  userName = "Demo Founder",
  userEmail = "demo@bizmind.ai",
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar
        businessName={businessName}
        businessStage={businessStage}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          businessName={businessName}
          userName={userName}
          userEmail={userEmail}
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
