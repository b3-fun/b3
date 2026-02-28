"use client";

import { ANYSPEND_MAINNET_BASE_URL } from "@b3dotfun/sdk/anyspend/constants";
import app from "@b3dotfun/sdk/global-account/app";
import { useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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

async function getAuthHeader(): Promise<string | null> {
  try {
    const accessToken = await app.authentication.getAccessToken();
    return accessToken ? `Bearer ${accessToken}` : null;
  } catch {
    return null;
  }
}

async function fetchKycStatus(): Promise<KycStatusResponse> {
  const authHeader = await getAuthHeader();
  if (!authHeader) throw new Error("Not authenticated");

  const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/status`, {
    headers: { Authorization: authHeader },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch KYC status");
  return data.data;
}

async function createKycInquiry(): Promise<KycInquiryResponse> {
  const authHeader = await getAuthHeader();
  if (!authHeader) throw new Error("Not authenticated");

  const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/inquiry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create KYC inquiry");
  return data.data;
}

async function verifyKyc(inquiryId: string): Promise<KycVerifyResponse> {
  const authHeader = await getAuthHeader();
  if (!authHeader) throw new Error("Not authenticated");

  const response = await fetch(`${ANYSPEND_MAINNET_BASE_URL}/kyc/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ inquiryId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to verify KYC");
  return data.data;
}

export function useKycStatus() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: () => fetchKycStatus(),
    enabled: isAuthenticated,
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
    mutationFn: () => createKycInquiry(),
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
    mutationFn: (inquiryId: string) => verifyKyc(inquiryId),
  });

  return useMemo(
    () => ({
      verifyKyc: mutateAsync,
      isVerifying: isPending,
    }),
    [mutateAsync, isPending],
  );
}
