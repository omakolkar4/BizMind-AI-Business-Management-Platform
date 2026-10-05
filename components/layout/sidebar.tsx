"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BrainCircuit,
  FileText,
  Milestone,
  DollarSign,
  Users,
  CheckSquare,
  Sparkles,
  BarChart3,
  Settings,
  X,
  Building2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  businessName?: string;
  businessStage?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({
  businessName = "NovaBite Foods",
  businessStage = "Growing",
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const navLinks: NavSection[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "AI Business Analysis", href: "/analysis", icon: BrainCircuit, badge: "AI" },
        { label: "Business Plan", href: "/business-plan", icon: FileText },
        { label: "Roadmap", href: "/roadmap", icon: Milestone },
      ],
    },
    {
      title: "Operations & Finance",
      items: [
        { label: "Finances & P&L", href: "/finances", icon: DollarSign },
        { label: "Employees", href: "/employees", icon: Users },
        { label: "Task Manager", href: "/tasks", icon: CheckSquare },
      ],
    },
    {
      title: "Intelligence & Output",
      items: [
        { label: "Ask BizMind Advisor", href: "/advisor", icon: Sparkles, highlight: true },
        { label: "Executive Reports", href: "/reports", icon: BarChart3 },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r bg-card text-card-foreground transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-30",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Logo href="/dashboard" size="md" />
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Business Context Card */}
        <div className="p-3 border-b bg-muted/20">
          <div className="flex items-center justify-between rounded-xl border bg-background/80 p-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-foreground truncate">
                  {businessName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground capitalize font-medium">
                    {businessStage} Stage
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/settings"
              title="Edit Business Details"
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navLinks.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 select-none",
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        item.highlight && !isActive && "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                            isActive ? "text-white" : item.highlight ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <Badge
                          variant={isActive ? "secondary" : "ai"}
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 font-bold uppercase",
                            isActive ? "bg-white/20 text-white border-transparent" : ""
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Co-Pilot Status Bottom Badge */}
        <div className="p-3 border-t bg-muted/20">
          <div className="rounded-xl border bg-card p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-foreground">AI Co-Pilot Active</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              Continuous multi-agent monitoring for financials and operational risks.
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Deterministic/LLM
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">v1.2</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
