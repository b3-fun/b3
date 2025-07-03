import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyToClipboardProps {
  text?: string;
  onCopy?: () => void;
  children?: React.ReactNode;
}

export function CopyToClipboard({ text, onCopy, children }: CopyToClipboardProps) {
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
      className="text-b3-react-muted-foreground hover:text-b3-react-foreground flex cursor-pointer items-center gap-1 text-xs transition-all duration-200"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy</span>
        </>
      )}
    </div>
  );
}
