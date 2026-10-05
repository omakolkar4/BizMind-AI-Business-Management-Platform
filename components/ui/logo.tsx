import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ className, iconOnly = false, size = "md", href = "/" }: LogoProps) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight select-none group", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20 transition-transform duration-200 group-hover:scale-105",
          sizeClasses[size]
        )}
      >
        {/* Modern geometric AI brain / growth node SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/6 h-5/6 text-white"
        >
          {/* Growth bar / node */}
          <path d="M4 19h16" />
          <path d="M6 15l4-4 3 3 7-7" />
          <circle cx="10" cy="11" r="1.5" fill="currentColor" />
          <circle cx="13" cy="14" r="1.5" fill="currentColor" />
          <circle cx="20" cy="7" r="1.5" fill="currentColor" />
          {/* Subtle brain-neuron arc */}
          <path d="M7 9a4 4 0 0 1 8-2" strokeDasharray="1.5 2" strokeWidth="1.8" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span className={cn("font-extrabold text-foreground tracking-tight", textClasses[size])}>
              Biz<span className="text-indigo-600 dark:text-indigo-400">Mind</span>
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              AI
            </span>
          </div>
          {size === "lg" && (
            <span className="text-[11px] font-medium text-muted-foreground mt-0.5 tracking-normal">
              Intelligent Business Co-Pilot
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-flex focus:outline-none">{content}</Link>;
  }

  return content;
}
