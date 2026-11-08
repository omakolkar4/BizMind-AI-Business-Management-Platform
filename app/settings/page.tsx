"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  LogOut,
  KeyRound,
  Copy,
  Lock,
  Briefcase,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // User Profile State
  const [userName, setUserName] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [userRole, setUserRole] = React.useState("OWNER");
  const [userStatus, setUserStatus] = React.useState("Active");

  // Business State
  const [businessName, setBusinessName] = React.useState("");
  const [businessType, setBusinessType] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [goals, setGoals] = React.useState("");

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
  const [savingPassword, setSavingPassword] = React.useState(false);

  const [savingBusiness, setSavingBusiness] = React.useState(false);
  const [copiedUsername, setCopiedUsername] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [bizRes, meRes] = await Promise.all([
          fetch("/api/business"),
          fetch("/api/auth/me"),
        ]);
        if (bizRes.ok) {
          const json = await bizRes.json();
          if (json.business) {
            setBusinessName(json.business.name || "");
            setBusinessType(json.business.type || "");
            setLocation(json.business.location || "");
            setBudget(String(json.business.budget ?? ""));
            if (json.business.goals) {
              try {
                const parsed = JSON.parse(json.business.goals);
                setGoals(Array.isArray(parsed) ? parsed.join(", ") : json.business.goals);
              } catch {
                setGoals(json.business.goals);
              }
            }
          }
        }
        if (meRes.ok) {
          const meJson = await meRes.json();
          if (meJson.user) {
            setUserName(meJson.user.name || "User");
            setUserEmail(meJson.user.email || "");
            setUsername(meJson.user.username || "");
            setUserRole(meJson.user.role || "OWNER");
            setUserStatus(meJson.user.status || "Active");
          }
        }
      } catch (e) {
        console.warn("Notice loading settings data:", e);
      }
    }
    loadData();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBusiness(true);
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
      setSavingBusiness(false);
    }
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("AI Co-Pilot preference weights saved!");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("New passwords must match and cannot be empty.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    try {
      setSavingPassword(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currPassword,
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password.");
        return;
      }
      toast.success("Password changed successfully!");
      setCurrPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Network error updating password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bizmind_user_role");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully.");
      router.push("/login");
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bizmind_user_role");
      }
      router.push("/login");
    }
  };

  const copyUsername = () => {
    if (username) {
      navigator.clipboard.writeText(username);
      setCopiedUsername(true);
      toast.success("Username copied to clipboard!");
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  };

  const isEmployee = userRole === "EMPLOYEE";

  return (
    <DashboardShell
      businessName={businessName}
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isEmployee ? "Employee Settings" : "Workspace Settings"}
            </h1>
            <Badge variant="outline" className={`text-xs ${isEmployee ? "border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-950/50" : "border-indigo-500 text-indigo-600"}`}>
              {isEmployee ? "Staff Account" : "Owner Preferences"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isEmployee
              ? "Manage your employee profile display, personal account credentials, and interface preferences."
              : "Manage your personal profile, business parameters, AI recommendations, and theme preferences."}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* EMPLOYEE-SPECIFIC PROFILE VIEW                                            */}
        {/* ========================================================================= */}
        {isEmployee && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Employee Profile Information</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Your authenticated profile details within {businessName || "the organization"}.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <div className="font-semibold text-sm text-foreground bg-muted/40 p-2.5 rounded-lg border">
                    {userName || "Staff Member"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assigned Username</Label>
                  <div className="flex items-center justify-between font-mono font-bold text-sm text-purple-600 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/40 p-2.5 rounded-lg border border-purple-200 dark:border-purple-900/60">
                    <span>@{username || "unassigned"}</span>
                    <button
                      type="button"
                      onClick={copyUsername}
                      className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy username"
                    >
                      {copiedUsername ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Work Email</Label>
                  <div className="text-xs text-foreground bg-muted/40 p-2.5 rounded-lg border">
                    {userEmail || "No work email configured"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Account Status</Label>
                  <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-foreground">{userStatus}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p>
                  <strong>Role & Compensation:</strong> Your job title, department, salary, and company association are managed directly by your employer. Contact your business owner or HR for assignment changes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* OWNER-ONLY SECTION 1: BUSINESS PROFILE                                    */}
        {/* ========================================================================= */}
        {!isEmployee && (
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
                  <Button type="submit" disabled={savingBusiness} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                    <Save className="h-3.5 w-3.5 mr-1" />
                    <span>{savingBusiness ? "Updating..." : "Save Business Parameters"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* OWNER-ONLY SECTION 2: AI CO-PILOT PREFERENCES                             */}
        {/* ========================================================================= */}
        {!isEmployee && (
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
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                    <Save className="h-3.5 w-3.5 mr-1" />
                    <span>Save AI Configuration</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* COMMON: APPEARANCE / THEME                                                */}
        {/* ========================================================================= */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Appearance & Theme</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Personalize your workspace display mode for your current device.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                  theme === "light"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 shadow-sm"
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
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 shadow-sm"
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
                    ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="h-5 w-5 text-slate-500" />
                <span>System Auto</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* OWNER-ONLY: NOTIFICATION PREFERENCES                                      */}
        {/* ========================================================================= */}
        {!isEmployee && (
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
        )}

        {/* ========================================================================= */}
        {/* COMMON: ACCOUNT SECURITY & CHANGE PASSWORD                                */}
        {/* ========================================================================= */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <span>Change Account Password</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Update your password securely. Passwords are encrypted with bcrypt.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="sec-curr">Current Password</Label>
                <Input
                  id="sec-curr"
                  type="password"
                  placeholder="Enter current password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sec-new">New Password</Label>
                <Input
                  id="sec-new"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sec-conf">Confirm New Password</Label>
                <Input
                  id="sec-conf"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold mt-2"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                <span>{savingPassword ? "Updating Password..." : "Update Password"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* COMMON: SESSION & SIGN OUT                                                */}
        {/* ========================================================================= */}
        <Card className="border border-red-200 dark:border-red-900/30 shadow-sm">
          <CardHeader className="pb-3 border-b bg-red-50/20 dark:bg-red-950/10">
            <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
              <LogOut className="h-4 w-4" />
              <span>Session & Sign Out</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Safely end your session and clear local credentials from this browser.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">
                Signed in as <span className="font-bold">{userName}</span> {username && `(@${username})`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Role: <span className="capitalize">{userRole.toLowerCase()}</span> • Status: {userStatus}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="text-xs font-semibold border-red-200 dark:border-red-900/60 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span>Sign Out</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
