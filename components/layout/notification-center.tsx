"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Award,
  Sparkles,
  DollarSign,
  CheckSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string; // alert, milestone, task, financial, ai
  isRead: boolean;
  createdAt?: string;
}

export function NotificationCenter() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: "n-1",
      title: "Monthly Revenue Goal Reached",
      message: "September revenue surpassed ₹8,45,000 across catering & subscriptions.",
      type: "milestone",
      isRead: false,
    },
    {
      id: "n-2",
      title: "New AI Recommendation Generated",
      message: "Strategy Agent detected an opportunity in B2B corporate lunch contracts.",
      type: "ai",
      isRead: false,
    },
    {
      id: "n-3",
      title: "Cold-Chain Vendor Task Blocked",
      message: "Action required on SLA contract negotiation with milk & paneer supplier.",
      type: "task",
      isRead: false,
    },
    {
      id: "n-4",
      title: "Packaging Expense Anomaly",
      message: "Packaging expenses grew 18% month-over-month. Review supplier invoices.",
      type: "financial",
      isRead: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.info("Notification dismissed");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "milestone":
        return <Award className="h-4 w-4 text-emerald-500" />;
      case "ai":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case "task":
        return <CheckSquare className="h-4 w-4 text-amber-500" />;
      case "financial":
        return <DollarSign className="h-4 w-4 text-rose-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="info" className="text-[10px] px-1.5 py-0">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markSingleAsRead(item.id)}
                    className={cn(
                      "p-3.5 hover:bg-muted/40 transition-colors flex items-start gap-3 cursor-pointer group relative",
                      !item.isRead && "bg-indigo-50/40 dark:bg-indigo-950/20"
                    )}
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-background border shadow-xs shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No notifications to display.
                </div>
              )}
            </div>

            <div className="border-t p-2 bg-muted/20 text-center">
              <span className="text-[11px] text-muted-foreground">
                BizMind Live Event Telemetry Active
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
