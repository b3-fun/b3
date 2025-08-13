import React from "react";

export interface SwapIconProps {
  className?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function SwapIcon({ className, size = 24, color = "#3268EF", style }: SwapIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path d="M8.75 9H4.25V4.5" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.25 9.00013L6.90125 6.34888C8.43666 4.81353 10.5154 3.94539 12.6868 3.93276C14.8581 3.92012 16.9468 4.764 18.5 6.28138"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16.25 15H20.75V19.5" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M20.75 15L18.0988 17.6512C16.5633 19.1866 14.4846 20.0547 12.3132 20.0674C10.1419 20.08 8.05317 19.2361 6.5 17.7188"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SwapIcon;
