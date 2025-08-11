import { cn } from "@/utils/cn";

export type ChartDataType = "price" | "marketCap";

interface DataTypeSelectorProps {
  selectedType: ChartDataType;
  onTypeChange: (type: ChartDataType) => void;
  className?: string;
}

const DATA_TYPES: { value: ChartDataType; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "marketCap", label: "Market Cap" },
];

export function DataTypeSelector({ selectedType, onTypeChange, className }: DataTypeSelectorProps) {
  return (
    <div className={cn("flex gap-1 rounded-lg bg-gray-700 p-1", className)}>
      {DATA_TYPES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onTypeChange(value)}
          className={cn(
            "min-w-[5rem] rounded px-3 py-1 text-xs font-medium transition-colors",
            selectedType === value ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-600 hover:text-white",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
