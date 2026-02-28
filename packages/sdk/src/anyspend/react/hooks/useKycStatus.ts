"use client";

import { ANYSPEND_MAINNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";

export interface KycStatusResponse {
  kycRequired: boolean;
  status: "not_verified" | "pending" | "completed" | "approved" | "declined" | "needs_review" | "expired";
  inquiry?: {
    inquiryId: string;
    sessionToken: string;
  };
  config?: {
    templateId: string;
    environment: string;
  };
}

interface KycInquiryResponse {
  inquiryId: string;
  sessionToken: string;
}

interface KycVerifyResponse {
  status: string;
}

function buildWalletAuthMessage(walletAddress: string, timestamp: number): string {
  return `AnySpend wants to verify your identity for card payments.\n\nThis signature does not trigger a blockchain transaction or cost any gas.\n\nWallet: ${walletAddress.toLowerCase()}\nNonce: ${timestamp}`;
}

/** Module-level signature cache to avoid repeated wallet prompts within the 5-minute window. */
const headerCache = new Map<string, { headers: Record<string, string>; expiresAt: number }>();

/**
 * Returns a function that builds the wallet-signature auth headers.
 * Caches signatures for 4 minutes (server allows 5-minute window).
 */
export function useWalletAuthHeaders() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const getHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!address) throw new Error("No wallet connected");
    const walletAddress = address.toLowerCase();

    const cached = headerCache.get(walletAddress);
    if (cached && Date.now() < cached.expiresAt) return cached.headers;

    const timestamp = Math.floor(Date.now() / 1000);
    const message = buildWalletAuthMessage(walletAddress, timestamp);
    const signature = await signMessageAsync({ message });

    const headers = {
      "X-Wallet-Address": walletAddress,
      "X-Wallet-Signature": signature,
      "X-Wallet-Timestamp": String(timestamp),
    };
    // Cache for 4 minutes so repeated fetches don't re-prompt the user
    headerCache.set(walletAddress, { headers, expiresAt: Date.now() + 4 * 60 * 1000 });
    return headers;
  }, [address, signMessageAsync]);

  return { address, getHeaders };
}

export function useKycStatus(enabled = true) {
  const { address, getHeaders } = useWalletAuthHeaders();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kyc-status", address],
    queryFn: async () => {
      const headers = await getHeaders();
      const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/status`, { headers });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to fetch KYC status");
      return json.data as KycStatusResponse;
    },
    enabled: enabled && !!address,
    staleTime: 30_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  return {
    kycStatus: data || null,
    isLoadingKycStatus: isLoading,
    kycStatusError: error,
    refetchKycStatus: refetch,
  };
}

export function useCreateKycInquiry() {
  const { address, getHeaders } = useWalletAuthHeaders();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("No wallet connected");
      const headers = await getHeaders();
      const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to create KYC inquiry");
      return json.data as KycInquiryResponse;
    },
  });

  return {
    createInquiry: mutateAsync,
    isCreatingInquiry: isPending,
  };
}

export function useVerifyKyc() {
  const { address, getHeaders } = useWalletAuthHeaders();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (inquiryId: string) => {
      if (!address) throw new Error("No wallet connected");
      const headers = await getHeaders();
      const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ inquiryId }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Failed to verify KYC");
      return json.data as KycVerifyResponse;
    },
  });

  return {
    verifyKyc: mutateAsync,
    isVerifying: isPending,
  };
}
