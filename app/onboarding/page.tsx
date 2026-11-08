"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Lightbulb,
  MapPin,
  DollarSign,
  Target,
  Wrench,
  Milestone,
  Check,
  BrainCircuit,
  Bot,
  Loader2,
  Users,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import { AiIdeaPlannerDialog } from "@/components/onboarding/ai-idea-planner-dialog";
import { IdeaAssessmentData } from "@/lib/ai/ideaAnalyzer";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);

  // Form State
  const [name, setName] = React.useState("");
  const [hasBusinessName, setHasBusinessName] = React.useState<boolean | null>(null);
  const [idea, setIdea] = React.useState("");
  const [businessType, setBusinessType] = React.useState("Food & Beverage");
  const [location, setLocation] = React.useState("");
  const [targetCustomer, setTargetCustomer] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [fundingSource, setFundingSource] = React.useState("Personal Savings / Bootstrapped");
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>([
    "Revenue growth",
    "Customer acquisition",
    "Profitability",
  ]);
  const [resources, setResources] = React.useState("");
  const [stage, setStage] = React.useState("Idea");
  const [constraints, setConstraints] = React.useState("");

  // AI Idea & Budget Planner Integration States
  const [isAiPlannerOpen, setIsAiPlannerOpen] = React.useState(false);
  const [aiAssessment, setAiAssessment] = React.useState<IdeaAssessmentData | null>(null);
  const [aiAssessmentRecordId, setAiAssessmentRecordId] = React.useState<string | null>(null);
  const [isAiAssisted, setIsAiAssisted] = React.useState(false);

  const handleApplyAiPlan = (data: {
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
  }) => {
    // Map AI category to onboarding businessTypes if possible, or fallback cleanly
    const matchedType = businessTypes.find((t) =>
      data.category.toLowerCase().includes(t.toLowerCase())
    ) || data.category;

    setBusinessType(matchedType);
    if (data.location) setLocation(data.location);
    if (data.targetCustomer) setTargetCustomer(data.targetCustomer);
    if (data.budget) setBudget(data.budget);
    if (data.resources) setResources(data.resources);
    if (data.stage) setStage(data.stage);
    if (data.goals && data.goals.length > 0) setSelectedGoals(data.goals);

    setAiAssessment(data.assessment);
    setAiAssessmentRecordId(data.assessmentRecordId || null);
    setIsAiAssisted(true);

    // Smoothly progress user to Step 3 so they immediately see the pre-filled category
    setCurrentStep(3);
  };

  // Step 10: Multi-agent execution animation states
  const [agentProgress, setAgentProgress] = React.useState([
    { name: "Feasibility Auditor", status: "pending", desc: "Assessing customer demand, unit economics, and capital sufficiency..." },
    { name: "Market Agent", status: "pending", desc: "Analyzing regional market density, competitors, and pricing power..." },
    { name: "Finance Agent", status: "pending", desc: "Modeling initial startup costs, monthly OpEx, and break-even timeline..." },
    { name: "Strategy Agent", status: "pending", desc: "Formulating competitive wedge, customer validation experiments, and moat..." },
    { name: "Operations Planner", status: "pending", desc: "Structuring deterministic milestone roadmap linked to real records..." },
  ]);
  const [isSynthesizing, setIsSynthesizing] = React.useState(false);
  const [analysisComplete, setAnalysisComplete] = React.useState(false);

  const businessTypes = [
    "Food & Beverage",
    "Technology",
    "Retail",
    "E-commerce",
    "Services",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Agriculture",
    "Other",
  ];

  const goalsList = [
    "Revenue growth",
    "Market expansion",
    "Customer acquisition",
    "Cost reduction",
    "Product launch",
    "Profitability",
  ];

  const fundingSources = [
    "Personal Savings / Bootstrapped",
    "Friends & Family",
    "Angel / Seed Investors",
    "Bank Loan / Credit Facility",
    "Government Grant / Incubator",
    "Undecided / Exploring Options",
  ];

  const stagesList = [
    { label: "Idea", desc: "Raw concept with no formal operations or revenue yet" },
    { label: "Validation", desc: "Testing prototypes, customer interviews, or pre-orders" },
    { label: "Pre-launch", desc: "Finalizing product, suppliers, or legal setup" },
    { label: "Early-stage", desc: "Operating with first paying customers" },
    { label: "Growing", desc: "Established operations aiming to scale sales and team" },
    { label: "Established", desc: "Stable recurring profits and brand recognition" },
  ];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (hasBusinessName === true && !name.trim()) {
        toast.error("Please enter your business name, or select 'No, I only have a business idea'.");
        return;
      }
      if (hasBusinessName === null) {
        setHasBusinessName(false);
      }
    }
    if (currentStep === 2 && !idea.trim()) {
      toast.error("Please explain your business idea and problem solved.");
      return;
    }
    if (currentStep === 4 && !location.trim()) {
      toast.error("Please specify your business location or market.");
      return;
    }

    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 9) {
      setCurrentStep(10);
      runAgentSimulation();
    }
  };

  const handleSkip = () => {
    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 9) {
      setCurrentStep(10);
      runAgentSimulation();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 10) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runAgentSimulation = async () => {
    const numericBudget = budget ? parseFloat(budget) : 0;

    // 1. Submit business creation to backend
    try {
      await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          idea,
          type: businessType,
          location,
          budget: numericBudget,
          goals: selectedGoals,
          resources,
          stage,
          targetCustomer,
          constraints: constraints ? `${constraints} | Funding: ${fundingSource}` : `Funding: ${fundingSource}`,
          assessmentRecordId: aiAssessmentRecordId,
          assessment: aiAssessment,
        }),
      });
    } catch (e) {
      console.warn("Backend sync notice:", e);
    }

    // 2. Animate agent progress steps sequentially
    for (let i = 0; i < agentProgress.length; i++) {
      setAgentProgress((prev) =>
        prev.map((agent, index) =>
          index === i ? { ...agent, status: "in_progress" } : agent
        )
      );
      await new Promise((r) => setTimeout(r, 650));

      setAgentProgress((prev) =>
        prev.map((agent, index) =>
          index === i ? { ...agent, status: "completed" } : agent
        )
      );
    }

    setIsSynthesizing(true);

    // 3. Trigger backend feasibility assessment, multi-agent orchestrator, and roadmap in parallel
    try {
      await Promise.all([
        fetch("/api/feasibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            idea,
            type: businessType,
            location,
            budget: numericBudget,
            stage,
            goals: selectedGoals,
            resources,
            targetCustomer,
          }),
        }),
        fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            idea,
            type: businessType,
            location,
            budget: numericBudget,
            stage,
            goals: selectedGoals,
            resources,
            targetCustomer,
          }),
        }),
        fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regenerate: true }),
        }),
      ]);
    } catch (e) {
      console.warn("Analysis trigger notice:", e);
    }

    setIsSynthesizing(false);
    setAnalysisComplete(true);
    toast.success("AI Feasibility & Strategy Synthesis Complete!");

    setTimeout(() => {
      router.push("/analysis");
    }, 1200);
  };

  const progressPercent = Math.round((currentStep / 10) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <Logo href="/" size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            Step {currentStep} of 10
          </span>
        </div>
      </header>

      {/* Main Form Content */}
      <div className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Discovery & Business Profile Setup</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <Card className="border shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: Business Idea & Optional Business Name */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 1 of 9</span>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-foreground">
                    Let&apos;s start with your business idea.
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    A business name is completely optional and can be decided or changed later. If you don&apos;t have a name yet, you can focus purely on shaping your concept.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <Label className="text-xs font-bold text-foreground">
                    Do you already have a business name?
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      id="has-name-yes-btn"
                      onClick={() => setHasBusinessName(true)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        hasBusinessName === true
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-foreground ring-2 ring-indigo-600/30"
                          : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          hasBusinessName === true
                            ? "bg-indigo-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Yes, I have a business name.
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          I have a brand or trading name ready.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="has-name-no-btn"
                      onClick={() => {
                        setHasBusinessName(false);
                        setName("");
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        hasBusinessName === false
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-foreground ring-2 ring-indigo-600/30"
                          : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          hasBusinessName === false
                            ? "bg-indigo-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          No, I only have a business idea.
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          I will choose or refine my name later.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* If Yes is selected, show the business-name input field */}
                {hasBusinessName === true && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in-50 duration-200">
                    <Label htmlFor="biz-name">Business Name</Label>
                    <Input
                      id="biz-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Apex Logistics, GreenRoot Organics, CloudSync AI"
                      className="text-base h-11"
                      autoFocus
                    />
                    <p className="text-[11px] text-muted-foreground">
                      You can change this anytime from your dashboard settings.
                    </p>
                  </div>
                )}

                {/* If No is selected, show reassurance card */}
                {hasBusinessName === false && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-2.5 animate-in fade-in-50 duration-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      That&apos;s totally fine! You don&apos;t need a name right now. Click <strong>Continue</strong> to describe your idea in Step 2.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Business Idea & Guidance */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 2 of 9</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">
                  Describe your business idea & what you want to offer
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tell us what product or service you want to sell in simple, ordinary words. You do not need formal business terminology or pre-calculated financial estimates.
                </p>

                {/* Quick Inspiration Starters */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Need inspiration? Click a starter example:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Healthy meal prep & cloud kitchen in Pune",
                      "B2B SaaS WhatsApp tool for local retail stores",
                      "Handmade pottery & ceramic decor studio",
                      "Mobile pet grooming van service",
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setIdea(sample)}
                        className="text-[10px] font-medium bg-muted/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-muted-foreground px-2.5 py-1 rounded-full border border-border transition-colors cursor-pointer"
                      >
                        + {sample}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-idea">Core Business Concept</Label>
                  <Textarea
                    id="biz-idea"
                    rows={4}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g. We want to start a small cloud kitchen selling healthy meal boxes to IT professionals in Pune, but we don't know how much money we need..."
                    className="text-sm leading-relaxed"
                    autoFocus
                  />
                </div>

                {/* AI Plan Assistance Callout Box */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">
                        Help me plan this idea with AI
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Not sure about your budget, startup costs, required resources, or where to begin? Describe your idea above and BizMind will help you work out an initial plan.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => {
                        if (!idea.trim()) {
                          toast.info("Please enter a brief phrase or click a starter above so AI can understand your idea.");
                          return;
                        }
                        setIsAiPlannerOpen(true);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-200" />
                      Help Me Plan with AI
                    </Button>
                    <span className="text-[11px] text-muted-foreground text-center sm:text-left sm:pl-2">
                      Or click <strong>"Continue"</strong> below to proceed through questions normally.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Business Type */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 3 of 9</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Select your industry category</h2>
                <p className="text-xs text-muted-foreground">
                  This calibrates our AI Feasibility Auditor and financial models to use realistic operating expense baselines and compliance requirements.
                </p>

                {isAiAssisted && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Pre-filled from your AI Idea Plan — select any category if you want to adjust.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {businessTypes.map((t) => {
                    const isSelected = businessType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBusinessType(t)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-xs"
                            : "border-border bg-card text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Business Location */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 4 of 9</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Where will you operate?</h2>
                <p className="text-xs text-muted-foreground">
                  Specify city, region or whether this is a remote/digital business.
                </p>

                {isAiAssisted && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Location calibrated from your AI Planning session.</span>
                  </div>
                )}
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-loc">Location / Primary Market</Label>
                  <Input
                    id="biz-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Pune, Bangalore, Mumbai, Austin TX, or Nationwide Remote"
                    className="text-base h-11"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Target Customers & Problem (Optional) */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Users className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Step 5 of 9</span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">Optional</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Who is your ideal customer?</h2>
                <p className="text-xs text-muted-foreground">
                  Describe their demographic, job, specific frustrations, and current alternatives they pay for.
                </p>

                {isAiAssisted && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Target customer segment suggested by AI Discovery.</span>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-cust">Target Customer Profile</Label>
                  <Textarea
                    id="biz-cust"
                    rows={3}
                    value={targetCustomer}
                    onChange={(e) => setTargetCustomer(e.target.value)}
                    placeholder="e.g. Working professionals aged 25-45 in metro cities seeking reliable subscription deliveries..."
                    className="text-sm leading-relaxed"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 6: Available Budget & Funding Source */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 6 of 9</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What is your starting capital?</h2>
                <p className="text-xs text-muted-foreground">
                  BizMind compares your budget with realistic industry launch costs to determine financial feasibility and loss prevention strategies.
                </p>

                {isAiAssisted && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Budget calibrated from your AI Planning financial estimate.</span>
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-budget">Available Budget (₹ INR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm font-bold text-muted-foreground">₹</span>
                      <Input
                        id="biz-budget"
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. 250000 (Enter 0 if starting with zero capital)"
                        className="pl-8 text-base h-11 font-mono"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Primary Funding Source</Label>
                    <select
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold"
                    >
                      {fundingSources.map((fs) => (
                        <option key={fs} value={fs}>{fs}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Business Goals */}
            {currentStep === 7 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 7 of 9</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What are your primary business goals?</h2>
                <p className="text-xs text-muted-foreground">
                  Select the main milestones you want your AI Startup Mentor to optimize for.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {goalsList.map((goal) => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200"
                            : "border-border bg-card text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span>{goal}</span>
                        {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 8: Available Resources & Team (Optional) */}
            {currentStep === 8 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Wrench className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Step 8 of 9</span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">Optional</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What existing resources or skills do you have?</h2>
                <p className="text-xs text-muted-foreground">
                  e.g., industry connections, technical skills, commercial space, inventory, or co-founders.
                </p>

                {isAiAssisted && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Essential operational resources populated from AI Equipment Checklist.</span>
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-res">Existing Resources & Founder Capabilities</Label>
                  <Textarea
                    id="biz-res"
                    rows={3}
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    placeholder="e.g. 5 years culinary experience, existing kitchen equipment, 1 marketing co-founder..."
                    className="text-sm leading-relaxed"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 9: Business Stage & Constraints */}
            {currentStep === 9 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Milestone className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 9 of 9</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What is your current venture stage?</h2>
                <p className="text-xs text-muted-foreground">
                  This determines your roadmap starting phase and validation requirements.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {stagesList.map((item) => {
                    const isSelected = stage === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setStage(item.label)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60"
                            : "border-border bg-card hover:bg-muted/50"
                        }`}
                      >
                        <div className="text-xs font-bold text-foreground">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-constraints" className="text-xs text-muted-foreground">Target launch date or constraints (Optional)</Label>
                  <Input
                    id="biz-constraints"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g. Must launch within 60 days, part-time founder hours only"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            )}

            {/* STEP 10: Multi-Agent AI Feasibility & Roadmap Processing */}
            {currentStep === 10 && (
              <div className="space-y-6 py-4 animate-in fade-in-50 duration-200">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <BrainCircuit className="h-8 w-8 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground">
                    BizMind AI Startup Mentor Synthesizing Strategy
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Auditing feasibility, unit margins, capital runway, and generating your personalized execution roadmap for <strong className="text-foreground">{name || "your new venture"}</strong>.
                  </p>
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  {agentProgress.map((agent, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-bold text-foreground block">{agent.name}</span>
                          <span className="text-[10px] text-muted-foreground">{agent.desc}</span>
                        </div>
                      </div>

                      {agent.status === "completed" && (
                        <span className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
                          <Check className="h-4 w-4" />
                          <span>Complete</span>
                        </span>
                      )}

                      {agent.status === "in_progress" && (
                        <span className="flex items-center gap-1 font-bold text-indigo-600 text-xs animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Evaluating...</span>
                        </span>
                      )}

                      {agent.status === "pending" && (
                        <span className="text-[11px] text-muted-foreground">Queued</span>
                      )}
                    </div>
                  ))}

                  {isSynthesizing && (
                    <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-center text-xs font-bold text-purple-700 dark:text-purple-300 animate-pulse">
                      Synthesizing Actionable Feasibility & Execution Roadmap...
                    </div>
                  )}

                  {analysisComplete && (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Feasibility Audit Complete! Loading your personalized guidance...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 10 && (
              <div className="flex items-center justify-between pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="font-semibold text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  {[5, 8].includes(currentStep) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Skip this step
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm shadow-indigo-600/20"
                  >
                    <span>{currentStep === 9 ? "Audit Feasibility & Build Plan" : "Continue"}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integrated AI Idea & Budget Planner Dialog */}
      <AiIdeaPlannerDialog
        isOpen={isAiPlannerOpen}
        onClose={() => setIsAiPlannerOpen(false)}
        businessName={name}
        initialIdea={idea}
        onApplyToOnboarding={handleApplyAiPlan}
      />

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-2">
        BizMind 3.0 • AI Startup Mentor & Business Growth Execution Platform
      </footer>
    </div>
  );
}
