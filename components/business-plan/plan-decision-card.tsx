"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Edit3,
  Calendar,
  Layers,
  Check,
  HelpCircle,
  Briefcase,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronRight,
  FileCheck2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface PlanDecisionCardProps {
  business: {
    name?: string;
    type?: string;
    location?: string;
    budget?: number;
    stage?: string;
    idea?: string;
    planApproved?: boolean;
    planStatus?: string;
  } | null;
  plan: {
    status?: string;
    version?: number;
    decision?: string | null;
    decisionTimestamp?: string | null;
    acceptedAt?: string | null;
    acceptedBy?: string | null;
    revisionNotes?: string | null;
  } | null;
  feasibility?: {
    overallStatus?: string;
    summary?: string;
    minStartupCost?: number;
    maxStartupCost?: number;
    expectedMonthlyOpex?: number;
    breakEvenMonths?: number;
    capitalViability?: string;
  } | null;
  roadmapPhasesCount?: number;
  userName?: string;
  userRole?: string;
  onDecisionComplete: () => void;
  onScrollToSections?: () => void;
}

export function PlanDecisionCard({
  business,
  plan,
  feasibility,
  roadmapPhasesCount = 7,
  userName = "Founder",
  userRole = "OWNER",
  onDecisionComplete,
  onScrollToSections,
}: PlanDecisionCardProps) {
  const [acceptModalOpen, setAcceptModalOpen] = React.useState(false);
  const [reviseModalOpen, setReviseModalOpen] = React.useState(false);
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);

  const [revisionFeedback, setRevisionFeedback] = React.useState("");
  const [selectedRevisionAreas, setSelectedRevisionAreas] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  const [history, setHistory] = React.useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  const isOwner = userRole !== "EMPLOYEE";
  const planStatus = plan?.status || business?.planStatus || "GENERATED";
  const planVersion = plan?.version || 1;
  const isAccepted = planStatus === "ACCEPTED";
  const isRevisionRequired = planStatus === "REVISION_REQUIRED";
  const isUnderReview = planStatus === "UNDER_REVIEW" || planStatus === "GENERATED";

  const revisionAreaOptions = [
    "Business Idea & Problem Formulation",
    "Starting Budget & Capital Requirements",
    "Target Market & Customer Demographics",
    "Monetization & Pricing Strategy",
    "Operational Constraints & Facility Needs",
    "Risk Mitigation & Assumptions",
  ];

  const toggleRevisionArea = (area: string) => {
    setSelectedRevisionAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleAcceptPlan = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/business-plan/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to record plan acceptance.");
        return;
      }

      toast.success(`Business Plan v${planVersion} officially accepted!`);
      setAcceptModalOpen(false);
      onDecisionComplete();
    } catch {
      toast.error("Network error submitting plan acceptance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevisePlan = async () => {
    try {
      setSubmitting(true);
      const compositeFeedback = [
        selectedRevisionAreas.length > 0
          ? `Areas to revise: ${selectedRevisionAreas.join(", ")}`
          : null,
        revisionFeedback.trim() ? `Founder Notes: ${revisionFeedback.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/business-plan/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REVISE",
          feedback: compositeFeedback || "Founder requested strategic revisions.",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to record revision request.");
        return;
      }

      toast.info("Plan marked as Revision Required. You can now update inputs or plan text.");
      setReviseModalOpen(false);
      setRevisionFeedback("");
      setSelectedRevisionAreas([]);
      onDecisionComplete();
    } catch {
      toast.error("Network error submitting revision request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/business-plan/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SUBMIT_FOR_REVIEW" }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to submit plan for review.");
        return;
      }

      toast.success("Plan submitted for acceptance review.");
      onDecisionComplete();
    } catch {
      toast.error("Network error submitting plan for review.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/business-plan/history");
      if (res.ok) {
        const json = await res.json();
        setHistory(json.versions || []);
      }
    } catch {
      toast.error("Failed to load plan history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryModalOpen(true);
    loadHistory();
  };

  return (
    <div className="space-y-4">
      {/* Main Review & Decision Card */}
      <Card
        className={`border-2 shadow-md transition-all ${
          isAccepted
            ? "border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 via-card to-emerald-50/20 dark:from-emerald-950/20 dark:via-card dark:to-emerald-950/10"
            : isRevisionRequired
            ? "border-amber-500/40 bg-gradient-to-br from-amber-50/50 via-card to-amber-50/20 dark:from-amber-950/20 dark:via-card dark:to-amber-950/10"
            : "border-indigo-500/40 bg-gradient-to-br from-indigo-50/60 via-card to-purple-50/30 dark:from-indigo-950/30 dark:via-card dark:to-purple-950/10"
        }`}
      >
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-xl bg-background border shadow-xs">
                {isAccepted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : isRevisionRequired ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <FileCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg sm:text-xl font-extrabold text-foreground">
                    Review Your Business Plan
                  </CardTitle>
                  <Badge
                    variant={
                      isAccepted
                        ? "success"
                        : isRevisionRequired
                        ? "warning"
                        : "ai"
                    }
                    className="text-xs font-bold"
                  >
                    {isAccepted
                      ? `Accepted (v${planVersion})`
                      : isRevisionRequired
                      ? `Revision Required (v${planVersion})`
                      : `Under Review (v${planVersion})`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review the business idea, feasibility findings, estimated budget, risks, recommendations, and proposed roadmap.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenHistory}
                className="text-xs font-semibold h-8 gap-1.5"
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Version History</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Executive Overview Synthesis Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Box 1: Business Profile */}
            <div className="p-3.5 rounded-xl border bg-card/80 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground font-semibold">
                <span>Venture Profile</span>
                <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
              </div>
              <p className="font-extrabold text-sm text-foreground truncate">
                {business?.name || "My Venture"}
              </p>
              <p className="text-muted-foreground text-[11px] truncate">
                {business?.type} • {business?.location}
              </p>
            </div>

            {/* Box 2: Feasibility & Capital Viability */}
            <div className="p-3.5 rounded-xl border bg-card/80 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground font-semibold">
                <span>Feasibility Finding</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-foreground">
                  {feasibility?.overallStatus || "Evaluated"}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({feasibility?.breakEvenMonths || 6} mo breakeven)
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] truncate">
                {feasibility?.capitalViability || "Capital analyzed against requirements"}
              </p>
            </div>

            {/* Box 3: Capital Allocation */}
            <div className="p-3.5 rounded-xl border bg-card/80 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground font-semibold">
                <span>Estimated Budget</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  ₹
                </span>
              </div>
              <p className="font-extrabold text-sm text-foreground font-mono">
                {formatCurrency(business?.budget || feasibility?.minStartupCost || 500000, "₹")}
              </p>
              <p className="text-muted-foreground text-[11px]">
                Monthly OpEx: {formatCurrency(feasibility?.expectedMonthlyOpex || 75000, "₹")}
              </p>
            </div>

            {/* Box 4: Execution Roadmap Readiness */}
            <div className="p-3.5 rounded-xl border bg-card/80 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground font-semibold">
                <span>Execution Roadmap</span>
                <Layers className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-foreground">
                  {roadmapPhasesCount} Strategic Phases
                </span>
              </div>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {isAccepted
                  ? "✓ Active for Execution"
                  : "Approval Pending Before Execution"}
              </p>
            </div>
          </div>

          {/* Decision Presentation / Actions */}
          {isAccepted ? (
            /* ACCEPTED STATE CONFIRMATION */
            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                      <span>Plan Formally Accepted & Approved for Execution</span>
                      <Badge variant="outline" className="text-[10px] bg-background text-emerald-700 border-emerald-300">
                        v{planVersion} Frozen
                      </Badge>
                    </h3>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                      Accepted by <strong>{plan?.acceptedBy || userName}</strong> on{" "}
                      {plan?.decisionTimestamp
                        ? new Date(plan.decisionTimestamp).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Verified Record"}
                      . Associated roadmap is unlocked for operational execution.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link href="/roadmap">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
                    >
                      <span>Execute Roadmap</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>

                  <Link href="/tasks">
                    <Button variant="outline" size="sm" className="text-xs font-semibold h-9 bg-background">
                      <span>Manage Tasks</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300">
                <span>Want to make material modifications?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviseModalOpen(true)}
                  className="text-[11px] h-7 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100 dark:text-emerald-200"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  <span>Request Revisions on v{planVersion}</span>
                </Button>
              </div>
            </div>
          ) : isRevisionRequired ? (
            /* REVISION REQUIRED STATE BANNER */
            <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                      Revision Required — Changes Requested by Founder
                    </h3>
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-mono whitespace-pre-line bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                      {plan?.revisionNotes || "Revisions requested across strategic sections."}
                    </p>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                      Choose an action below to update your inputs, adjust budget assumptions, or edit sections directly.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={handleSubmitForReview}
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                  >
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    <span>Submit for Acceptance Review</span>
                  </Button>
                </div>
              </div>

              {/* Action Buttons for Revision */}
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-amber-950 dark:text-amber-200">Revision Actions:</span>
                <Link href="/analysis">
                  <Button variant="outline" size="sm" className="text-xs font-semibold h-8 bg-background">
                    <span>1. Edit Business Analysis & Context</span>
                  </Button>
                </Link>
                <Link href="/analyzer">
                  <Button variant="outline" size="sm" className="text-xs font-semibold h-8 bg-background">
                    <span>2. AI Idea & Budget Analyzer</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onScrollToSections}
                  className="text-xs font-semibold h-8 bg-background"
                >
                  <span>3. Edit 17 Plan Sections Directly</span>
                </Button>
              </div>
            </div>
          ) : (
            /* UNDER REVIEW / GENERATED: THE CORE YES / NO DECISION */
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Are you satisfied with this business plan and ready to proceed?</span>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Accepting formalizes Business Plan v{planVersion} as your verified baseline, preserves an immutable snapshot, and unlocks the execution roadmap. Rejecting places it into revision mode so you can refine inputs or sections.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Option B — No, Revise Plan */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={submitting || !isOwner}
                    onClick={() => setReviseModalOpen(true)}
                    className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 font-bold text-xs h-10 px-4"
                  >
                    <XCircle className="h-4 w-4 mr-1.5 text-amber-600" />
                    <span>No, Revise Plan</span>
                  </Button>

                  {/* Option A — Yes, Accept Plan */}
                  <Button
                    size="sm"
                    disabled={submitting || !isOwner}
                    onClick={() => setAcceptModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 px-5 shadow-sm shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    <span>Yes, Accept Plan</span>
                  </Button>
                </div>
              </div>

              {!isOwner && (
                <p className="text-[11px] text-muted-foreground italic">
                  Note: Logged in as Employee. Only authenticated business owners can formally record plan acceptance decisions.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: Option A — Accept Plan Confirmation */}
      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>Confirm Business Plan Acceptance</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Formally adopt this business plan as your strategic operating baseline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-500/10 space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-950 dark:text-emerald-100">
                <span>Venture: {business?.name || "Business"}</span>
                <span>Plan Version: v{planVersion}.0</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
                By accepting, you confirm that you have reviewed the feasibility findings, capital requirements (₹{(business?.budget || 500000).toLocaleString("en-IN")}), customer strategy, and operational risks.
              </p>
            </div>

            <div className="space-y-1.5 text-muted-foreground text-[11px]">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Plan will be stamped with authenticated owner signature: <strong>{userName}</strong>.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Server-generated timestamp will be permanently recorded in the database.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Associated execution roadmap will become active for milestone tracking.</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => setAcceptModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleAcceptPlan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {submitting ? "Recording Acceptance..." : "Confirm & Accept Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Option B — Revise Plan Questionnaire */}
      <Dialog open={reviseModalOpen} onOpenChange={setReviseModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>What Would You Like to Revise?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the areas needing revision and specify what should change before you accept this plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Revision Areas Selection */}
            <div className="space-y-2">
              <label className="font-bold text-foreground block">
                Select Areas Needing Attention:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {revisionAreaOptions.map((area, i) => {
                  const isSelected = selectedRevisionAreas.includes(area);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => toggleRevisionArea(area)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 font-semibold"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <span className="truncate pr-2">{area}</span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Feedback Textarea */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                Specific Feedback or Changes Required:
              </label>
              <Textarea
                rows={4}
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="e.g. Starting budget should be ₹3,00,000 instead of ₹15,00,000. Customer acquisition strategy should focus more on B2B corporate contracts rather than paid Instagram ads..."
                className="text-xs leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                This feedback will be stored in your version history and guide the revision process.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => setReviseModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleRevisePlan}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              {submitting ? "Saving..." : "Record Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Version History Drawer / Inspector */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="h-5 w-5 text-indigo-600" />
              <span>Business Plan Version History & Snapshots</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Auditable archive of all plan versions, decisions, founder signatures, and revision notes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
            {loadingHistory ? (
              <div className="py-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Loading version history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No past version snapshots recorded yet. When you accept or request revision on a plan, immutable snapshots are archived here.
              </div>
            ) : (
              history.map((ver, idx) => (
                <div
                  key={ver.id || idx}
                  className="p-3.5 rounded-xl border bg-card space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-foreground">
                        Version {ver.version}.0
                      </span>
                      <Badge
                        variant={
                          ver.status === "ACCEPTED"
                            ? "success"
                            : ver.status === "REVISION_REQUIRED"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {ver.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(ver.decisionTimestamp || ver.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Action by: <strong>{ver.acceptedBy || "Founder"}</strong>
                  </div>

                  {ver.revisionNotes && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border text-[11px] text-foreground/90 font-mono">
                      <span className="font-bold block text-muted-foreground text-[10px] uppercase">
                        Revision Notes:
                      </span>
                      {ver.revisionNotes}
                    </div>
                  )}

                  <div className="pt-1 text-[11px] text-muted-foreground line-clamp-2">
                    Executive Summary: {ver.executiveSummary}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryModalOpen(false)}
              className="text-xs"
            >
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
