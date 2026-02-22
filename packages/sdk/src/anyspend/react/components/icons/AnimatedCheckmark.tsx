"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";

interface AnimatedCheckmarkProps {
  /** Circle stroke / fill color (CSS color value) */
  color?: string;
  /** Checkmark stroke color (defaults to white) */
  checkColor?: string;
  /** Stroke width for the circle and check path */
  strokeWidth?: number;
  /** Tailwind or custom className to control size, e.g. "h-16 w-16" */
  className?: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Render in final (post-animation) state with no animation */
  static?: boolean;
}

/**
 * Animated checkmark SVG component.
 * Circle draws in → checkmark draws → background fills → subtle scale bounce.
 *
 * Size is controlled via className (Tailwind classes like `h-10 w-10`, `h-16 w-16`, etc.).
 * The SVG scales to fit its container via viewBox.
 */
export function AnimatedCheckmark({
  color = "#22c55e",
  checkColor = "#fff",
  strokeWidth = 2,
  className,
  delay = 0,
  static: isStatic = false,
}: AnimatedCheckmarkProps) {
  if (isStatic) {
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
        style={{
          borderRadius: "50%",
          display: "block",
          strokeWidth,
          stroke: checkColor,
          strokeMiterlimit: 10,
          boxShadow: `inset 0px 0px 0px 100px ${color}`,
        }}
      >
        <circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          style={{
            strokeWidth,
            strokeMiterlimit: 10,
            stroke: color,
          }}
        />
        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" style={{ transformOrigin: "50% 50%" }} />
      </svg>
    );
  }

  const id = `ac-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes ${id}-stroke {
  100% { stroke-dashoffset: 0; }
}
@keyframes ${id}-scale {
  0%, 100% { transform: none; }
  50% { transform: scale3d(1.1, 1.1, 1); }
}
@keyframes ${id}-fill {
  100% { box-shadow: inset 0px 0px 0px 100px ${color}; }
}
.${id} {
  border-radius: 50%;
  display: block;
  stroke-width: ${strokeWidth};
  stroke: ${checkColor};
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px ${color};
  animation:
    ${id}-fill .4s ease-in-out ${delay + 0.4}s forwards,
    ${id}-scale .3s ease-in-out ${delay + 0.9}s both;
}
.${id}__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: ${strokeWidth};
  stroke-miterlimit: 10;
  stroke: ${color};
  fill: none;
  animation: ${id}-stroke .6s cubic-bezier(0.65, 0, 0.45, 1) ${delay}s forwards;
}
.${id}__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: ${id}-stroke .3s cubic-bezier(0.65, 0, 0.45, 1) ${delay + 0.8}s forwards;
}
`,
        }}
      />
      <svg className={cn(id, className)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={`${id}__circle`} cx="26" cy="26" r="25" fill="none" />
        <path className={`${id}__check`} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
      </svg>
    </>
  );
}
