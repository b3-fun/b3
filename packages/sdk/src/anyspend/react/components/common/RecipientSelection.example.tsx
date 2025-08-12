/**
 * Example usage of the RecipientSelection component
 * This file demonstrates various ways to use the component with different props
 */

import { isAddress } from "viem";
import { RecipientSelection } from "./RecipientSelection";

// Basic usage example
export function BasicRecipientSelection() {
  return (
    <RecipientSelection
      onBack={() => console.log("Back clicked")}
      onConfirm={address => console.log("Address confirmed:", address)}
    />
  );
}

// Custom styling and validation example
export function CustomRecipientSelection() {
  const validateEthereumAddress = (address: string): boolean => {
    return isAddress(address);
  };

  return (
    <RecipientSelection
      initialValue="0x..."
      placeholder="Enter Ethereum address"
      title="Send to Ethereum Address"
      description="Enter a valid Ethereum address to send tokens"
      confirmText="Confirm Ethereum Address"
      validateAddress={validateEthereumAddress}
      autoFocus={false}
      onBack={() => console.log("Going back")}
      onConfirm={address => console.log("Valid Ethereum address:", address)}
    />
  );
}

// ENS-focused example
export function ENSRecipientSelection() {
  return (
    <RecipientSelection
      placeholder="Enter ENS name (e.g., vitalik.eth)"
      title="Send to ENS Address"
      description="Enter an ENS name or Ethereum address"
      confirmText="Confirm ENS Address"
      onBack={() => console.log("Back to previous view")}
      onConfirm={address => console.log("ENS or address:", address)}
    />
  );
}
