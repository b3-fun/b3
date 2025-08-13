import React from "react";

export interface SignOutIconProps {
  className?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function SignOutIcon({ className, size = 16, color = "#676767", style }: SignOutIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path d="M7 2.5H3V13.5H7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8H14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 5.5L14 8L11.5 10.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default SignOutIcon;
