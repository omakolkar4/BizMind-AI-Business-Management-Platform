"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>Notifications & Alerts</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Your real-time notifications are also accessible directly from the bell icon in the top navigation bar.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-xs h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        <Card className="border shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold">Notification Center</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All task alerts, blocker notices, review updates, and system messages are streamed live to the top navigation bell.
            </p>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              Go to Workspace Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
