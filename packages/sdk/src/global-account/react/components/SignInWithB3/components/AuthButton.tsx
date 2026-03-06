import { Button } from "../../custom/Button";
import { Github, Mail } from "lucide-react";
import { strategyIcons, strategyLabels } from "../utils/signInUtils";

const fallbackIcons = {
  github: Github,
  email: Mail,
} as const;

export function AuthButton({
  strategy,
  onClick,
  isLoading,
}: {
  strategy: string;
  onClick: () => void;
  isLoading: boolean;
}) {
  const strategyIcon = strategyIcons[strategy];
  const strategyLabel = strategyLabels[strategy] || strategy;
  const FallbackIcon = fallbackIcons[strategy as keyof typeof fallbackIcons];

  return (
    <Button
      key={strategy}
      onClick={onClick}
      disabled={isLoading}
      aria-label={`Sign in with ${strategyLabel}`}
      title={`Sign in with ${strategyLabel}`}
      className="flex w-full items-center justify-center bg-gray-100 px-2 py-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {strategyIcon ? (
        <img src={strategyIcon} alt={`${strategyLabel} icon`} className="h-9 w-9" />
      ) : FallbackIcon ? (
        <FallbackIcon className="h-9 w-9 text-gray-900 dark:text-gray-100" />
      ) : (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{strategyLabel[0]}</span>
      )}
    </Button>
  );
}
