"use client";

import * as React from "react";
import {
  Settings,
  User,
  Building2,
  BrainCircuit,
  Bell,
  Shield,
  Palette,
  Save,
  Check,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  // Profile State
  const [userName, setUserName] = React.useState("Demo Founder");
  const [userEmail, setUserEmail] = React.useState("demo@bizmind.ai");

  // Business State
  const [businessName, setBusinessName] = React.useState("NovaBite Foods");
  const [businessType, setBusinessType] = React.useState("Food & Beverage");
  const [location, setLocation] = React.useState("Pune, Maharashtra");
  const [budget, setBudget] = React.useState("1500000");
  const [goals, setGoals] = React.useState("Revenue growth, Customer acquisition, Profitability");

  // AI Preferences
  const [aiSensitivity, setAiSensitivity] = React.useState("Balanced");
  const [aiFocus, setAiFocus] = React.useState("Profitability & Cost Control");
  const [alertFrequency, setAlertFrequency] = React.useState("Real-time");

  // Notification Toggles
  const [notifExpenseSpike, setNotifExpenseSpike] = React.useState(true);
  const [notifTaskOverdue, setNotifTaskOverdue] = React.useState(true);
  const [notifMilestones, setNotifMilestones] = React.useState(true);

  // Password State
  const [currPassword, setCurrPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function loadBiz() {
      try {
        const res = await fetch("/api/business");
        if (res.ok) {
          const json = await res.json();
          if (json.business) {
            setBusinessName(json.business.name || "");
            setBusinessType(json.business.type || "");
            setLocation(json.business.location || "");
            setBudget(String(json.business.budget || "1500000"));
          }
        }
      } catch (e) {
        console.warn("Notice loading business:", e);
      }
    }
    loadBiz();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          type: businessType,
          location,
          budget,
          goals,
        }),
      });

      if (res.ok) {
        toast.success("Business profile parameters updated!");
      } else {
        toast.error("Failed to update business.");
      }
    } catch {
      toast.error("Network error saving business settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Founder profile settings updated.");
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("AI Co-Pilot preference weights saved!");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Passwords must match and cannot be empty.");
      return;
    }
    toast.success("Password changed successfully.");
    setCurrPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <DashboardShell businessName={businessName}>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Workspace Settings
            </h1>
            <Badge variant="outline" className="text-xs">Preferences</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal profile, business parameters, AI recommendations, and theme preferences.
          </p>
        </div>

        {/* SECTION 1: BUSINESS PROFILE */}
        <Card id="business" className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Business Parameters</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Core company information used for multi-agent financial modeling and market benchmarks.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-bname">Business Legal / Brand Name</Label>
                  <Input
                    id="s-bname"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s-btype">Industry Category</Label>
                  <Input
                    id="s-btype"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s-bloc">Primary Geographic Hub</Label>
                  <Input
                    id="s-bloc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s-bbudget">Working Capital Budget (₹)</Label>
                  <Input
                    id="s-bbudget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s-bgoals">Immediate Strategic Goals</Label>
                <Input
                  id="s-bgoals"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving} size="sm" className="bg-indigo-600 text-white font-semibold text-xs">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  <span>{saving ? "Updating..." : "Save Business Parameters"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SECTION 2: AI CO-PILOT PREFERENCES */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>AI Multi-Agent Preferences</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Configure how aggressive or conservative the autonomous agents should evaluate your decisions.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSaveAI} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Risk Sensitivity</Label>
                  <select
                    value={aiSensitivity}
                    onChange={(e) => setAiSensitivity(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="Conservative">Conservative (Flag all cost spikes)</option>
                    <option value="Balanced">Balanced (Standard enterprise threshold)</option>
                    <option value="Growth-First">Growth-First (Higher spend tolerance)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Strategic Optimization Focus</Label>
                  <select
                    value={aiFocus}
                    onChange={(e) => setAiFocus(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="Profitability & Cost Control">Profitability & Cost Control</option>
                    <option value="Aggressive Customer Acquisition">Aggressive Customer Acquisition</option>
                    <option value="Operational Throughput">Operational Throughput & SLAs</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Alert Telemetry Interval</Label>
                  <select
                    value={alertFrequency}
                    onChange={(e) => setAlertFrequency(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="Real-time">Real-time Autonomous</option>
                    <option value="Daily Digest">Daily Consolidated Digest</option>
                    <option value="Weekly Executive Review">Weekly Executive Review</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" size="sm" className="bg-indigo-600 text-white font-semibold text-xs">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  <span>Save AI Configuration</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* SECTION 3: APPEARANCE / THEME */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Appearance & Dark Mode</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Switch between Light Professional Mode and Dark Obsidian Studio Mode.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  theme === "light"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="h-5 w-5 text-amber-500" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  theme === "dark"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="h-5 w-5 text-indigo-400" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  theme === "system"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="h-5 w-5 text-slate-500" />
                <span>System Auto</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: NOTIFICATIONS */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <span>Notification Rules</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-foreground">Expense Anomaly Warnings</div>
                <div className="text-[11px] text-muted-foreground">Alert when any category increases &gt;15% in 30 days</div>
              </div>
              <input
                type="checkbox"
                checked={notifExpenseSpike}
                onChange={(e) => setNotifExpenseSpike(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-foreground">Blocked Task Escalations</div>
                <div className="text-[11px] text-muted-foreground">Notify when a high-priority deliverable is marked as Blocked</div>
              </div>
              <input
                type="checkbox"
                checked={notifTaskOverdue}
                onChange={(e) => setNotifTaskOverdue(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-foreground">Milestone Achievement Celebrations</div>
                <div className="text-[11px] text-muted-foreground">Broadcast alerts when a strategic roadmap phase is completed</div>
              </div>
              <input
                type="checkbox"
                checked={notifMilestones}
                onChange={(e) => setNotifMilestones(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded"
              />
            </label>
          </CardContent>
        </Card>

        {/* SECTION 5: SECURITY */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Account Security</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
              <div className="space-y-1">
                <Label htmlFor="sec-curr">Current Password</Label>
                <Input
                  id="sec-curr"
                  type="password"
                  placeholder="••••••••"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sec-new">New Password</Label>
                <Input
                  id="sec-new"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sec-conf">Confirm New Password</Label>
                <Input
                  id="sec-conf"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button type="submit" size="sm" variant="outline" className="text-xs font-semibold mt-2">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
