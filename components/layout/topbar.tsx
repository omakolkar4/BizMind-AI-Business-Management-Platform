"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Sparkles,
  RefreshCw,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationCenter } from "./notification-center";
import { CommandMenu } from "./command-menu";
import { toast } from "sonner";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  onMobileToggle?: () => void;
  businessName?: string;
}

export function Topbar({
  userName = "Founder",
  userEmail = "",
  onMobileToggle,
  businessName = "My Business",
}: TopbarProps) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bizmind_user_role");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bizmind_user_role");
      }
      router.push("/login");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Left Section: Mobile Menu + Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Trigger */}
          <div
            onClick={() => setCommandOpen(true)}
            className="flex items-center w-full gap-2.5 rounded-xl border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer select-none"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Search tasks, metrics, plan...</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Right Section: Actions, AI Status, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Mode Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-card text-[11px] font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-foreground font-semibold">AI Mentor</span>
            <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">
              Online
            </span>
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-muted transition-colors focus:outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-foreground truncate max-w-[100px]">
                  {userName}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                  {businessName}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border bg-card p-1.5 shadow-2xl text-card-foreground animate-in fade-in-0 zoom-in-95">
                  <div className="px-3 py-2 border-b">
                    <div className="text-xs font-bold text-foreground">{userName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{userEmail}</div>
                  </div>
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push("/settings");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted text-foreground transition-colors text-left"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push("/settings#business");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted text-foreground transition-colors text-left"
                    >
                      <Building className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Manage Business</span>
                    </button>
                  </div>
                  <div className="border-t pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left font-medium"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Search Menu */}
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
