"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed. Check your credentials.");
        return;
      }

      toast.success("Welcome back to BizMind!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail("demo@bizmind.ai");
    setPassword("Demo@123");
    toast.info("Filled demo credentials: demo@bizmind.ai / Demo@123");
  };

  const handleOneClickDemo = async () => {
    try {
      setDemoLoading(true);
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (res.ok) {
        toast.success("Logged in as Demo Founder (NovaBite Foods)!");
        router.push("/dashboard");
      } else {
        toast.error("Could not initialize demo session.");
      }
    } catch {
      toast.error("Network error launching demo.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info("Google OAuth SSO requires configured credentials in production.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Logo href="/" size="lg" className="justify-center" />
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          Sign In to Your Workspace
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter your credentials to access your business analytics and planning tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-muted-foreground font-medium">Remember me for 30 days</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-md shadow-indigo-600/20"
              >
                {loading ? "Authenticating..." : "Sign In to BizMind"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">Or continue with</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold h-9"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.43 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </Button>

              {/* Demo Account Box */}
              <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-indigo-950 dark:text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Demo Account Credentials</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Auto-Fill
                  </button>
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  <div>Email: <strong className="text-foreground">demo@bizmind.ai</strong></div>
                  <div>Password: <strong className="text-foreground">Demo@123</strong></div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOneClickDemo}
                  disabled={demoLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8"
                >
                  {demoLoading ? "Starting Demo..." : "Instant 1-Click Demo Login"}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t bg-muted/20 py-3 justify-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="ml-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create an Account
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
