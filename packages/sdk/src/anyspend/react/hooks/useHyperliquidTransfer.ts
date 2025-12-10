import { HYPERLIQUID_CHAIN_ID, HYPERLIQUID_MAINNET } from "@b3dotfun/sdk/anyspend";
import { toast } from "@b3dotfun/sdk/global-account/react";
import { formatUnits } from "@b3dotfun/sdk/shared/utils/number";
import axios from "axios";
import { useCallback } from "react";
import { parseSignature } from "viem";
import { useWalletClient } from "wagmi";

interface HyperliquidTransferParams {
  /** Amount in smallest unit (USDC has 6 decimals) */
  amount: string;
  /** Recipient address */
  destination: string;
}

/**
 * @deprecated This hook is NOT USED in production.
 *
 * Hyperliquid is only supported as DESTINATION CHAIN (not source chain).
 * Users cannot send FROM Hyperliquid in our flow, so EIP-712 signing is not needed.
 *
 * This hook was created during initial planning but is kept for:
 * - Reference if we need to support source chain in the future
 * - Understanding how Hyperliquid EIP-712 transfers work
 *
 * DO NOT USE THIS HOOK IN PRODUCTION CODE.
 *
 * Custom hook for handling Hyperliquid transfers via EIP-712 signature.
 * Based on Relay SDK's Hyperliquid implementation.
 *
 * @example
 * ```tsx
 * const { initiateTransfer } = useHyperliquidTransfer();
 *
 * await initiateTransfer({
 *   amount: "1000000", // 1 USDC
 *   destination: "0x..."
 * });
 * ```
 */
export function useHyperliquidTransfer() {
  const { data: walletClient } = useWalletClient();

  /**
   * Get the connected wallet address if available.
   */
  const getConnectedAddress = useCallback(() => {
    return walletClient?.account?.address || null;
  }, [walletClient]);

  /**
   * Initiate Hyperliquid transfer by signing EIP-712 message and sending to Hyperliquid API.
   */
  const initiateTransfer = useCallback(
    async ({ amount, destination }: HyperliquidTransferParams): Promise<void> => {
      if (!walletClient?.account) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }

      try {
        const currentTime = new Date().getTime();

        // Convert amount from smallest unit (6 decimals) to display format.
        // e.g., "11151533" -> "11.151533"
        const displayAmount = formatUnits(amount, 6);

        // Prepare EIP-712 typed data for Hyperliquid USD send.
        const typedData = {
          domain: {
            name: "HyperliquidSignTransaction",
            version: "1",
            chainId: HYPERLIQUID_CHAIN_ID,
            verifyingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`,
          },
          types: {
            "HyperliquidTransaction:UsdSend": [
              { name: "hyperliquidChain", type: "string" },
              { name: "destination", type: "string" },
              { name: "amount", type: "string" },
              { name: "time", type: "uint64" },
            ],
          },
          primaryType: "HyperliquidTransaction:UsdSend" as const,
          message: {
            hyperliquidChain: "Mainnet",
            destination: destination.toLowerCase(),
            amount: displayAmount,
            time: BigInt(currentTime),
          },
        };

        toast.info("Please sign the message in your wallet");

        // Sign EIP-712 message.
        const signature = await walletClient.signTypedData(typedData);

        // Parse signature to get r, s, v components.
        const { r, s, v } = parseSignature(signature);

        toast.info("Sending transaction to Hyperliquid...");

        // Send signature to Hyperliquid API.
        const response = await axios.post(HYPERLIQUID_MAINNET.apiUrl + "/exchange", {
          signature: {
            r,
            s,
            v: Number(v ?? BigInt(0)),
          },
          nonce: currentTime,
          action: {
            type: "usdSend",
            signatureChainId: `0x${HYPERLIQUID_CHAIN_ID.toString(16)}`,
            hyperliquidChain: "Mainnet",
            destination: destination.toLowerCase(),
            amount: displayAmount,
            time: currentTime,
          },
        });

        // Check response status.
        if (!response || response.status !== 200 || response.data?.status !== "ok") {
          const errorMsg = response?.data?.error || "Failed to send transaction to Hyperliquid";
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }

        toast.success("Transaction sent to Hyperliquid successfully!");
      } catch (error: any) {
        console.error("Hyperliquid transfer error:", error);

        // Handle user rejection.
        if (error?.message?.includes("User rejected") || error?.code === 4001) {
          toast.error("Transaction signature rejected");
          throw new Error("User rejected signature");
        }

        // Handle other errors.
        const errorMsg = error?.message || "Failed to complete Hyperliquid transfer";
        toast.error(errorMsg);
        throw error;
      }
    },
    [walletClient],
  );

  return {
    initiateTransfer,
    getConnectedAddress,
    isWalletConnected: !!walletClient?.account,
  };
}
