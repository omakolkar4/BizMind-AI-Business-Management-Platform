"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Download,
  Save,
  Edit3,
  RefreshCw,
  CheckCircle2,
  ListOrdered,
  Printer,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { exportDocumentToPdf } from "@/lib/exportPdf";
import { PlanDecisionCard } from "@/components/business-plan/plan-decision-card";
import { toast } from "sonner";

interface BusinessPlanState {
  id?: string;
  executiveSummary: string;
  businessOverview: string;
  problem: string;
  solution: string;
  targetMarket: string;
  customerPersona: string;
  marketAnalysis: string;
  competitorAnalysis: string;
  valueProposition: string;
  businessModel: string;
  marketingStrategy: string;
  operationsStrategy: string;
  technologyStrategy: string;
  financialOverview: string;
  riskAnalysis: string;
  growthStrategy: string;
  implementationRoadmap: string;
  status?: string;
  version?: number;
  decision?: string | null;
  decisionTimestamp?: string | null;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
  revisionNotes?: string | null;
  updatedAt?: string;
}

export type PlanTextSectionKey =
  | "executiveSummary"
  | "businessOverview"
  | "problem"
  | "solution"
  | "targetMarket"
  | "customerPersona"
  | "marketAnalysis"
  | "competitorAnalysis"
  | "valueProposition"
  | "businessModel"
  | "marketingStrategy"
  | "operationsStrategy"
  | "technologyStrategy"
  | "financialOverview"
  | "riskAnalysis"
  | "growthStrategy"
  | "implementationRoadmap";

interface SectionMeta {
  num: number;
  key: PlanTextSectionKey;
  title: string;
  explanation: string;
  keyQuestion: string;
}

const SECTIONS: SectionMeta[] = [
  {
    num: 1,
    key: "executiveSummary",
    title: "1. Executive Summary",
    explanation: "A high-level synthesis of your entire business model, unique advantage, capital requirements, and financial targets.",
    keyQuestion: "What is this business and why will it succeed in simple terms?",
  },
  {
    num: 2,
    key: "businessOverview",
    title: "2. Business Overview",
    explanation: "Legal entity structure, founding location, industry category, and mission statement.",
    keyQuestion: "Who are you, where do you operate, and what is your foundational mission?",
  },
  {
    num: 3,
    key: "problem",
    title: "3. Problem Statement",
    explanation: "The acute pain point, inefficiency, or unserved need experienced by your target customers.",
    keyQuestion: "What exact frustration or cost are customers currently enduring?",
  },
  {
    num: 4,
    key: "solution",
    title: "4. Product or Service Offering",
    explanation: "The exact products, services, or platform you deliver that solves the stated problem.",
    keyQuestion: "How does your offering directly alleviate the customer's pain point?",
  },
  {
    num: 5,
    key: "targetMarket",
    title: "5. Target Market & Demographics",
    explanation: "Specific customer segments, geographic territories, and demographic criteria for primary buyers.",
    keyQuestion: "Who are the exact people or businesses most eager to pay you first?",
  },
  {
    num: 6,
    key: "customerPersona",
    title: "6. Customer Persona",
    explanation: "A vivid profile of your ideal decision-maker: their daily habits, budget, and purchasing triggers.",
    keyQuestion: "What does a day in the life of your best customer look like?",
  },
  {
    num: 7,
    key: "marketAnalysis",
    title: "7. Market Analysis & Industry Trends",
    explanation: "Market size, macro growth drivers, changing consumer behavior, and tailwinds in your sector.",
    keyQuestion: "Why is right now the perfect macroeconomic moment for this business?",
  },
  {
    num: 8,
    key: "competitorAnalysis",
    title: "8. Competitor Analysis & Moat",
    explanation: "Direct and indirect competitors, their structural weaknesses, and your defensible advantage.",
    keyQuestion: "Where do competitors fall short, and why can't they easily copy you?",
  },
  {
    num: 9,
    key: "valueProposition",
    title: "9. Unique Value Proposition",
    explanation: "The clear, memorable promise that convinces buyers to choose you over every alternative.",
    keyQuestion: "What is the single compelling reason to choose your brand today?",
  },
  {
    num: 10,
    key: "businessModel",
    title: "10. Revenue Model & Monetization",
    explanation: "Pricing structure, billing cadence (subscriptions, unit sales, retainers), and gross margin economics.",
    keyQuestion: "How do you charge, how much does it cost to deliver, and where does profit come from?",
  },
  {
    num: 11,
    key: "marketingStrategy",
    title: "11. Marketing & Customer Acquisition Strategy",
    explanation: "Channels, campaigns, local partnerships, and referral flywheels used to attract paying clients.",
    keyQuestion: "How will strangers discover your business and become paying customers?",
  },
  {
    num: 12,
    key: "operationsStrategy",
    title: "12. Operations & Service Delivery Plan",
    explanation: "Fulfillment workflows, supplier partnerships, quality control SOPs, and delivery turnaround targets.",
    keyQuestion: "How do inputs reliably become finished, delightful customer deliverables every day?",
  },
  {
    num: 13,
    key: "technologyStrategy",
    title: "13. Technology Stack & Automation",
    explanation: "Software architecture, POS systems, customer communication apps, and data analytics tools.",
    keyQuestion: "What tools and software keep the business running smoothly with minimal human error?",
  },
  {
    num: 14,
    key: "financialOverview",
    title: "14. Financial Projections & Break-Even Analysis",
    explanation: "Seed budget allocation, monthly OpEx burn, unit contribution margins, and expected break-even horizon.",
    keyQuestion: "When will the business become cash-flow positive and what margins will it maintain?",
  },
  {
    num: 15,
    key: "riskAnalysis",
    title: "15. Risk Assessment & Mitigation Matrix",
    explanation: "Supply chain vulnerabilities, compliance/licensing hurdles, talent shortages, and proactive safeguards.",
    keyQuestion: "What is the worst thing that could happen and how will you survive and thrive anyway?",
  },
  {
    num: 16,
    key: "growthStrategy",
    title: "16. Scalability & 3-Year Growth Roadmap",
    explanation: "Multi-location expansion, secondary service lines, B2B enterprise tier rollouts, and franchise playbooks.",
    keyQuestion: "How does this business grow 5x without proportionally multiplying headcount and chaos?",
  },
  {
    num: 17,
    key: "implementationRoadmap",
    title: "17. Implementation Roadmap & Milestones",
    explanation: "Core timeline phases, hiring dates, initial launch target, and 12-month execution goals.",
    keyQuestion: "What are the exact sequential milestones from day 1 to market launch?",
  },
];

export default function BusinessPlanPage() {
  const sectionsRef = React.useRef<HTMLDivElement>(null);

  const [businessName, setBusinessName] = React.useState("");
  const [businessStage, setBusinessStage] = React.useState("Idea");
  const [businessType, setBusinessType] = React.useState("");
  const [businessData, setBusinessData] = React.useState<any>(null);
  const [feasibilityData, setFeasibilityData] = React.useState<any>(null);
  const [roadmapPhasesCount, setRoadmapPhasesCount] = React.useState(7);
  const [userName, setUserName] = React.useState("Founder");
  const [userRole, setUserRole] = React.useState("OWNER");

  const [plan, setPlan] = React.useState<BusinessPlanState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editingSection, setEditingSection] = React.useState<keyof BusinessPlanState | "all" | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/business-plan");
      if (res.ok) {
        const json = await res.json();
        if (json.plan) {
          setPlan(json.plan);
          if (json.plan.updatedAt) {
            setLastSaved(new Date(json.plan.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        }
        if (json.business) {
          setBusinessData(json.business);
          setBusinessName(json.business.name || "My Business");
          setBusinessStage(json.business.stage || "Idea");
          setBusinessType(json.business.type || "Enterprise");
        }
        if (json.feasibility) {
          setFeasibilityData(json.feasibility);
        }
        if (json.roadmapPhasesCount) {
          setRoadmapPhasesCount(json.roadmapPhasesCount);
        }
        if (json.userName) setUserName(json.userName);
        if (json.userRole) setUserRole(json.userRole);
      }
    } catch {
      toast.error("Network error loading business plan.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPlan();
  }, []);

  const handleGenerate = async (regenerate: boolean = false) => {
    try {
      setGenerating(true);
      toast.info(regenerate ? "Regenerating all 17 strategic sections with AI..." : "Synthesizing customized 17-section business plan...");
      const res = await fetch("/api/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });

      if (res.ok) {
        const json = await res.json();
        setPlan(json.plan);
        setRegenerateModalOpen(false);
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        toast.success("17-Section Business Blueprint generated and saved successfully!");
        fetchPlan();
      } else {
        toast.error("Failed to generate plan. Please verify business profile.");
      }
    } catch {
      toast.error("Network error during plan generation.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    try {
      setSaving(true);
      const res = await fetch("/api/business-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });

      const json = await res.json();
      if (res.ok) {
        setEditingSection(null);
        setPlan(json.plan);
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        if (json.requiresReviewAgain) {
          toast.warning(json.message || "Manual edits saved. Modified plan now requires review and acceptance.");
        } else {
          toast.success("Business plan changes saved to database.");
        }
        fetchPlan();
      } else {
        toast.error("Failed to save changes.");
      }
    } catch {
      toast.error("Error saving business plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    if (!plan) {
      toast.error("No business plan content available to export.");
      return;
    }

    const sections = SECTIONS.map((s) => ({
      title: s.title,
      content: plan[s.key] || "Section pending final draft.",
    }));

    exportDocumentToPdf({
      title: "Comprehensive Strategic Business Plan",
      businessName: businessName || "My Venture",
      sections,
      metadata: {
        "Document Version": `v${plan.version || 1}.0 ${plan.status || "Draft"}`,
        "Plan Status": plan.status || "Under Review",
        "Accepted By": plan.acceptedBy || "Pending Review",
        "Sections": "17 Complete Strategic Sections",
        "Generated By": "BizMind Multi-Agent Architecture",
        "Date Exported": new Date().toLocaleDateString("en-US", { dateStyle: "medium" }),
      },
    });

    toast.success("Business Plan PDF downloaded successfully!");
  };

  const updateSection = (key: keyof BusinessPlanState, value: string) => {
    if (!plan) return;
    setPlan({ ...plan, [key]: value });
  };

  // Completion calculation: how many sections have non-empty text > 30 chars
  const completedSectionsCount = SECTIONS.filter(
    (s) => plan && plan[s.key] && plan[s.key].trim().length > 30
  ).length;
  const completionPercentage = Math.round((completedSectionsCount / 17) * 100);

  const scrollToSections = () => {
    sectionsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <DashboardShell
      businessName={businessName}
      businessStage={businessStage}
      userRole={userRole}
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-background dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-background p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="ai" className="text-xs font-semibold">
                  Founder Blueprint
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {completedSectionsCount} of 17 Sections Active ({completionPercentage}%)
                </span>
                {plan?.status && (
                  <Badge
                    variant={
                      plan.status === "ACCEPTED"
                        ? "success"
                        : plan.status === "REVISION_REQUIRED"
                        ? "warning"
                        : "outline"
                    }
                    className="text-xs font-bold"
                  >
                    {plan.status === "ACCEPTED"
                      ? "Plan Accepted"
                      : plan.status === "REVISION_REQUIRED"
                      ? "Revision Required"
                      : "Under Review"}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                AI Strategic Business Blueprint
              </h1>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {plan && (
                <>
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
                    variant="outline"
                    size="sm"
                    onClick={() => setRegenerateModalOpen(true)}
                    disabled={generating}
                    className="text-xs font-semibold h-9"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${generating ? "animate-spin" : ""}`} />
                    <span>Regenerate</span>
                  </Button>

                  {editingSection === "all" ? (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      <span>{saving ? "Saving..." : "Save All"}</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setEditingSection("all")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      <span>Edit Document</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your AI-generated business blueprint explains what you are building, who your customers are, how much money you need, how you will earn revenue, what risks to prepare for, and what actions to take next. Use this strategic document for planning, execution, funding discussions, and tracking milestones.
          </p>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
            <span>
              {lastSaved ? `Last saved: ${lastSaved}` : "Not yet saved to database"}
            </span>
            <span className="italic">
              Strategic planning tool • Feeds directly into your Roadmap phases
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3 animate-pulse">
            <div className="h-10 w-48 bg-muted rounded-xl mx-auto" />
            <div className="h-4 w-72 bg-muted/60 rounded mx-auto" />
            <div className="h-96 rounded-2xl bg-muted/30 max-w-4xl mx-auto border" />
          </div>
        )}

        {/* Empty State: Clear CTA to Generate Plan */}
        {!loading && !plan && (
          <Card className="border text-center py-16 px-4 shadow-sm">
            <CardContent className="space-y-4 max-w-lg mx-auto">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
                <FileText className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                No Business Plan Generated Yet
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to synthesize a comprehensive 17-section institutional business plan tailored directly to your business idea, starting budget, and target market.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-10 px-6 shadow-sm shadow-indigo-600/20"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  <span>{generating ? "Formulating Blueprint..." : "Generate My Business Plan"}</span>
                </Button>
                <Link href="/analyzer">
                  <Button variant="outline" size="sm" className="text-xs h-10 gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Run AI Idea & Budget Analyzer</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="text-xs h-10">
                    Verify Business Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CORE PLAN ACCEPTANCE DECISION SECTION (Requirement 2) */}
        {!loading && plan && (
          <PlanDecisionCard
            business={businessData}
            plan={plan}
            feasibility={feasibilityData}
            roadmapPhasesCount={roadmapPhasesCount}
            userName={userName}
            userRole={userRole}
            onDecisionComplete={fetchPlan}
            onScrollToSections={scrollToSections}
          />
        )}

        {/* Main 2-Column Document Layout */}
        {!loading && plan && (
          <div ref={sectionsRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            {/* Left Column: Interactive Table of Contents (4 cols) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-20">
              <Card className="border shadow-xs">
                <CardHeader className="p-3.5 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ListOrdered className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Table of Contents</span>
                    </CardTitle>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">
                      {completedSectionsCount}/17 Ready
                    </span>
                  </div>
                  <Progress value={completionPercentage} className="h-1 mt-1.5" />
                </CardHeader>
                <CardContent className="p-2 space-y-0.5 max-h-[calc(100vh-180px)] overflow-y-auto">
                  {SECTIONS.map((sec) => {
                    const content = plan ? plan[sec.key] : "";
                    const hasContent = Boolean(content && content.trim().length > 30);
                    const isCurrentlyEditing = editingSection === sec.key || editingSection === "all";

                    return (
                      <a
                        key={sec.num}
                        href={`#section-${sec.key}`}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isCurrentlyEditing
                            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                              hasContent
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sec.num}
                          </span>
                          <span className="truncate">{sec.title.replace(/^\d+\.\s*/, "")}</span>
                        </div>
                        {hasContent ? (
                          <Check className="h-3 w-3 text-emerald-500 shrink-0 ml-1" />
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic shrink-0">draft</span>
                        )}
                      </a>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: 17 Editable Document Sections (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b bg-muted/10 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      17 Strategic Business Plan Sections
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Review, tailor, or edit individual sections to match your exact operating model.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSection(editingSection ? null : "all")}
                      className="text-xs h-8"
                    >
                      {editingSection === "all" ? "Collapse Editor" : "Edit All Sections"}
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/60">
                  {SECTIONS.map((sec) => {
                    const isEditing = editingSection === sec.key || editingSection === "all";
                    const content = plan[sec.key] || "";

                    return (
                      <div
                        key={sec.key}
                        id={`section-${sec.key}`}
                        className="p-4 sm:p-6 space-y-3 transition-colors hover:bg-muted/5 scroll-mt-20"
                      >
                        {/* Section Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
                                Section {sec.num}
                              </span>
                              <h3 className="text-sm sm:text-base font-extrabold text-foreground">
                                {sec.title.replace(/^\d+\.\s*/, "")}
                              </h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {sec.explanation}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium pt-0.5">
                              <HelpCircle className="h-3 w-3 shrink-0" />
                              <span>Key Question: {sec.keyQuestion}</span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {isEditing ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSave}
                                disabled={saving}
                                className="text-[11px] h-7 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                <span>Save</span>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSection(sec.key)}
                                className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground"
                              >
                                <Edit3 className="h-3 w-3 mr-1" />
                                <span>Edit</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Section Body */}
                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <Textarea
                              rows={5}
                              value={content}
                              onChange={(e) => updateSection(sec.key, e.target.value)}
                              className="text-xs sm:text-sm leading-relaxed font-sans"
                              placeholder={`Draft ${sec.title.toLowerCase()}...`}
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSection(null)}
                                className="text-[11px] h-7"
                              >
                                Done Editing
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60">
                            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal whitespace-pre-line">
                              {content || (
                                <span className="text-muted-foreground italic">
                                  Section draft pending. Click Edit to add details.
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Regenerate Plan Safeguard */}
        <Dialog open={regenerateModalOpen} onOpenChange={setRegenerateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span>Regenerate Business Plan</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Regenerating with AI will formulate fresh strategic sections based on your current business profile and archived existing versions.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Version Archive Safeguard</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                If your current plan was accepted or has custom text, a snapshot is safely preserved in Version History before new sections are synthesized.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRegenerateModalOpen(false)}
                disabled={generating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={generating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                {generating ? "Regenerating..." : "Confirm & Regenerate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
