import React from "react";

export interface BankIconProps {
  className?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function BankIcon({ className, size = 24, color = "#3268EF", style }: BankIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M2.25 9H21.75L12 3L2.25 9Z"
        stroke={color}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5.25 9V15.75" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.75 9V15.75" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.25 9V15.75" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.75 9V15.75" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 15.75H21" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.5 19.5H22.5" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default BankIcon;
