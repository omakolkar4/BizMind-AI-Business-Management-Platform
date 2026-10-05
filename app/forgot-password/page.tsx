"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email.");
      return;
    }
    setSubmitted(true);
    toast.success("Password reset instructions dispatched!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Logo href="/" size="lg" className="justify-center" />
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
          Reset Your Password
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter your registered email address and we will send you a recovery link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border shadow-lg">
          <CardContent className="pt-6">
            {!submitted ? (
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

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-md shadow-indigo-600/20"
                >
                  Send Recovery Link
                </Button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-foreground">Check Your Inbox</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We have dispatched password reset instructions to <strong className="text-foreground">{email}</strong>.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold"
                >
                  Try another email
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-muted/20 py-3 justify-center text-xs text-muted-foreground">
            <Link href="/login" className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
