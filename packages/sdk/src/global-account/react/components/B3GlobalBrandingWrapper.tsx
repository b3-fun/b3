import { ReactNode } from "react";

interface B3GlobalBrandingWrapperProps {
  children: ReactNode;
}

export function B3GlobalBrandingWrapper({ children }: B3GlobalBrandingWrapperProps) {
  console.log("B3GlobalBrandingWrapper", children);
  return (
    <div className="b3-global-account-wrapper bg-[#E4E4E7] p-[10px]">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#D1D1D6] bg-white shadow-[0_20px_24px_-4px_rgba(10,13,18,0.08),0_8px_8px_-4px_rgba(10,13,18,0.03),0_3px_3px_-1.5px_rgba(10,13,18,0.04)]">
        {children}
      </div>
      {/* Global Account Footer */}
      <div className="flex items-center justify-center gap-1.5 border-t border-[#e4e4e7] pt-[10px]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 4.66667C2 3.19391 3.19391 2 4.66667 2H11.3333C12.8061 2 14 3.19391 14 4.66667V11.3333C14 12.8061 12.8061 14 11.3333 14H4.66667C3.19391 14 2 12.8061 2 11.3333V4.66667Z"
            fill="#0B57C2"
          />
          <path
            d="M5.33333 6C5.33333 5.63181 5.63181 5.33333 6 5.33333H10C10.3682 5.33333 10.6667 5.63181 10.6667 6V10C10.6667 10.3682 10.3682 10.6667 10 10.6667H6C5.63181 10.6667 5.33333 10.3682 5.33333 10V6Z"
            fill="white"
          />
        </svg>
        <span className="font-neue-montreal-semibold text-xs uppercase leading-none tracking-[0.72px] text-[#0B57C2]">
          Global Account
        </span>
      </div>
    </div>
  );
}
