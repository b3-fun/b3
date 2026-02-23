import type { ReactNode } from "react";
import { useTheme } from "../ThemeContext";
import { DemoPageHeader } from "./DemoPageHeader";

interface DemoPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Max width class for the main content area. Defaults to "max-w-6xl". */
  maxWidth?: string;
}

export function DemoPageLayout({ title, subtitle, actions, children, maxWidth = "max-w-6xl" }: DemoPageLayoutProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen transition-colors"
      style={{
        background: isDark ? "#0B0F1A" : "#F8F9FB",
        backgroundImage: isDark
          ? "radial-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px)"
          : "radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <DemoPageHeader title={title} subtitle={subtitle} actions={actions} />
      <main className={`mx-auto ${maxWidth} px-6 py-8`}>{children}</main>
    </div>
  );
}
