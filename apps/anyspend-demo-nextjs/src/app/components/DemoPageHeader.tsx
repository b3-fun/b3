"use client";

import { ArrowLeft, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useTheme } from "../ThemeContext";

interface DemoPageHeaderProps {
  title: string;
  subtitle?: string;
  /** Extra content rendered on the right side, before the theme toggle */
  actions?: ReactNode;
}

export function DemoPageHeader({ title, subtitle, actions }: DemoPageHeaderProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      className="px-6 py-5 transition-colors"
      style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}` }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="h-5" style={{ width: 1, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
          <div>
            <h1 className="text-sm font-semibold tracking-tight" style={{ color: isDark ? "#fff" : "#111827" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
            }}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
