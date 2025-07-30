import { getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { Badge } from "@b3dotfun/sdk/global-account/react";
import { Check, X } from "lucide-react";
import { memo } from "react";

export const OrderStatus = memo(function OrderStatus({ order }: { order: components["schemas"]["Order"] }) {
  const isComplete = order.status === "executed";
  const { text, status: displayStatus } = getStatusDisplay(order);

  return (
    <div className="flex items-center justify-center gap-2">
      {isComplete ? (
        <Badge
          variant="outline"
          className="flex items-center gap-3 border-green-500/50 bg-green-500/20 px-4 py-1 text-base transition-colors"
        >
          <Check className="h-6 w-6 text-green-500" />
          <span className="font-medium">{text}</span>
        </Badge>
      ) : displayStatus === "failure" ? (
        <div className="flex flex-col items-center">
          <div className="bg-as-error-secondary flex h-10 w-10 items-center justify-center rounded-full text-base">
            <X className="text-as-content-icon-error h-5 w-5" />
          </div>
          <div className="font-sf-rounded text-as-content-primary mt-4 text-lg font-semibold">{text}</div>
          <div className="text-as-tertiarry text-center" style={{ whiteSpace: "normal" }}>
            This order is no longer valid because the order expired.
          </div>
        </div>
      ) : null}
    </div>
  );
});
