"use client";

import * as React from "react";
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
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { exportDocumentToPdf } from "@/lib/exportPdf";
import { toast } from "sonner";

interface BusinessPlanState {
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
}

const SECTION_KEYS: { key: keyof BusinessPlanState; title: string; num: number }[] = [
  { num: 1, key: "executiveSummary", title: "Executive Summary" },
  { num: 2, key: "businessOverview", title: "Business Overview" },
  { num: 3, key: "problem", title: "Problem Statement" },
  { num: 4, key: "solution", title: "Product / Service Solution" },
  { num: 5, key: "targetMarket", title: "Target Market & Demographics" },
  { num: 6, key: "customerPersona", title: "Ideal Customer Persona" },
  { num: 7, key: "marketAnalysis", title: "Market Analysis & Industry Sizing" },
  { num: 8, key: "competitorAnalysis", title: "Competitor Analysis & Moat" },
  { num: 9, key: "valueProposition", title: "Unique Value Proposition" },
  { num: 10, key: "businessModel", title: "Business & Monetization Model" },
  { num: 11, key: "marketingStrategy", title: "Marketing & Go-To-Market Strategy" },
  { num: 12, key: "operationsStrategy", title: "Operations & Supply Chain Strategy" },
  { num: 13, key: "technologyStrategy", title: "Technology Architecture & Tools" },
  { num: 14, key: "financialOverview", title: "Financial Overview & Projections" },
  { num: 15, key: "riskAnalysis", title: "Risk Analysis & Contingency Plans" },
  { num: 16, key: "growthStrategy", title: "Growth & Multi-City Expansion Strategy" },
  { num: 17, key: "implementationRoadmap", title: "Implementation Roadmap & Milestones" },
];

export default function BusinessPlanPage() {
  const [businessName, setBusinessName] = React.useState("NovaBite Foods");
  const [plan, setPlan] = React.useState<BusinessPlanState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/business-plan");
      if (res.ok) {
        const json = await res.json();
        if (json.plan) setPlan(json.plan);
        if (json.business?.name) setBusinessName(json.business.name);
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
      toast.info(regenerate ? "Regenerating all 17 plan sections with AI..." : "Generating investor-grade business plan...");
      const res = await fetch("/api/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });

      if (res.ok) {
        const json = await res.json();
        setPlan(json.plan);
        toast.success("17-Section Business Plan generated successfully!");
      } else {
        toast.error("Failed to generate plan.");
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

      if (res.ok) {
        setIsEditing(false);
        toast.success("Business plan saved successfully.");
      } else {
        toast.error("Failed to save business plan.");
      }
    } catch {
      toast.error("Error saving business plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = () => {
    if (!plan) {
      toast.error("No plan to export.");
      return;
    }

    const sections = SECTION_KEYS.map((s) => ({
      title: s.title,
      content: plan[s.key] || "Section pending final draft.",
    }));

    exportDocumentToPdf({
      title: "Comprehensive Strategic Business Plan",
      businessName,
      sections,
      metadata: {
        "Plan Version": "1.0 Formal",
        "Sections Compiled": "17 Complete Sections",
        "Prepared By": "BizMind AI Strategy Director",
        "Date Certified": new Date().toLocaleDateString("en-US", { dateStyle: "medium" }),
      },
    });

    toast.success("Business Plan PDF downloaded!");
  };

  const updateSection = (key: keyof BusinessPlanState, val: string) => {
    if (!plan) return;
    setPlan({ ...plan, [key]: val });
  };

  return (
    <DashboardShell businessName={businessName}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                17-Section Business Plan
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Investor Ready
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Complete, comprehensive venture blueprint formulated by AI and editable for stakeholders.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="text-xs font-semibold h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${generating ? "animate-spin" : ""}`} />
              <span>Regenerate with AI</span>
            </Button>

            {isEditing ? (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-sm"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsEditing(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                <span>Edit Document</span>
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Document Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Table of Contents (3 cols) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20">
            <Card className="border shadow-xs">
              <CardHeader className="p-4 border-b bg-muted/20">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ListOrdered className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Table of Contents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-0.5 max-h-[calc(100vh-180px)] overflow-y-auto">
                {SECTION_KEYS.map((sec) => (
                  <a
                    key={sec.num}
                    href={`#section-${sec.num}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors group truncate"
                  >
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline">
                      {sec.num}.
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Document Canvas (9 cols) */}
          <div className="lg:col-span-9 space-y-6">
            <div className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm space-y-10 border-border">
              {/* Document Title Banner */}
              <div className="border-b pb-8 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    Official Business Plan • Confidential
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last Saved: {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  {businessName}
                </h2>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Intelligent Strategic Business Plan & Operational Playbook
                </p>
              </div>

              {/* 17 Sections */}
              {plan ? (
                <div className="space-y-8">
                  {SECTION_KEYS.map((sec) => {
                    const content = plan[sec.key] || "";
                    return (
                      <div
                        key={sec.num}
                        id={`section-${sec.num}`}
                        className="space-y-3 scroll-mt-24 group"
                      >
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-xs font-bold">
                              {sec.num}
                            </span>
                            <span>{sec.title}</span>
                          </h3>
                        </div>

                        {isEditing ? (
                          <Textarea
                            rows={5}
                            value={content}
                            onChange={(e) => updateSection(sec.key, e.target.value)}
                            className="text-xs sm:text-sm leading-relaxed font-sans"
                          />
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h3 className="text-base font-bold text-foreground">No Business Plan Draft</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click &ldquo;Generate with AI&rdquo; to draft a full 17-section institutional plan.
                  </p>
                  <Button
                    onClick={() => handleGenerate(false)}
                    disabled={generating}
                    className="bg-indigo-600 text-white font-semibold text-xs"
                  >
                    Generate Plan Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
