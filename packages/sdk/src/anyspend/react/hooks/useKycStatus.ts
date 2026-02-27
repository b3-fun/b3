"use client";

import { ANYSPEND_MAINNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

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

async function fetchKycStatus(walletAddress: string): Promise<KycStatusResponse> {
  const response = await fetch(
    `${ANYSPEND_MAINNET_BASE_URL}/kyc/status?walletAddress=${encodeURIComponent(walletAddress)}`,
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch KYC status");
  return data.data;
}

async function createKycInquiry(walletAddress: string): Promise<KycInquiryResponse> {
  const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create KYC inquiry");
  return data.data;
}

async function verifyKyc(walletAddress: string, inquiryId: string): Promise<KycVerifyResponse> {
  const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, inquiryId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to verify KYC");
  return data.data;
}

export function useKycStatus(walletAddress: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kyc-status", walletAddress],
    queryFn: () => fetchKycStatus(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 30_000,
  });

  return useMemo(
    () => ({
      kycStatus: data || null,
      isLoadingKycStatus: isLoading,
      kycStatusError: error,
      refetchKycStatus: refetch,
    }),
    [data, isLoading, error, refetch],
  );
}

export function useCreateKycInquiry() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (walletAddress: string) => createKycInquiry(walletAddress),
  });

  return useMemo(
    () => ({
      createInquiry: mutateAsync,
      isCreatingInquiry: isPending,
    }),
    [mutateAsync, isPending],
  );
}

export function useVerifyKyc() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ walletAddress, inquiryId }: { walletAddress: string; inquiryId: string }) =>
      verifyKyc(walletAddress, inquiryId),
  });

  return useMemo(
    () => ({
      verifyKyc: mutateAsync,
      isVerifying: isPending,
    }),
    [mutateAsync, isPending],
  );
}
