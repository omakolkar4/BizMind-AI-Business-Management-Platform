import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BizMind — Intelligent Business Planning & Management AI",
  description:
    "BizMind combines AI-powered planning, financial management, team management, and decision support in one intelligent business workspace. From business idea to business growth.",
  keywords: [
    "AI Business Planning",
    "Business Management Software",
    "Startup Co-Pilot",
    "Financial Planning",
    "Business Health Score",
    "Multi-Agent AI",
    "Task Management",
    "BizMind",
  ],
  authors: [{ name: "BizMind Technologies" }],
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
