"use client";

import * as React from "react";
import {
  BarChart3,
  Download,
  Eye,
  Plus,
  FileText,
  DollarSign,
  Users,
  CheckSquare,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportDocumentToPdf } from "@/lib/exportPdf";
import { toast } from "sonner";

interface ReportItem {
  id: string;
  title: string;
  type: string;
  summary: string;
  data: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [summary, setSummary] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [viewingReport, setViewingReport] = React.useState<ReportItem | null>(null);

  const REPORT_TEMPLATES = [
    {
      type: "Business Performance",
      title: "Executive Business Performance & Health Audit",
      desc: "Holistic analysis of revenue velocity, margin expansion, and operational bottleneck index.",
      icon: BarChart3,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950",
    },
    {
      type: "Financial Report",
      title: "Quarterly Financial Audit & P&L Statement",
      desc: "Categorical breakdown of cash inflows, cost of goods, fixed OpEx, and EBITDA margins.",
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950",
    },
    {
      type: "Employee Report",
      title: "Workforce Productivity & Payroll Audit",
      desc: "Headcount distribution, department salary allocations, and task completion velocity.",
      icon: Users,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950",
    },
    {
      type: "Task Performance",
      title: "Operational Milestone & Pipeline Review",
      desc: "Kanban milestone throughput, blocked task diagnostics, and delivery predictability.",
      icon: CheckSquare,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950",
    },
    {
      type: "AI Business Analysis",
      title: "Multi-Agent SWOT & Strategic Landscape",
      desc: "Synthesized intelligence across Market, Finance, Strategy, Risk, and Operations agents.",
      icon: Sparkles,
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950",
    },
    {
      type: "Business Plan",
      title: "Institutional 17-Section Business Blueprint",
      desc: "Formal investor deck and comprehensive operating plan for banking and venture partners.",
      icon: FileText,
      color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950",
    },
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
        setSummary(json.businessSummary);
      }
    } catch {
      toast.error("Failed to load executive reports.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (type: string) => {
    try {
      toast.info(`Compiling ${type} from live database telemetry...`);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        const json = await res.json();
        setReports((prev) => [json.report, ...prev]);
        toast.success(`${type} generated successfully!`);
      } else {
        toast.error("Failed to generate report.");
      }
    } catch {
      toast.error("Error generating report.");
    }
  };

  const handleExportPdf = (report: ReportItem) => {
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(report.data);
    } catch {
      parsedData = {};
    }

    const businessName = summary?.name || parsedData.businessName || "My Business";
    const reportMetrics = parsedData.metrics || {};

    const sections = parsedData.sections && Array.isArray(parsedData.sections) && parsedData.sections.length > 0
      ? parsedData.sections
      : [
          {
            title: "I. Executive Summary",
            content: report.summary,
          },
          {
            title: "II. Operational Telemetry Data",
            content: `This management report reflects live transactions, task completions, and headcount metrics recorded for ${businessName}. All figures are derived directly from verified business records.`,
          },
          {
            title: "III. Recommendations & Governance Notes",
            content: "1. Monitor cash flow velocity and maintain disciplined tracking of operational expenses.\n2. Ensure tasks are linked to strategic roadmap phases to track milestones automatically.\n3. Align hiring plans with realistic monthly revenue benchmarks.",
          },
        ];

    exportDocumentToPdf({
      title: report.title,
      businessName,
      sections,
      metadata: {
        "Report ID": report.id.substring(0, 10),
        "Report Type": report.type,
        "Total Revenue": formatCurrency(reportMetrics.revenue ?? summary?.revenue ?? 0),
        "Total Expenses": formatCurrency(reportMetrics.expenses ?? summary?.expenses ?? 0),
        "Net Operating Profit": formatCurrency(reportMetrics.netProfit ?? summary?.netProfit ?? 0),
        "Health Score": summary?.healthScore != null ? `${summary.healthScore}/100` : "Evaluation Pending",
      },
    });

    toast.success("Executive Report exported to PDF!");
  };

  return (
    <DashboardShell businessName={summary?.name || "My Business"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Executive Reports
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Audit & Export
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generate structured business, financial, workforce, and strategic reports with investor-ready PDF downloads.
            </p>
          </div>
        </div>

        {/* 6 Report Templates Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Available Report Templates
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TEMPLATES.map((tmpl, idx) => {
              const Icon = tmpl.icon;
              return (
                <Card key={idx} className="border shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition-all flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${tmpl.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {tmpl.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground mt-2">
                      {tmpl.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tmpl.desc}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(tmpl.type)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 shadow-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span>Generate Report</span>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Generated Reports History Table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Generated Reports Archive</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Previously compiled reports ready for viewing and PDF download
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {reports.length} Reports
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Generated Date</th>
                      <th className="py-3 px-4">Report Title</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Summary</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          {r.title}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-[10px]">
                            {r.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-sm truncate">
                          {r.summary}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingReport(r)}
                              className="text-xs h-7 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleExportPdf(r)}
                              className="bg-indigo-600 text-white text-xs h-7 px-2"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No reports compiled yet. Click &ldquo;Generate Certified Report&rdquo; above to audit your venture.
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Report Modal */}
        {viewingReport && (
          <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>{viewingReport.title}</DialogTitle>
              </DialogHeader>

              {(() => {
                let parsed: any = {};
                try {
                  parsed = JSON.parse(viewingReport.data);
                } catch {
                  parsed = {};
                }
                const metrics = parsed.metrics || {};
                const sections = parsed.sections || [];

                return (
                  <div className="space-y-4 pt-2 text-xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <Badge variant="ai">{viewingReport.type}</Badge>
                      <span className="text-muted-foreground font-mono">
                        Compiled: {formatDate(viewingReport.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-foreground">Report Summary:</strong>
                      <p className="text-muted-foreground leading-relaxed">{viewingReport.summary}</p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                      <strong className="text-foreground">Executive Snapshot:</strong>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                        <div>Revenue: <strong>{formatCurrency(metrics.revenue ?? summary?.revenue ?? 0)}</strong></div>
                        <div>Expenses: <strong>{formatCurrency(metrics.expenses ?? summary?.expenses ?? 0)}</strong></div>
                        <div>Net Margin: <strong>{((metrics.profitMargin ?? summary?.profitMargin) ?? 0).toFixed(1)}%</strong></div>
                        <div>Health Score: <strong>{metrics.healthScore ?? summary?.healthScore ?? "Evaluation Pending"}</strong></div>
                      </div>
                    </div>

                    {sections.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {sections.map((sec: any, sIdx: number) => (
                          <div key={sIdx} className="rounded-lg border bg-card p-3 space-y-1">
                            <span className="font-bold text-foreground text-xs">{sec.title}</span>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-[11px]">
                              {sec.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <DialogFooter className="pt-4">
                <Button variant="outline" size="sm" onClick={() => setViewingReport(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleExportPdf(viewingReport);
                    setViewingReport(null);
                  }}
                  className="bg-indigo-600 text-white"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardShell>
  );
}
