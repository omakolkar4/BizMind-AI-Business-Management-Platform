"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  Users,
  Info,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

type LoginMode = "OWNER" | "EMPLOYEE";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = React.useState<LoginMode>("OWNER");
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error(
        loginMode === "OWNER"
          ? "Please enter your business username/email and password."
          : "Please enter your employee username or ID and password."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
          mode: loginMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.suggestedMode) {
          toast.error(data.error, {
            action: {
              label: `Switch to ${data.suggestedMode === "EMPLOYEE" ? "Employee" : "Owner"} Login`,
              onClick: () => setLoginMode(data.suggestedMode),
            },
          });
        } else {
          toast.error(data.error || "Login failed. Check your credentials.");
        }
        return;
      }

      if (data?.user?.role) {
        try {
          localStorage.setItem("bizmind_user_role", data.user.role);
          localStorage.setItem("bizmind_user_name", data.user.name || "");
        } catch {}
      }

      toast.success(
        loginMode === "OWNER"
          ? "Welcome back to your company workspace!"
          : "Welcome back to your employee workspace!"
      );
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
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
          Select your account role and enter your credentials to access your workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border shadow-lg">
          <CardContent className="pt-6">
            {/* Two-Option Role Selector */}
            <div
              className="grid grid-cols-2 gap-3 mb-6"
              role="tablist"
              aria-label="Login Mode Selector"
            >
              <button
                type="button"
                id="mode-owner-btn"
                role="tab"
                aria-selected={loginMode === "OWNER"}
                onClick={() => setLoginMode("OWNER")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                  loginMode === "OWNER"
                    ? "border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-foreground ring-2 ring-purple-600/30 shadow-xs"
                    : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Building2
                      className={`h-4 w-4 ${
                        loginMode === "OWNER"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        loginMode === "OWNER"
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-foreground"
                      }`}
                    >
                      Owner Login
                    </span>
                  </div>
                  {loginMode === "OWNER" && (
                    <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Access and manage your company.
                </span>
              </button>

              <button
                type="button"
                id="mode-employee-btn"
                role="tab"
                aria-selected={loginMode === "EMPLOYEE"}
                onClick={() => setLoginMode("EMPLOYEE")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                  loginMode === "EMPLOYEE"
                    ? "border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-foreground ring-2 ring-purple-600/30 shadow-xs"
                    : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Users
                      className={`h-4 w-4 ${
                        loginMode === "EMPLOYEE"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        loginMode === "EMPLOYEE"
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-foreground"
                      }`}
                    >
                      Employee Login
                    </span>
                  </div>
                  {loginMode === "EMPLOYEE" && (
                    <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Access your assigned tasks and workspace.
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <Label htmlFor="identifier">
                  {loginMode === "OWNER" ? "Username or Email" : "Employee Username or ID"}
                </Label>
                <div className="relative">
                  {loginMode === "OWNER" ? (
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    id="identifier"
                    type="text"
                    placeholder={
                      loginMode === "OWNER"
                        ? "Enter your username or email"
                        : "Enter your employee username or ID"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-9"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span className="text-muted-foreground font-medium">Remember me for 30 days</span>
                </label>
              </div>

              {/* Primary Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-10 shadow-md shadow-purple-600/20"
              >
                {loading
                  ? loginMode === "OWNER"
                    ? "Signing in as Owner..."
                    : "Signing in as Employee..."
                  : loginMode === "OWNER"
                  ? "Sign in as Owner"
                  : "Sign in as Employee"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </form>

            {/* Google OAuth (Owner Mode Only) */}
            {loginMode === "OWNER" && (
              <div className="space-y-4 pt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-semibold">
                      Or continue with
                    </span>
                  </div>
                </div>

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
              </div>
            )}
          </CardContent>

          {/* Card Footer: Conditional based on loginMode */}
          <CardFooter className="border-t bg-muted/20 py-3.5 px-6">
            {loginMode === "OWNER" ? (
              <p className="w-full text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="ml-1 font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Create an Account
                </Link>
              </p>
            ) : (
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border w-full">
                <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Your account must be created by your company owner. Please contact your owner or
                  administrator for your login credentials.
                </span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
