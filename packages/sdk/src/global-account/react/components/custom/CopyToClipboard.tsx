import { cn } from "@b3dotfun/sdk/shared/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyToClipboardProps {
  text?: string;
  onCopy?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function CopyToClipboard({ text, onCopy, children, className }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  if (children) {
    return (
      <div onClick={handleCopy} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={handleCopy}
      className={cn(
        "text-b3-foreground-muted hover:text-b3-foreground-muted/80 flex cursor-pointer items-center gap-1 text-xs transition-all duration-200",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
        </>
      )}
    </div>
  );
}
