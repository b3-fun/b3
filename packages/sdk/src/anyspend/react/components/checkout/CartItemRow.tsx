"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import type { CheckoutItem, AnySpendCheckoutClasses } from "./AnySpendCheckout";

interface CartItemRowProps {
  item: CheckoutItem;
  formattedPrice: string;
  classes?: AnySpendCheckoutClasses;
}

export function CartItemRow({ item, formattedPrice, classes }: CartItemRowProps) {
  return (
    <div className={cn("flex items-start gap-3 py-3", classes?.cartItemRow)}>
      {item.imageUrl && (
        <div className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100", classes?.cartItemImage)}>
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium text-gray-900 dark:text-gray-100", classes?.cartItemName)}>
            {item.name}
          </p>
          {item.description && (
            <p
              className={cn(
                "mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400",
                classes?.cartItemDescription,
              )}
            >
              {item.description}
            </p>
          )}
          {item.quantity > 1 && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Qty: {item.quantity}</p>
          )}
        </div>
        <p className={cn("ml-3 text-sm font-medium text-gray-900 dark:text-gray-100", classes?.cartItemPrice)}>
          {formattedPrice}
        </p>
      </div>
    </div>
  );
}
