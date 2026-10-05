# BizMind — Intelligent Business Planning & Management AI

> **"Your Intelligent Business Co-Pilot"**  
> *From business idea to business growth — BizMind helps you understand, plan, execute, and improve.*

[![Next.js](https://img.shields.io/badge/Next.js-15.1.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.1.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 🚀 Product Vision

**BizMind** is a complete, production-grade AI SaaS web application designed for startup founders, entrepreneurs, and small business owners. Rather than treating business ideation and daily management as disconnected silos, BizMind combines:

1. **Autonomous Multi-Agent AI Business Analysis** (Market, Finance, Strategy, Risk, Operations, and Orchestrator)
2. **Institutional 17-Section Business Plan Generation** with interactive editing and PDF export
3. **Strategic 7-Phase Execution Roadmap** with milestones and budget tracking
4. **Real-time Financial Management & Live P&L** with interactive Recharts visualizations
5. **Employee Directory & Workforce Management** with salary audits and individual task profiles
6. **Kanban & List Task Manager** with live priority matrix and bottleneck alerts
7. **Context-Aware AI Business Advisor ("Ask BizMind")** grounded directly on live business data
8. **Autonomous Business Health Score (0–100)** with dimensional breakdowns and proactive recommendations
9. **Executive PDF Reports** for investors, bankers, and incubators

---

## 🛠️ Technology Stack

- **Frontend Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide React, Framer Motion, sonner
- **Data Visualization**: Recharts (Revenue vs Expenses, Expense Distribution Donut)
- **Database & ORM**: SQLite (zero-config local dev & demo) / PostgreSQL compatible, Prisma 6 ORM
- **Authentication**: Secure bcrypt-hashed password authentication with session cookies & 1-click Demo mode
- **AI Architecture**: Multi-Agent abstraction supporting both OpenAI-compatible LLMs and realistic deterministic demo mode (`AI_MODE=demo`)
- **Document Export**: Client-side vector PDF compilation via `jspdf` and `jspdf-autotable`

---

## 🧠 Multi-Agent AI Architecture

BizMind's intelligence layer (`/lib/ai/`) deploys 5 specialized autonomous agents coordinated by an **AI Orchestrator**:

- **Market Agent** (`marketAgent.ts`): Analyzes TAM, SAM, SOM, demographic adoption, customer acquisition cost (CAC), and competitive density.
- **Finance Agent** (`financeAgent.ts`): Models gross margins, monthly burn rate, cash buffer safety, runway horizons, and breakeven timelines.
- **Strategy Agent** (`strategyAgent.ts`): Formulates initial distribution wedges, pricing power, customer retention flywheels, and defensive moats.
- **Risk Agent** (`riskAgent.ts`): Identifies supply-chain disruptions, vendor concentration, regulatory licenses (FSSAI, GST), and churn vulnerabilities.
- **Operations Agent** (`operationsAgent.ts`): Evaluates fulfillment batching, kitchen/facility capacity, equipment maintenance, and dispatch SLAs.
- **AI Orchestrator** (`orchestrator.ts`): Harmonizes all agent findings into an overall Business Health Score and executive action items.

---

## 📦 Project Structure

```
bizmind/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── onboarding/page.tsx       # 9-Step Onboarding Wizard
│   ├── dashboard/page.tsx        # Executive SaaS Dashboard & Real-Time KPIs
│   ├── analysis/page.tsx         # Multi-Agent SWOT & Business Analysis
│   ├── business-plan/page.tsx    # 17-Section Editable Plan + PDF Export
│   ├── roadmap/page.tsx          # 7-Phase Execution Timeline & Milestones
│   ├── finances/page.tsx         # Ledger, P&L Statement, Charts & Modals
│   ├── employees/                # Team Directory & Profile Pages
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── tasks/page.tsx            # Kanban Board & List Pipeline
│   ├── advisor/page.tsx          # "Ask BizMind" Context-Aware AI Chat
│   ├── reports/page.tsx          # Executive Reports & Certified PDF Export
│   ├── settings/page.tsx         # Business, AI, Profile & Appearance Settings
│   ├── about/page.tsx            # Academic Capstone & Project Team
│   ├── api/                      # REST API Endpoints with Prisma CRUD
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── investments/
│   │   ├── employees/
│   │   ├── tasks/
│   │   ├── roadmap/
│   │   ├── analysis/
│   │   ├── business-plan/
│   │   ├── ai/advisor/
│   │   ├── business/
│   │   └── reports/
│   ├── globals.css               # Design System Tokens & Dark Mode
│   ├── layout.tsx                # Root Layout with Font & ThemeProvider
│   └── page.tsx                  # Public Landing Page & Live Demo Preview
├── components/
│   ├── ui/                       # Buttons, Cards, Inputs, Dialogs, Badges
│   ├── layout/                   # Sidebar, Topbar, CommandMenu (Ctrl+K), NotificationCenter
│   ├── dashboard/                # BusinessHealthScore, AIRecommendations
│   └── charts/                   # RevenueExpenseChart, ExpensePieChart
├── lib/
│   ├── ai/                       # Multi-Agent Engine & Orchestrator
│   ├── db/                       # Prisma Client & Realistic Demo Seeder
│   ├── auth/                     # Session Management & Password Hashing
│   ├── exportPdf.ts              # jsPDF Document Generation Utility
│   └── utils.ts                  # Number & Currency Formatting (₹ INR / $ USD)
└── prisma/
    └── schema.prisma             # Relational Database Schema
```

---

## ⚡ Quick Start

### 1. Prerequisites

- Node.js 18.17+ or 20+ installed
- npm or yarn or pnpm

### 2. Installation

Clone or open the repository directory:

```bash
cd BizMind
npm install
```

### 3. Database Initialization

Generate the Prisma Client and initialize the local SQLite database:

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌟 Demo Credentials & One-Click Exploration

BizMind comes pre-configured with a realistic, comprehensive food-tech enterprise called **"NovaBite Foods"** (Pune, Maharashtra):

- **Demo User Email**: `demo@bizmind.ai`
- **Demo User Password**: `Demo@123`
- Or simply click **"Explore Demo"** or **"Instant 1-Click Demo Login"** on the landing/login pages to immediately access the full platform!

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Database configuration
DATABASE_URL="file:./dev.db"

# Authentication secret
AUTH_SECRET="bizmind_super_secure_jwt_secret_key_2026_growth_mindset"
NEXTAUTH_URL="http://localhost:3000"

# AI Configuration
# When AI_MODE=demo, the platform operates in 100% deterministic demo mode with zero external dependencies.
# When AI_MODE=live, provide an OpenAI-compatible API key.
OPENAI_API_KEY=""
AI_MODEL="gpt-4o-mini"
AI_MODE="demo"
```

---

## 🎓 Academic Capstone & Project Team

**Project**: BIZMIND — Intelligent Business Planning & Management AI  
**Institution**: MIT School of Computing, Department of Computer Science & Engineering  
**University**: MIT Art, Design and Technology University, Pune, Maharashtra  

**Project Team**:
- **Aman Inamdar** — Lead Full-Stack Architect & AI Systems Engineer
- **Saniya Tamboli** — Product Architect & Business Intelligence Specialist
- **Om Akolkar** — Backend & Data Systems Engineer
- **Adarsh Rai** — Frontend Engineer & UI/UX Designer

**Faculty Guide**:
- **Dr. Nandkishor Karlekar** — Department of Computer Science & Engineering

---

## 📄 License

© 2026 BizMind. All rights reserved. Built for venture scalability and academic excellence.
