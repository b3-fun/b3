import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface SettingsMenuItemProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

const SettingsMenuItem = ({ icon, title, subtitle, onClick }: SettingsMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className="b3-modal-settings-menu-item dark:hover:bg-b3-line/50 flex w-full items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-[#f4f4f5]"
    >
      <div className="dark:bg-b3-line flex size-10 items-center justify-center rounded-full bg-[#f4f4f5]">{icon}</div>
      <div className="flex flex-1 flex-col items-start gap-1 text-left dark:text-white">
        <span className="font-neue-montreal-semibold text-[14px] leading-none tracking-[-0.28px] text-[#3f3f46] dark:text-white">
          {title}
        </span>
        <span className="dark:text-b3-foreground-muted font-neue-montreal-medium text-[14px] leading-none tracking-[-0.28px] text-[#70707b]">
          {subtitle}
        </span>
      </div>
      <ChevronRight size={20} className="text-[#51525c]" />
    </button>
  );
};

export default SettingsMenuItem;
