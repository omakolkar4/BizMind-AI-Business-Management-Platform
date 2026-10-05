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

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);

  // Form State
  const [name, setName] = React.useState("EcoDine Cloud Labs");
  const [idea, setIdea] = React.useState(
    "A zero-waste farm-to-table corporate meal delivery network connecting local organic produce with busy tech teams."
  );
  const [businessType, setBusinessType] = React.useState("Food & Beverage");
  const [location, setLocation] = React.useState("Pune, Maharashtra");
  const [budget, setBudget] = React.useState("1200000");
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>([
    "Revenue growth",
    "Customer acquisition",
    "Profitability",
  ]);
  const [resources, setResources] = React.useState(
    "1,000 sq ft cloud kitchen space, initial chef team, local farm network"
  );
  const [stage, setStage] = React.useState("Pre-launch");

  // Step 9: Agent execution animation states
  const [agentProgress, setAgentProgress] = React.useState([
    { name: "Market Agent", status: "pending", desc: "Estimating TAM and demographic demand patterns..." },
    { name: "Finance Agent", status: "pending", desc: "Calculating burn rate, gross margins, and breakeven..." },
    { name: "Strategy Agent", status: "pending", desc: "Drafting competitive moats and market wedge..." },
    { name: "Risk Agent", status: "pending", desc: "Analyzing supply volatility and regulatory exposure..." },
    { name: "Operations Agent", status: "pending", desc: "Evaluating batch dispatch and kitchen capacity..." },
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

  const stagesList = [
    { label: "Idea", desc: "Concept phase with no formal operations yet" },
    { label: "Validation", desc: "Interviewing users & testing prototypes" },
    { label: "Pre-launch", desc: "Building infrastructure and initial menu/product" },
    { label: "Early-stage", desc: "Live with first paying customers" },
    { label: "Growing", desc: "Scaling revenue and hiring core team" },
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
    if (currentStep === 1 && !name.trim()) {
      toast.error("Please provide a business name.");
      return;
    }
    if (currentStep === 2 && !idea.trim()) {
      toast.error("Please explain your business idea.");
      return;
    }
    if (currentStep === 4 && !location.trim()) {
      toast.error("Please specify your business location.");
      return;
    }

    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 8) {
      setCurrentStep(9);
      runAgentSimulation();
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 9) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runAgentSimulation = async () => {
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
          budget,
          goals: selectedGoals,
          resources,
          stage,
        }),
      });
    } catch (e) {
      console.warn("Backend sync notice:", e);
    }

    // 2. Animate agent progress steps sequentially
    for (let i = 0; i < 5; i++) {
      setAgentProgress((prev) =>
        prev.map((agent, index) =>
          index === i ? { ...agent, status: "in_progress" } : agent
        )
      );
      await new Promise((r) => setTimeout(r, 700));

      setAgentProgress((prev) =>
        prev.map((agent, index) =>
          index === i ? { ...agent, status: "completed" } : agent
        )
      );
    }

    setIsSynthesizing(true);
    await new Promise((r) => setTimeout(r, 800));

    // 3. Trigger backend multi-agent orchestrator analysis
    try {
      await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, idea, type: businessType, location, budget, stage, goals: selectedGoals }),
      });
    } catch (e) {
      console.warn("Analysis trigger notice:", e);
    }

    setIsSynthesizing(false);
    setAnalysisComplete(true);
    toast.success("AI Business Analysis Complete!");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1200);
  };

  const progressPercent = Math.round((currentStep / 9) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <Logo href="/" size="md" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            Step {currentStep} of 9
          </span>
        </div>
      </header>

      {/* Main Form Content */}
      <div className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Onboarding Progress</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <Card className="border shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: Business Name */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 1 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What is your business called?</h2>
                <p className="text-xs text-muted-foreground">
                  Give your venture an official or working brand name.
                </p>
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-name">Business Name</Label>
                  <Input
                    id="biz-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., NovaBite Foods, AeroMetrics, UrbanSprout"
                    className="text-base h-11"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Business Idea */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 2 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Describe your business concept</h2>
                <p className="text-xs text-muted-foreground">
                  What problem are you solving, what do you offer, and who is it for?
                </p>
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-idea">Core Idea</Label>
                  <Textarea
                    id="biz-idea"
                    rows={4}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Describe what product or service you provide and why customers will love it..."
                    className="text-sm leading-relaxed"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Business Type */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 3 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Select your industry category</h2>
                <p className="text-xs text-muted-foreground">
                  This calibrates our AI agents to use relevant market benchmarks and financial ratios.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {businessTypes.map((type) => {
                    const isSelected = businessType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessType(type)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-xs"
                            : "border-border bg-card text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {type}
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
                  <span className="text-xs font-bold uppercase tracking-wider">Step 4 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">Where will you operate?</h2>
                <p className="text-xs text-muted-foreground">
                  Specify city or region so the Market Agent can evaluate regional customer density.
                </p>
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-loc">Headquarters / Primary Market</Label>
                  <Input
                    id="biz-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Pune, Maharashtra or Bengaluru or Remote"
                    className="text-base h-11"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 5: Available Budget */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 5 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What is your starting budget?</h2>
                <p className="text-xs text-muted-foreground">
                  The Finance Agent uses this figure to calculate runway months and break-even targets.
                </p>
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-budget">Capital Allocation (₹ INR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm font-bold text-muted-foreground">₹</span>
                    <Input
                      id="biz-budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="1500000"
                      className="pl-8 text-base h-11 font-mono"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Business Goals */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 6 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What are your immediate goals?</h2>
                <p className="text-xs text-muted-foreground">
                  Select the primary outcomes you want your AI Co-Pilot to optimize for.
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

            {/* STEP 7: Available Resources */}
            {currentStep === 7 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Wrench className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 7 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What assets or resources do you have?</h2>
                <p className="text-xs text-muted-foreground">
                  e.g., domain expertise, patents, existing equipment, physical space, or team members.
                </p>
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="biz-res">Current Resources</Label>
                  <Textarea
                    id="biz-res"
                    rows={3}
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    placeholder="e.g., Commercial kitchen lease, 3 full-time line cooks, 500 waitlist signups..."
                    className="text-sm leading-relaxed"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* STEP 8: Business Stage */}
            {currentStep === 8 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Milestone className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Step 8 of 8</span>
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">What stage is your venture in?</h2>
                <p className="text-xs text-muted-foreground">
                  This anchors your initial business roadmap and task priority matrix.
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
              </div>
            )}

            {/* STEP 9: Animated AI Agent Processing */}
            {currentStep === 9 && (
              <div className="space-y-6 py-4 animate-in fade-in-50 duration-200">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <BrainCircuit className="h-8 w-8 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-foreground">
                    Multi-Agent AI Analysis in Progress
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Our specialized agents are analyzing market opportunity, financial runway, competitive moats, and operational capacity for <strong className="text-foreground">{name}</strong>.
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
                          <span>Analyzing...</span>
                        </span>
                      )}

                      {agent.status === "pending" && (
                        <span className="text-[11px] text-muted-foreground">Waiting...</span>
                      )}
                    </div>
                  ))}

                  {isSynthesizing && (
                    <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-center text-xs font-bold text-purple-700 dark:text-purple-300 animate-pulse">
                      AI Orchestrator harmonizing recommendations...
                    </div>
                  )}

                  {analysisComplete && (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Analysis Complete! Launching your Executive Dashboard...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 9 && (
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

                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-sm shadow-indigo-600/20"
                >
                  <span>{currentStep === 8 ? "Generate AI Analysis" : "Continue"}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-2">
        BizMind AI • Intelligent Business Planning & Management Platform
      </footer>
    </div>
  );
}
