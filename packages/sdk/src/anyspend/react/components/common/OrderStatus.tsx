import { Order, OrderStatus as OrderStatusEnum, getStatusDisplay } from "@b3dotfun/sdk/anyspend";
import { Badge, TextShimmer } from "@b3dotfun/sdk/global-account/react";
import { Check, Loader2 } from "lucide-react";
import { memo } from "react";

export const OrderStatus = memo(function OrderStatus({ order }: { order: Order }) {
  const isComplete = order.status === OrderStatusEnum.Executed;
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
        <Badge variant="destructive" className="border-red-400/50 bg-red-400/20 px-4 py-1 text-base">
          <div className="font-sf-rounded text-base font-semibold text-red-400/50">{text}</div>
        </Badge>
      ) : (
        <Badge
          variant="default"
          className="border-as-stroke/20 bg-as-primary/10 flex items-center gap-3 px-4 py-1 text-base transition-colors"
        >
          {displayStatus === "processing" && <Loader2 className="text-as-primary h-4 w-4 animate-spin" />}

          <TextShimmer duration={1} className="font-sf-rounded text-base font-semibold">
            {text}
          </TextShimmer>
        </Badge>
      )}
    </div>
  );
});
