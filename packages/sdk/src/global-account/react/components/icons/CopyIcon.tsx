import { SVGProps } from "react";

export function CopyIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M3.33333 3.33333V2C3.33333 1.63181 3.63181 1.33333 4 1.33333H10C10.3682 1.33333 10.6667 1.63181 10.6667 2V8C10.6667 8.36819 10.3682 8.66667 10 8.66667H8.66667M2 3.33333H8C8.36819 3.33333 8.66667 3.63181 8.66667 4V10C8.66667 10.3682 8.36819 10.6667 8 10.6667H2C1.63181 10.6667 1.33333 10.3682 1.33333 10V4C1.33333 3.63181 1.63181 3.33333 2 3.33333Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
