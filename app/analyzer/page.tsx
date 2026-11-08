"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  DollarSign,
  TrendingUp,
  Building2,
  Layers,
  Wrench,
  Users,
  Compass,
  Check,
  RefreshCw,
  Save,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCheck2,
  FileText,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { IdeaAssessmentData, BudgetItem } from "@/lib/ai/ideaAnalyzer";

export default function IdeaAnalyzerPage() {
  const [step, setStep] = React.useState<"input" | "questions" | "results">("input");

  // Form Inputs
  const [rawIdea, setRawIdea] = React.useState("");
  const [businessCategory, setBusinessCategory] = React.useState("Food & Beverage / Cloud Kitchen");
  const [targetLocation, setTargetLocation] = React.useState("Pune, Maharashtra");
  const [operatingModel, setOperatingModel] = React.useState("Both Online & Offline / Shared Kitchen");
  const [staffingPlan, setStaffingPlan] = React.useState("Solo founder with part-time support");
  const [statedBudget, setStatedBudget] = React.useState<string>("500000");
  const [isBudgetUnknown, setIsBudgetUnknown] = React.useState(false);
  const [existingResources, setExistingResources] = React.useState("");
  const [timeframeGoal, setTimeframeGoal] = React.useState("Validate customer demand and break even within 6 months");

  // Results & Application States
  const [assessment, setAssessment] = React.useState<IdeaAssessmentData | null>(null);
  const [assessmentRecordId, setAssessmentRecordId] = React.useState<string | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [applyModalOpen, setApplyModalOpen] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [currentBusiness, setCurrentBusiness] = React.useState<any>(null);

  // Load existing business profile if available
  React.useEffect(() => {
    fetch("/api/business")
      .then((res) => res.json())
      .then((json) => {
        if (json.business) {
          setCurrentBusiness(json.business);
          if (!rawIdea && json.business.idea) {
            setRawIdea(json.business.idea);
          }
          if (json.business.location) {
            setTargetLocation(json.business.location);
          }
          if (json.business.budget) {
            setStatedBudget(String(json.business.budget));
          }
        }
      })
      .catch(() => null);
  }, []);

  const sampleIdeaStarters = [
    {
      title: "Cloud Kitchen",
      text: "I want to start a small cloud kitchen selling healthy meal boxes to IT professionals in Pune, but I do not know how much money I need.",
      cat: "Food & Beverage / Cloud Kitchen",
      op: "Both Online & Offline / Shared Kitchen",
    },
    {
      title: "AI / SaaS Tool",
      text: "I want to build a simple B2B SaaS web application that helps local retail shops automate customer WhatsApp reorders.",
      cat: "Technology / Software / SaaS",
      op: "Online Only",
    },
    {
      title: "Clothing Boutique",
      text: "I want to open a small curated boutique store selling sustainable cotton clothing in a local shopping neighborhood.",
      cat: "Retail & E-commerce",
      op: "Physical Facility / Shop",
    },
    {
      title: "Design Agency",
      text: "I want to start a freelance UX design and branding agency for early-stage tech startups.",
      cat: "Professional & Client Services",
      op: "From Home / Remote",
    },
  ];

  const handleApplyStarter = (starter: typeof sampleIdeaStarters[0]) => {
    setRawIdea(starter.text);
    setBusinessCategory(starter.cat);
    setOperatingModel(starter.op);
  };

  const handleProceedToQuestions = () => {
    if (!rawIdea.trim()) {
      toast.error("Please enter a short description of your business idea.");
      return;
    }
    setStep("questions");
  };

  const handleRunAssessment = async () => {
    try {
      setAnalyzing(true);
      toast.info("Analyzing your idea, operational model, and calculating estimated budget...");

      const payload = {
        rawIdea: rawIdea.trim(),
        businessCategory,
        operatingModel,
        targetLocation,
        staffingPlan,
        statedBudget: isBudgetUnknown ? null : (statedBudget ? parseFloat(statedBudget) : null),
        isBudgetUnknown,
        existingResources,
        timeframeGoal,
      };

      const res = await fetch("/api/analyzer/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to analyze business idea.");
        return;
      }

      setAssessment(json.assessment);
      if (json.assessmentRecordId) {
        setAssessmentRecordId(json.assessmentRecordId);
      }
      setStep("results");
      toast.success("Preliminary Business Assessment & Budget Estimation Ready!");
    } catch {
      toast.error("Network error during idea assessment.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyToProfile = async () => {
    if (!assessment) return;
    try {
      setApplying(true);
      const budgetValue = isBudgetUnknown
        ? assessment.financialEstimates.oneTimeStartupRange.typical
        : (statedBudget ? parseFloat(statedBudget) : assessment.financialEstimates.oneTimeStartupRange.typical);

      const res = await fetch("/api/analyzer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentRecordId,
          businessName: currentBusiness?.name || `${assessment.businessCategory.split("/")[0].trim()} Venture`,
          businessIdea: rawIdea.trim(),
          businessCategory: assessment.businessCategory,
          location: targetLocation,
          budget: budgetValue,
          stage: "Validation",
          targetCustomer: assessment.targetCustomer.group,
          pricingModel: assessment.proposedBusinessModel.pricingStrategy,
          uniqueAdvantage: assessment.targetCustomer.problemSolved,
          resources: existingResources || "Preliminary tools and operational plan identified via Analyzer",
          assessment,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to apply analyzer results.");
        return;
      }

      toast.success("Analyzer findings successfully applied to your business profile!");
      setApplyModalOpen(false);
    } catch {
      toast.error("Error applying findings to business profile.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <DashboardShell businessName={currentBusiness?.name || "Business Venture"}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-background dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-background p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  I Have a Business Idea — Help Me Plan It
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI-assisted idea & budget explorer for founders who need initial clarity on startup capital, resources, and operational steps.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/analysis">
              <Button variant="outline" size="sm" className="text-xs font-semibold h-9">
                <Compass className="h-3.5 w-3.5 mr-1.5" />
                <span>Go to Analysis Hub</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* STEP 1: ORDINARY LANGUAGE IDEA INPUT */}
        {step === "input" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>Describe Your Idea in Simple Words</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                You do not need formal business terminology or detailed financial spreadsheets. Just tell us what you want to do.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="raw-idea-input" className="text-xs font-bold text-foreground">
                  What business idea do you want to start? <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="raw-idea-input"
                  rows={4}
                  value={rawIdea}
                  onChange={(e) => setRawIdea(e.target.value)}
                  placeholder="e.g. I want to start a small cloud kitchen selling healthy meals in Pune, but I do not know how much money I need."
                  className="text-xs sm:text-sm leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Tell us what product or service you want to offer, who might want it, and what your main questions are.
                </p>
              </div>

              {/* Quick Starter Chips */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Or select a starter example to explore:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleIdeaStarters.map((starter, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleApplyStarter(starter)}
                      className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/50 text-left text-xs transition-colors flex items-start gap-2.5"
                    >
                      <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground block">{starter.title}</span>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {starter.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  size="sm"
                  onClick={handleProceedToQuestions}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6 shadow-sm"
                >
                  <span>Continue to Guided Questions</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: RELEVANT CONDITIONAL FOLLOW-UP QUESTIONS */}
        {step === "questions" && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Compass className="h-4 w-4 text-indigo-600" />
                    <span>A Few Quick Questions to Customize Your Estimate</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Help us adapt the equipment, staffing, and budget calculations to your specific situation.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Step 2 of 2
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Summary of Idea entered */}
              <div className="p-3.5 rounded-xl border bg-muted/20 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Your Business Concept:
                </span>
                <p className="text-foreground font-medium italic">"{rawIdea}"</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="q-cat" className="text-xs font-bold">
                    Business Category
                  </Label>
                  <select
                    id="q-cat"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 text-foreground"
                  >
                    <option value="Food & Beverage / Cloud Kitchen">Food & Beverage / Cloud Kitchen</option>
                    <option value="Technology / Software / SaaS">Technology / Software / SaaS</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                    <option value="Professional & Client Services">Professional & Client Services</option>
                    <option value="Manufacturing & Craft Production">Manufacturing & Craft Production</option>
                    <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                    <option value="General Small Enterprise">General Small Enterprise</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="q-loc" className="text-xs font-bold">
                    Location or Target Market
                  </Label>
                  <Input
                    id="q-loc"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. Pune, Maharashtra (Hinjewadi & Baner)"
                    className="text-xs"
                  />
                </div>

                {/* Operating Model */}
                <div className="space-y-1.5">
                  <Label htmlFor="q-op" className="text-xs font-bold">
                    Where / How will you operate?
                  </Label>
                  <select
                    id="q-op"
                    value={operatingModel}
                    onChange={(e) => setOperatingModel(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 text-foreground"
                  >
                    <option value="From Home">From Home (Zero rent initially)</option>
                    <option value="Online / Remote">Online Only (Digital cloud services)</option>
                    <option value="Shared Facility / Cloud Kitchen">Shared Facility / Co-working / Cloud Kitchen</option>
                    <option value="Physical Facility / Shop">Physical Dedicated Store / Facility</option>
                    <option value="Undecided">Undecided (Recommend best approach)</option>
                  </select>
                </div>

                {/* Staffing Plan */}
                <div className="space-y-1.5">
                  <Label htmlFor="q-staff" className="text-xs font-bold">
                    Are you starting alone or hiring staff?
                  </Label>
                  <select
                    id="q-staff"
                    value={staffingPlan}
                    onChange={(e) => setStaffingPlan(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 text-foreground"
                  >
                    <option value="Solo founder (Handling everything initially)">Solo founder (Handling everything initially)</option>
                    <option value="Founder + 1 Co-founder / Partner">Founder + 1 Co-founder / Partner</option>
                    <option value="Solo founder + 1-2 Hired staff">Solo founder + 1-2 Hired staff</option>
                    <option value="Full team from day 1">Full team from day 1</option>
                  </select>
                </div>

                {/* Budget Question with "I don't know" toggle */}
                <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-xl border bg-card">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="q-budget" className="text-xs font-bold text-foreground">
                      What budget range can you afford, if known?
                    </Label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <input
                        type="checkbox"
                        checked={isBudgetUnknown}
                        onChange={(e) => setIsBudgetUnknown(e.target.checked)}
                        className="rounded border-input text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>I don't know yet — show me estimated requirements</span>
                    </label>
                  </div>

                  {!isBudgetUnknown ? (
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        id="q-budget"
                        type="number"
                        value={statedBudget}
                        onChange={(e) => setStatedBudget(e.target.value)}
                        placeholder="e.g. 500000"
                        className="text-xs pl-7 font-mono font-bold"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Enter your available capital. We will evaluate if it is sufficient or if a leaner option is advised.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 text-[11px] text-indigo-950 dark:text-indigo-200 mt-2">
                      ✓ No problem! You do not need to invent financial numbers. We will calculate estimated Low, Typical, and High capital requirements for you.
                    </div>
                  )}
                </div>

                {/* Existing Resources */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="q-res" className="text-xs font-bold">
                    Do you already have any equipment, premises, tools, or resources? (Optional)
                  </Label>
                  <Input
                    id="q-res"
                    value={existingResources}
                    onChange={(e) => setExistingResources(e.target.value)}
                    placeholder="e.g. Existing laptop, car for deliveries, contacts with suppliers, starting from scratch"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("input")}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  <span>Back to Idea Description</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleRunAssessment}
                  disabled={analyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6 shadow-sm"
                >
                  <Sparkles className={`h-4 w-4 mr-1.5 ${analyzing ? "animate-spin" : ""}`} />
                  <span>{analyzing ? "Analyzing & Estimating..." : "Generate Preliminary Assessment"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: INTERACTIVE RESULTS & DETAILED ESTIMATE (Sections 4.C, 4.D, 4.E, 4.F) */}
        {step === "results" && assessment && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-card shadow-xs">
              <div className="flex items-center gap-2">
                <Badge variant="ai" className="text-xs font-bold">
                  {assessment.businessCategory}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  • Operating in {targetLocation}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("questions")}
                  className="text-xs h-9"
                >
                  <span>Edit Inputs & Assumptions</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => setApplyModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Use Results in Business Plan & Profile</span>
                </Button>
              </div>
            </div>

            {/* Feasibility & Budget Comparison Banner (Section 4.E) */}
            {assessment.budgetComparison && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                  assessment.budgetComparison.feasibilityVerdict === "FEASIBLE"
                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100"
                    : assessment.budgetComparison.feasibilityVerdict === "CAPITAL_CONSTRAINED"
                    ? "border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100"
                    : "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                      assessment.budgetComparison.feasibilityVerdict === "FEASIBLE"
                        ? "bg-emerald-600"
                        : assessment.budgetComparison.feasibilityVerdict === "CAPITAL_CONSTRAINED"
                        ? "bg-rose-600"
                        : "bg-amber-600"
                    }`}
                  >
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base">
                        {assessment.budgetComparison.verdictTitle}
                      </h3>
                      <Badge variant="outline" className="text-[10px] bg-background">
                        {assessment.budgetComparison.feasibilityVerdict.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {assessment.budgetComparison.explanation}
                    </p>
                    <p className="text-[11px] opacity-80 pt-0.5">
                      <strong>Risk Note:</strong> {assessment.budgetComparison.riskIfUnderfunded}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0">
                  <span className="text-[10px] uppercase font-bold opacity-80">Essential Startup Capital:</span>
                  <span className="font-extrabold text-base sm:text-xl font-mono">
                    {formatCurrency(assessment.budgetComparison.essentialCapitalNeeded, "₹")}
                  </span>
                </div>
              </div>
            )}

            {/* 3 Core Estimated Financial Ranges (Section 4.D) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* One-Time Startup Costs */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-2 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>1. One-Time Startup Costs</span>
                    <Badge variant="outline" className="text-[10px]">Setup Only</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                    {formatCurrency(assessment.financialEstimates.oneTimeStartupRange.typical, "₹")}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Low: {formatCurrency(assessment.financialEstimates.oneTimeStartupRange.low, "₹")}</span>
                    <span>High: {formatCurrency(assessment.financialEstimates.oneTimeStartupRange.high, "₹")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t">
                    Covers premises deposit, equipment, licenses, initial inventory, and launch testing.
                  </p>
                </CardContent>
              </Card>

              {/* Recurring Monthly OpEx */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-2 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                    <span>2. Monthly Recurring OpEx</span>
                    <Badge variant="outline" className="text-[10px]">Monthly Burn</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                    {formatCurrency(assessment.financialEstimates.recurringMonthlyOpexRange.typical, "₹")}<span className="text-xs font-normal text-muted-foreground">/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Low: {formatCurrency(assessment.financialEstimates.recurringMonthlyOpexRange.low, "₹")}</span>
                    <span>High: {formatCurrency(assessment.financialEstimates.recurringMonthlyOpexRange.high, "₹")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t">
                    Covers rent, staff payroll, utilities, cloud software, and recurring marketing.
                  </p>
                </CardContent>
              </Card>

              {/* Total Recommended Capital with 3-Mo Buffer */}
              <Card className="border shadow-xs border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20">
                <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900">
                  <CardTitle className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                    <span>3. Total Capital with Buffer</span>
                    <Badge variant="ai" className="text-[10px]">3-Mo Safety Buffer</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {formatCurrency(assessment.financialEstimates.totalRecommendedCapital.typical, "₹")}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Low: {formatCurrency(assessment.financialEstimates.totalRecommendedCapital.low, "₹")}</span>
                    <span>High: {formatCurrency(assessment.financialEstimates.totalRecommendedCapital.high, "₹")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-indigo-100 dark:border-indigo-900">
                    Includes ₹{assessment.financialEstimates.suggestedWorkingCapitalBuffer.toLocaleString("en-IN")} working capital buffer to protect against slow initial sales.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Lean MVP Alternative Card (Section 4.C #12) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-100">
                    Suggested Low-Cost Starting Option: {assessment.leanAlternative.title}
                  </h4>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-700 border-emerald-400 bg-background">
                  Est. Lean Capital: {formatCurrency(assessment.leanAlternative.estimatedLeanStartupCost, "₹")}
                </Badge>
              </div>

              <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                {assessment.leanAlternative.description}
              </p>

              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100 block text-[11px]">Key Focus & Trade-offs:</span>
                  <span className="text-muted-foreground text-[11px]">{assessment.leanAlternative.keyCompromisesOrFocus}</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-950 dark:text-emerald-100 block text-[11px]">Milestone Before Full Spend:</span>
                  <span className="text-muted-foreground text-[11px]">{assessment.leanAlternative.validationMilestoneBeforeFullSpend}</span>
                </div>
              </div>
            </div>

            {/* Itemized Budget Breakdown Table (Section 4.D) */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Itemized Budget Breakdown & Planning Assumptions</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Distinguishes essential Day-1 setup expenses from deferrable items.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b text-[11px] text-muted-foreground uppercase font-bold">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3">Expense Item</th>
                      <th className="p-3">Period</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3 font-mono">Est. Typical (₹)</th>
                      <th className="p-3">Assumptions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {assessment.financialEstimates.itemizedBudget.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-3 font-semibold text-foreground truncate max-w-[140px]">
                          {item.category}
                        </td>
                        <td className="p-3 font-bold text-foreground">{item.item}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {item.period}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.isEssential
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.isEssential ? "Essential Day 1" : "Can Defer"}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-foreground">
                          {formatCurrency(item.typicalEstimate, "₹")}
                        </td>
                        <td className="p-3 text-[11px] text-muted-foreground max-w-xs">
                          {item.assumption}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* 2-Column: Operational Resource Checklist & Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
              {/* Equipment & Resource Checklist */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-indigo-600" />
                    <span>Equipment, Tools & Premises Checklist</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <span className="font-bold text-foreground block mb-1">Required Equipment & Hardware:</span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {assessment.equipmentAndResources.physicalEquipment.map((eq, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{eq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="font-bold text-foreground block mb-1">Software & Cloud Tools:</span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {assessment.equipmentAndResources.toolsAndTechnology.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="font-bold text-foreground block mb-1">Premises & Space Needs:</span>
                    <p className="text-[11px] text-muted-foreground">
                      {assessment.equipmentAndResources.premisesOrSpace}
                    </p>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="font-bold text-foreground block mb-1">Staffing Strategy:</span>
                    <p className="text-[11px] text-muted-foreground">
                      {assessment.staffingAndTalent.initialTeamStructure}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Risks, Assumptions & Unknown Questions */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Critical Risks & Questions to Answer</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <span className="font-bold text-foreground block mb-1">Top Critical Risks:</span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {assessment.risksAndUncertainties.criticalRisks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="font-bold text-foreground block mb-1">Questions That Still Need Answers:</span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {assessment.unansweredQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold">?</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t">
                    <span className="font-bold text-foreground block mb-1">Immediate Recommended Next Steps:</span>
                    <ul className="space-y-1 text-muted-foreground text-[11px]">
                      {assessment.recommendedNextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold font-mono">→</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer & Financial Integrity Note */}
            <div className="p-3.5 rounded-xl border border-muted bg-muted/10 text-[11px] text-muted-foreground space-y-1">
              <span className="font-bold text-foreground block">
                Financial Integrity & Disclaimer Note:
              </span>
              <p className="leading-relaxed">
                {assessment.disclaimer}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("questions")}
                className="text-xs h-10 w-full sm:w-auto"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                <span>Adjust Assumptions & Recalculate</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={() => setApplyModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 w-full sm:w-auto shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  <span>Apply Findings to Business Profile</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION MODAL: Apply Analyzer Results to Venture Profile */}
        <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Apply Findings to Business Profile</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review proposed updates before integrating them into your active venture profile, context, and feasibility models.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3.5 rounded-xl border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Category:</span>
                  <span className="text-indigo-600">{assessment?.businessCategory}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Location:</span>
                  <span>{targetLocation}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span>Estimated Capital:</span>
                  <span className="font-mono">
                    {formatCurrency(
                      isBudgetUnknown
                        ? assessment?.financialEstimates.oneTimeStartupRange.typical || 500000
                        : parseFloat(statedBudget || "500000"),
                      "₹"
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-muted-foreground text-[11px]">
                <p>• Updates your active Business profile and Context records.</p>
                <p>• Syncs estimated startup and monthly OpEx figures into Feasibility Assessment.</p>
                <p>• Does NOT write hypothetical transactions to your actual financial ledger.</p>
                <p>• Sets your venture up to generate a customized 17-section Business Plan and Execution Roadmap.</p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                disabled={applying}
                onClick={() => setApplyModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={applying}
                onClick={handleApplyToProfile}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {applying ? "Applying..." : "Confirm & Apply to Profile"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
