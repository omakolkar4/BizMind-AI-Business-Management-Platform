import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const DEMO_USER_EMAIL = "demo@bizmind.ai";
export const DEMO_USER_PASSWORD = "Demo@123";

export async function ensureDemoData() {
  try {
    // Check if demo user already exists
    let demoUser = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      include: { businesses: true },
    });

    const hashedPassword = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          name: "Demo Founder",
          email: DEMO_USER_EMAIL,
          password: hashedPassword,
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        },
        include: { businesses: true },
      });
    }

    // Check if NovaBite Foods business exists
    let business = await prisma.business.findFirst({
      where: {
        userId: demoUser.id,
        name: "NovaBite Foods",
      },
    });

    if (!business) {
      business = await prisma.business.create({
        data: {
          userId: demoUser.id,
          name: "NovaBite Foods",
          idea: "A healthy, farm-to-table corporate meal and cloud kitchen platform delivering nutritious, chef-crafted daily meals to professionals and health-conscious consumers in urban hubs.",
          type: "Food & Beverage",
          location: "Pune, Maharashtra",
          budget: 1500000,
          stage: "Growing",
          goals: JSON.stringify([
            "Revenue growth",
            "Market expansion",
            "Customer acquisition",
            "Profitability",
          ]),
          resources: "Cloud kitchen facility, direct farmer supply partnerships, proprietary meal customization web app, 6 core team members",
          currency: "₹",
          isDemo: true,
        },
      });
    }

    // Seed or check Context
    const existingContext = await prisma.businessContext.findUnique({
      where: { businessId: business.id },
    });
    if (!existingContext) {
      await prisma.businessContext.create({
        data: {
          businessId: business.id,
          targetCustomer: "IT and tech professionals in Hinjewadi, Magarpatta and Kalyani Nagar, health-conscious urban households",
          pricingModel: "Subscription meal boxes (₹180-₹240/meal) and on-demand cloud kitchen orders",
          uniqueAdvantage: "Direct sourcing from local organic farmers, zero refined sugars/oils, smart macro-nutrient tracking on each meal box",
          channels: "Direct corporate cafeterias, iOS/Android mobile app, Swiggy/Zomato gourmet selection",
          competitorNotes: "Faasos/Rebel Foods (scale but high oil/sodium), local dabba services (cheap but low hygiene & no nutrition tracking)",
        },
      });
    }

    // Seed or check Analysis
    const existingAnalysis = await prisma.businessAnalysis.findUnique({
      where: { businessId: business.id },
    });
    if (!existingAnalysis) {
      await prisma.businessAnalysis.create({
        data: {
          businessId: business.id,
          overallScore: 82,
          summary: "NovaBite Foods addresses the accelerating post-pandemic shift toward clean, functional nutrition among India's salaried urban workforce. With strong unit economics in central Pune and high repeat orders from tech park clusters, the company shows significant profitability potential, tempered by rising fresh produce procurement costs.",
          marketOpportunity: "India's healthy food delivery segment is growing at 28% CAGR. Pune represents an ideal proving ground with over 600,000 tech professionals seeking daily convenient, healthy food options.",
          feasibility: "Highly feasible. Existing cloud kitchen setup has 42% surplus capacity for scaling corporate meal subscriptions without immediate heavy capex.",
          targetAudience: "Ages 23-44, annual income ₹8L-₹25L, fitness enthusiasts, IT corridor employees working hybrid or in-office shifts.",
          marketTrends: "High adoption of macro-balanced diet plans, low GI ingredients (millet, quinoa), eco-conscious compostable packaging.",
          competitorNotes: "Competitors are either low-cost traditional unhygienic caterers or hyper-expensive boutique wellness cafes. NovaBite's sweet spot is daily accessible wellness.",
          strengths: JSON.stringify([
            "Direct farm sourcing cuts distributor markup by 14%",
            "High customer retention rate (64% 30-day repeat rate)",
            "Nutritionally certified menus curated by clinical dieticians",
            "Automated portioning minimizing kitchen food waste to under 3%",
          ]),
          weaknesses: JSON.stringify([
            "Single kitchen dependency creates localized delivery boundary limit",
            "Cold chain delivery logistics vulnerable to seasonal monsoon traffic",
            "Lower gross margins during unseasonal vegetable price spikes",
          ]),
          opportunities: JSON.stringify([
            "Corporate meal wellness sponsorship contracts with tech MNCs",
            "Launch shelf-stable healthy snack lines (millet crisps, seed mixes)",
            "Expanding secondary micro-hub in Kharadi/Viman Nagar tech corridor",
          ]),
          threats: JSON.stringify([
            "Aggregator commission hikes (25-30% on food delivery apps)",
            "Volatile raw ingredient inflation, especially cold-pressed oils & dairy",
            "Low barrier to entry for imitation health cloud kitchens",
          ]),
          riskAssessment: "Moderate risk. Primary vulnerability lies in raw material cost fluctuation and delivery SLA adherence during peak Pune traffic hours. Recommended mitigation: forward-purchasing grains and securing contracted courier partners.",
          revenueOpportunities: "B2B office floor pantry contracts, premium weekend family meal packages, detox subscription bundles.",
          costConsiderations: "Packaging currently accounts for 9.2% of COGS. Switching to bulk molded pulp trays will save ₹4.80 per container at 20,000 units/mo.",
          recommendedActions: JSON.stringify([
            "Lock in 6-month farmer forward contracts on staple lentils and millets",
            "Initiate direct sales pilot with 3 IT parks in Hinjewadi Phase 1",
            "Audit delivery fleet routing to decrease average transit time to under 28 mins",
            "Implement automated feedback loops via QR codes on packaging lids",
          ]),
          agentLogs: JSON.stringify([
            { agent: "Market Agent", status: "completed", message: "Market size analyzed: ₹1,200 Cr TAM in Tier-1/2 Indian hubs." },
            { agent: "Finance Agent", status: "completed", message: "Unit economics verified: Contribution margin at 44.2%." },
            { agent: "Strategy Agent", status: "completed", message: "Positioning finalized: 'Everyday Accessible Functional Nutrition'." },
            { agent: "Risk Agent", status: "completed", message: "Supply chain risks mapped: Monsoonal inflation buffer required." },
            { agent: "Operations Agent", status: "completed", message: "Capacity calculated: 1,400 meals/day maximum throughput." },
          ]),
        },
      });
    }

    // Seed or check Business Plan
    const existingPlan = await prisma.businessPlan.findUnique({
      where: { businessId: business.id },
    });
    if (!existingPlan) {
      await prisma.businessPlan.create({
        data: {
          businessId: business.id,
          executiveSummary: "NovaBite Foods is an intelligent cloud-kitchen enterprise founded in Pune, Maharashtra, dedicated to solving the daily nutritional crisis faced by modern urban professionals. By marrying culinary excellence with clinical dietary science and direct-from-farm procurement, NovaBite offers predictable, affordable, and delicious health meals delivered fresh twice daily.",
          businessOverview: "Registered as a Private Limited entity with cloud facilities in Baner, Pune. NovaBite operates a hybrid model: direct-to-consumer digital subscriptions and institutional corporate pantry supply agreements.",
          problem: "Over 78% of urban professionals consume calorie-heavy, high-sodium restaurant meals or unhygienic street food during working hours due to a lack of convenient, affordable, and genuinely healthy meal options.",
          solution: "A curated daily subscription platform where users select calorie/macro profiles (High Protein, Keto, Diabetic-friendly, Balanced Indian) prepared fresh in certified hygienic kitchens using pesticide-free local produce.",
          targetMarket: "Corporate employees, startup founders, fitness trainers, and dual-income urban families across Pune's western and eastern IT corridors.",
          customerPersona: "Kavita, 29, Lead Software Engineer at a Hinjewadi MNC. Works 10 hours daily, goes to the gym 4 times weekly, values health but has zero time for cooking. Willing to spend ₹5,000-₹7,000/month for stress-free, healthy weekday meals.",
          marketAnalysis: "The Indian health food and meal delivery market is valued at $2.6B and projected to reach $8.1B by 2030, driven by lifestyle disease awareness and corporate wellness programs.",
          competitorAnalysis: "Traditional dabba services lack consistency and hygiene standards. Mass food aggregators offer unvetted dishes with variable quality. NovaBite's single-brand consistency and verified nutrition labels provide an unassailable trust moat.",
          valueProposition: "Chef-prepared, dietician-approved gourmet meals delivered hot before 1:00 PM, guaranteed zero refined sugar, hydrogenated oils, or artificial preservatives.",
          businessModel: "Direct recurring subscription plans (Weekly ₹1,100, Monthly ₹4,400), B2B bulk catering invoices, and high-margin guilt-free packaged beverages and snacks.",
          marketingStrategy: "Corporate sampling desks in high-density tech parks, fitness influencer partnerships, referral bonuses offering free healthy bowls, and hyper-targeted digital campaigns.",
          operationsStrategy: "Central production unit in Baner with hub-and-spoke delivery clusters. Temperature-controlled insulated hot boxes ensuring food arrives at optimal temperature.",
          technologyStrategy: "Custom Next.js web application with progressive web app (PWA) capabilities, integrated payment gateways (UPI, Credit/Debit, Corporate cards), and automated kitchen display system.",
          financialOverview: "Initial 18-month target: Achieve ₹18L monthly recurring revenue with 24% EBITDA margin. Breakeven attained at month 7 of current unit operation.",
          riskAnalysis: "Operational disruptions handled through dual power generators, cold-storage buffer stock, and backup logistics partners across Pune.",
          growthStrategy: "Scale Pune operations to 3 regional fulfillment hubs, followed by expansion into Navi Mumbai and Bengaluru tech hubs in Year 2.",
          implementationRoadmap: "Q1: Corporate pilot in Hinjewadi. Q2: Launch mobile subscription portal. Q3: Breakeven on second kitchen hub. Q4: B2B catering accreditation.",
          isDraft: false,
          status: "ACCEPTED",
          version: 1,
          acceptedAt: new Date("2026-04-15"),
          acceptedBy: "Demo Founder",
          decision: "ACCEPT",
          decisionTimestamp: new Date("2026-04-15"),
        },
      });

      // Seed initial BusinessPlanVersion snapshot
      await prisma.businessPlanVersion.create({
        data: {
          planId: (await prisma.businessPlan.findUnique({ where: { businessId: business.id } }))!.id,
          businessId: business.id,
          version: 1,
          status: "ACCEPTED",
          decision: "ACCEPT",
          decisionTimestamp: new Date("2026-04-15"),
          acceptedBy: "Demo Founder",
          executiveSummary: "NovaBite Foods is an intelligent cloud-kitchen enterprise founded in Pune, Maharashtra, dedicated to solving the daily nutritional crisis faced by modern urban professionals.",
          businessOverview: "Registered as a Private Limited entity with cloud facilities in Baner, Pune.",
          problem: "Over 78% of urban professionals consume calorie-heavy, high-sodium restaurant meals or unhygienic street food during working hours.",
          solution: "A curated daily subscription platform where users select calorie/macro profiles prepared fresh in certified hygienic kitchens.",
          targetMarket: "Corporate employees, startup founders, fitness trainers across Pune IT corridors.",
          customerPersona: "Kavita, 29, Lead Software Engineer at Hinjewadi MNC.",
          marketAnalysis: "The Indian health food and meal delivery market is valued at $2.6B and projected to reach $8.1B by 2030.",
          competitorAnalysis: "Traditional dabba services lack consistency and hygiene standards. NovaBite provides verified nutrition labels.",
          valueProposition: "Chef-prepared, dietician-approved gourmet meals delivered hot before 1:00 PM.",
          businessModel: "Direct recurring subscription plans and B2B bulk catering invoices.",
          marketingStrategy: "Corporate sampling desks in high-density tech parks and fitness influencer partnerships.",
          operationsStrategy: "Central production unit in Baner with hub-and-spoke delivery clusters.",
          technologyStrategy: "Custom Next.js web application with progressive web app capabilities.",
          financialOverview: "Initial 18-month target: Achieve ₹18L monthly recurring revenue with 24% EBITDA margin.",
          riskAnalysis: "Operational disruptions handled through dual power generators and cold-storage buffer stock.",
          growthStrategy: "Scale Pune operations to 3 regional fulfillment hubs.",
          implementationRoadmap: "Q1: Corporate pilot in Hinjewadi. Q2: Launch mobile subscription portal.",
        },
      }).catch(() => null);

      await prisma.business.update({
        where: { id: business.id },
        data: {
          planApproved: true,
          planStatus: "ACCEPTED",
        },
      });
    }

    // Seed or check Transactions
    const txCount = await prisma.transaction.count({
      where: { businessId: business.id },
    });
    if (txCount === 0) {
      const sampleTransactions = [
        { type: "INCOME", category: "Corporate Subscriptions", amount: 345000, description: "Monthly catering retainer - Infosys Pune Phase 2", date: new Date("2026-09-02") },
        { type: "INCOME", category: "Retail Orders", amount: 185000, description: "Direct consumer app deliveries - Week 1 to 3", date: new Date("2026-09-10") },
        { type: "INCOME", category: "Event Catering", amount: 140000, description: "Tech Summit Pune lunch hospitality contract", date: new Date("2026-09-18") },
        { type: "INCOME", category: "Corporate Subscriptions", amount: 125000, description: "TCS Sahyadri Park trial meal program", date: new Date("2026-09-24") },
        { type: "INCOME", category: "Direct Sales", amount: 50000, description: "Weekend wellness box retail popups", date: new Date("2026-09-28") },
        { type: "EXPENSE", category: "Raw Materials", amount: 145000, description: "Organic vegetables, millets & cold-pressed oil sourcing", date: new Date("2026-09-04") },
        { type: "EXPENSE", category: "Kitchen Lease", amount: 75000, description: "Commercial kitchen rent - Baner Main Road", date: new Date("2026-09-05") },
        { type: "EXPENSE", category: "Salaries", amount: 110000, description: "Kitchen staff, chef & packaging personnel payroll", date: new Date("2026-09-07") },
        { type: "EXPENSE", category: "Marketing", amount: 42000, description: "Meta ads, LinkedIn B2B campaigns & campus leaflets", date: new Date("2026-09-14") },
        { type: "EXPENSE", category: "Packaging & Logistics", amount: 38000, description: "Biodegradable sugarcane pulp meal trays & delivery bags", date: new Date("2026-09-20") },
        { type: "EXPENSE", category: "Software & Utilities", amount: 15000, description: "POS system, cloud server hosting, water & electricity", date: new Date("2026-09-25") },
      ];

      for (const tx of sampleTransactions) {
        await prisma.transaction.create({
          data: {
            businessId: business.id,
            type: tx.type,
            category: tx.category,
            amount: tx.amount,
            description: tx.description,
            date: tx.date,
          },
        });
      }
    }

    // Seed or check Investments
    const invCount = await prisma.investment.count({
      where: { businessId: business.id },
    });
    if (invCount === 0) {
      await prisma.investment.createMany({
        data: [
          {
            businessId: business.id,
            investor: "Western Maharashtra Angel Network",
            amount: 400000,
            equityPercentage: 5.5,
            type: "Angel",
            notes: "Seed round tranche 1 for kitchen equipment automation and FSSAI certification.",
            date: new Date("2026-05-15"),
          },
          {
            businessId: business.id,
            investor: "Founders' Bootstrapping Capital",
            amount: 250000,
            equityPercentage: 94.5,
            type: "Founders",
            notes: "Initial working capital for Baner kitchen setup, inventory and lease security deposit.",
            date: new Date("2026-01-10"),
          },
        ],
      });
    }

    // Seed or check Employees
    const empCount = await prisma.employee.count({
      where: { businessId: business.id },
    });
    if (empCount === 0) {
      const sampleEmployees = [
        {
          name: "Rohit Verma",
          email: "rohit.verma@novabite.in",
          phone: "+91 98231 44521",
          role: "Head of Culinary Operations",
          department: "Culinary & Kitchen",
          salary: 65000,
          status: "Active",
          performanceRating: 4.8,
          notes: "Former Sous Chef at Taj Blue Diamond. Oversees recipe standardization and kitchen hygiene.",
        },
        {
          name: "Ananya Deshmukh",
          email: "ananya.d@novabite.in",
          phone: "+91 98452 11980",
          role: "Marketing & Brand Lead",
          department: "Growth & Marketing",
          salary: 50000,
          status: "Active",
          performanceRating: 4.7,
          notes: "Manages B2B corporate relations in Hinjewadi and leads digital ad campaigns.",
        },
        {
          name: "Siddharth Joshi",
          email: "siddharth.j@novabite.in",
          phone: "+91 97632 88412",
          role: "Finance & Procurement Manager",
          department: "Finance",
          salary: 48000,
          status: "Active",
          performanceRating: 4.6,
          notes: "Directly negotiates farmer contracts and monitors daily food waste and cost variance.",
        },
        {
          name: "Priya Kulkarni",
          email: "priya.k@novabite.in",
          phone: "+91 98901 23456",
          role: "Quality Assurance & Dietitian",
          department: "Quality & Compliance",
          salary: 42000,
          status: "Active",
          performanceRating: 4.9,
          notes: "Certified clinical nutritionist. Formulates macro profiles and validates calorie counts.",
        },
        {
          name: "Amit Shinde",
          email: "amit.s@novabite.in",
          phone: "+91 91580 99876",
          role: "Logistics & Fleet Coordinator",
          department: "Supply Chain",
          salary: 32000,
          status: "Active",
          performanceRating: 4.4,
          notes: "Dispatches lunch batches and monitors on-time delivery rates across Pune Western zones.",
        },
        {
          name: "Neha Patil",
          email: "neha.p@novabite.in",
          phone: "+91 98220 77123",
          role: "Customer Experience Associate",
          department: "Customer Success",
          salary: 28000,
          status: "Active",
          performanceRating: 4.5,
          notes: "Handles subscriber menu alterations, feedback loops, and customer onboarding.",
        },
      ];

      for (const emp of sampleEmployees) {
        await prisma.employee.create({
          data: {
            businessId: business.id,
            ...emp,
          },
        });
      }
    }

    // Seed or check Tasks
    const taskCount = await prisma.task.count({
      where: { businessId: business.id },
    });
    if (taskCount === 0) {
      const rohit = await prisma.employee.findFirst({ where: { businessId: business.id, name: "Rohit Verma" } });
      const ananya = await prisma.employee.findFirst({ where: { businessId: business.id, name: "Ananya Deshmukh" } });
      const siddharth = await prisma.employee.findFirst({ where: { businessId: business.id, name: "Siddharth Joshi" } });
      const priya = await prisma.employee.findFirst({ where: { businessId: business.id, name: "Priya Kulkarni" } });

      const sampleTasks = [
        {
          title: "Finalize eco-friendly packaging supplier contract",
          description: "Sign 6-month agreement for sugarcane pulp trays with 8% discount on bulk delivery.",
          priority: "High",
          status: "To Do",
          category: "Operations",
          assignedEmployeeId: siddharth?.id,
          dueDate: new Date("2026-10-18"),
        },
        {
          title: "Launch B2B catering outreach to Hinjewadi tech parks",
          description: "Present curated healthy meal tasting sessions to 5 corporate HR facilities teams.",
          priority: "High",
          status: "To Do",
          category: "Marketing",
          assignedEmployeeId: ananya?.id,
          dueDate: new Date("2026-10-22"),
        },
        {
          title: "Integrate automated inventory restocking alerts",
          description: "Connect POS inventory deduction logic with procurement WhatsApp notification trigger.",
          priority: "Medium",
          status: "To Do",
          category: "Technology",
          dueDate: new Date("2026-10-28"),
        },
        {
          title: "Nutritional audit for monsoon menu lineup",
          description: "Verify calorie counts and allergen disclosures for warm millet soups and immunity bowls.",
          priority: "Critical",
          status: "In Progress",
          category: "Compliance",
          assignedEmployeeId: priya?.id,
          dueDate: new Date("2026-10-12"),
        },
        {
          title: "Refine delivery radius optimization in Pune West",
          description: "Re-cluster dispatch routes to maintain 28-minute average drop-off window.",
          priority: "Medium",
          status: "In Progress",
          category: "Logistics",
          dueDate: new Date("2026-10-15"),
        },
        {
          title: "FSSAI compliance audit renewal",
          description: "Completed annual food safety hygiene verification with zero citations.",
          priority: "Critical",
          status: "Completed",
          category: "Compliance",
          assignedEmployeeId: rohit?.id,
          dueDate: new Date("2026-09-15"),
        },
        {
          title: "Setup Cloud POS with multi-store tracking",
          description: "Live cloud system tracking raw inventory, cook times, and order dispatch status.",
          priority: "High",
          status: "Completed",
          category: "Technology",
          dueDate: new Date("2026-09-20"),
        },
        {
          title: "Cold-chain vendor SLA renegotiation",
          description: "Current vendor delayed 2 morning dairy deliveries; awaiting revised penalty clause agreement.",
          priority: "High",
          status: "Blocked",
          category: "Procurement",
          assignedEmployeeId: siddharth?.id,
          dueDate: new Date("2026-10-08"),
        },
      ];

      for (const t of sampleTasks) {
        await prisma.task.create({
          data: {
            businessId: business.id,
            ...t,
          },
        });
      }
    }

    // Seed Roadmap Phases
    const phaseCount = await prisma.roadmapPhase.count({
      where: { businessId: business.id },
    });
    if (phaseCount === 0) {
      const samplePhases = [
        {
          phaseNumber: 1,
          title: "Phase 1: Idea Validation",
          description: "Customer interviews, nutritional preference surveys, and menu recipe prototyping.",
          status: "Completed",
          estimatedCost: 50000,
          startDate: "2026-01-01",
          dueDate: "2026-02-15",
          order: 1,
          tasks: JSON.stringify([
            { id: "p1-1", title: "Survey 300 IT employees in Pune", completed: true },
            { id: "p1-2", title: "Blind taste test 12 signature bowls", completed: true },
            { id: "p1-3", title: "Calculate ingredient cost benchmarks", completed: true },
          ]),
        },
        {
          phaseNumber: 2,
          title: "Phase 2: Market Research",
          description: "Competitor price mapping, delivery aggregator commission analysis, supplier vetting.",
          status: "Completed",
          estimatedCost: 75000,
          startDate: "2026-02-16",
          dueDate: "2026-03-31",
          order: 2,
          tasks: JSON.stringify([
            { id: "p2-1", title: "Map 14 competitive cloud kitchens in West Pune", completed: true },
            { id: "p2-2", title: "Form relationships with 4 organic farmer cooperatives", completed: true },
            { id: "p2-3", title: "Finalize packaging material durability tests", completed: true },
          ]),
        },
        {
          phaseNumber: 3,
          title: "Phase 3: Business Planning",
          description: "Financial modeling, 3-year cash flow projections, unit economics, regulatory filings.",
          status: "Completed",
          estimatedCost: 60000,
          startDate: "2026-04-01",
          dueDate: "2026-04-30",
          order: 3,
          tasks: JSON.stringify([
            { id: "p3-1", title: "Incorporate NovaBite Foods Pvt Ltd", completed: true },
            { id: "p3-2", title: "Draft detailed financial model & sensitivity analysis", completed: true },
            { id: "p3-3", title: "Secure ₹4,00,000 Angel investment commitment", completed: true },
          ]),
        },
        {
          phaseNumber: 4,
          title: "Phase 4: Product / Service Preparation",
          description: "Commercial kitchen fitout, FSSAI licensing, staff hiring, web application build.",
          status: "Completed",
          estimatedCost: 450000,
          startDate: "2026-05-01",
          dueDate: "2026-06-30",
          order: 4,
          tasks: JSON.stringify([
            { id: "p4-1", title: "Lease and equip 1,200 sq.ft Baner commercial kitchen", completed: true },
            { id: "p4-2", title: "Hire Head Chef & 4 kitchen line cooks", completed: true },
            { id: "p4-3", title: "Deploy initial customer web ordering portal", completed: true },
          ]),
        },
        {
          phaseNumber: 5,
          title: "Phase 5: Launch",
          description: "Private beta launch for 100 subscribers, operational stress testing, influencer campaign.",
          status: "Completed",
          estimatedCost: 200000,
          startDate: "2026-07-01",
          dueDate: "2026-08-31",
          order: 5,
          tasks: JSON.stringify([
            { id: "p5-1", title: "Deliver 2,500 beta meals with 94% satisfaction rating", completed: true },
            { id: "p5-2", title: "Partner with 6 Pune fitness and lifestyle creators", completed: true },
            { id: "p5-3", title: "Fine-tune food temperature retention in transit", completed: true },
          ]),
        },
        {
          phaseNumber: 6,
          title: "Phase 6: Customer Acquisition",
          description: "Active B2B corporate cafeteria contracts, referral loops, monthly subscription scaling.",
          status: "In Progress",
          estimatedCost: 350000,
          startDate: "2026-09-01",
          dueDate: "2026-12-31",
          order: 6,
          tasks: JSON.stringify([
            { id: "p6-1", title: "Close 3 corporate catering agreements in Hinjewadi", completed: true },
            { id: "p6-2", title: "Reach 450 active daily individual subscribers", completed: false },
            { id: "p6-3", title: "Maintain sub-₹120 customer acquisition cost (CAC)", completed: false },
          ]),
        },
        {
          phaseNumber: 7,
          title: "Phase 7: Growth & Expansion",
          description: "Establish 2nd micro-kitchen in Kharadi, launch retail packaged healthy snacks.",
          status: "Not Started",
          estimatedCost: 800000,
          startDate: "2027-01-01",
          dueDate: "2027-06-30",
          order: 7,
          tasks: JSON.stringify([
            { id: "p7-1", title: "Identify Kharadi tech park delivery kitchen site", completed: false },
            { id: "p7-2", title: "Launch millet energy crisp snack SKU on Amazon/Blinkit", completed: false },
            { id: "p7-3", title: "Prepare Series Seed institutional pitch deck", completed: false },
          ]),
        },
      ];

      for (const phase of samplePhases) {
        await prisma.roadmapPhase.create({
          data: {
            businessId: business.id,
            ...phase,
          },
        });
      }
    }

    // Seed AI Recommendations
    const recCount = await prisma.aIRecommendation.count({
      where: { businessId: business.id },
    });
    if (recCount === 0) {
      await prisma.aIRecommendation.createMany({
        data: [
          {
            businessId: business.id,
            type: "Expense Alert",
            priority: "High",
            title: "Packaging costs increased 18% over past 45 days",
            explanation: "Recent spike in biodegradable container purchase volume without tier discounts is eroding food contribution margins from 48% to 42%.",
            recommendedAction: "Consolidate supplier bulk orders to a quarterly contract for an immediate 8% margin improvement.",
          },
          {
            businessId: business.id,
            type: "Growth Opportunity",
            priority: "Medium",
            title: "Corporate meal subscription demand in Pune West grew 34%",
            explanation: "Tech enterprises in Hinjewadi Phase 1 show high interest in sponsored healthy lunch stipends for return-to-office employees.",
            recommendedAction: "Launch a specialized 5-day corporate lunch pilot targeting HR managers with free tasting samples.",
          },
          {
            businessId: business.id,
            type: "Task Risk",
            priority: "Urgent",
            title: "Cold-chain vendor SLA renegotiation is currently blocked",
            explanation: "Morning delivery delays risk ingredient freshness and can create 15-minute kitchen prep delays for peak lunch rush.",
            recommendedAction: "Escalate to procurement manager Siddharth Joshi with backup supplier shortlist immediately.",
          },
          {
            businessId: business.id,
            type: "Financial Insight",
            priority: "Low",
            title: "Healthy net profit margin sustained at 49.7%",
            explanation: "Recent B2B event catering contracts provided high operating leverage and strong cash flow velocity.",
            recommendedAction: "Allocate 15% of surplus into high-efficiency induction cookers to increase batch capacity by 20%.",
          },
        ],
      });
    }

    // Seed Notifications
    const notifCount = await prisma.notification.count({
      where: { businessId: business.id },
    });
    if (notifCount === 0) {
      await prisma.notification.createMany({
        data: [
          {
            businessId: business.id,
            title: "Monthly Revenue Goal Reached",
            message: "September revenue surpassed ₹8,45,000 across catering & subscriptions.",
            type: "milestone",
            isRead: false,
          },
          {
            businessId: business.id,
            title: "New AI Recommendation Generated",
            message: "Strategy Agent detected an opportunity in B2B corporate lunch contracts.",
            type: "ai",
            isRead: false,
          },
          {
            businessId: business.id,
            title: "Cold-Chain Vendor Task Blocked",
            message: "Action required on SLA contract negotiation with milk & paneer supplier.",
            type: "task",
            isRead: false,
          },
          {
            businessId: business.id,
            title: "Expense Anomaly Detected",
            message: "Packaging expenses grew 18% month-over-month. Review supplier invoices.",
            type: "financial",
            isRead: true,
          },
        ],
      });
    }

    return { success: true, businessId: business.id, userId: demoUser.id };
  } catch (error) {
    console.error("Error ensuring demo data:", error);
    return { success: false, error };
  }
}
