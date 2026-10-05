"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  BarChart3,
  Users,
  CheckCircle2,
  ChevronDown,
  Layers,
  Zap,
  Target,
  Play,
  HelpCircle,
  FileText,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RevenueExpenseChart } from "@/components/charts/revenue-expense-chart";
import { toast } from "sonner";

export default function LandingPage() {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = React.useState(false);
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  const handleExploreDemo = async () => {
    try {
      setLoadingDemo(true);
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (res.ok) {
        toast.success("Loaded demo workspace: NovaBite Foods!");
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setLoadingDemo(false);
    }
  };

  const workflowSteps = [
    { num: "01", title: "Idea Conception", desc: "Input your business concept, target demographic, and initial budget." },
    { num: "02", title: "Multi-Agent AI Analysis", desc: "Specialized agents evaluate market size, risks, unit economics, and operations." },
    { num: "03", title: "17-Section Business Plan", desc: "AI formulates a bank-ready, investor-grade comprehensive business roadmap." },
    { num: "04", title: "Milestone Roadmap", desc: "Structured timeline from validation to multi-city market expansion." },
    { num: "05", title: "Continuous Execution", desc: "Track cash flows, delegate tasks on Kanban, and lead your workforce." },
    { num: "06", title: "AI Co-Pilot Decision Support", desc: "Get proactive expense alerts, growth recommendations, and instant strategic advice." },
  ];

  const agentCards = [
    { title: "Market Agent", role: "TAM & Trend Sizing", score: "84/100", desc: "Scans demographic patterns, competitive density, and customer willingness-to-pay." },
    { title: "Finance Agent", role: "Unit Economics & Runway", score: "86/100", desc: "Calculates gross margins, monthly burn, cash buffer safety, and breakeven horizons." },
    { title: "Strategy Agent", role: "Competitive Moat", score: "87/100", desc: "Designs initial wedge distribution, pricing power, and customer retention flywheels." },
    { title: "Risk Agent", role: "Mitigation & Audits", score: "80/100", desc: "Surfaces regulatory compliance hurdles, supplier dependencies, and margin shocks." },
    { title: "Operations Agent", role: "Throughput & SLAs", score: "85/100", desc: "Models fulfillment bottlenecks, labor allocation, and equipment capacity." },
    { title: "AI Orchestrator", role: "Executive Synthesis", score: "82/100", desc: "Harmonizes all agent findings into unified actionable priorities for the founder." },
  ];

  const faqs = [
    {
      q: "What makes BizMind different from generic AI chatbots?",
      a: "BizMind does not merely generate static text. It links multi-agent AI business analysis directly to real operational execution — including live transaction tracking, P&L calculations, Kanban task delegation, employee management, and continuous proactive decision alerts based on your real data.",
    },
    {
      q: "Does BizMind require an OpenAI API key to work?",
      a: "No! BizMind includes a sophisticated, deterministic Demo Mode with realistic multi-agent simulations and preloaded venture datasets (NovaBite Foods). You can also configure an OpenAI-compatible API key via .env anytime for live LLM completions.",
    },
    {
      q: "Can I export my generated business plan or reports to PDF?",
      a: "Yes. Every business plan, financial summary, and multi-agent SWOT analysis can be exported as a beautifully formatted, investor-grade PDF with customized headers, metrics tables, and execution checklists.",
    },
    {
      q: "Is BizMind suitable for existing businesses or only early-stage startups?",
      a: "BizMind supports both! You can start from a raw idea in the Onboarding Wizard, or bring an existing operational business to manage ongoing cash flow, track team productivity, and receive automated financial diagnosis.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo href="/" size="md" />

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#ai-agents" className="hover:text-foreground transition-colors">AI Agents</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#dashboard-preview" className="hover:text-foreground transition-colors">Dashboard</a>
            <Link href="/about" className="hover:text-foreground transition-colors">About Project</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm">
                Sign In
              </Button>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={handleExploreDemo}
              disabled={loadingDemo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20"
            >
              {loadingDemo ? "Launching..." : "Explore Demo"}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Introducing BizMind 2.0 — Multi-Agent Business Co-Pilot</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
            Turn Your Business Idea Into a{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Smarter Business.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BizMind combines AI-powered planning, financial management, team management, and decision support in one intelligent business workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/onboarding">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/25 px-8">
                <span>Start Building</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleExploreDemo}
              disabled={loadingDemo}
              className="w-full sm:w-auto font-semibold border-border hover:bg-muted/80 px-8"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              <span>Explore Live Demo Business</span>
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant demo mode ready
            </span>
            <span className="flex items-center gap-1.5 hidden sm:flex">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Multi-Agent AI architecture
            </span>
          </div>

          {/* 7 & 40. Realistic Dashboard Preview (Section 40 Requirements) */}
          <div id="dashboard-preview" className="pt-10 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border bg-card p-3 sm:p-5 shadow-2xl overflow-hidden text-left">
              {/* Top Window Bar */}
              <div className="flex items-center justify-between pb-4 border-b mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">
                    NovaBite Foods — BizMind Executive Workspace
                  </span>
                </div>
                <Badge variant="success" className="text-[11px] font-bold">
                  Business Health: 82%
                </Badge>
              </div>

              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Revenue</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">₹8,45,000</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">+18.4% vs last month</span>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Expenses</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">₹4,25,000</div>
                  <span className="text-[11px] text-amber-600 font-semibold">Packaging up 18%</span>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Net Profit</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">₹4,20,000</div>
                  <span className="text-[11px] text-emerald-600 font-semibold">49.7% Profit Margin</span>
                </div>
                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Investments</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">₹6,50,000</div>
                  <span className="text-[11px] text-muted-foreground font-semibold">Seed Angel Round</span>
                </div>
              </div>

              {/* Chart + AI Recommendation Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">Revenue vs Expenses (Monthly)</span>
                    <Badge variant="outline" className="text-[10px]">Real Database Records</Badge>
                  </div>
                  <RevenueExpenseChart />
                </div>

                <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 p-4 flex flex-col justify-between border-indigo-200/60 dark:border-indigo-900/50">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">AI Recommendation</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      &ldquo;Review operational expenses to improve your current profit margin.&rdquo;
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Operating expenses in packaging increased 18% over the past 45 days. Consolidating supplier orders will restore gross contribution margin to 52%.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-indigo-200/50 dark:border-indigo-900/50 mt-4">
                    <Button
                      size="sm"
                      onClick={handleExploreDemo}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                    >
                      Open Interactive Workspace
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Product Statement */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            The Central Breakthrough
          </p>
          <blockquote className="mt-3 text-xl sm:text-2xl font-bold text-foreground max-w-3xl mx-auto leading-snug">
            &ldquo;BizMind combines AI-powered business guidance, planning and actual business management in one unified platform.&rdquo;
          </blockquote>
          <p className="mt-2 text-sm text-muted-foreground">
            From business idea to business growth — understand, plan, execute and improve.
          </p>
        </div>
      </section>

      {/* 4 & 41. How BizMind Works / Workflow */}
      <section id="how-it-works" className="py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-xs">End-to-End Journey</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              How BizMind Accelerates Your Venture
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              A disciplined, intelligent path taking you from back-of-the-napkin concept to predictable scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step) => (
              <div key={step.num} className="rounded-2xl border bg-card p-6 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all hover:shadow-md group">
                <span className="text-3xl font-black text-indigo-600/30 group-hover:text-indigo-600 transition-colors">
                  {step.num}
                </span>
                <h3 className="text-lg font-bold text-foreground mt-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Multi-Agent AI Architecture */}
      <section id="ai-agents" className="py-20 bg-muted/20 border-y">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="ai" className="text-xs">Multi-Agent Intelligence</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Your Specialized Executive AI Board
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Five autonomous agents analyze your business independently before the AI Orchestrator harmonizes recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentCards.map((agent, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-foreground">{agent.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    {agent.score}
                  </Badge>
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {agent.role}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Comprehensive Business Management Modules */}
      <section id="features" className="py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-xs">All-in-One Operations</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              Everything Needed to Run Your Business
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Replace five fragmented subscriptions with one intelligent workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Financials & Live P&L</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log income, expenses, and investments. Watch real-time profit margins update instantly with interactive Recharts breakdowns.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Workforce Directory</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track employee roles, payroll costs, assigned tasks, and performance ratings with individualized employee profile views.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Kanban Task Manager</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prioritize deliverables across To Do, In Progress, Completed, and Blocked stages. Unblock bottlenecks with AI advice.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Phase-Driven Roadmap</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Manage 7 structured development phases with budgets, task checklists, and status transitions from validation to scale.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 w-fit">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">17-Section Business Plan</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fully editable, comprehensive startup business plans with one-click AI generation and instant investor-ready PDF export.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 w-fit">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Ask BizMind AI Advisor</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Context-aware conversational business co-pilot answering financial, hiring, and growth queries using your real database data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ */}
      <section className="py-20 bg-muted/20 border-t">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">Everything you need to know about BizMind AI.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t bg-muted/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. Final CTA Banner */}
      <section className="py-16 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-purple-900 text-white text-center">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            Ready to Build a Smarter, More Profitable Business?
          </h2>
          <p className="text-indigo-200 text-sm sm:text-base max-w-xl mx-auto">
            Experience the complete platform today. Explore the NovaBite Foods live demo business or launch your own venture in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={handleExploreDemo}
              disabled={loadingDemo}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-8 shadow-xl"
            >
              Explore Live Demo Now
            </Button>
            <Link href="/onboarding">
              <Button size="lg" variant="outline" className="border-indigo-400/50 text-white hover:bg-white/10 font-semibold px-8">
                Create New Business
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 13. Footer (Section 43) */}
      <footer className="border-t bg-card text-card-foreground py-12">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Logo size="md" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                &ldquo;Your Intelligent Business Co-Pilot&rdquo;
              </p>
              <p className="text-[11px] text-muted-foreground">
                From business idea to business growth.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">Product</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground">Executive Dashboard</Link></li>
                <li><Link href="/analysis" className="hover:text-foreground">AI Business Analysis</Link></li>
                <li><Link href="/business-plan" className="hover:text-foreground">Business Planning</Link></li>
                <li><Link href="/advisor" className="hover:text-foreground">Ask AI Advisor</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">Management</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><Link href="/finances" className="hover:text-foreground">Financials & P&L</Link></li>
                <li><Link href="/employees" className="hover:text-foreground">Team Management</Link></li>
                <li><Link href="/tasks" className="hover:text-foreground">Kanban Tasks</Link></li>
                <li><Link href="/reports" className="hover:text-foreground">PDF Reports</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground">About & Team</div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground font-semibold text-indigo-600 dark:text-indigo-400">About Project & Team</Link></li>
                <li><a href="https://mituniversity.ac.in" target="_blank" rel="noreferrer" className="hover:text-foreground">MIT School of Computing</a></li>
                <li><Link href="/login" className="hover:text-foreground">Founder Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
            <div>© 2026 BizMind. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Department of Computer Science & Engineering</span>
              <span>•</span>
              <span>MIT ADT University</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
