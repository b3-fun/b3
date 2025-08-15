import { TimeFrame } from "@/types/chart";
import { cn } from "@/utils/cn";

interface TimeFrameSelectorProps {
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  className?: string;
}

const TIME_FRAMES: { value: TimeFrame; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
];

export function TimeFrameSelector({ selectedTimeFrame, onTimeFrameChange, className }: TimeFrameSelectorProps) {
  return (
    <div className={cn("flex gap-1 rounded-lg bg-gray-700 p-1", className)}>
      {TIME_FRAMES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onTimeFrameChange(value)}
          className={cn(
            "min-w-[3rem] rounded px-3 py-1 font-mono text-xs font-medium transition-colors",
            selectedTimeFrame === value
              ? "bg-blue-600 text-white"
              : "text-b3-react-muted-foreground hover:bg-b3-react-subtle hover:text-b3-react-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
