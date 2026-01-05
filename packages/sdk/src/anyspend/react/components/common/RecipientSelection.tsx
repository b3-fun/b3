"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import type { RecipientSelectionClasses } from "../types/classes";

export interface RecipientSelectionProps {
  /**
   * Initial recipient address value
   */
  initialValue?: string;
  /**
   * Placeholder text for the input field
   */
  placeholder?: string;
  /**
   * Title text displayed in the header
   */
  title?: string;
  /**
   * Description text displayed below the title
   */
  description?: string;
  /**
   * Text for the confirm button
   */
  confirmText?: string;
  /**
   * Callback when back button is clicked
   */
  onBack: () => void;
  /**
   * Callback when recipient address is confirmed
   * @param address - The recipient address entered by the user
   */
  onConfirm: (address: string) => void;
  /**
   * Whether the component should auto-focus the input
   */
  autoFocus?: boolean;
  /**
   * Custom validation function for the address
   * @param address - The address to validate
   * @returns true if valid, false otherwise
   */
  validateAddress?: (address: string) => boolean;
  /**
   * Custom classes for styling
   */
  classes?: RecipientSelectionClasses;
}

export function RecipientSelection({
  initialValue = "",
  placeholder = "Enter recipient address",
  title = "Add recipient address or ENS",
  description = "Swap and send tokens to another address",
  confirmText = "Confirm recipient address",
  onBack,
  onConfirm,
  autoFocus = true,
  validateAddress,
  classes,
}: RecipientSelectionProps) {
  const [recipientAddress, setRecipientAddress] = useState<string>(initialValue);

  // Update internal state when initialValue changes
  useEffect(() => {
    setRecipientAddress(initialValue);
  }, [initialValue]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipientAddress(text);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  const handleConfirm = () => {
    if (recipientAddress && (!validateAddress || validateAddress(recipientAddress))) {
      onConfirm(recipientAddress);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && recipientAddress) {
      handleConfirm();
    }
  };

  const isAddressValid = !validateAddress || !recipientAddress || validateAddress(recipientAddress);
  const canConfirm = recipientAddress && isAddressValid;

  return (
    <div className={classes?.container || "recipient-selection mx-auto w-[460px] max-w-full p-5"}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className={classes?.header || "flex justify-around"}>
          <button
            onClick={onBack}
            className={
              classes?.backButton ||
              "text-as-quaternary hover:text-as-primary flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            }
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-as-primary text-lg font-semibold">{title}</h2>
            <p className="text-as-primary/60 text-sm">{description}</p>
          </div>
        </div>

        {/* Address Input */}
        <div className="flex flex-col gap-4">
          <div className="bg-as-surface-secondary border-as-border-secondary flex h-12 w-full overflow-hidden rounded-xl border">
            <input
              type="text"
              placeholder={placeholder}
              value={recipientAddress}
              onChange={e => setRecipientAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              className={
                classes?.searchInput ||
                "text-as-primary placeholder:text-as-primary/50 flex-1 bg-transparent px-4 text-base focus:outline-none"
              }
              autoFocus={autoFocus}
            />
            <div className="border-as-border-secondary border-l">
              <button
                onClick={handlePaste}
                className="text-as-primary/70 hover:text-as-primary hover:bg-as-surface-primary h-full px-4 font-semibold transition-colors"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Validation Error */}
          {recipientAddress && !isAddressValid && (
            <div className="text-as-red text-sm">Please enter a valid address</div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={
              classes?.confirmButton ||
              "bg-as-brand hover:bg-as-brand/90 disabled:bg-as-on-surface-2 disabled:text-as-secondary h-12 w-full rounded-xl font-medium text-white transition-colors disabled:cursor-not-allowed"
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
