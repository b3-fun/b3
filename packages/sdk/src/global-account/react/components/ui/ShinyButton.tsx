"use client";

import { StaggeredFadeLoader } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { isLightColor } from "@b3dotfun/sdk/shared/utils/colors";
import { useInView } from "react-intersection-observer";

export const ShinyButton = ({
  text = "shiny-button",
  accentColor,
  animatedPulse = true,
  className = "",
  children,
  onClick,
  onClickCapture,
  disabled,
  textColor = "",
  textClassName = "",
  type = "button"
}: {
  text?: string;
  accentColor?: string;
  animatedPulse?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  onClickCapture?: () => void;
  disabled?: boolean;
  textColor?: string;
  textClassName?: string;
  type?: "button" | "submit" | "reset";
}) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  const computedTextColor =
    textColor ||
    (accentColor?.startsWith("hsl")
      ? "text-[rgb(0,0,0,65%)] dark:text-[rgb(255,255,255,90%)]"
      : accentColor && isLightColor(accentColor)
        ? "text-black/90"
        : "text-white");

  return (
    <button
      ref={ref}
      className={cn(
        `shiny-button relative min-h-fit rounded-2xl border border-black/10 px-6 py-3 tracking-wide backdrop-blur-xl transition-all duration-300 ease-in-out dark:bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--b3-react-primary)/25%)_0%,transparent_70%)] ${className}`,
        disabled
          ? "grayscale-20 cursor-not-allowed opacity-60"
          : "hover:border-black/30 hover:shadow-[0_0_20px_rgb(0,0,0,20%)]",
        animatedPulse && inView && "animated-pulse"
      )}
      style={{
        backgroundColor: disabled ? "#94A3B8" : accentColor
      }}
      onClick={!disabled ? onClick : undefined}
      onClickCapture={onClickCapture}
      disabled={disabled}
      type={type}
    >
      <div className="absolute inset-0 bottom-0 left-0 right-0 top-0 rounded-2xl border border-white/10"></div>

      <span
        className={cn(
          "font-sf-rounded relative block h-full w-full text-lg font-semibold tracking-wide",
          computedTextColor
        )}
      >
        <div className={cn("flex items-center justify-center gap-2", textClassName)}>
          {children || text}
          {text === "Loading" && <StaggeredFadeLoader size={2} />}
        </div>
      </span>
      <span className="shiny-overlay"></span>
    </button>
  );
};
