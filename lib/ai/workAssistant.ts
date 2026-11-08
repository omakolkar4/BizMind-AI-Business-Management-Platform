import prisma from "@/lib/db/prisma";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "./client";

export interface WorkAssistantRequest {
  userId: string;
  question: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface WorkAssistantResponse {
  reply: string;
  suggestedFollowUps?: string[];
  refusedConfidentialQuery?: boolean;
}

// Patterns that attempt to query private financial data, owner-only analytics, or salaries
const CONFIDENTIAL_PATTERNS = [
  /\b(revenue|sales\s+figure|turnover)\b/i,
  /\b(profit|net\s+profit|gross\s+profit|ebitda|margin)\b/i,
  /\b(expense|spend|cash\s+flow|runway|burn\s+rate|budget\s+overall)\b/i,
  /\b(investment|investor|valuation|equity|cap\s+table)\b/i,
  /\b(salary|salaries|compensation|payroll|paycheck|remuneration)\b/i,
  /\b(health\s+score|feasibility\s+score|business\s+health)\b/i,
  /\b(password|credential|secret\s+key|token)\b/i,
];

export async function askWorkAssistant({
  userId,
  question,
  conversationHistory = [],
}: WorkAssistantRequest): Promise<WorkAssistantResponse> {
  // 1. Fetch authenticated user and verify employee profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          business: true,
          tasks: {
            orderBy: { dueDate: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              category: true,
              dueDate: true,
              blockerReason: true,
              managerFeedback: true,
              successMetric: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return {
      reply: "Authentication error: Unable to identify user account. Please log in again.",
    };
  }

  // 2. Strict Confidential Information Guardrail
  const isConfidentialQuery = CONFIDENTIAL_PATTERNS.some((pattern) => pattern.test(question));
  if (isConfidentialQuery) {
    return {
      reply:
        "I am the **BizMind Work Assistant**, designed exclusively to assist you with your assigned operational tasks, company work procedures, attendance policies, and team collaboration. \n\n" +
        "I do **not** have access to company financial figures (revenue, profits, expenses, investments), owner executive analysis, or confidential HR/salary records. For financial or compensation inquiries, please contact your manager directly.",
      refusedConfidentialQuery: true,
      suggestedFollowUps: [
        "What are my assigned tasks?",
        "How do I submit my work for review?",
        "What is our approved attendance policy?",
      ],
    };
  }

  // 3. Assemble Permitted Employee Context
  const employee = user.employee;
  const companyName = employee?.business?.name || "BizMind Enterprise";
  const businessType = employee?.business?.type || "General Business";
  const employeeName = employee?.name || user.name || "Team Member";
  const employeeRole = employee?.role || "Staff";
  const employeeDept = employee?.department || "Operations";

  const assignedTasks = employee?.tasks || [];
  const todoTasks = assignedTasks.filter((t) => t.status === "To Do");
  const inProgressTasks = assignedTasks.filter((t) => t.status === "In Progress");
  const inReviewTasks = assignedTasks.filter((t) => t.status === "In Review");
  const blockedTasks = assignedTasks.filter((t) => t.status === "Blocked");
  const completedTasks = assignedTasks.filter((t) => t.status === "Completed");

  const taskSummary = assignedTasks.map((t, idx) => 
    `${idx + 1}. [${t.status.toUpperCase()}] "${t.title}" (Priority: ${t.priority}, Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "None"})${t.blockerReason ? ` - BLOCKER: ${t.blockerReason}` : ""}${t.managerFeedback ? ` - MANAGER FEEDBACK: ${t.managerFeedback}` : ""}`
  ).join("\n");

  const companyPolicies = `
- Company Name: ${companyName} (${businessType})
- Standard Office Hours: 09:30 AM to 06:30 PM (Monday through Saturday)
- Late Arrival Grace Period: 30 minutes (arrival after 10:00 AM is logged as Late Arrival)
- Office Attendance Procedure: Open "Attendance" module and select "Scan QR Code" using the daily QR code displayed at the office reception or by the authorized manager.
- Remote / Field Work Policy: For work-from-home or on-site client visits, submit a "Remote Work / Field Work Request" in the Attendance module prior to shift start. Check-in is unlocked once your manager reviews and approves the request.
- Attendance Correction Policy: If a punch was missed due to technical or emergency reasons, submit an "Attendance Correction Request" with justification.
- Task Lifecycle: To Do → In Progress → In Review → Completed.
- Starting Work: Select "Start Work (In Progress)" on your assigned task when commencing work.
- Submitting Work: Once deliverable is ready, click "Submit Deliverable for Review" and attach summary notes.
- Reporting Blockers: If dependencies, technical issues, or missing assets prevent progress, select "Report Blocker" immediately with details so management can intervene.
`;

  // 4. If OpenAI client is available and active
  const openai = getOpenAIClient();
  if (!isDemoMode() && openai) {
    try {
      const systemPrompt = `You are BizMind Work Assistant — a helpful, encouraging, and authoritative AI work assistant for employees at ${companyName}.
Your user is ${employeeName}, currently working as ${employeeRole} in ${employeeDept}.

AUTHORIZED CONTEXT:
${companyPolicies}

CURRENT TASKS ASSIGNED TO ${employeeName.toUpperCase()}:
Total Assigned: ${assignedTasks.length}
${taskSummary || "No active tasks currently assigned."}

STRICT GUARDRAILS & PERMISSIONS:
1. Only answer questions related to:
   - The employee's own assigned tasks, requirements, priorities, and deadlines.
   - Work execution procedures (starting tasks, submitting deliverables, reporting blockers).
   - Approved attendance, QR check-in/out, and remote-work request policies.
   - General professional guidelines and formatting deliverables.
2. NEVER disclose or speculate about:
   - Company revenue, expenses, profit/loss, cash runway, investments, or executive forecasts.
   - Owner-only AI analysis, feasibility scores, business health ratings, or investor decks.
   - Salaries, compensation, performance ratings of peers, passwords, credentials, or other employees' tasks.
3. If the user asks about something outside your scope or not in the context, explicitly say you do not have that information and guide them to their manager.
4. Keep answers concise, highly practical, formatted in clean Markdown with bullet points where appropriate.`;

      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-6),
        { role: "user", content: question },
      ];

      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 500,
      });

      const reply = completion.choices[0]?.message?.content || "I am currently unable to process your request. Please try again shortly.";

      return {
        reply,
        suggestedFollowUps: [
          "What are my highest priority tasks?",
          "How do I submit my deliverable for manager review?",
          "How do I request a remote work check-in?",
        ],
      };
    } catch (error) {
      console.warn("OpenAI API call failed in WorkAssistant, falling back to deterministic response:", error);
    }
  }

  // 5. Deterministic / Grounded Response Mode (Zero hallucinations, accurate live facts)
  const q = question.toLowerCase();

  if (q.includes("my assigned task") || q.includes("what are my task") || q.includes("my task") || q.includes("list my task")) {
    if (assignedTasks.length === 0) {
      return {
        reply: `You currently have **no tasks assigned** under your employee account at **${companyName}**. Your manager will assign tasks as milestones are scheduled in the project roadmap.`,
        suggestedFollowUps: [
          "How do I submit work for review?",
          "What is our approved attendance policy?",
        ],
      };
    }

    const lines = [
      `### Your Assigned Deliverables (${assignedTasks.length} Total)\n`,
      `**Active Tasks (${inProgressTasks.length + todoTasks.length}):**`,
      ...[...inProgressTasks, ...todoTasks].map((t) => 
        `- **${t.title}** (${t.status}) • Priority: *${t.priority}* • Due: *${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No deadline"}*`
      ),
      "",
      inReviewTasks.length > 0 ? `**Under Manager Review (${inReviewTasks.length}):**\n` + inReviewTasks.map((t) => `- **${t.title}** (Submitted for approval)`).join("\n") : "",
      blockedTasks.length > 0 ? `\n**Blocked Tasks (${blockedTasks.length}):**\n` + blockedTasks.map((t) => `- **${t.title}** (Blocker: ${t.blockerReason || "Awaiting resolution"})`).join("\n") : "",
    ].filter(Boolean).join("\n");

    return {
      reply: lines,
      suggestedFollowUps: [
        "Explain my task requirements",
        "How do I submit my work for review?",
        "How do I report a blocker?",
      ],
    };
  }

  if (q.includes("submit") || q.includes("deliverable") || q.includes("review")) {
    return {
      reply: `### How to Submit Your Deliverable for Review\n\n` +
        `1. Open the **[My Tasks](/tasks)** page.\n` +
        `2. Click on the task you have been working on to open its detail modal.\n` +
        `3. Click the **Submit Deliverable for Review** button.\n` +
        `4. In the text area, write a concise summary of the work completed, results, or links to shared documents.\n` +
        `5. Click **Submit to Manager**.\n\n` +
        `Your task status will change to **In Review**. Your manager will be notified to review and approve your work or provide feedback if revisions are needed.`,
      suggestedFollowUps: [
        "What are my assigned tasks?",
        "How do I report a blocker?",
      ],
    };
  }

  if (q.includes("blocker") || q.includes("blocked") || q.includes("help") || q.includes("stuck")) {
    return {
      reply: `### How to Report an Operational Blocker\n\n` +
        `If you are unable to proceed due to missing requirements, dependency on another team member, or technical obstacles:\n\n` +
        `1. Go to **[My Tasks](/tasks)** and click on the affected task.\n` +
        `2. Click the **Report Blocker** button (in red).\n` +
        `3. Clearly describe what is blocking your progress (e.g., missing API credentials, waiting on design assets).\n` +
        `4. Submit the blocker.\n\n` +
        `The task status will automatically transition to **Blocked** and appear in your manager's Blocker Monitor for immediate resolution.`,
      suggestedFollowUps: [
        "What are my assigned tasks?",
        "How do I submit my work for review?",
      ],
    };
  }

  if (q.includes("attendance") || q.includes("check in") || q.includes("check-in") || q.includes("qr") || q.includes("hours") || q.includes("punch")) {
    return {
      reply: `### Approved Attendance Policy & Procedures\n\n` +
        `**Work Schedule:**\n` +
        `- Office hours: **09:30 AM to 06:30 PM**.\n` +
        `- Grace period: **30 minutes** (Check-ins after 10:00 AM are flagged as Late Arrival).\n\n` +
        `**Office Check-In:**\n` +
        `1. Go to the **[Attendance](/attendance)** module.\n` +
        `2. Click **Scan QR Code** and scan the live QR code displayed on the office reception screen.\n` +
        `3. Your arrival timestamp and status will be recorded immediately.\n\n` +
        `**Remote / Field Work Check-In:**\n` +
        `- If working remotely or visiting clients, submit a **Remote Work / Field Work Request** before shift start.\n` +
        `- Once approved by your manager, click **Check In (Approved Remote)**.\n\n` +
        `**End of Shift:**\n` +
        `- Always click **Check Out Now** before leaving so your total work hours are accurately tracked.`,
      suggestedFollowUps: [
        "How do I request remote work?",
        "What are my assigned tasks?",
      ],
    };
  }

  if (q.includes("remote") || q.includes("work from home") || q.includes("wfh") || q.includes("field")) {
    return {
      reply: `### Remote & Field Work Exception Procedure\n\n` +
        `1. Navigate to **[Attendance](/attendance)**.\n` +
        `2. In the actions panel, click **Request Remote / Field Work**.\n` +
        `3. Select the date, choose whether it is **Remote / WFH** or **Field Work (Client Visit)**, and provide a brief reason.\n` +
        `4. Submit your request for management review.\n` +
        `5. Once approved by your manager, your attendance card will unlock the approved remote check-in option.`,
      suggestedFollowUps: [
        "What is our approved attendance policy?",
        "What are my assigned tasks?",
      ],
    };
  }

  if (q.includes("requirement") || q.includes("explain my task") || q.includes("details")) {
    if (assignedTasks.length === 0) {
      return {
        reply: `You do not have any active tasks assigned right now. When tasks are assigned, you can ask me to explain requirements for any specific deliverable.`,
      };
    }
    const current = inProgressTasks[0] || todoTasks[0] || assignedTasks[0];
    return {
      reply: `### Active Deliverable: "${current.title}"\n\n` +
        `- **Category:** ${current.category}\n` +
        `- **Priority:** ${current.priority}\n` +
        `- **Status:** ${current.status}\n` +
        `- **Target Deadline:** ${current.dueDate ? new Date(current.dueDate).toLocaleDateString() : "Flexible"}\n` +
        `${current.successMetric ? `- **Success Metric:** ${current.successMetric}\n` : ""}` +
        `\n**Description / Acceptance Criteria:**\n` +
        `${current.description || "No detailed acceptance criteria provided yet. Check with your manager for extra guidance."}\n\n` +
        `${current.managerFeedback ? `**Latest Manager Feedback:**\n> ${current.managerFeedback}\n\n` : ""}` +
        `When ready, start work or submit your deliverable through **[My Tasks](/tasks)**.`,
      suggestedFollowUps: [
        "How do I submit my work for review?",
        "How do I report a blocker?",
      ],
    };
  }

  // Default grounded response
  return {
    reply: `Hello **${employeeName}**! I am your **BizMind Work Assistant** at **${companyName}**.\n\n` +
      `I can help you with:\n` +
      `- Checking your assigned tasks, deadlines, and requirements.\n` +
      `- Explaining how to submit deliverables or report blockers.\n` +
      `- Company attendance hours, QR scanning, and remote-work approval procedures.\n\n` +
      `Feel free to click any of the starter prompts below or ask a question about your work.`,
    suggestedFollowUps: [
      "What are my assigned tasks?",
      "How do I submit my work for review?",
      "How do I report a blocker?",
      "What is our approved attendance policy?",
      "Explain my task requirements",
    ],
  };
}
