"use client";

import * as React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  ShieldCheck,
  BrainCircuit,
  ArrowLeft,
  Building2,
  Sparkles,
  Layers,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Aman Inamdar",
      role: "Lead Full-Stack Architect & AI Systems Engineer",
      desc: "Designed multi-agent AI orchestrator, deterministic simulation engine, and real-time financial telemetry models.",
    },
    {
      name: "Saniya Tamboli",
      role: "Product Architect & Business Intelligence Specialist",
      desc: "Architected 17-section institutional business plan generator and financial health diagnostic frameworks.",
    },
    {
      name: "Om Akolkar",
      role: "Backend & Data Systems Engineer",
      desc: "Developed relational schema architectures, transactional P&L ledger services, and authentication security.",
    },
    {
      name: "Adarsh Rai",
      role: "Frontend Engineer & UI/UX Designer",
      desc: "Engineered responsive SaaS design system, interactive Recharts telemetry, and Kanban workflow interfaces.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo href="/" size="md" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8">
                Open Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Landing Page</span>
        </Link>

        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Academic Capstone & Venture Research</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            About Project BizMind
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            &ldquo;Intelligent Business Planning & Management AI&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BizMind was conceived to solve the critical gap faced by early-stage entrepreneurs and SME owners: bridging high-level strategic ideation with rigorous daily operational execution through autonomous multi-agent intelligence.
          </p>
        </div>

        {/* Institutional Accreditation Card */}
        <Card className="border shadow-sm border-indigo-200/60 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Building2 className="h-4 w-4" />
                <span>Department of Computer Science & Engineering</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                MIT School of Computing
              </h2>
              <p className="text-sm font-semibold text-muted-foreground">
                MIT Art, Design and Technology University, Pune, Maharashtra
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-1 text-left min-w-[240px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Faculty Guide & Mentor
              </span>
              <div className="text-base font-extrabold text-foreground">
                Dr. Nandkishor Karlekar
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Department of Computer Science & Engineering
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Team Section */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Core Engineering & Research Team
            </h2>
            <p className="text-xs text-muted-foreground">
              Undergraduate Computer Science & Engineering Cohort
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member, idx) => (
              <Card key={idx} className="border shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition-all p-5 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm shadow-xs">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{member.name}</h3>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {member.role}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {member.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Vision & Architectural Tenets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Card className="border shadow-xs p-5 space-y-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 w-fit">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Multi-Agent Autonomy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Specialized domain agents (Market, Finance, Strategy, Risk, Operations) operate concurrently with an executive orchestrator.
            </p>
          </Card>

          <Card className="border shadow-xs p-5 space-y-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Deterministic & Live LLM</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Resilient zero-failure service architecture: operates smoothly offline in deterministic demo mode or connects live with OpenAI APIs.
            </p>
          </Card>

          <Card className="border shadow-xs p-5 space-y-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Operational Grounding</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI advice is computed directly against real transactions, tasks, employee costs, and health progress rather than generic prompts.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-8 text-center text-xs text-muted-foreground">
        <div>BizMind • MIT School of Computing • MIT Art, Design and Technology University, Pune</div>
        <div className="mt-1">© 2026 BizMind. All rights reserved.</div>
      </footer>
    </div>
  );
}
