import { Button } from "../../custom/Button";
import { strategyIcons } from "../utils/signInUtils";

export function AuthButton({
  strategy,
  onClick,
  isLoading
}: {
  strategy: string;
  onClick: () => void;
  isLoading: boolean;
}) {
  return (
    <Button
      key={strategy}
      onClick={onClick}
      disabled={isLoading}
      className="flex w-full items-center justify-center bg-gray-100 px-2 py-3 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      <img src={strategyIcons[strategy]} className="h-9 w-9" />
    </Button>
  );
}
