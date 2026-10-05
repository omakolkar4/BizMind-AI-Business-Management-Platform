"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
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
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const navigationItems = [
    { title: "Dashboard Overview", category: "Navigation", href: "/dashboard", icon: LayoutDashboard },
    { title: "AI Business Analysis & SWOT", category: "AI & Planning", href: "/analysis", icon: BrainCircuit },
    { title: "17-Section Business Plan", category: "AI & Planning", href: "/business-plan", icon: FileText },
    { title: "Strategic Roadmap", category: "Operations", href: "/roadmap", icon: Milestone },
    { title: "Financial Management & P&L", category: "Finances", href: "/finances", icon: DollarSign },
    { title: "Team & Employee Directory", category: "Operations", href: "/employees", icon: Users },
    { title: "Kanban Task Management", category: "Operations", href: "/tasks", icon: CheckSquare },
    { title: "Ask BizMind — AI Business Advisor", category: "AI & Planning", href: "/advisor", icon: Sparkles },
    { title: "Executive Business Reports", category: "Analytics", href: "/reports", icon: BarChart3 },
    { title: "Workspace & AI Settings", category: "Configuration", href: "/settings", icon: Settings },
  ];

  const quickActions = [
    { title: "Add New Income / Expense", category: "Finances", href: "/finances?action=new-tx" },
    { title: "Add Team Member", category: "Employees", href: "/employees?action=new-emp" },
    { title: "Create New Kanban Task", category: "Tasks", href: "/tasks?action=new-task" },
    { title: "Ask Co-Pilot about Expenses", category: "Advisor", href: "/advisor?q=expenses" },
    { title: "Export Business Plan PDF", category: "Reports", href: "/business-plan" },
  ];

  const filteredNav = navigationItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = quickActions.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center border-b px-4 py-3 bg-muted/20">
          <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search anything... (Ctrl + K)"
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2 space-y-4">
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation & Modules
              </div>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-accent/80 hover:text-accent-foreground text-foreground transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground group-hover:text-primary flex items-center gap-1">
                        {item.category}
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Shortcuts
              </div>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(action.href)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-accent/80 hover:text-accent-foreground text-foreground transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
                      {action.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No matching modules or actions found for &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2.5 bg-muted/30 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-muted border font-mono">↑↓</span>
            <span>Navigate</span>
            <span className="px-1.5 py-0.5 rounded bg-muted border font-mono ml-2">↵</span>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Press</span>
            <span className="px-1.5 py-0.5 rounded bg-muted border font-mono">ESC</span>
            <span>to exit</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
