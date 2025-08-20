import { CircleAlert } from "lucide-react";

interface ErrorSectionProps {
  error?: Error | null;
  message?: string;
}

export function ErrorSection({ error, message }: ErrorSectionProps) {
  if (!error && !message) {
    return null;
  }

  const errorMessage = message || error?.message || "An error occurred";

  return (
    <div className="error-section bg-as-on-surface-1 flex w-full max-w-[460px] items-center gap-2 rounded-2xl px-4 py-2">
      <CircleAlert className="bg-as-red h-4 min-h-4 w-4 min-w-4 rounded-full p-0 text-sm font-medium text-white" />
      <div className="text-as-red text-sm">{errorMessage}</div>
    </div>
  );
}
