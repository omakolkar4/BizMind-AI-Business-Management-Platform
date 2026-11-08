"use client";

import * as React from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Sparkles,
  RefreshCw,
  Download,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Target,
  DollarSign,
  Briefcase,
  Layers,
  HelpCircle,
  FlaskConical,
  Clock,
  ArrowRight,
  ArrowLeft,
  ListPlus,
  Compass,
  Save,
  Check,
  Info,
  ExternalLink,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { exportDocumentToPdf } from "@/lib/exportPdf";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type AnalysisTab = "profile" | "context" | "opportunities" | "risks" | "feasibility";

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = React.useState<AnalysisTab>("profile");
  const [data, setData] = React.useState<any>(null);
  const [feasibility, setFeasibility] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [savingProgress, setSavingProgress] = React.useState(false);
  const [creatingTasks, setCreatingTasks] = React.useState(false);

  // Section A: Business Idea & Profile
  const [name, setName] = React.useState("");
  const [idea, setIdea] = React.useState("");
  const [productsServices, setProductsServices] = React.useState("");
  const [type, setType] = React.useState("Food & Beverage");
  const [location, setLocation] = React.useState("");
  const [operatingModel, setOperatingModel] = React.useState("Both Online & Offline");
  const [stage, setStage] = React.useState("Idea");

  // Section B: Business Context & Resources
  const [targetCustomer, setTargetCustomer] = React.useState("");
  const [budget, setBudget] = React.useState("500000");
  const [resources, setResources] = React.useState("");
  const [goals, setGoals] = React.useState("Validate customer demand, launch MVP, achieve 50 paying customers");
  const [constraints, setConstraints] = React.useState("");

  // Section C: Opportunities & Revenue
  const [uniqueAdvantage, setUniqueAdvantage] = React.useState("");
  const [pricingModel, setPricingModel] = React.useState("");
  const [channels, setChannels] = React.useState("");

  // Section D: Risks & Competitor Notes
  const [competitorNotes, setCompetitorNotes] = React.useState("");
  const [userStatedRisks, setUserStatedRisks] = React.useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analysisRes, feasibilityRes] = await Promise.all([
        fetch("/api/analysis"),
        fetch("/api/feasibility"),
      ]);

      if (analysisRes.ok) {
        const json = await analysisRes.json();
        setData(json);
        if (json.business) {
          setName(json.business.name || "");
          setIdea(json.business.idea || "");
          setProductsServices(json.business.productsServices || "");
          setType(json.business.type || "Food & Beverage");
          setLocation(json.business.location || "");
          setBudget(String(json.business.budget || 500000));
          setStage(json.business.stage || "Idea");
          setResources(json.business.resources || "");
          setGoals(typeof json.business.goals === "string" ? json.business.goals : JSON.stringify(json.business.goals || ""));
          setConstraints(json.business.constraints || "");
        }
        if (json.context) {
          setTargetCustomer(json.context.targetCustomer || "");
          setPricingModel(json.context.pricingModel || "");
          setUniqueAdvantage(json.context.uniqueAdvantage || "");
          setChannels(json.context.channels || "");
          setCompetitorNotes(json.context.competitorNotes || "");
        }
      }

      if (feasibilityRes.ok) {
        const fJson = await feasibilityRes.json();
        if (fJson.feasibility) {
          setFeasibility(fJson.feasibility);
        }
      }
    } catch {
      toast.error("Network error loading AI analysis.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSaveProgress = async (silent: boolean = false) => {
    try {
      setSavingProgress(true);
      const numericBudget = budget ? parseFloat(budget) : 0;

      // 1. Update Business profile
      await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "My Business Venture",
          idea: idea.trim(),
          productsServices,
          type,
          location,
          budget: numericBudget,
          stage,
          resources,
          goals,
          constraints,
          targetCustomer,
          pricingModel,
          uniqueAdvantage,
        }),
      });

      if (!silent) {
        toast.success("Analysis inputs saved to database!");
      }
    } catch {
      if (!silent) toast.error("Failed to save progress.");
    } finally {
      setSavingProgress(false);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      toast.info("Synthesizing multi-agent feasibility and market diagnostics...");

      // Save inputs first
      await handleSaveProgress(true);

      const payload = {
        name: name.trim() || "My Business Venture",
        type,
        location,
        budget,
        idea,
        stage,
        targetCustomer,
        resources,
        goals,
        constraints,
      };

      const [analysisRes, feasibilityRes] = await Promise.all([
        fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch("/api/feasibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      ]);

      if (analysisRes.ok && feasibilityRes.ok) {
        const aJson = await analysisRes.json();
        const fJson = await feasibilityRes.json();
        setData((prev: any) => ({ ...prev, analysis: aJson.analysis }));
        setFeasibility(fJson.feasibility);
        setActiveTab("feasibility");
        toast.success("AI Feasibility & Strategy Synthesis Complete!");
      } else {
        toast.error("Analysis completed with partial telemetry.");
      }
    } catch {
      toast.error("Error executing AI analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConvertExperimentsToTasks = async () => {
    if (!feasibility?.validationExperiments || feasibility.validationExperiments.length === 0) {
      toast.error("No validation experiments found.");
      return;
    }

    try {
      setCreatingTasks(true);
      let created = 0;
      for (const exp of feasibility.validationExperiments) {
        const title = exp.experiment || exp.title || "Customer Validation Test";
        const desc = `Objective: ${exp.objective || exp.hypothesis || "Validate demand"}\nTimeline: ${exp.reviewTimeline || exp.duration || "2 Weeks"}`;
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `[Validation] ${title}`,
            description: desc,
            category: "Marketing",
            priority: "High",
            estimatedBudget: exp.budgetLimit || exp.budget || 5000,
            successMetric: exp.metricsToTrack || exp.targetMetric || "Confirmed paying orders",
          }),
        });
        if (res.ok) created++;
      }
      toast.success(`Successfully converted ${created} validation experiments into executable tasks!`);
    } catch {
      toast.error("Failed to create validation tasks.");
    } finally {
      setCreatingTasks(false);
    }
  };

  const handleExportPdf = () => {
    if (!analysis) {
      toast.error("No analysis available to export.");
      return;
    }

    const sections: Array<{ title: string; content: string }> = [
      { title: "Executive AI Summary", content: analysis.summary },
      {
        title: "Feasibility Assessment & Capital Viability",
        content: `Feasibility Status: ${feasibility?.overallStatus || "Evaluated"}\n\nSummary: ${feasibility?.summary || "N/A"}\n\nCapital Viability: ${feasibility?.capitalViability || "N/A"}\nStartup Cost Range: ₹${(feasibility?.minStartupCost || 0).toLocaleString("en-IN")} - ₹${(feasibility?.maxStartupCost || 0).toLocaleString("en-IN")}\nMonthly OpEx: ₹${(feasibility?.expectedMonthlyOpex || 0).toLocaleString("en-IN")}\nEstimated Break-Even Horizon: ${feasibility?.breakEvenMonths || 6} months`,
      },
      { title: "Market Opportunity & Demand", content: analysis.marketOpportunity },
      { title: "Target Audience & Customer Profile", content: analysis.targetAudience },
      { title: "Competitive Intelligence", content: analysis.competitorNotes },
      { title: "Risk Assessment & Mitigation", content: analysis.riskAssessment },
      { title: "Revenue Opportunities", content: analysis.revenueOpportunities },
      { title: "Cost Considerations", content: analysis.costConsiderations },
    ];

    exportDocumentToPdf({
      title: "BizMind 3.0 Feasibility & Multi-Agent Business Analysis",
      businessName: name || "Business Venture",
      sections,
      metadata: {
        "Feasibility Status": feasibility?.overallStatus || "NEEDS_VALIDATION",
        "Business Category": type || "N/A",
        "Primary Location": location || "N/A",
        "Starting Budget": `₹${parseFloat(budget || "0").toLocaleString("en-IN")}`,
      },
    });

    toast.success("Analysis report exported to PDF!");
  };

  const analysis = data?.analysis;

  const parseList = (str: string | null | undefined): string[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [str];
    } catch {
      return [str];
    }
  };

  const strengths = parseList(analysis?.strengths);
  const weaknesses = parseList(analysis?.weaknesses);
  const opportunities = parseList(analysis?.opportunities);
  const threats = parseList(analysis?.threats);

  const TABS: { id: AnalysisTab; label: string; step: number; desc: string }[] = [
    { id: "profile", label: "Idea & Profile", step: 1, desc: "Simple answers about your venture" },
    { id: "context", label: "Business Context", step: 2, desc: "Customers, stage & resources" },
    { id: "opportunities", label: "Opportunities", step: 3, desc: "Demand & competitive moat" },
    { id: "risks", label: "Risks & Unknowns", step: 4, desc: "Failure points & assumptions" },
    { id: "feasibility", label: "Feasibility Synthesis", step: 5, desc: "AI audit & action blueprint" },
  ];

  return (
    <DashboardShell businessName={name || "Business Venture"}>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-background dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-background p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                AI Business Analysis & Feasibility
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                BizMind 3.0 Mentor Layer
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              A beginner-friendly, structured business evaluation. Answers simple questions, identifies real market boundaries, and tests practical viability.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/analyzer">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-9 border-indigo-200 dark:border-indigo-900 bg-background text-indigo-700 dark:text-indigo-300 gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>AI Idea & Budget Analyzer</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              className="text-xs font-semibold h-9"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span>Export PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Synthesizing AI..." : "Run AI Analysis"}</span>
            </Button>
          </div>
        </div>

        {/* 5-Step Progress & Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b pb-2">
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  isActive
                    ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-100 shadow-xs"
                    : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.step}
                  </span>
                  <span className="truncate">{t.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5 hidden sm:block">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Tab Content Cards */}
        <div className="space-y-6">
          {/* TAB 1: BUSINESS IDEA & PROFILE (Section 3.A) */}
          {activeTab === "profile" && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>Step 1: Business Idea & Profile</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Answer these simple questions in ordinary words. You do not need formal business terminology.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Q1: Business Idea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="q-idea" className="text-xs font-bold text-foreground">
                      What business idea do you have? <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Required</span>
                  </div>
                  <Textarea
                    id="q-idea"
                    rows={3}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g. I want to start a healthy cloud kitchen delivering nutritious daily meals to office workers in Pune."
                    className="text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Tip: Describe the main problem customers have and how your idea solves it.
                  </p>
                </div>

                {/* Q2: Product / Service */}
                <div className="space-y-1.5">
                  <Label htmlFor="q-prod" className="text-xs font-bold text-foreground">
                    What specific product or service do you want to offer?
                  </Label>
                  <Input
                    id="q-prod"
                    value={productsServices}
                    onChange={(e) => setProductsServices(e.target.value)}
                    placeholder="e.g. Calorie-counted lunch meal boxes, weekly diet subscriptions, and healthy fruit snacks"
                    className="text-xs"
                  />
                </div>

                {/* 2-col inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="q-name" className="text-xs font-bold text-foreground">
                      Business or Project Name
                    </Label>
                    <Input
                      id="q-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. NovaBite Foods"
                      className="text-xs"
                    />
                  </div>

                  {/* Industry Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="q-type" className="text-xs font-bold text-foreground">
                      Industry Sector
                    </Label>
                    <Input
                      id="q-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="e.g. Food & Beverage, Technology, Retail, Services"
                      className="text-xs"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <Label htmlFor="q-loc" className="text-xs font-bold text-foreground">
                      Where do you want to operate?
                    </Label>
                    <Input
                      id="q-loc"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Pune, Maharashtra (Hinjewadi & Baner clusters)"
                      className="text-xs"
                    />
                  </div>

                  {/* Operating Model */}
                  <div className="space-y-1.5">
                    <Label htmlFor="q-model" className="text-xs font-bold text-foreground">
                      Is the business online, offline, or both?
                    </Label>
                    <select
                      id="q-model"
                      value={operatingModel}
                      onChange={(e) => setOperatingModel(e.target.value)}
                      className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Online Only">Online Only (Web app, marketplace, delivery app)</option>
                      <option value="Physical Facility / Shop">Physical Facility / Shop (Storefront, dining, clinic)</option>
                      <option value="From Home">From Home (Initial home-based launch)</option>
                      <option value="Both Online & Offline">Both Online & Offline (Hybrid cloud model)</option>
                    </select>
                  </div>

                  {/* Stage */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-foreground">
                      What is your current stage?
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {[
                        { label: "Idea", desc: "Just starting to think" },
                        { label: "Validation", desc: "Talking to customers" },
                        { label: "Pre-launch", desc: "Setting up suppliers/tools" },
                        { label: "Launched", desc: "First paying clients" },
                        { label: "Growing", desc: "Scaling operations" },
                      ].map((s) => (
                        <button
                          type="button"
                          key={s.label}
                          onClick={() => setStage(s.label)}
                          className={`p-2 rounded-xl border text-left text-xs transition-colors ${
                            stage === s.label
                              ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 font-bold"
                              : "border-border hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <div>{s.label}</div>
                          <span className="text-[10px] text-muted-foreground font-normal">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Next: Define target customer context and resource boundaries.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveProgress(false)}
                      disabled={savingProgress}
                      className="text-xs h-9"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      <span>{savingProgress ? "Saving..." : "Save Progress"}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSaveProgress(true);
                        setActiveTab("context");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                    >
                      <span>Continue to Context</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: BUSINESS CONTEXT (Section 3.B) */}
          {activeTab === "context" && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Compass className="h-4 w-4 text-indigo-600" />
                  <span>Step 2: Business Context & Operating Realities</span>
                </CardTitle>
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200 mt-2 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Info className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span>What does context mean and why does it matter?</span>
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Context tells BizMind's multi-agent AI about your real-world setting—your local buyers, starting savings, equipment you already own, and practical limits. Without context, AI can only give generic textbook advice. With context, it computes real regional costs, realistic timelines, and custom safeguards.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Target Customer */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-cust" className="text-xs font-bold text-foreground">
                    Who are your target customers?
                  </Label>
                  <Input
                    id="c-cust"
                    value={targetCustomer}
                    onChange={(e) => setTargetCustomer(e.target.value)}
                    placeholder="e.g. Salaried tech employees working 9-7 in Hinjewadi Phase 1 & 2 who want healthy lunch boxes"
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Describe their daily habits, where they spend time, and why they would pay you.
                  </p>
                </div>

                {/* Available Budget / Capital */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="c-budget" className="text-xs font-bold text-foreground">
                      Starting Capital Allocation (₹ INR)
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Optional if unknown</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-bold">
                      ₹
                    </span>
                    <Input
                      id="c-budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="e.g. 500000"
                      className="text-xs pl-7 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If you don't know your exact budget yet, keep an estimate or run the{" "}
                    <Link href="/analyzer" className="text-indigo-600 font-semibold hover:underline">
                      AI Idea & Budget Analyzer
                    </Link>{" "}
                    to calculate preliminary costs.
                  </p>
                </div>

                {/* Available Resources */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-res" className="text-xs font-bold text-foreground">
                    Available Resources (Tools, premises, equipment, personal skills)
                  </Label>
                  <Textarea
                    id="c-res"
                    rows={2}
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    placeholder="e.g. Existing home kitchen appliances, reliable laptop, direct contact with 2 organic vegetable suppliers, 10 hours daily availability"
                    className="text-xs"
                  />
                </div>

                {/* Business Goals for 3-6 months */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-goals" className="text-xs font-bold text-foreground">
                    Main Goals for First 3 to 6 Months
                  </Label>
                  <Input
                    id="c-goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="e.g. Complete customer taste tests, reach 40 active daily subscribers, achieve operational breakeven"
                    className="text-xs"
                  />
                </div>

                {/* Known Constraints */}
                <div className="space-y-1.5">
                  <Label htmlFor="c-constraints" className="text-xs font-bold text-foreground">
                    Known Constraints (Budget limits, time restrictions, supplier issues)
                  </Label>
                  <Input
                    id="c-constraints"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g. Cannot take bank debt, must operate within a 4 km delivery radius, solo founder until revenue"
                    className="text-xs"
                  />
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("profile")}
                    className="text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    <span>Back</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveProgress(false)}
                      disabled={savingProgress}
                      className="text-xs h-9"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      <span>{savingProgress ? "Saving..." : "Save Progress"}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSaveProgress(true);
                        setActiveTab("opportunities");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                    >
                      <span>Continue to Opportunities</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: OPPORTUNITIES (Section 3.C) */}
          {activeTab === "opportunities" && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-600" />
                  <span>Step 3: Market Opportunities & Revenue Model</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Clearly distinguishes what you have stated from AI-generated market opportunities and revenue models.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* 2-Column: User Stated vs AI Generated */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left: Founder Stated */}
                  <div className="p-4 rounded-xl border bg-card space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-bold text-foreground">
                        Founder-Stated Advantages & Pricing
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-background text-indigo-600 border-indigo-200">
                        User Stated
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="op-adv" className="text-xs font-bold">
                        What is your unique competitive advantage?
                      </Label>
                      <Textarea
                        id="op-adv"
                        rows={3}
                        value={uniqueAdvantage}
                        onChange={(e) => setUniqueAdvantage(e.target.value)}
                        placeholder="e.g. Farm-to-table organic produce with zero refined oil, transparent macro nutritional breakdown on every meal box."
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="op-price" className="text-xs font-bold">
                        Proposed Pricing & Monetization Model
                      </Label>
                      <Input
                        id="op-price"
                        value={pricingModel}
                        onChange={(e) => setPricingModel(e.target.value)}
                        placeholder="e.g. ₹180-₹220 per meal box, ₹4,200 monthly weekday subscription"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="op-chan" className="text-xs font-bold">
                        Distribution Channels
                      </Label>
                      <Input
                        id="op-chan"
                        value={channels}
                        onChange={(e) => setChannels(e.target.value)}
                        placeholder="e.g. Direct WhatsApp ordering, web subscription portal, local corporate cafeteria tasting desks"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Right: AI-Identified Opportunities & Hypotheses */}
                  <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900 pb-2">
                      <span className="text-xs font-bold text-foreground">
                        AI-Synthesized Market Hypotheses
                      </span>
                      <Badge variant="ai" className="text-[10px]">
                        AI Generated (To Validate)
                      </Badge>
                    </div>

                    {analysis ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="font-bold text-foreground block mb-1">
                            Market Opportunity & TAM:
                          </span>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {analysis.marketOpportunity || "Run AI Analysis to synthesize regional opportunity."}
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-foreground block mb-1">
                            Identified Revenue Opportunities:
                          </span>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {analysis.revenueOpportunities || "Run AI Analysis to evaluate multi-stream monetization."}
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-foreground block mb-1">
                            Key Growth Opportunities to Test:
                          </span>
                          <ul className="space-y-1 text-muted-foreground text-[11px]">
                            {opportunities.map((opp, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{opp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Click <strong>Run AI Analysis</strong> above to synthesize market opportunity hypotheses.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("context")}
                    className="text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    <span>Back</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveProgress(false)}
                      disabled={savingProgress}
                      className="text-xs h-9"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      <span>{savingProgress ? "Saving..." : "Save Progress"}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSaveProgress(true);
                        setActiveTab("risks");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                    >
                      <span>Continue to Risks</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: RISKS & ASSUMPTIONS (Section 3.D) */}
          {activeTab === "risks" && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Step 4: Risks, Working Assumptions & Compliance</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Understand what could prevent success and identify which assumptions must be tested first before investing large capital.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Competitor Notes & Founder Stated Risks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="r-comp" className="text-xs font-bold text-foreground">
                      Competitor Weaknesses & Alternative Options
                    </Label>
                    <Textarea
                      id="r-comp"
                      rows={3}
                      value={competitorNotes}
                      onChange={(e) => setCompetitorNotes(e.target.value)}
                      placeholder="e.g. Existing mass delivery apps have high delivery charges and oily food; local dabba services have zero nutritional tracking."
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="r-stated" className="text-xs font-bold text-foreground">
                      What are your biggest worries or failure risks?
                    </Label>
                    <Textarea
                      id="r-stated"
                      rows={3}
                      value={userStatedRisks}
                      onChange={(e) => setUserStatedRisks(e.target.value)}
                      placeholder="e.g. Food spoilage during hot summer delivery, delayed customer payment cycles, kitchen cook absenteeism."
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* AI-Derived Assumptions & Safeguards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs pt-2">
                  {/* Card 1: Critical Risks */}
                  <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/20 space-y-2">
                    <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300">
                      <span>Operational & Financial Risks</span>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                      {(feasibility?.criticalRisks || [
                        "Working capital exhaustion before reaching 50 daily subscribers",
                        "Raw ingredient inflation reducing food gross margins",
                        "Delivery packaging leaks during peak traffic transit",
                      ]).map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 2: Assumptions Needing Validation */}
                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300">
                      <span>Major Working Assumptions</span>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <ul className="space-y-1.5 text-muted-foreground text-[11px]">
                      {(feasibility?.majorAssumptions || [
                        "Target office workers will pay ₹180/meal consistently",
                        "Monthly customer churn will stay below 12%",
                        "Local supplier can deliver fresh produce by 7:00 AM daily",
                      ]).map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 3: Legal & Regulatory Requirements */}
                  <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-2">
                    <div className="flex items-center justify-between font-bold text-indigo-700 dark:text-indigo-300">
                      <span>Licensing & Compliance Needs</span>
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {feasibility?.legalRegulatoryRisks ||
                        "FSSAI Food License (State), Municipal Shop & Establishment Act (Gumasta), GST registration, commercial fire safety compliance."}
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                      Always verify specific local municipal bylaws with a professional CA before commercial launch.
                    </p>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("opportunities")}
                    className="text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    <span>Back</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveProgress(false)}
                      disabled={savingProgress}
                      className="text-xs h-9"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      <span>{savingProgress ? "Saving..." : "Save Progress"}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSaveProgress(true);
                        setActiveTab("feasibility");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                    >
                      <span>View Feasibility Synthesis</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: FEASIBILITY SYNTHESIS (Section 3.E) */}
          {activeTab === "feasibility" && (
            <div className="space-y-6">
              {/* Feasibility Assessment Card */}
              {feasibility ? (
                <Card
                  className={`border shadow-sm ${
                    feasibility.overallStatus === "VIABLE"
                      ? "border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10"
                      : feasibility.overallStatus === "CAPITAL_CONSTRAINED"
                      ? "border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10"
                      : "border-amber-500/30 bg-amber-50/10 dark:bg-amber-950/10"
                  }`}
                >
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg text-white ${
                          feasibility.overallStatus === "VIABLE"
                            ? "bg-emerald-600"
                            : feasibility.overallStatus === "CAPITAL_CONSTRAINED"
                            ? "bg-rose-600"
                            : "bg-amber-600"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-extrabold text-foreground">
                          Venture Feasibility Assessment
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Pragmatic viability rating based on your available budget and market reality.
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        feasibility.overallStatus === "VIABLE"
                          ? "success"
                          : feasibility.overallStatus === "CAPITAL_CONSTRAINED"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-xs font-bold"
                    >
                      {feasibility.overallStatus}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 space-y-5">
                    {/* Summary Paragraph */}
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                      {feasibility.summary}
                    </p>

                    {/* 4 Financial Benchmarks */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="p-3 rounded-xl border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Startup Cost Range
                        </span>
                        <div className="font-extrabold text-sm text-foreground font-mono">
                          {formatCurrency(feasibility.minStartupCost || 0)} -{" "}
                          {formatCurrency(feasibility.maxStartupCost || 0)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Expected Monthly OpEx
                        </span>
                        <div className="font-extrabold text-sm text-foreground font-mono">
                          {formatCurrency(feasibility.expectedMonthlyOpex || 0)}/mo
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Break-Even Horizon
                        </span>
                        <div className="font-extrabold text-sm text-foreground">
                          {feasibility.breakEvenMonths || 6} Months
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border bg-card space-y-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Capital Viability
                        </span>
                        <div className="font-bold text-xs text-foreground truncate">
                          {feasibility.capitalViability || "Adequate Capital"}
                        </div>
                      </div>
                    </div>

                    {/* Validation Experiments to Tasks Action */}
                    {feasibility.validationExperiments?.length > 0 && (
                      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <FlaskConical className="h-4 w-4 text-indigo-600" />
                              <span>Recommended Customer Validation Experiments</span>
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Test paying demand before spending large funds on fixed leases or inventory.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleConvertExperimentsToTasks}
                            disabled={creatingTasks}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8"
                          >
                            <ListPlus className="h-3.5 w-3.5 mr-1" />
                            <span>{creatingTasks ? "Creating..." : "Convert to Tasks"}</span>
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {feasibility.validationExperiments.map((exp: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg border bg-background space-y-1">
                              <div className="font-bold text-foreground">
                                {exp.experiment || exp.title || "Experiment"}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {exp.hypothesis || exp.objective}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                                <span>Budget: {formatCurrency(exp.budgetLimit || exp.budget || 5000)}</span>
                                <span>Timeline: {exp.reviewTimeline || exp.duration || "2 wks"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Step Transition to Business Plan Review & Acceptance */}
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Ready for Institutional Business Plan & Plan Acceptance?</span>
                        </h4>
                        <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                          Move to the business plan review to review all 17 strategic sections, inspect the proposed roadmap, and confirm your Yes/No acceptance decision.
                        </p>
                      </div>

                      <Link href="/business-plan">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 px-5 shadow-xs">
                          <span>Proceed to Business Plan & Decision</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border text-center py-12 px-4">
                  <CardContent className="space-y-3 max-w-md mx-auto">
                    <BrainCircuit className="h-10 w-10 text-indigo-600 mx-auto" />
                    <h3 className="font-extrabold text-base text-foreground">
                      No Feasibility Synthesis Run Yet
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Save your business inputs across Steps 1-4 and click the button below to generate your multi-agent feasibility assessment.
                    </p>
                    <Button
                      onClick={handleRunAnalysis}
                      disabled={analyzing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9"
                    >
                      <span>{analyzing ? "Synthesizing..." : "Run AI Feasibility Analysis"}</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
