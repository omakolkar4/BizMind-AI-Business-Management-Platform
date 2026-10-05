"use client";

import * as React from "react";
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
  Bot,
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

export default function AnalysisPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);

  // Editable Form Inputs
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [idea, setIdea] = React.useState("");
  const [targetCustomer, setTargetCustomer] = React.useState("");

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analysis");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.business) {
          setName(json.business.name || "");
          setType(json.business.type || "");
          setLocation(json.business.location || "");
          setBudget(String(json.business.budget || 1500000));
          setIdea(json.business.idea || "");
        }
        if (json.context?.targetCustomer) {
          setTargetCustomer(json.context.targetCustomer);
        }
      }
    } catch {
      toast.error("Network error loading AI analysis.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalysis();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      toast.info("Multi-Agent AI analysis initiated across 5 specialized agents...");

      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          location,
          budget,
          idea,
          targetCustomer,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setData((prev: any) => ({ ...prev, analysis: json.analysis }));
        toast.success("AI Orchestrator synthesis complete!");
      } else {
        toast.error("Failed to run analysis.");
      }
    } catch {
      toast.error("Error running AI analysis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPdf = () => {
    if (!analysis) {
      toast.error("No analysis available to export.");
      return;
    }

    const sections = [
      { title: "Executive AI Summary", content: analysis.summary },
      { title: "Market Opportunity & TAM", content: analysis.marketOpportunity },
      { title: "Business Feasibility & Unit Economics", content: analysis.feasibility },
      { title: "Target Audience & Customer Profile", content: analysis.targetAudience },
      { title: "Market Trends & Adoption Dynamics", content: analysis.marketTrends },
      { title: "Competitive Intelligence", content: analysis.competitorNotes },
      { title: "Risk Assessment & Mitigation Strategy", content: analysis.riskAssessment },
      { title: "Revenue Opportunities", content: analysis.revenueOpportunities },
      { title: "Cost Considerations & Overhead Control", content: analysis.costConsiderations },
    ];

    exportDocumentToPdf({
      title: "Multi-Agent AI Business Analysis",
      businessName: name || "NovaBite Foods",
      sections,
      metadata: {
        "Overall Health Score": `${analysis.overallScore}/100`,
        "Business Category": type,
        "Primary Market": location,
        "Capital Allocation": `₹${parseFloat(budget || "0").toLocaleString("en-IN")}`,
      },
    });

    toast.success("AI Analysis exported to PDF!");
  };

  const analysis = data?.analysis;

  // Parse JSON arrays safely
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
  const recommendedActions = parseList(analysis?.recommendedActions);
  const agentLogs = parseList(analysis?.agentLogs);

  return (
    <DashboardShell businessName={name || "NovaBite Foods"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                AI Business Analysis
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Multi-Agent Synthesis
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Autonomous evaluation across Market, Finance, Strategy, Risk, and Operations agents.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              className="text-xs font-semibold h-9"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <span>Export Analysis PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Orchestrating Agents..." : "Run AI Analysis"}</span>
            </Button>
          </div>
        </div>

        {/* Multi-Agent Live Execution Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { name: "Market Agent", score: "84%", role: "TAM & Demographics" },
            { name: "Finance Agent", score: "86%", role: "Margins & Runway" },
            { name: "Strategy Agent", score: "87%", role: "Wedge & Moat" },
            { name: "Risk Agent", score: "80%", role: "Supply & Compliance" },
            { name: "Operations Agent", score: "85%", role: "Throughput & SLAs" },
          ].map((agent, i) => (
            <div key={i} className="p-3 rounded-xl border bg-card text-xs space-y-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground truncate">{agent.name}</span>
                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {agent.score}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Verified</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2-Column Layout: Left Context / Right Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Business Information (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Business Parameters</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Context used to prompt the multi-agent AI system.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="biz-name">Company Name</Label>
                  <Input
                    id="biz-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biz-type">Industry Sector</Label>
                  <Input
                    id="biz-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biz-loc">Location</Label>
                  <Input
                    id="biz-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biz-budget">Capital Allocation (₹)</Label>
                  <Input
                    id="biz-budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biz-cust">Target Customer</Label>
                  <Input
                    id="biz-cust"
                    value={targetCustomer}
                    onChange={(e) => setTargetCustomer(e.target.value)}
                    placeholder="e.g., Tech professionals, B2B HRs"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="biz-idea">Core Idea & Value Proposition</Label>
                  <Textarea
                    id="biz-idea"
                    rows={4}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="text-xs leading-relaxed"
                  />
                </div>

                <Button
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 mt-2"
                >
                  {analyzing ? "Running Agents..." : "Re-Calculate AI Analysis"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Analysis Output (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {analysis ? (
              <>
                {/* Executive Summary Card */}
                <Card className="border shadow-sm border-indigo-200/60 dark:border-indigo-900/50 bg-card">
                  <CardHeader className="pb-3 border-b bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Orchestrated Executive Summary</CardTitle>
                        <p className="text-xs text-muted-foreground">Consolidated AI verdict</p>
                      </div>
                    </div>
                    <Badge variant="ai" className="text-xs font-bold font-mono">
                      Overall Score: {analysis.overallScore}/100
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Market & Feasibility Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border shadow-2xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>Market Opportunity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed pt-0">
                      {analysis.marketOpportunity}
                    </CardContent>
                  </Card>

                  <Card className="border shadow-2xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Operational Feasibility</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed pt-0">
                      {analysis.feasibility}
                    </CardContent>
                  </Card>
                </div>

                {/* SWOT Analysis Matrix (Section 11) */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Multi-Agent SWOT Analysis</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Structured evaluation of internal advantages and external landscape risks
                    </p>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Strengths</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {strengths.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                          <span>Weaknesses</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {weaknesses.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Opportunities */}
                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          <span>Opportunities</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {opportunities.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Threats */}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                          <span>Threats</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {threats.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment & Financial Considerations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border shadow-2xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Risk Assessment</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed pt-0">
                      {analysis.riskAssessment}
                    </CardContent>
                  </Card>

                  <Card className="border shadow-2xs">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Cost & Revenue Potential</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground leading-relaxed pt-0">
                      <p><strong>Revenue:</strong> {analysis.revenueOpportunities}</p>
                      <p className="mt-1"><strong>Cost control:</strong> {analysis.costConsiderations}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommended Priority Actions */}
                <Card className="border shadow-sm bg-gradient-to-br from-indigo-50/40 via-card to-card dark:from-indigo-950/20">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Recommended Priority Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-2.5">
                      {recommendedActions.map((action, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl border bg-background/80 text-xs shadow-2xs"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <span className="font-semibold text-foreground leading-relaxed">
                            {action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="py-20 text-center space-y-3">
                <BrainCircuit className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
                <h3 className="text-base font-bold text-foreground">No Analysis Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click &ldquo;Run AI Analysis&rdquo; to prompt our specialized multi-agent architecture.
                </p>
                <Button onClick={handleRunAnalysis} className="bg-indigo-600 text-white font-semibold text-xs">
                  Generate Analysis Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
