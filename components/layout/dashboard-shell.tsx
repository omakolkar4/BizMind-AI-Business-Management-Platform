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
  userRole?: string;
}

export function DashboardShell({
  children,
  businessName: propBusinessName,
  businessStage: propBusinessStage,
  userName: propUserName,
  userEmail: propUserEmail,
  userRole: propUserRole,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sessionInfo, setSessionInfo] = React.useState<{
    userName?: string;
    userEmail?: string;
    businessName?: string;
    businessStage?: string;
    userRole?: string;
  } | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedRole = localStorage.getItem("bizmind_user_role");
        const cachedName = localStorage.getItem("bizmind_user_name");
        if (cachedRole) {
          return {
            userRole: cachedRole,
            userName: cachedName || undefined,
          };
        }
      } catch {}
    }
    return null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = React.useState(!propUserRole && !sessionInfo?.userRole);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user) {
          const role = data.user.role || "OWNER";
          const name = data.user.name || (role === "EMPLOYEE" ? "Team Member" : "Founder");
          try {
            localStorage.setItem("bizmind_user_role", role);
            localStorage.setItem("bizmind_user_name", name);
          } catch {}
          setSessionInfo({
            userName: name,
            userEmail: data.user.email || "",
            businessName: data.user.businessName || "My Business",
            userRole: role,
          });
          setIsLoadingAuth(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const businessName = propBusinessName || sessionInfo?.businessName || "My Business";
  const businessStage = propBusinessStage || sessionInfo?.businessStage || "Growing";
  const userName = propUserName || sessionInfo?.userName || "Founder";
  const userEmail = propUserEmail || sessionInfo?.userEmail || "";
  const userRole = propUserRole || sessionInfo?.userRole || "OWNER";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8faff] via-[#f5f7fc] to-[#eef2fb] dark:from-[#0b0f19] dark:via-[#0e1322] dark:to-[#121829] text-foreground">
      <Sidebar
        businessName={businessName}
        businessStage={businessStage}
        userRole={userRole}
        loading={isLoadingAuth}
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
