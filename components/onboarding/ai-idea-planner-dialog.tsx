"use client";

import * as React from "react";
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
  Info,
  ShieldCheck,
  FileCheck2,
  Lightbulb,
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  IdeaAssessmentData,
  detectBusinessCategory,
} from "@/lib/ai/ideaAnalyzer";

interface AiIdeaPlannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  initialIdea: string;
  onApplyToOnboarding: (data: {
    category: string;
    location: string;
    targetCustomer: string;
    budget: string;
    resources: string;
    operatingModel: string;
    stage: string;
    goals: string[];
    assessment: IdeaAssessmentData;
    assessmentRecordId?: string | null;
  }) => void;
}

export function AiIdeaPlannerDialog({
  isOpen,
  onClose,
  businessName,
  initialIdea,
  onApplyToOnboarding,
}: AiIdeaPlannerDialogProps) {
  const [stage, setStage] = React.useState<"questions" | "results" | "confirm">("questions");

  // Inputs
  const [ideaText, setIdeaText] = React.useState(initialIdea);
  const [detectedCategory, setDetectedCategory] = React.useState("Food & Beverage / Cloud Kitchen");
  const [location, setLocation] = React.useState("Pune, Maharashtra");
  const [operatingModel, setOperatingModel] = React.useState("Both Online & Offline / Shared Kitchen");
  const [staffingPlan, setStaffingPlan] = React.useState("Solo founder with part-time support");
  const [isBudgetUnknown, setIsBudgetUnknown] = React.useState(false);
  const [statedBudget, setStatedBudget] = React.useState("350000");
  const [existingResources, setExistingResources] = React.useState("");
  const [timeframeGoal, setTimeframeGoal] = React.useState("Validate customer demand and break even within 6 months");

  // Loading & Results
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [assessment, setAssessment] = React.useState<IdeaAssessmentData | null>(null);
  const [assessmentRecordId, setAssessmentRecordId] = React.useState<string | null>(null);

  // Sync initial idea when dialog opens
  React.useEffect(() => {
    if (initialIdea && initialIdea.trim()) {
      setIdeaText(initialIdea);
      const cat = detectBusinessCategory(initialIdea);
      setDetectedCategory(cat);
      if (cat.includes("Technology") || cat.includes("Software")) {
        setOperatingModel("Online Only");
        setStaffingPlan("Solo founder (handling code & design)");
        setStatedBudget("200000");
      } else if (cat.includes("Retail")) {
        setOperatingModel("Physical Facility / Shop");
        setStaffingPlan("Solo founder + 1 retail assistant");
        setStatedBudget("500000");
      } else if (cat.includes("Food")) {
        setOperatingModel("Both Online & Offline / Shared Kitchen");
        setStaffingPlan("Solo founder with 1 cook / assistant");
        setStatedBudget("400000");
      }
    }
  }, [initialIdea, isOpen]);

  // Handle changing idea text live
  const handleIdeaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setIdeaText(val);
    if (val.trim().length > 10) {
      setDetectedCategory(detectBusinessCategory(val));
    }
  };

  const handleRunAssessment = async () => {
    if (!ideaText.trim()) {
      toast.error("Please enter a brief sentence about your business idea.");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.info("BizMind AI is estimating your startup requirements and budget in ₹ INR...");

      const res = await fetch("/api/analyzer/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIdea: ideaText.trim(),
          businessCategory: detectedCategory,
          operatingModel,
          targetLocation: location,
          staffingPlan,
          statedBudget: isBudgetUnknown ? null : (statedBudget ? parseFloat(statedBudget) : null),
          isBudgetUnknown,
          existingResources,
          timeframeGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate business estimate.");
      }

      setAssessment(data.assessment);
      setAssessmentRecordId(data.assessmentRecordId || null);
      setStage("results");
      toast.success("Preliminary Business & Budget Assessment Ready!");
    } catch (err: any) {
      console.error("AI Planner error:", err);
      toast.error(err?.message || "Failed to analyze idea. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmTransfer = () => {
    if (!assessment) return;

    const budgetValue = isBudgetUnknown
      ? String(assessment.financialEstimates.oneTimeStartupRange.typical || 300000)
      : (statedBudget || String(assessment.financialEstimates.oneTimeStartupRange.typical));

    const resourcesList = assessment.equipmentAndResources.physicalEquipment
      .concat(assessment.equipmentAndResources.toolsAndTechnology.slice(0, 2))
      .slice(0, 4)
      .join(", ");

    onApplyToOnboarding({
      category: assessment.businessCategory,
      location: location.trim() || "Pune, Maharashtra",
      targetCustomer: assessment.targetCustomer.group || "Urban consumers seeking high convenience and reliability",
      budget: budgetValue,
      resources: existingResources ? `${existingResources} | Needed: ${resourcesList}` : resourcesList,
      operatingModel,
      stage: "Validation",
      goals: ["Revenue growth", "Customer acquisition", "Profitability"],
      assessment,
      assessmentRecordId,
    });

    toast.success("AI Plan applied to your onboarding profile!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border shadow-2xl rounded-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sticky top-0 z-20 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                <Sparkles className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-300 font-bold block">
                  BizMind 3.0 • Integrated AI Startup Planner
                </span>
                <DialogTitle className="text-xl font-extrabold text-white">
                  {stage === "questions" && "Plan Your Business Idea & Budget with AI"}
                  {stage === "results" && "Preliminary Business & Budget Assessment"}
                  {stage === "confirm" && "Review Proposed Onboarding Inputs"}
                </DialogTitle>
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs text-indigo-200 mt-1">
            {stage === "questions" &&
              `Assisting ${businessName ? `"${businessName}"` : "your venture"} with realistic Indian market estimates (₹ INR), required resources, and beginner-friendly planning.`}
            {stage === "results" &&
              "Itemized startup costs, recurring expenses, operational equipment, and low-cost MVP recommendations."}
            {stage === "confirm" &&
              "Check the details before pre-filling your onboarding setup. You can still modify any field later."}
          </DialogDescription>
        </div>

        <div className="p-6">
          {/* ========================================================================= */}
          {/* STAGE 1: QUESTIONS & DISCOVERY */}
          {/* ========================================================================= */}
          {stage === "questions" && (
            <div className="space-y-6">
              {/* Business Idea Refinement */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-idea-input" className="text-xs font-bold text-foreground">
                    1. What business idea do you want to start?
                  </Label>
                  <Badge variant="outline" className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50">
                    Detected: {detectedCategory}
                  </Badge>
                </div>
                <Textarea
                  id="ai-idea-input"
                  rows={3}
                  value={ideaText}
                  onChange={handleIdeaChange}
                  placeholder="e.g. I want to start a small cloud kitchen selling healthy meal boxes in Pune, but I don't know how much money I need..."
                  className="text-sm leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use ordinary, everyday language. You do not need formal business terminology or pre-calculated figures.
                </p>
              </div>

              {/* Conditional Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                {/* Location */}
                <div className="space-y-1.5">
                  <Label htmlFor="ai-loc-input" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    Target Location or Market
                  </Label>
                  <Input
                    id="ai-loc-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune, Bangalore, Mumbai, or Nationwide Remote"
                    className="text-xs h-10"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Helps calculate commercial rent, labor wages, and local licensing.
                  </p>
                </div>

                {/* Operating Modality */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                    Operating Model
                  </Label>
                  <select
                    value={operatingModel}
                    onChange={(e) => setOperatingModel(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                  >
                    <option value="Online Only">Online Only (Remote / Cloud)</option>
                    <option value="From Home / Remote">From Home / Residential Studio</option>
                    <option value="Both Online & Offline / Shared Kitchen">Hybrid: Online & Shared Space / Cloud Kitchen</option>
                    <option value="Physical Facility / Shop">Physical Commercial Premises / Retail Shop</option>
                    <option value="Undecided / Help Me Decide">Undecided (Recommend Best Starting Model)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Where the core product or service is produced or delivered.
                  </p>
                </div>

                {/* Staffing Intent */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    Staffing & Hiring Intent
                  </Label>
                  <select
                    value={staffingPlan}
                    onChange={(e) => setStaffingPlan(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-medium"
                  >
                    <option value="Solo founder with part-time support">Solo Founder (Starting alone with part-time help)</option>
                    <option value="With co-founder or family partner">With Co-founder / Business Partner</option>
                    <option value="Hiring 1-3 essential team members">Hiring 1 to 3 Essential Employees</option>
                    <option value="Help me decide based on workload">Help Me Decide (Suggest minimal team required)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Determines monthly payroll and workforce overhead.
                  </p>
                </div>

                {/* Starting Budget */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-budget-input" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
                      Available Capital (₹ INR)
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsBudgetUnknown(!isBudgetUnknown);
                        if (!isBudgetUnknown) setStatedBudget("");
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {isBudgetUnknown ? "I want to enter a budget" : "I don't know my budget"}
                    </button>
                  </div>

                  {isBudgetUnknown ? (
                    <div className="h-10 px-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                      <HelpCircle className="h-4 w-4" />
                      <span>Budget Unknown: BizMind will estimate required startup capital.</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">₹</span>
                      <Input
                        id="ai-budget-input"
                        type="number"
                        value={statedBudget}
                        onChange={(e) => setStatedBudget(e.target.value)}
                        placeholder="e.g. 350000"
                        className="pl-7 text-xs h-10 font-mono"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    You do not need to guess. Select "I don't know" to get a benchmark.
                  </p>
                </div>
              </div>

              {/* Existing Resources & Skills (Optional) */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="ai-res-input" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                  Existing Resources, Premises, or Skills (Optional)
                </Label>
                <Input
                  id="ai-res-input"
                  value={existingResources}
                  onChange={(e) => setExistingResources(e.target.value)}
                  placeholder="e.g. Own baking oven, laptop, commercial driver's license, 3 years industry experience..."
                  className="text-xs h-10"
                />
                <p className="text-[10px] text-muted-foreground">
                  Anything you already own reduces your upfront Day-1 cash requirement.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
                  Cancel & Return to Onboarding
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleRunAssessment}
                  disabled={isAnalyzing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm shadow-indigo-600/20"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Analyzing Idea...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Generate Preliminary Assessment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: PRELIMINARY ASSESSMENT RESULTS */}
          {/* ========================================================================= */}
          {stage === "results" && assessment && (
            <div className="space-y-6">
              {/* Top Summary Banner */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600 text-white text-[10px] font-bold">
                      {assessment.businessCategory}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {assessment.proposedBusinessModel.pricingStrategy}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Calculated for {location}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed font-medium">
                  {assessment.summary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-muted-foreground">
                  <div>
                    <strong className="text-foreground">Target Buyer:</strong> {assessment.targetCustomer.group}
                  </div>
                  <div>
                    <strong className="text-foreground">Problem Solved:</strong> {assessment.targetCustomer.problemSolved}
                  </div>
                </div>
              </div>

              {/* Financial Estimates KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border shadow-xs bg-card">
                  <CardContent className="p-3.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-600" />
                      One-Time Startup Capital
                    </span>
                    <div className="text-base font-extrabold text-foreground font-mono">
                      {formatCurrency(assessment.financialEstimates.oneTimeStartupRange.typical)}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                      <span>Low: {formatCurrency(assessment.financialEstimates.oneTimeStartupRange.low)}</span>
                      <span>High: {formatCurrency(assessment.financialEstimates.oneTimeStartupRange.high)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs bg-card">
                  <CardContent className="p-3.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-indigo-600" />
                      Recurring Monthly OpEx
                    </span>
                    <div className="text-base font-extrabold text-foreground font-mono">
                      {formatCurrency(assessment.financialEstimates.recurringMonthlyOpexRange.typical)}/mo
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                      <span>Low: {formatCurrency(assessment.financialEstimates.recurringMonthlyOpexRange.low)}</span>
                      <span>High: {formatCurrency(assessment.financialEstimates.recurringMonthlyOpexRange.high)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs bg-card">
                  <CardContent className="p-3.5 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-purple-600" />
                      Working Capital Buffer
                    </span>
                    <div className="text-base font-extrabold text-foreground font-mono">
                      {formatCurrency(assessment.financialEstimates.suggestedWorkingCapitalBuffer)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Covers ~{assessment.financialEstimates.suggestedWorkingCapitalMonths} months runway & contingency
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Feasibility Comparison Alert */}
              {assessment.budgetComparison && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    assessment.budgetComparison.feasibilityVerdict === "FEASIBLE"
                      ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                      : assessment.budgetComparison.feasibilityVerdict === "TIGHT_RESOURCES"
                      ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                      : assessment.budgetComparison.feasibilityVerdict === "CAPITAL_CONSTRAINED"
                      ? "border-red-500/30 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200"
                      : "border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {assessment.budgetComparison.feasibilityVerdict === "FEASIBLE" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    {assessment.budgetComparison.feasibilityVerdict === "TIGHT_RESOURCES" && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    {assessment.budgetComparison.feasibilityVerdict === "CAPITAL_CONSTRAINED" && <ShieldAlert className="h-4 w-4 text-red-600" />}
                    {assessment.budgetComparison.feasibilityVerdict === "ESTIMATION_ONLY" && <Info className="h-4 w-4 text-indigo-600" />}
                    <span>Capital Feasibility Analysis</span>
                  </div>
                  <p>{assessment.budgetComparison.explanation}</p>
                </div>
              )}

              {/* Lean Alternative (MVP) */}
              {assessment.leanAlternative && (
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Suggested Low-Cost Starting Option (Lean MVP)
                    </span>
                    <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700 dark:text-purple-300 font-mono">
                      ~{formatCurrency(assessment.leanAlternative.estimatedLeanStartupCost)} Startup
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-foreground">{assessment.leanAlternative.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {assessment.leanAlternative.description}
                  </p>
                  <div className="text-[10px] text-purple-800 dark:text-purple-200 pt-1">
                    <strong>Validation Milestone:</strong> {assessment.leanAlternative.validationMilestoneBeforeFullSpend}
                  </div>
                </div>
              )}

              {/* Resource & Equipment Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border bg-card space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                    Essential Equipment & Tools
                  </span>
                  <ul className="space-y-1 text-[11px] text-muted-foreground">
                    {assessment.equipmentAndResources.physicalEquipment.slice(0, 4).map((eq, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{eq}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border bg-card space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    Key Licenses & Regulatory Setup
                  </span>
                  <ul className="space-y-1 text-[11px] text-muted-foreground">
                    {assessment.equipmentAndResources.licensesAndCompliance.map((lic, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{lic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Itemized Budget Breakdown Table */}
              {assessment.financialEstimates.itemizedBudget && assessment.financialEstimates.itemizedBudget.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
                      Itemized Cost Breakdown (Planning Guide)
                    </span>
                    <span className="text-[10px] text-muted-foreground">Values in ₹ INR</span>
                  </div>
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2.5">Category & Item</th>
                          <th className="p-2.5">Period</th>
                          <th className="p-2.5">Priority</th>
                          <th className="p-2.5 text-right">Typical Estimate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {assessment.financialEstimates.itemizedBudget.slice(0, 6).map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            <td className="p-2.5">
                              <span className="font-semibold text-foreground block">{item.item}</span>
                              <span className="text-[10px] text-muted-foreground">{item.assumption}</span>
                            </td>
                            <td className="p-2.5 font-mono text-[10px]">
                              {item.period === "one-time" ? "One-time" : "Monthly"}
                            </td>
                            <td className="p-2.5">
                              {item.isEssential ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[9px]">
                                  Day 1 Essential
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px]">
                                  Deferrable
                                </Badge>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-foreground">
                              {formatCurrency(item.typicalEstimate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-2.5 rounded-lg bg-muted/40 border text-[10px] text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-indigo-600" />
                <span>
                  {assessment.disclaimer ||
                    "Estimates are for planning only and reflect typical Indian market costs. No actual financial ledger transactions are created."}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStage("questions")}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Edit My Answers
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRunAssessment}
                    disabled={isAnalyzing}
                    className="text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isAnalyzing ? "animate-spin" : ""}`} />
                    Recalculate
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setStage("confirm")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm shadow-indigo-600/20"
                  >
                    <span>Use These Results in Onboarding</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 3: CONFIRMATION & ONBOARDING PRE-FILL REVIEW */}
          {/* ========================================================================= */}
          {stage === "confirm" && assessment && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-600" />
                  Confirm Information to Transfer into Onboarding
                </h3>
                <p className="text-xs text-muted-foreground">
                  The following details will pre-fill your onboarding fields so you don't need to type them again. You will still review each step and can edit any value before finalizing.
                </p>
              </div>

              <div className="border rounded-xl divide-y text-xs">
                <div className="p-3 flex items-start justify-between">
                  <span className="font-bold text-muted-foreground">Business Concept:</span>
                  <span className="font-medium text-foreground max-w-sm text-right">{ideaText}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Industry Category:</span>
                  <Badge className="bg-indigo-600 text-white text-[11px] font-bold">
                    {assessment.businessCategory}
                  </Badge>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Location / Market:</span>
                  <span className="font-medium text-foreground">{location}</span>
                </div>
                <div className="p-3 flex items-start justify-between">
                  <span className="font-bold text-muted-foreground">Target Customer:</span>
                  <span className="font-medium text-foreground max-w-sm text-right">
                    {assessment.targetCustomer.group}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Starting Capital / Budget:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {isBudgetUnknown
                      ? `${formatCurrency(assessment.financialEstimates.oneTimeStartupRange.typical)} (AI Estimated)`
                      : formatCurrency(parseFloat(statedBudget || "0"))}
                  </span>
                </div>
                <div className="p-3 flex items-start justify-between">
                  <span className="font-bold text-muted-foreground">Essential Equipment:</span>
                  <span className="font-medium text-foreground max-w-sm text-right">
                    {assessment.equipmentAndResources.physicalEquipment.slice(0, 3).join(", ")}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="font-bold text-muted-foreground">Starting Venture Stage:</span>
                  <Badge variant="outline" className="text-[11px]">Validation</Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStage("results")}
                  className="text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back to Assessment
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmTransfer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 shadow-sm shadow-emerald-600/20"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Confirm & Continue Onboarding
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
